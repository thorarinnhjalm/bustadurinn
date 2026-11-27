/**
 * useUserRole Hook
 * Fetches user's system role and house-specific roles.
 *
 * Resolved roles are cached in the Zustand store, keyed by userId, so that
 * multiple components mounting for the same user don't each fire a redundant
 * Firestore read. The userId key matters for impersonation: a cache hit only
 * happens if the requested userId matches the cached one, so an impersonated
 * user's role lookup never returns the real user's cached role (or vice versa).
 *
 * On top of the resolved-value cache, a module-level in-flight promise map
 * deduplicates concurrent fetches: when several permission-aware components
 * mount in the same page load (before any fetch has resolved), they all miss
 * the store cache, but only the first one issues a getDoc - the rest await
 * that same in-flight promise.
 */

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { logger } from '@/utils/logger';
import { useAppStore } from '@/store/appStore';
import type { UserRoles, SystemRole, HouseRole } from '@/types/rbac';

interface UseUserRoleReturn {
    systemRole: SystemRole;
    houseRoles: { [houseId: string]: HouseRole };
    loading: boolean;
    error: string | null;
}

interface ResolvedRole {
    systemRole: SystemRole;
    houseRoles: { [houseId: string]: HouseRole };
}

// Module-level (not store-level) - this is purely a request-dedup mechanism,
// not app state, so it doesn't belong in Zustand. Keyed by userId, same as
// the store cache, for the same impersonation-safety reason.
// Stable reference so consumers using houseRoles in dependency lists don't churn.
const EMPTY_HOUSE_ROLES: { [houseId: string]: HouseRole } = {};

const inFlightFetches = new Map<string, Promise<ResolvedRole>>();

async function fetchRole(userId: string): Promise<ResolvedRole> {
    const roleDoc = await getDoc(doc(db, 'user_roles', userId));

    let systemRole: SystemRole = 'regular_user';
    const houseRoles: { [houseId: string]: HouseRole } = {};

    if (roleDoc.exists()) {
        const data = roleDoc.data() as UserRoles;
        systemRole = data.system_role || 'regular_user';

        // Convert house_roles to simple map
        Object.entries(data.house_roles || {}).forEach(([houseId, grant]) => {
            houseRoles[houseId] = grant.role;
        });
    }

    return { systemRole, houseRoles };
}

function getOrCreateInFlightFetch(userId: string): Promise<ResolvedRole> {
    const existing = inFlightFetches.get(userId);
    if (existing) {
        return existing;
    }

    const promise = fetchRole(userId);
    inFlightFetches.set(userId, promise);

    // Clear on both resolve and reject - a rejected promise must never be
    // reused by a later mount (consistent with not caching error results),
    // and a resolved one is superseded by the store cache anyway.
    // The trailing .catch(() => {}) only guards the *derived* .finally()
    // promise against being reported as an unhandled rejection - the
    // original `promise` returned below is still consumed (and its
    // rejection handled) by every caller's own .then().catch() chain.
    promise
        .finally(() => {
            if (inFlightFetches.get(userId) === promise) {
                inFlightFetches.delete(userId);
            }
        })
        .catch(() => {});

    return promise;
}

export function useUserRole(userId: string | undefined): UseUserRoleReturn {
    const setCachedRole = useAppStore((state) => state.setCachedRole);
    // The cache is a single slot written only when a fetch resolves, so
    // subscribing is cheap, and it means a role written by another component
    // (or a deduplicated in-flight fetch) shows up here without extra state.
    const cachedRole = useAppStore((state) => state.cachedRole);
    // Only failures need local state: a successful fetch lands in the store
    // cache above. Keyed by userId so a failure for one user is never shown
    // for another (impersonation).
    const [failedUserId, setFailedUserId] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;

        const cached = useAppStore.getState().cachedRole;
        if (cached && cached.userId === userId) return;

        let cancelled = false;

        getOrCreateInFlightFetch(userId)
            .then((resolved) => {
                if (cancelled) return;
                setCachedRole({ userId, ...resolved });
            })
            .catch((err) => {
                if (cancelled) return;
                logger.error('Error fetching user role:', err);
                // Report regular_user on error. Deliberately do NOT write
                // to the cache here - an error result must not get "stuck"
                // and served to later mounts as if it were a real role.
                setFailedUserId(userId);
            });

        return () => {
            cancelled = true;
        };
    }, [userId, setCachedRole]);

    // Everything below is derived during render, so the first render for a
    // userId that has no cached role reports the lowest role (never a stale
    // elevated one from a previous user) and `loading: true`.
    if (!userId) {
        return { systemRole: 'regular_user', houseRoles: EMPTY_HOUSE_ROLES, loading: false, error: null };
    }
    if (cachedRole && cachedRole.userId === userId) {
        return {
            systemRole: cachedRole.systemRole,
            houseRoles: cachedRole.houseRoles,
            loading: false,
            error: null,
        };
    }
    if (failedUserId === userId) {
        return {
            systemRole: 'regular_user',
            houseRoles: EMPTY_HOUSE_ROLES,
            loading: false,
            error: 'Failed to load user permissions',
        };
    }
    return { systemRole: 'regular_user', houseRoles: EMPTY_HOUSE_ROLES, loading: true, error: null };
}
