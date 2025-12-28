/**
 * Global State Store using Zustand
 */

import { create } from 'zustand';
import { User, House } from '@/types/models';

interface AppState {
    // Auth state
    currentUser: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // House state
    currentHouse: House | null;
    userHouses: House[];

    // Actions
    setCurrentUser: (user: User | null) => void;
    setAuthenticated: (isAuth: boolean) => void;
    setLoading: (loading: boolean) => void;
    setCurrentHouse: (house: House | null) => void;
    setUserHouses: (houses: House[]) => void;
    logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    // Initial state
    currentUser: null,
    isAuthenticated: false,
    isLoading: true,
    currentHouse: null,
    userHouses: [],

    // Actions
    setCurrentUser: (user) => set({ currentUser: user }),
    setAuthenticated: (isAuth) => set({ isAuthenticated: isAuth }),
    setLoading: (loading) => set({ isLoading: loading }),
    setCurrentHouse: (house) => set({ currentHouse: house }),
    setUserHouses: (houses) => set({ userHouses: houses }),
    logout: () => set({
        currentUser: null,
        isAuthenticated: false,
        currentHouse: null,
        userHouses: []
    }),
}));
