/**
 * Impersonation Context - God Mode for Admin
 * Allows admin to view the app as any user
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import type { User } from '@/types/models';

interface ImpersonationContextType {
    impersonatedUser: User | null;
    startImpersonation: (user: User) => void;
    stopImpersonation: () => void;
    isImpersonating: boolean;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

const IMPERSONATION_KEY = 'admin_impersonation';

export function ImpersonationProvider({ children }: { children: ReactNode }) {
    const [impersonatedUser, setImpersonatedUser] = useState<User | null>(() => {
        // Restore from localStorage on mount
        const stored = localStorage.getItem(IMPERSONATION_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                localStorage.removeItem(IMPERSONATION_KEY);
                return null;
            }
        }
        return null;
    });

    // Listen for auth state changes to clear impersonation on logout
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            // If user logs out (user is null) and we are impersonating, stop it
            if (!user && impersonatedUser) {
                console.log('🔒 User logged out - clearing impersonation');
                stopImpersonation();
            }
        });
        return () => unsubscribe();
    }, [impersonatedUser]);

    const startImpersonation = (user: User) => {
        setImpersonatedUser(user);
        localStorage.setItem(IMPERSONATION_KEY, JSON.stringify(user));
        console.log('🎭 Started impersonating:', user.name, user.email);
    };

    const stopImpersonation = () => {
        console.log('🎭 Stopped impersonation');
        setImpersonatedUser(null);
        localStorage.removeItem(IMPERSONATION_KEY);
        localStorage.removeItem('admin_original_house');
        localStorage.removeItem('admin_return_url');
    };

    return (
        <ImpersonationContext.Provider
            value={{
                impersonatedUser,
                startImpersonation,
                stopImpersonation,
                isImpersonating: !!impersonatedUser,
            }}
        >
            {children}
        </ImpersonationContext.Provider>
    );
}

export function useImpersonation() {
    const context = useContext(ImpersonationContext);
    if (!context) {
        throw new Error('useImpersonation must be used within ImpersonationProvider');
    }
    return context;
}
