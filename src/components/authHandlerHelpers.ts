import type { DocumentSnapshot } from 'firebase/firestore';
import type { House } from '@/types/models';

/** A profile is only re-created for accounts older than this (SignupPage writes it first). */
export const BRAND_NEW_ACCOUNT_MS = 15000;

/**
 * Whether the profile snapshot justifies even looking into a self-repair.
 * A snapshot served from the local cache that says "missing" proves nothing
 * (empty cache on first load / offline), so it never qualifies.
 */
export function shouldAttemptProfileRepair(params: {
    exists: boolean;
    fromCache: boolean;
    creationTimeMs: number;
    nowMs: number;
}): boolean {
    if (params.exists || params.fromCache) return false;
    return params.nowMs - params.creationTimeMs >= BRAND_NEW_ACCOUNT_MS;
}

export interface HousesLoadResult {
    houses: House[];
    /** Reasons of the reads that failed (e.g. permission-denied for a stale id). */
    failures: Array<{ houseId: string; reason: unknown }>;
}

/** Keep the houses that loaded; collect the failures instead of rejecting everything. */
export function collectSettledHouses(
    houseIds: string[],
    settled: Array<PromiseSettledResult<DocumentSnapshot>>
): HousesLoadResult {
    const houses: House[] = [];
    const failures: HousesLoadResult['failures'] = [];
    settled.forEach((result, i) => {
        if (result.status === 'fulfilled') {
            if (result.value.exists()) {
                houses.push({ id: result.value.id, ...result.value.data() } as House);
            }
        } else {
            failures.push({ houseId: houseIds[i], reason: result.reason });
        }
    });
    return { houses, failures };
}

/**
 * Set by the account-deletion flow. While true, AuthHandler must not
 * self-repair the profile: the server deletes users/{uid} before the Auth
 * user, and the listener would otherwise recreate the document.
 */
export const accountDeletionState = { inProgress: false };
