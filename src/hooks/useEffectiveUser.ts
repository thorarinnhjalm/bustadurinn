/**
 * Hook to get the effective user (impersonated or real)
 * Use this instead of directly accessing useAppStore for user data
 */

import { useAppStore } from '@/store/appStore';
import { useImpersonation } from '@/contexts/ImpersonationContext';

export function useEffectiveUser() {
    const { impersonatedUser, isImpersonating } = useImpersonation();
    const currentUser = useAppStore((state) => state.currentUser);

    // Return impersonated user if active, otherwise real user
    return {
        user: isImpersonating ? impersonatedUser : currentUser,
        isImpersonating,
        isAdmin: !isImpersonating && currentUser?.email === 'thorarinnhjalmarsson@gmail.com'
    };
}
