/**
 * usePermissions Hook
 * Checks user permissions for specific actions
 */

import { useMemo } from 'react';
import { useUserRole } from './useUserRole';
import { checkPermission } from '@/utils/rbac';
import type { Permissions } from '@/types/rbac';

export function usePermissions(
    userId: string | undefined,
    houseId?: string,
    hideFinances?: boolean
): Permissions {
    const { systemRole, houseRoles } = useUserRole(userId);

    return useMemo(() => {
        const houseRole = houseId ? houseRoles[houseId] : undefined;

        return {
            // System permissions
            canAccessSuperAdmin: checkPermission(systemRole, 'super_admin', 'access_super_admin'),
            canViewAllHouses: checkPermission(systemRole, 'super_admin', 'view_all_houses') ||
                checkPermission(systemRole, 'support_admin', 'view_all_houses'),
            canImpersonateUsers: checkPermission(systemRole, 'super_admin', 'impersonate_users'),
            canManageEmailTemplates: checkPermission(
                systemRole,
                'super_admin',
                'manage_email_templates'
            ),

            // House permissions
            canManageHouse:
                checkPermission(systemRole, 'super_admin', 'manage_house') ||
                (!!houseRole && checkPermission(houseRole, 'owner', 'manage_house')) ||
                (!!houseRole && checkPermission(houseRole, 'admin', 'manage_house')),

            canDeleteHouse:
                checkPermission(systemRole, 'super_admin', 'delete_house') ||
                (!!houseRole && checkPermission(houseRole, 'owner', 'delete_house')),

            canEditHouseSettings:
                checkPermission(systemRole, 'super_admin', 'edit_settings') ||
                (!!houseRole && checkPermission(houseRole, 'owner', 'edit_settings')) ||
                (!!houseRole && checkPermission(houseRole, 'admin', 'edit_settings')),

            canInviteMembers:
                checkPermission(systemRole, 'super_admin', 'invite_members') ||
                (!!houseRole && checkPermission(houseRole, 'owner', 'invite_members')) ||
                (!!houseRole && checkPermission(houseRole, 'admin', 'invite_members')),

            canRemoveMembers:
                checkPermission(systemRole, 'super_admin', 'remove_members') ||
                (!!houseRole && checkPermission(houseRole, 'owner', 'remove_members')),

            canTransferOwnership:
                checkPermission(systemRole, 'super_admin', 'transfer_ownership') ||
                (!!houseRole && checkPermission(houseRole, 'owner', 'transfer_ownership')),

            // Booking permissions
            canCreateBooking:
                checkPermission(systemRole, 'super_admin', 'create_booking') ||
                (!!houseRole && checkPermission(houseRole, 'owner', 'create_booking')) ||
                (!!houseRole && checkPermission(houseRole, 'admin', 'create_booking')) ||
                (!!houseRole && checkPermission(houseRole, 'member', 'create_booking')),

            canEditOwnBooking:
                checkPermission(systemRole, 'super_admin', 'edit_booking') ||
                (!!houseRole && checkPermission(houseRole, 'owner', 'edit_booking')) ||
                (!!houseRole && checkPermission(houseRole, 'admin', 'edit_booking')) ||
                (!!houseRole && checkPermission(houseRole, 'member', 'edit_booking')),

            canDeleteAnyBooking:
                checkPermission(systemRole, 'super_admin', 'delete_booking') ||
                (!!houseRole && checkPermission(houseRole, 'owner', 'delete_booking')) ||
                (!!houseRole && checkPermission(houseRole, 'admin', 'delete_booking')),

            // Finance permissions (respects privacy_hide_finances flag)
            canViewFinances:
                checkPermission(systemRole, 'super_admin', 'view_finances') ||
                (!!houseRole && checkPermission(houseRole, 'owner', 'view_finances')) ||
                (!!houseRole && checkPermission(houseRole, 'admin', 'view_finances')) ||
                (!!houseRole && houseRole === 'member' && !hideFinances),

            canEditBudget:
                checkPermission(systemRole, 'super_admin', 'edit_budget') ||
                (!!houseRole && checkPermission(houseRole, 'owner', 'edit_budget')) ||
                (!!houseRole && checkPermission(houseRole, 'admin', 'edit_budget')),

            canManageInvoices:
                checkPermission(systemRole, 'super_admin', 'manage_invoices') ||
                (!!houseRole && checkPermission(houseRole, 'owner', 'manage_invoices')),

            // Task permissions
            canCreateTask:
                checkPermission(systemRole, 'super_admin', 'create_task') ||
                (!!houseRole && checkPermission(houseRole, 'owner', 'create_task')) ||
                (!!houseRole && checkPermission(houseRole, 'admin', 'create_task')) ||
                (!!houseRole && checkPermission(houseRole, 'member', 'create_task')),

            canEditOwnTask:
                checkPermission(systemRole, 'super_admin', 'delete_task') ||
                (!!houseRole && !!houseRole),

            canDeleteAnyTask:
                checkPermission(systemRole, 'super_admin', 'delete_task') ||
                (!!houseRole && checkPermission(houseRole, 'owner', 'delete_task')) ||
                (!!houseRole && checkPermission(houseRole, 'admin', 'delete_task')),
        };
    }, [systemRole, houseRoles, houseId, hideFinances]);
}
