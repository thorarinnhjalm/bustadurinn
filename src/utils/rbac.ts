/**
 * RBAC Utility Functions
 * Permission checking helpers
 */

import { SYSTEM_PERMISSIONS, HOUSE_PERMISSIONS } from '@/types/rbac';
import type { SystemRole, HouseRole } from '@/types/rbac';

/**
 * Check if a system role has a specific permission
 */
export function checkSystemPermission(role: SystemRole, permission: string): boolean {
    const rolePermissions = SYSTEM_PERMISSIONS[role];

    if (!rolePermissions) return false;

    // Convert readonly array to mutable for type checking
    const permissions = Array.from(rolePermissions);

    // Super admin has all permissions
    if (permissions.includes('all')) return true;

    return permissions.includes(permission);
}

/**
 * Check if a house role has a specific permission
 */
export function checkHousePermission(role: HouseRole, permission: string): boolean {
    const rolePermissions = HOUSE_PERMISSIONS[role];

    if (!rolePermissions) return false;

    // Convert readonly array to mutable for type checking
    const permissions = Array.from(rolePermissions);

    return permissions.includes(permission);
}

/**
 * Generic permission check
 * Works for both system and house roles
 */
export function checkPermission(
    role: SystemRole | HouseRole,
    requiredRole: SystemRole | HouseRole,
    permission: string
): boolean {
    // If role doesn't match required role, deny
    if (role !== requiredRole) return false;

    // Check if it's a system role
    if (['super_admin', 'support_admin', 'regular_user'].includes(role)) {
        return checkSystemPermission(role as SystemRole, permission);
    }

    // Otherwise it's a house role
    return checkHousePermission(role as HouseRole, permission);
}

/**
 * Check if user is at least a certain role level
 */
export function hasRoleLevel(
    userRole: HouseRole | undefined,
    minimumRole: HouseRole
): boolean {
    const roleHierarchy: HouseRole[] = ['viewer', 'member', 'admin', 'owner'];

    if (!userRole) return false;

    const userLevel = roleHierarchy.indexOf(userRole);
    const minLevel = roleHierarchy.indexOf(minimumRole);

    return userLevel >= minLevel;
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(systemRole: SystemRole): boolean {
    return systemRole === 'super_admin';
}

/**
 * Check if user is any kind of admin (system or house)
 */
export function isAnyAdmin(systemRole: SystemRole, houseRole?: HouseRole): boolean {
    return (
        isSuperAdmin(systemRole) ||
        systemRole === 'support_admin' ||
        houseRole === 'owner' ||
        houseRole === 'admin'
    );
}
