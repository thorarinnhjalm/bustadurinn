/**
 * userService.updateUserNameInAllCollections: updates the name copies in the
 * house subcollections, in chunks, and reports partial failure honestly.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/firebase', () => ({ db: {} }));

type Snap = { docs: Array<{ ref: { path: string }; data: () => any }> };
const results = new Map<string, Snap | Error>();
const batches: Array<{ updates: Array<{ path: string; data: any }>; commit: ReturnType<typeof vi.fn> }> = [];

vi.mock('firebase/firestore', () => ({
    // collection(db, 'houses', id, name) -> a key
    collection: vi.fn((_db: unknown, ...segs: string[]) => ({ key: segs.join('/') })),
    where: vi.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
    query: vi.fn((c: { key: string }, w?: { field: string }) => ({ key: w ? `${c.key}|${w.field}` : c.key })),
    getDocs: vi.fn(async (q: { key: string }) => {
        const r = results.get(q.key);
        if (r instanceof Error) throw r;
        return r ?? { docs: [] };
    }),
    writeBatch: vi.fn(() => {
        const b = {
            updates: [] as Array<{ path: string; data: any }>,
            update: (ref: { path: string }, data: any) => b.updates.push({ path: ref.path, data }),
            commit: vi.fn(async () => undefined),
        };
        batches.push(b);
        return b;
    }),
}));

import { updateUserNameInAllCollections } from './userService';

const d = (path: string, data: any = {}) => ({ ref: { path }, data: () => data });

beforeEach(() => {
    results.clear();
    batches.length = 0;
});

describe('updateUserNameInAllCollections', () => {
    it('updates name fields in the house subcollections and merges per document', async () => {
        results.set('houses/h1/bookings|user_id', { docs: [d('houses/h1/bookings/b1')] });
        results.set('houses/h1/tasks|created_by', { docs: [d('houses/h1/tasks/t1')] });
        results.set('houses/h1/tasks|assigned_to', {
            docs: [d('houses/h1/tasks/t1', { assigned_to: ['x', 'u1'], assigned_to_names: ['X', 'Old'] })],
        });
        results.set('houses/h1/budget_plans', {
            docs: [d('houses/h1/budget_plans/p1', { items: [{ assigned_owner_id: 'u1', assigned_owner_name: 'Old' }, { assigned_owner_id: 'z' }] })],
        });

        const r = await updateUserNameInAllCollections('u1', 'Nýtt', ['h1']);

        expect(r).toEqual({ ok: true, updatedDocs: 3, failedHouseIds: [] });
        const all = batches.flatMap((b) => b.updates);
        expect(all.find((u) => u.path === 'houses/h1/bookings/b1')?.data).toEqual({ user_name: 'Nýtt' });
        expect(all.find((u) => u.path === 'houses/h1/tasks/t1')?.data).toEqual({
            created_by_name: 'Nýtt',
            assigned_to_names: ['X', 'Nýtt'],
        });
        expect(all.find((u) => u.path === 'houses/h1/budget_plans/p1')?.data.items[0].assigned_owner_name).toBe('Nýtt');
        expect(all.find((u) => u.path === 'houses/h1/budget_plans/p1')?.data.items[1]).toEqual({ assigned_owner_id: 'z' });
    });

    it('never queries top-level collections', async () => {
        const { collection } = await import('firebase/firestore');
        await updateUserNameInAllCollections('u1', 'N', ['h1']);
        for (const call of vi.mocked(collection).mock.calls) {
            expect(call[1]).toBe('houses');
        }
    });

    it('reports partial failure and keeps processing other houses', async () => {
        results.set('houses/h1/bookings|user_id', new Error('permission-denied'));
        results.set('houses/h2/bookings|user_id', { docs: [d('houses/h2/bookings/b1')] });
        const r = await updateUserNameInAllCollections('u1', 'N', ['h1', 'h2']);
        expect(r.ok).toBe(false);
        expect(r.failedHouseIds).toEqual(['h1']);
        expect(r.updatedDocs).toBe(1);
    });

    it('chunks writes at 450 per batch', async () => {
        results.set('houses/h1/bookings|user_id', {
            docs: Array.from({ length: 1000 }, (_, i) => d(`houses/h1/bookings/b${i}`)),
        });
        const r = await updateUserNameInAllCollections('u1', 'N', ['h1']);
        expect(r.updatedDocs).toBe(1000);
        expect(batches.map((b) => b.updates.length)).toEqual([450, 450, 100]);
    });
});
