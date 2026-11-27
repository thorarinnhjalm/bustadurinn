/**
 * organizationService tests
 * createOrganization: one batch, creator in admin_user_ids, member doc id = uid.
 * approveAccessRequest: member doc id = uid (what the security rules look up).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDoc, writeBatch, doc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { createOrganization, approveAccessRequest } from './organizationService';

vi.mock('@/lib/firebase', () => ({ db: { __db: true } }));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn((_db: unknown, ...path: string[]) => ({ __collection: path.join('/') })),
    doc: vi.fn((first: any, ...path: string[]) => {
        if (first && first.__collection) {
            return { id: 'new-org-id', path: `${first.__collection}/new-org-id` };
        }
        return { id: path[path.length - 1], path: path.join('/') };
    }),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    writeBatch: vi.fn(),
    arrayUnion: vi.fn(),
    arrayRemove: vi.fn(),
    increment: vi.fn((n: number) => ({ __increment: n })),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    Timestamp: { fromDate: vi.fn() },
    serverTimestamp: vi.fn(() => 'server-timestamp'),
}));

const makeBatch = () => ({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
});

let batch: ReturnType<typeof makeBatch>;

beforeEach(() => {
    vi.clearAllMocks();
    batch = makeBatch();
    vi.mocked(writeBatch).mockReturnValue(batch as any);
    vi.mocked(addDoc).mockResolvedValue({ id: 'action-1' } as any);
    vi.mocked(updateDoc).mockResolvedValue(undefined);
});

describe('createOrganization', () => {
    it('writes org doc and creator member doc in a single batch', async () => {
        const orgId = await createOrganization(
            {
                name: 'Félagið',
                // legacy fields must never be persisted on new orgs
                subscription_status: 'trial',
                billing_email: 'x@y.is',
            } as any,
            'user-1',
            { name: 'Jón', email: 'jon@example.is' }
        );

        expect(orgId).toBe('new-org-id');
        expect(writeBatch).toHaveBeenCalledTimes(1);
        expect(batch.commit).toHaveBeenCalledTimes(1);
        expect(batch.set).toHaveBeenCalledTimes(2);
        expect(vi.mocked(collection)).toHaveBeenCalledWith(expect.anything(), 'organizations');

        const [orgRef, orgData] = batch.set.mock.calls[0];
        expect(orgRef.path).toBe('organizations/new-org-id');
        expect(orgData.admin_user_ids).toEqual(['user-1']);
        expect(orgData.created_by).toBe('user-1');
        expect(orgData.name).toBe('Félagið');
        expect(orgData).not.toHaveProperty('subscription_status');
        expect(orgData).not.toHaveProperty('billing_email');

        const [memberRef, memberData] = batch.set.mock.calls[1];
        expect(memberRef.path).toBe('organizations/new-org-id/members/user-1');
        expect(vi.mocked(doc)).toHaveBeenCalledWith(
            expect.anything(),
            'organizations',
            'new-org-id',
            'members',
            'user-1'
        );
        expect(memberData).toMatchObject({ user_id: 'user-1', role: 'admin', status: 'active' });
    });

    it('does not touch user_roles or write outside the batch', async () => {
        await createOrganization({ name: 'A' }, 'user-1');
        const paths = vi.mocked(doc).mock.calls.map((c) => c.slice(1).join('/'));
        expect(paths.some((p) => p.includes('user_roles'))).toBe(false);
        expect(addDoc).not.toHaveBeenCalled();
    });
});

describe('approveAccessRequest', () => {
    const requestSnap = (data: Record<string, unknown> | null) => ({
        exists: () => data !== null,
        data: () => data,
    });

    it('creates the member doc with the requester uid as document id', async () => {
        vi.mocked(getDoc)
            .mockResolvedValueOnce(
                requestSnap({ user_id: 'employee-7', email: 'e@x.is', name: 'Eva' }) as any
            ) // access request
            .mockResolvedValueOnce(requestSnap(null) as any); // no existing member

        await approveAccessRequest('org-1', 'req-1', 'admin-1', 'Admin');

        expect(vi.mocked(doc)).toHaveBeenCalledWith(
            expect.anything(),
            'organizations',
            'org-1',
            'members',
            'employee-7'
        );
        expect(batch.update).toHaveBeenCalledTimes(1); // request -> approved
        expect(batch.update.mock.calls[0][1]).toMatchObject({ status: 'approved' });
        expect(batch.set).toHaveBeenCalledTimes(1);
        const [memberRef, memberData] = batch.set.mock.calls[0];
        expect(memberRef.path).toBe('organizations/org-1/members/employee-7');
        expect(memberData).toMatchObject({
            user_id: 'employee-7',
            email: 'e@x.is',
            name: 'Eva',
            status: 'active',
        });
        expect(batch.commit).toHaveBeenCalledTimes(1);
        expect(addDoc).not.toHaveBeenCalledWith(
            expect.objectContaining({ __collection: 'organizations/org-1/members' }),
            expect.anything()
        );
    });

    it('rejects legacy requests that have no user_id', async () => {
        vi.mocked(getDoc).mockResolvedValueOnce(
            requestSnap({ email: 'e@x.is', name: 'Eva' }) as any
        );

        await expect(approveAccessRequest('org-1', 'req-1', 'admin-1', 'Admin')).rejects.toThrow();
        expect(batch.commit).not.toHaveBeenCalled();
    });
});
