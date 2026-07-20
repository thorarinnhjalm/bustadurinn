/**
 * Global State Store using Zustand
 */

import { create } from 'zustand';
import type { User, House } from '@/types/models';
import type { SystemRole, HouseRole } from '@/types/rbac';

// Cached result of a user_roles/{userId} lookup, keyed by userId so that
// impersonation (which calls useUserRole with a different userId) can never
// read another user's cached role. Mismatched userId => cache miss => refetch.
export interface CachedRole {
    userId: string;
    systemRole: SystemRole;
    houseRoles: { [houseId: string]: HouseRole };
}

interface AppState {
    // Auth state
    currentUser: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // House state
    currentHouse: House | null;
    userHouses: House[];

    // RBAC cache
    cachedRole: CachedRole | null;

    // Actions
    setCurrentUser: (user: User | null) => void;
    setAuthenticated: (isAuth: boolean) => void;
    setLoading: (loading: boolean) => void;
    setCurrentHouse: (house: House | null) => void;
    setUserHouses: (houses: House[]) => void;
    setCachedRole: (cachedRole: CachedRole | null) => void;
    logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    // Initial state
    currentUser: null,
    isAuthenticated: false,
    isLoading: true,
    currentHouse: null,
    userHouses: [],
    cachedRole: null,

    // Actions
    setCurrentUser: (user) => set({ currentUser: user }),
    setAuthenticated: (isAuth) => set({ isAuthenticated: isAuth }),
    setLoading: (loading) => set({ isLoading: loading }),
    setCurrentHouse: (house) => set({ currentHouse: house }),
    setUserHouses: (houses) => set({ userHouses: houses }),
    setCachedRole: (cachedRole) => set({ cachedRole }),
    logout: () => set({
        currentUser: null,
        isAuthenticated: false,
        currentHouse: null,
        userHouses: [],
        cachedRole: null
    }),
}));
