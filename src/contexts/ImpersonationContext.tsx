/**
 * Impersonation Context - God Mode for Admin
 * Allows admin to view the app as any user
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import type { User } from '@/types/models';

interface ImpersonationContextType {
    impersonatedUser: User | null;
    startImpersonation: (user: User) => void;
    stopImpersonation: () => void;
    isImpersonating: boolean;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
    const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);

    const startImpersonation = (user: User) => {
        setImpersonatedUser(user);
        console.log('🎭 Started impersonating:', user.name, user.email);
    };

    const stopImpersonation = () => {
        console.log('🎭 Stopped impersonation');
        setImpersonatedUser(null);
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
