/**
 * RBAC Utility Function Tests
 * Tests permission checking and role hierarchy
 */

import { describe, it, expect } from 'vitest';
import {
    checkSystemPermission,
    checkHousePermission,
    checkPermission,
    hasRoleLevel,
    isSuperAdmin,
    isAnyAdmin
} from './rbac';
import type { SystemRole, HouseRole } from '@/types/rbac';

describe('RBAC - System Permissions', () => {
    describe('checkSystemPermission', () => {
        it('should grant super_admin all permissions', () => {
            expect(checkSystemPermission('super_admin', 'delete_user')).toBe(true);
            expect(checkSystemPermission('super_admin', 'view_analytics')).toBe(true);
            expect(checkSystemPermission('super_admin', 'view_all_houses')).toBe(true);
        });

        it('should grant support_admin limited permissions', () => {
            expect(checkSystemPermission('support_admin', 'view_analytics')).toBe(true);
            expect(checkSystemPermission('support_admin', 'view_all_houses')).toBe(true);
            expect(checkSystemPermission('support_admin', 'delete_user')).toBe(false);
        });

        it('should deny regular_user system permissions', () => {
            expect(checkSystemPermission('regular_user', 'delete_user')).toBe(false);
            expect(checkSystemPermission('regular_user', 'view_analytics')).toBe(false);
            expect(checkSystemPermission('regular_user', 'view_all_houses')).toBe(false);
        });
    });
});

describe('RBAC - House Permissions', () => {
    describe('checkHousePermission', () => {
        it('should grant owner full house permissions', () => {
            expect(checkHousePermission('owner', 'delete_house')).toBe(true);
            expect(checkHousePermission('owner', 'invite_members')).toBe(true);
            expect(checkHousePermission('owner', 'delete_task')).toBe(true);
            expect(checkHousePermission('owner', 'view_finances')).toBe(true);
        });

        it('should grant admin management permissions but not delete house', () => {
            expect(checkHousePermission('admin', 'invite_members')).toBe(true);
            expect(checkHousePermission('admin', 'delete_task')).toBe(true);
            expect(checkHousePermission('admin', 'delete_house')).toBe(false);
        });

        it('should grant member basic permissions', () => {
            expect(checkHousePermission('member', 'create_task')).toBe(true);
            expect(checkHousePermission('member', 'view_finances')).toBe(true);
            expect(checkHousePermission('member', 'invite_members')).toBe(false);
            expect(checkHousePermission('member', 'delete_house')).toBe(false);
        });

        it('should grant viewer no permissions', () => {
            expect(checkHousePermission('viewer', 'view_finances')).toBe(false);
            expect(checkHousePermission('viewer', 'create_task')).toBe(false);
            expect(checkHousePermission('viewer', 'invite_members')).toBe(false);
        });
    });

    describe('hasRoleLevel', () => {
        it('should correctly evaluate role hierarchy', () => {
            // Owner has all levels
            expect(hasRoleLevel('owner', 'viewer')).toBe(true);
            expect(hasRoleLevel('owner', 'member')).toBe(true);
            expect(hasRoleLevel('owner', 'admin')).toBe(true);
            expect(hasRoleLevel('owner', 'owner')).toBe(true);

            // Admin has member and viewer
            expect(hasRoleLevel('admin', 'viewer')).toBe(true);
            expect(hasRoleLevel('admin', 'member')).toBe(true);
            expect(hasRoleLevel('admin', 'admin')).toBe(true);
            expect(hasRoleLevel('admin', 'owner')).toBe(false);

            // Member has member and viewer
            expect(hasRoleLevel('member', 'viewer')).toBe(true);
            expect(hasRoleLevel('member', 'member')).toBe(true);
            expect(hasRoleLevel('member', 'admin')).toBe(false);
            expect(hasRoleLevel('member', 'owner')).toBe(false);

            // Viewer only has viewer
            expect(hasRoleLevel('viewer', 'viewer')).toBe(true);
            expect(hasRoleLevel('viewer', 'member')).toBe(false);
        });

        it('should handle undefined role', () => {
            expect(hasRoleLevel(undefined, 'viewer')).toBe(false);
            expect(hasRoleLevel(undefined, 'owner')).toBe(false);
        });
    });
});

describe('RBAC - Hierarchical Permission Checking', () => {
    describe('checkPermission', () => {
        it('should support hierarchical house role checking', () => {
            // Owner can perform admin actions
            expect(checkPermission('owner', 'admin', 'invite_members')).toBe(true);
            // Owner can perform member actions
            expect(checkPermission('owner', 'member', 'create_task')).toBe(true);

            // Admin can perform member actions
            expect(checkPermission('admin', 'member', 'create_task')).toBe(true);
            // Admin cannot perform owner actions
            expect(checkPermission('admin', 'owner', 'delete_house')).toBe(false);

            // Member cannot perform admin actions
            expect(checkPermission('member', 'admin', 'invite_members')).toBe(false);
        });

        it('should require exact match for system roles', () => {
            // Super admin with 'all' permission
            expect(checkSystemPermission('super_admin', 'delete_user')).toBe(true);
            expect(checkPermission('support_admin', 'super_admin', 'delete_user')).toBe(false);
            expect(checkPermission('regular_user', 'super_admin', 'delete_user')).toBe(false);
        });

        it('should handle permission that does not exist', () => {
            expect(checkPermission('viewer', 'owner', 'fake_permission')).toBe(false);
            expect(checkPermission('regular_user', 'super_admin', 'fake_permission')).toBe(false);
        });
    });
});

describe('RBAC - Helper Functions', () => {
    describe('isSuperAdmin', () => {
        it('should identify super_admin correctly', () => {
            expect(isSuperAdmin('super_admin')).toBe(true);
            expect(isSuperAdmin('support_admin')).toBe(false);
            expect(isSuperAdmin('regular_user')).toBe(false);
        });
    });

    describe('isAnyAdmin', () => {
        it('should identify any admin role', () => {
            // System admins
            expect(isAnyAdmin('super_admin')).toBe(true);
            expect(isAnyAdmin('support_admin')).toBe(true);
            expect(isAnyAdmin('regular_user')).toBe(false);

            // House admins
            expect(isAnyAdmin('regular_user', 'owner')).toBe(true);
            expect(isAnyAdmin('regular_user', 'admin')).toBe(true);
            expect(isAnyAdmin('regular_user', 'member')).toBe(false);
            expect(isAnyAdmin('regular_user', 'viewer')).toBe(false);

            // Combined
            expect(isAnyAdmin('super_admin', 'viewer')).toBe(true); // System role takes precedence
        });
    });
});

describe('RBAC - Edge Cases', () => {
    it('should handle invalid roles gracefully', () => {
        // @ts-expect-error Testing invalid role
        expect(checkSystemPermission('invalid_role', 'delete_user')).toBe(false);

        // @ts-expect-error Testing invalid role
        expect(checkHousePermission('invalid_role', 'create_task')).toBe(false);
    });

    it('should handle permission checks with different role types', () => {
        // Mixing system and house roles should use appropriate logic
        expect(checkSystemPermission('super_admin', 'delete_user')).toBe(true);
        expect(checkPermission('owner', 'owner', 'delete_house')).toBe(true);
    });
});

describe('RBAC - Real World Scenarios', () => {
    it('scenario: owner can create tasks', () => {
        const userRole: HouseRole = 'owner';
        const canCreate = checkPermission(userRole, 'member', 'create_task');
        expect(canCreate).toBe(true);
    });

    it('scenario: member cannot manage other members', () => {
        const userRole: HouseRole = 'member';
        const canManage = checkPermission(userRole, 'admin', 'invite_members');
        expect(canManage).toBe(false);
    });

    it('scenario: viewer has no permissions', () => {
        const userRole: HouseRole = 'viewer';
        // Viewers have no permissions in the schema
        const canCreate = checkHousePermission(userRole, 'create_task');
        expect(canCreate).toBe(false);
    });

    it('scenario: super_admin can do everything', () => {
        const systemRole: SystemRole = 'super_admin';

        expect(checkSystemPermission(systemRole, 'delete_user')).toBe(true);
        expect(checkSystemPermission(systemRole, 'view_analytics')).toBe(true);
        expect(checkSystemPermission(systemRole, 'view_all_houses')).toBe(true);
    });

    it('scenario: support_admin has limited access', () => {
        const systemRole: SystemRole = 'support_admin';

        expect(checkSystemPermission(systemRole, 'view_analytics')).toBe(true);
        expect(checkSystemPermission(systemRole, 'view_all_houses')).toBe(true);
        expect(checkSystemPermission(systemRole, 'delete_user')).toBe(false);
    });
});
