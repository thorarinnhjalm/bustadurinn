/**
 * Sandbox Context - Demo mode for unauthenticated users
 * Allows viewing real features with demo data
 */

import { createContext, useContext, type ReactNode } from 'react';

interface SandboxContextType {
    isSandboxMode: boolean;
    demoHouseId: string;
    demoUser: {
        uid: string;
        name: string;
        email: string;
    };
}

const SandboxContext = createContext<SandboxContextType | undefined>(undefined);

const DEMO_HOUSE_ID = 'demo-house-001';
const DEMO_USER = {
    uid: 'demo-user-001',
    name: 'Sýnisnotandi',
    email: 'demo@bustadurinn.is'
};

export function SandboxProvider({ children }: { children: ReactNode }) {
    // Check if we're in sandbox mode (URL contains /sandbox/)
    const isSandboxMode = window.location.pathname.startsWith('/sandbox');

    return (
        <SandboxContext.Provider
            value={{
                isSandboxMode,
                demoHouseId: DEMO_HOUSE_ID,
                demoUser: DEMO_USER
            }}
        >
            {children}
        </SandboxContext.Provider>
    );
}

export function useSandbox() {
    const context = useContext(SandboxContext);
    if (!context) {
        throw new Error('useSandbox must be used within SandboxProvider');
    }
    return context;
}
