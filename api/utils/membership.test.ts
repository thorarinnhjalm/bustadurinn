/**
 * membership helpers: removeUserFromHouse / transferManager against a tiny
 * in-memory fake of the Admin Firestore transaction API.
 */
import { describe, it, expect } from 'vitest';
import { MembershipError, isValidDocId, removeUserFromHouse, transferManager } from './membership';

type Doc = Record<string, any>;

function fakeDb(store: Record<string, Doc>) {
    const ref = (path: string) => ({ path });
    const applyUpdate = (path: string, data: Doc) => {
        const doc = store[path];
        for (const [k, v] of Object.entries(data)) {
            // FieldValue sentinels: arrayRemove / serverTimestamp carry no public shape,
            // so detect by method name on the transform object.
            const name = (v as any)?.constructor?.name ?? '';
            if (/ArrayRemove/i.test(name)) {
                const elems: any[] = (v as any).elements ?? (v as any)._elements ?? [];
                doc[k] = (doc[k] ?? []).filter((x: any) => !elems.includes(x));
            } else if (/ServerTimestamp/i.test(name)) {
                doc[k] = 'ts';
            } else {
                doc[k] = v;
            }
        }
    };
    const t = {
        get: async (r: { path: string }) => ({ exists: r.path in store, data: () => store[r.path] }),
        update: (r: { path: string }, data: Doc) => applyUpdate(r.path, data),
    };
    return {
        collection: (c: string) => ({ doc: (id: string) => ref(`${c}/${id}`) }),
        runTransaction: async (fn: (tx: typeof t) => Promise<any>) => fn(t),
    } as any;
}

describe('isValidDocId', () => {
    it('accepts plain ids and rejects paths and junk', () => {
        expect(isValidDocId('abc_DEF-123')).toBe(true);
        expect(isValidDocId('a/b')).toBe(false);
        expect(isValidDocId('')).toBe(false);
        expect(isValidDocId(42)).toBe(false);
        expect(isValidDocId('x'.repeat(129))).toBe(false);
    });
});

describe('removeUserFromHouse', () => {
    const base = () => ({
        'houses/h1': { owner_ids: ['a', 'b', 'c'], manager_id: 'a' },
        'users/a': { house_ids: ['h1'] },
        'users/b': { house_ids: ['h1'] },
    });

    it('removes a non-manager from both documents', async () => {
        const store = base();
        const r = await removeUserFromHouse(fakeDb(store), 'h1', 'b');
        expect(r.removed).toBe(true);
        expect(store['houses/h1'].owner_ids).toEqual(['a', 'c']);
        expect(store['users/b'].house_ids).toEqual([]);
        expect(store['houses/h1'].manager_id).toBe('a');
    });

    it('requires a valid new manager when the manager leaves', async () => {
        const store = base();
        await expect(removeUserFromHouse(fakeDb(store), 'h1', 'a')).rejects.toMatchObject({ code: 'new_manager_required' });
        await expect(removeUserFromHouse(fakeDb(store), 'h1', 'a', { newManagerId: 'zzz' })).rejects.toMatchObject({ code: 'invalid_new_manager' });
        const r = await removeUserFromHouse(fakeDb(store), 'h1', 'a', { newManagerId: 'c' });
        expect(r.newManagerId).toBe('c');
        expect(store['houses/h1'].manager_id).toBe('c');
        expect(store['houses/h1'].owner_ids).toEqual(['b', 'c']);
    });

    it('refuses to remove the sole owner', async () => {
        const store = { 'houses/h1': { owner_ids: ['a'], manager_id: 'a' }, 'users/a': { house_ids: ['h1'] } };
        await expect(removeUserFromHouse(fakeDb(store), 'h1', 'a')).rejects.toMatchObject({ code: 'sole_owner', status: 409 });
    });

    it('is idempotent for a user who is no longer an owner', async () => {
        const store = { 'houses/h1': { owner_ids: ['a'], manager_id: 'a' }, 'users/b': { house_ids: ['h1'] } };
        const r = await removeUserFromHouse(fakeDb(store), 'h1', 'b');
        expect(r.removed).toBe(false);
        expect(store['users/b'].house_ids).toEqual([]);
    });
});

describe('transferManager', () => {
    it('only the manager can hand over, to another owner', async () => {
        const store = { 'houses/h1': { owner_ids: ['a', 'b'], manager_id: 'a' } } as Record<string, Doc>;
        const db = fakeDb(store);
        await expect(transferManager(db, 'h1', 'b', 'a')).rejects.toMatchObject({ code: 'not_manager' });
        await expect(transferManager(db, 'h1', 'a', 'a')).rejects.toMatchObject({ code: 'same_manager' });
        await expect(transferManager(db, 'h1', 'a', 'x')).rejects.toMatchObject({ code: 'target_not_member' });
        await transferManager(db, 'h1', 'a', 'b');
        expect(store['houses/h1'].manager_id).toBe('b');
    });

    it('MembershipError carries http status', () => {
        expect(new MembershipError('not_manager').status).toBe(403);
    });
});
