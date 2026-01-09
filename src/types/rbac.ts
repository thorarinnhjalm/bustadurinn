/**
 * RBAC (Role-Based Access Control) Types
 * Defines roles and permissions for the application
 */

import { Timestamp } from 'firebase/firestore';

// System-wide roles
export type SystemRole = 'super_admin' | 'support_admin' | 'regular_user';

// House-specific roles
export type HouseRole = 'owner' | 'admin' | 'member' | 'viewer';

// Role grant record
export interface RoleGrant {
    role: HouseRole;
    granted_at: Timestamp;
    granted_by: string; // User UID who granted this role
}

// User roles document (stored in Firestore: user_roles/{userId})
export interface UserRoles {
    user_id: string;
    email: string;
    system_role: SystemRole;
    house_roles: {
        [house_id: string]: RoleGrant;
    };
    created_at: Timestamp;
    updated_at: Timestamp;
}

// Permissions interface
export interface Permissions {
    // System permissions
    canAccessSuperAdmin: boolean;
    canViewAllHouses: boolean;
    canImpersonateUsers: boolean;
    canManageEmailTemplates: boolean;

    // House permissions
    canManageHouse: boolean;
    canDeleteHouse: boolean;
    canEditHouseSettings: boolean;
    canInviteMembers: boolean;
    canRemoveMembers: boolean;
    canTransferOwnership: boolean;

    // Booking permissions
    canCreateBooking: boolean;
    canEditOwnBooking: boolean;
    canDeleteAnyBooking: boolean;

    // Finance permissions
    canViewFinances: boolean;
    canEditBudget: boolean;
    canManageInvoices: boolean;

    // Task permissions
    canCreateTask: boolean;
    canEditOwnTask: boolean;
    canDeleteAnyTask: boolean;
}

// Permission check helpers
export const SYSTEM_PERMISSIONS = {
    super_admin: ['all'],
    support_admin: ['view_all_houses', 'view_analytics'],
    regular_user: [],
} as const;

export const HOUSE_PERMISSIONS = {
    owner: [
        'manage_house',
        'delete_house',
        'edit_settings',
        'invite_members',
        'remove_members',
        'transfer_ownership',
        'create_booking',
        'edit_booking',
        'delete_booking',
        'view_finances',
        'edit_budget',
        'manage_invoices',
        'create_task',
        'delete_task',
    ],
    admin: [
        'edit_settings',
        'invite_members',
        'create_booking',
        'edit_booking',
        'delete_booking',
        'view_finances',
        'edit_budget',
        'create_task',
        'delete_task',
    ],
    member: ['create_booking', 'edit_booking', 'view_finances', 'create_task'],
    viewer: [],
} as const;
