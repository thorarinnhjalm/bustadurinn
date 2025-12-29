/**
 * Impersonation Banner - Red Warning When in God Mode
 * Shows at top of screen when admin is viewing as another user
 */

import { X, AlertTriangle } from 'lucide-react';
import { useImpersonation } from '@/contexts/ImpersonationContext';

export default function ImpersonationBanner() {
    const { impersonatedUser, stopImpersonation, isImpersonating } = useImpersonation();

    if (!isImpersonating || !impersonatedUser) {
        return null;
    }

    return (
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
                    onClick={stopImpersonation}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded font-medium text-sm hover:bg-red-50 transition-colors"
                >
                    <X className="w-4 h-4" />
                    Exit God Mode
                </button>
            </div>
        </div>
    );
}
