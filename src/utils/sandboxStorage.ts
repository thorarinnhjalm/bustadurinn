/**
 * Sandbox State Management
 * Handles localStorage persistence for sandbox demo data
 */

const SANDBOX_STORAGE_KEY = 'bustadurinn_sandbox_state';
const SANDBOX_VERSION = '1.0';

export interface SandboxState {
    version: string;
    bookings: any[];
    financeEntries: any[];
    tasks: any[];
    shoppingItems: any[];
    lastVisit: string;
    hasSeenTour: boolean;
}

export function loadSandboxState(): Partial<SandboxState> | null {
    try {
        const stored = localStorage.getItem(SANDBOX_STORAGE_KEY);
        if (!stored) return null;

        const state = JSON.parse(stored);
        // Version check - reset if version mismatch
        if (state.version !== SANDBOX_VERSION) {
            localStorage.removeItem(SANDBOX_STORAGE_KEY);
            return null;
        }

        return state;
    } catch (error) {
        console.error('Failed to load sandbox state:', error);
        return null;
    }
}

export function saveSandboxState(state: Partial<SandboxState>) {
    try {
        const fullState: SandboxState = {
            version: SANDBOX_VERSION,
            bookings: state.bookings || [],
            financeEntries: state.financeEntries || [],
            tasks: state.tasks || [],
            shoppingItems: state.shoppingItems || [],
            lastVisit: new Date().toISOString(),
            hasSeenTour: state.hasSeenTour || false,
        };

        localStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(fullState));
    } catch (error) {
        console.error('Failed to save sandbox state:', error);
    }
}

export function clearSandboxState() {
    localStorage.removeItem(SANDBOX_STORAGE_KEY);
}

export function markTourAsSeen() {
    const state = loadSandboxState() || {};
    saveSandboxState({ ...state, hasSeenTour: true });
}
