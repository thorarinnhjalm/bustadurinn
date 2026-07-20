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
    // Read the store once for the initial value rather than subscribing
    // reactively - subscribing would re-render every mounted useUserRole
    // consumer on every cache write. The effect below re-checks the store
    // directly (via getState()) whenever userId changes, so a live
    // subscription isn't needed for correctness.
    const setCachedRole = useAppStore((state) => state.setCachedRole);

    const [systemRole, setSystemRole] = useState<SystemRole>(() => {
        const cached = useAppStore.getState().cachedRole;
        return cached && userId && cached.userId === userId ? cached.systemRole : 'regular_user';
    });
    const [houseRoles, setHouseRoles] = useState<{ [houseId: string]: HouseRole }>(() => {
        const cached = useAppStore.getState().cachedRole;
        return cached && userId && cached.userId === userId ? cached.houseRoles : {};
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setSystemRole('regular_user');
            setHouseRoles({});
            return;
        }

        const cached = useAppStore.getState().cachedRole;
        if (cached && cached.userId === userId) {
            setSystemRole(cached.systemRole);
            setHouseRoles(cached.houseRoles);
            setLoading(false);
            setError(null);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);

        getOrCreateInFlightFetch(userId)
            .then((resolved) => {
                if (cancelled) return;
                setSystemRole(resolved.systemRole);
                setHouseRoles(resolved.houseRoles);
                setCachedRole({ userId, ...resolved });
            })
            .catch((err) => {
                if (cancelled) return;
                logger.error('Error fetching user role:', err);
                setError('Failed to load user permissions');
                // Default to regular user on error. Deliberately do NOT write
                // to the cache here - an error result must not get "stuck"
                // and served to later mounts as if it were a real role.
                setSystemRole('regular_user');
                setHouseRoles({});
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [userId, setCachedRole]);

    return { systemRole, houseRoles, loading, error };
}
