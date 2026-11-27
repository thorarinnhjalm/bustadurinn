import { describe, it, expect } from 'vitest';
import type { DocumentSnapshot } from 'firebase/firestore';
import { collectSettledHouses, shouldAttemptProfileRepair } from './authHandlerHelpers';

const snap = (id: string, exists: boolean, data: Record<string, unknown> = {}) =>
    ({ id, exists: () => exists, data: () => data }) as unknown as DocumentSnapshot;

describe('shouldAttemptProfileRepair', () => {
    const now = 1_000_000;
    it('never repairs from a cache-served snapshot', () => {
        expect(shouldAttemptProfileRepair({ exists: false, fromCache: true, creationTimeMs: 0, nowMs: now })).toBe(false);
    });
    it('does not repair an existing profile', () => {
        expect(shouldAttemptProfileRepair({ exists: true, fromCache: false, creationTimeMs: 0, nowMs: now })).toBe(false);
    });
    it('keeps the brand-new-account guard', () => {
        expect(shouldAttemptProfileRepair({ exists: false, fromCache: false, creationTimeMs: now - 5000, nowMs: now })).toBe(false);
    });
    it('repairs a server-confirmed missing profile on an older account', () => {
        expect(shouldAttemptProfileRepair({ exists: false, fromCache: false, creationTimeMs: now - 60000, nowMs: now })).toBe(true);
    });
});

describe('collectSettledHouses', () => {
    it('keeps loaded houses when another read was rejected', () => {
        const err = new Error('permission-denied');
        const r = collectSettledHouses(['a', 'b', 'c'], [
            { status: 'fulfilled', value: snap('a', true, { name: 'A' }) },
            { status: 'rejected', reason: err },
            { status: 'fulfilled', value: snap('c', false) },
        ]);
        expect(r.houses).toEqual([{ id: 'a', name: 'A' }]);
        expect(r.failures).toEqual([{ houseId: 'b', reason: err }]);
    });
});
