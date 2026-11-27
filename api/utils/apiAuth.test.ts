import { describe, it, expect } from 'vitest';
import { isAdminIdentity } from './apiAuth';

describe('isAdminIdentity', () => {
    const owner = { uid: 'u1', email: 'thorarinnhjalmarsson@gmail.com', email_verified: true };

    it('accepts a verified allow-listed email without a role doc', () => {
        expect(isAdminIdentity(owner, undefined)).toBe(true);
        expect(isAdminIdentity({ ...owner, email: 'ThorarinnHjalmarsson@Gmail.com' }, null)).toBe(true);
    });

    it('rejects an unverified allow-listed email', () => {
        expect(isAdminIdentity({ ...owner, email_verified: false }, undefined)).toBe(false);
        expect(isAdminIdentity({ uid: 'u1', email: owner.email }, undefined)).toBe(false);
    });

    it('accepts role docs and rejects everyone else', () => {
        expect(isAdminIdentity({ uid: 'x', email: 'a@b.is', email_verified: true }, { system_role: 'super_admin' })).toBe(true);
        expect(isAdminIdentity({ uid: 'x' }, { is_super_admin: true })).toBe(true);
        expect(isAdminIdentity({ uid: 'x', email: 'a@b.is', email_verified: true }, { system_role: 'regular_user' })).toBe(false);
        expect(isAdminIdentity({ uid: 'x' }, undefined)).toBe(false);
    });
});
