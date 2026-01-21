/**
 * Hook to get the effective user (impersonated or real)
 * Use this instead of directly accessing useAppStore for user data
 */

import { useAppStore } from '@/store/appStore';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useUserRole } from '@/hooks/useUserRole';

export function useEffectiveUser() {
    const { impersonatedUser, isImpersonating } = useImpersonation();
    const currentUser = useAppStore((state) => state.currentUser);

    const effectiveUserId = isImpersonating ? impersonatedUser?.uid : currentUser?.uid;
    const { systemRole } = useUserRole(effectiveUserId);

    // Return impersonated user if active, otherwise real user
    return {
        user: isImpersonating ? impersonatedUser : currentUser,
        isImpersonating,
        isAdmin: !isImpersonating && systemRole === 'super_admin'
    };
}
