/**
 * Impersonation Banner - Red Warning When in God Mode
 * Shows at top of screen when admin is viewing as another user
 */

import { X, AlertTriangle } from 'lucide-react';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useAppStore } from '@/store/appStore';
import type { House } from '@/types/models';

export default function ImpersonationBanner() {
    const { impersonatedUser, stopImpersonation, isImpersonating } = useImpersonation();

    if (!isImpersonating || !impersonatedUser) {
        return null;
    }

    const handleExit = () => {
        // Restore admin's original house
        const storedHouse = localStorage.getItem('admin_original_house');
        if (storedHouse) {
            try {
                const adminHouse = JSON.parse(storedHouse) as House;
                useAppStore.getState().setCurrentHouse(adminHouse);
                localStorage.removeItem('admin_original_house');
            } catch (error) {
                console.error('Failed to restore admin house:', error);
            }
        }

        // Get the return URL from localStorage (set when impersonation started)
        const returnUrl = localStorage.getItem('admin_return_url') || '/super-admin';
        stopImpersonation();
        // Navigate back to where admin came from
        window.location.href = returnUrl;
    };

    return (
        <>
            <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-6 py-3 shadow-lg">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 animate-pulse" />
                        <div>
                            <p className="font-bold font-mono text-sm">
                                ⚠️ IMPERSONATION MODE ACTIVE
                            </p>
                            <p className="text-xs opacity-90">
                                Viewing as: {impersonatedUser.name} ({impersonatedUser.email})
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleExit}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded font-medium text-sm hover:bg-red-50 transition-colors"
                    >
                        <X className="w-4 h-4" />
                        Exit God Mode
                    </button>
                </div>
            </div>
            {/* Spacer to push content below fixed banner */}
            <div className="h-[60px]"></div>
        </>
    );
}
