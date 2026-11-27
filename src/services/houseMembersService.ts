/**
 * House members lookup.
 *
 * Firestore rules only let a user read their own `users/{uid}` document, so
 * co-owner display data is fetched through `/api/house-members`, which returns
 * only `{ uid, name, email, avatar_url }` for each owner of the house.
 */

import { auth } from '@/lib/firebase';
import { logger } from '@/utils/logger';

export interface HouseMember {
    uid: string;
    name: string;
    email: string;
    avatar_url: string | null;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_NAME = 'Meðeigandi';

const cache = new Map<string, { members: HouseMember[]; fetchedAt: number }>();
const inflight = new Map<string, Promise<HouseMember[]>>();

async function fetchMembers(houseId: string): Promise<HouseMember[]> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch('/api/house-members', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ houseId }),
    });
    if (!response.ok) {
        throw new Error(`house-members request failed with status ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data?.members) ? (data.members as HouseMember[]) : [];
}

export async function getHouseMembers(houseId: string, options?: { force?: boolean }): Promise<HouseMember[]> {
    if (!options?.force) {
        const cached = cache.get(houseId);
        if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
            return cached.members;
        }
        const pending = inflight.get(houseId);
        if (pending) return pending;
    }

    const request = fetchMembers(houseId)
        .then((members) => {
            cache.set(houseId, { members, fetchedAt: Date.now() });
            return members;
        })
        .catch((error) => {
            logger.warn('houseMembersService: failed to load house members', houseId, error);
            throw error;
        })
        .finally(() => {
            if (inflight.get(houseId) === request) inflight.delete(houseId);
        });
    inflight.set(houseId, request);
    return request;
}

export function getHouseMemberName(members: HouseMember[], uid: string, fallback: string = DEFAULT_NAME): string {
    const member = members.find((m) => m.uid === uid);
    return member?.name || fallback;
}

export function clearHouseMembersCache(houseId?: string): void {
    if (houseId) {
        cache.delete(houseId);
        inflight.delete(houseId);
    } else {
        cache.clear();
        inflight.clear();
    }
}
