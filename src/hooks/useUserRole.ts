/**
 * useUserRole Hook
 * Fetches user's system role and house-specific roles
 */

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { logger } from '@/utils/logger';
import type { UserRoles, SystemRole, HouseRole } from '@/types/rbac';

interface UseUserRoleReturn {
    systemRole: SystemRole;
    houseRoles: { [houseId: string]: HouseRole };
    loading: boolean;
    error: string | null;
}

export function useUserRole(userId: string | undefined): UseUserRoleReturn {
    const [systemRole, setSystemRole] = useState<SystemRole>('regular_user');
    const [houseRoles, setHouseRoles] = useState<{ [houseId: string]: HouseRole }>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setSystemRole('regular_user');
            setHouseRoles({});
            return;
        }

        const fetchUserRole = async () => {
            setLoading(true);
            setError(null);
            console.log('🔍 Fetching role for user:', userId);

            try {
                const docRef = doc(db, 'user_roles', userId);
                console.log('📄 Document Path:', docRef.path);

                const roleDoc = await getDoc(docRef);
                console.log('exists?', roleDoc.exists());

                if (roleDoc.exists()) {
                    const data = roleDoc.data() as UserRoles;
                    console.log('✅ User Role Data:', data);
                    setSystemRole(data.system_role || 'regular_user');

                    // Convert house_roles to simple map
                    const roles: { [houseId: string]: HouseRole } = {};
                    Object.entries(data.house_roles || {}).forEach(([houseId, grant]) => {
                        roles[houseId] = grant.role;
                    });
                    setHouseRoles(roles);
                } else {
                    console.log('❌ No role document found for this UID');
                    // No role document - regular user with no house access
                    setSystemRole('regular_user');
                    setHouseRoles({});
                }
            } catch (err) {
                console.error('🔥 Error fetching user role:', err);
                logger.error('Error fetching user role:', err);
                setError('Failed to load user permissions');
                // Default to regular user on error
                setSystemRole('regular_user');
                setHouseRoles({});
            } finally {
                setLoading(false);
            }
        };

        fetchUserRole();
    }, [userId]);

    return { systemRole, houseRoles, loading, error };
}
