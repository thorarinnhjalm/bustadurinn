/**
 * bookingService Tests
 * Covers the pure rangesOverlap boundary logic plus the Firestore-backed
 * conflict check / create / delete flows using the mocked firestore SDK
 * (see src/test/setup.ts and src/hooks/useUserRole.test.ts for the pattern).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import {
    rangesOverlap,
    findConflictingBookings,
    createBooking,
    deleteBooking,
    BookingConflictError,
} from './bookingService';

vi.mock('@/lib/firebase', () => ({
    db: {},
    auth: { currentUser: { getIdToken: vi.fn().mockResolvedValue('test-id-token') } },
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn(),
    serverTimestamp: vi.fn(() => 'server-timestamp'),
}));

const mockedGetDocs = vi.mocked(getDocs);
const mockedAddDoc = vi.mocked(addDoc);
const mockedDeleteDoc = vi.mocked(deleteDoc);
const mockedFetch = vi.fn();

function fakeTimestamp(date: Date) {
    return { toDate: () => date };
}

function bookingSnapshotDoc(id: string, data: Record<string, any>) {
    return {
        id,
        data: () => data,
    };
}

function bookingsSnapshot(docs: ReturnType<typeof bookingSnapshotDoc>[]) {
    return { docs } as unknown as Awaited<ReturnType<typeof getDocs>>;
}

describe('rangesOverlap', () => {
    it('detects full overlap (identical ranges)', () => {
        const start = new Date('2026-07-10');
        const end = new Date('2026-07-15');
        expect(rangesOverlap(start, end, start, end)).toBe(true);
    });

    it('detects partial overlap', () => {
        // A: 10-15, B: 13-20 -> overlap 13-15
        expect(rangesOverlap(
            new Date('2026-07-10'), new Date('2026-07-15'),
            new Date('2026-07-13'), new Date('2026-07-20')
        )).toBe(true);
    });

    it('detects one range fully contained within another', () => {
        // A: 1-30, B: 10-15 (contained)
        expect(rangesOverlap(
            new Date('2026-07-01'), new Date('2026-07-30'),
            new Date('2026-07-10'), new Date('2026-07-15')
        )).toBe(true);
    });

    it('treats touching boundaries (checkout day == check-in day) as NOT overlapping', () => {
        // A ends exactly when B starts - same-day checkout/check-in is allowed
        const boundary = new Date('2026-07-15');
        expect(rangesOverlap(
            new Date('2026-07-10'), boundary,
            boundary, new Date('2026-07-20')
        )).toBe(false);

        // Symmetric case: B ends exactly when A starts
        expect(rangesOverlap(
            boundary, new Date('2026-07-20'),
            new Date('2026-07-10'), boundary
        )).toBe(false);
    });

    it('returns false for completely disjoint ranges', () => {
        expect(rangesOverlap(
            new Date('2026-07-01'), new Date('2026-07-05'),
            new Date('2026-07-10'), new Date('2026-07-15')
        )).toBe(false);
    });

    it('treats an invalid range (end < start) as empty - never overlaps', () => {
        // A degenerate/invalid range where end < start should not report an
        // overlap with a range it "touches", since aEnd > bStart fails.
        const invalidStart = new Date('2026-07-15');
        const invalidEnd = new Date('2026-07-10'); // before start
        expect(rangesOverlap(
            invalidStart, invalidEnd,
            new Date('2026-07-01'), new Date('2026-07-20')
        )).toBe(false);
    });
});

describe('findConflictingBookings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('filters the fetched bookings down to only those that actually overlap', async () => {
        const requestedStart = new Date('2026-07-10');
        const requestedEnd = new Date('2026-07-15');

        mockedGetDocs.mockResolvedValueOnce(bookingsSnapshot([
            // Overlaps (13-20 crosses into 10-15)
            bookingSnapshotDoc('overlap-1', {
                house_id: 'house-1',
                user_id: 'u1',
                user_name: 'Anna',
                start: fakeTimestamp(new Date('2026-07-13')),
                end: fakeTimestamp(new Date('2026-07-20')),
                type: 'personal',
                created_at: fakeTimestamp(new Date('2026-01-01')),
            }),
            // Touches at the boundary (ends exactly when requested range starts) - no overlap
            bookingSnapshotDoc('touching', {
                house_id: 'house-1',
                user_id: 'u2',
                user_name: 'Bjarni',
                start: fakeTimestamp(new Date('2026-07-05')),
                end: fakeTimestamp(requestedStart),
                type: 'personal',
                created_at: fakeTimestamp(new Date('2026-01-01')),
            }),
        ]));

        const conflicts = await findConflictingBookings('house-1', requestedStart, requestedEnd);

        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].id).toBe('overlap-1');
        expect(conflicts[0].user_name).toBe('Anna');
    });

    it('returns an empty array when nothing overlaps', async () => {
        mockedGetDocs.mockResolvedValueOnce(bookingsSnapshot([]));

        const conflicts = await findConflictingBookings('house-1', new Date('2026-07-10'), new Date('2026-07-15'));

        expect(conflicts).toEqual([]);
    });
});

describe('createBooking', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedFetch.mockReset();
        mockedFetch.mockResolvedValue({ ok: true, status: 200 });
        vi.stubGlobal('fetch', mockedFetch);
        vi.mocked(auth.currentUser!.getIdToken).mockResolvedValue('test-id-token');
    });

    it('throws BookingConflictError carrying the conflicts instead of writing, when conflicts exist', async () => {
        mockedGetDocs.mockResolvedValueOnce(bookingsSnapshot([
            bookingSnapshotDoc('existing-1', {
                house_id: 'house-1',
                user_id: 'other-user',
                user_name: 'Existing Owner',
                start: fakeTimestamp(new Date('2026-07-12')),
                end: fakeTimestamp(new Date('2026-07-18')),
                type: 'personal',
                created_at: fakeTimestamp(new Date('2026-01-01')),
            }),
        ]));

        let caught: unknown;
        try {
            await createBooking({
                houseId: 'house-1',
                userId: 'me',
                userName: 'Me',
                start: new Date('2026-07-10'),
                end: new Date('2026-07-15'),
                type: 'personal',
            });
        } catch (err) {
            caught = err;
        }

        expect(caught).toBeInstanceOf(BookingConflictError);
        expect((caught as BookingConflictError).conflicts).toHaveLength(1);
        expect((caught as BookingConflictError).conflicts[0].id).toBe('existing-1');
        expect(mockedAddDoc).not.toHaveBeenCalled();
    });

    it('skips the conflict check and writes when allowConflicts is true', async () => {
        mockedAddDoc.mockResolvedValueOnce({ id: 'new-booking-id' } as any);

        const id = await createBooking({
            houseId: 'house-1',
            userId: 'me',
            userName: 'Me',
            start: new Date('2026-07-10'),
            end: new Date('2026-07-15'),
            type: 'personal',
            allowConflicts: true,
        });

        expect(id).toBe('new-booking-id');
        // The conflict re-check must not run at all when overriding
        expect(mockedGetDocs).not.toHaveBeenCalled();
        expect(mockedAddDoc).toHaveBeenCalledTimes(1);
    });

    it('writes the booking and returns its id when there are no conflicts', async () => {
        mockedGetDocs.mockResolvedValueOnce(bookingsSnapshot([])); // conflict check: none
        mockedAddDoc.mockResolvedValueOnce({ id: 'new-booking-id' } as any);

        const id = await createBooking({
            houseId: 'house-1',
            userId: 'me',
            userName: 'Me',
            start: new Date('2026-07-10'),
            end: new Date('2026-07-15'),
            type: 'personal',
        });

        expect(id).toBe('new-booking-id');
        expect(mockedAddDoc).toHaveBeenCalledTimes(1);
    });

    it('calls /api/booking-notification with the ID token and only { houseId, bookingId }', async () => {
        mockedGetDocs.mockResolvedValueOnce(bookingsSnapshot([]));
        mockedAddDoc.mockResolvedValueOnce({ id: 'new-booking-id' } as any);

        await createBooking({
            houseId: 'house-1',
            userId: 'me',
            userName: 'Me',
            start: new Date('2026-07-10'),
            end: new Date('2026-07-15'),
            type: 'personal',
        });

        expect(mockedFetch).toHaveBeenCalledTimes(1);
        const [url, init] = mockedFetch.mock.calls[0];
        expect(url).toBe('/api/booking-notification');
        expect(init.headers.Authorization).toBe('Bearer test-id-token');
        expect(JSON.parse(init.body)).toEqual({ houseId: 'house-1', bookingId: 'new-booking-id', language: 'is' });
    });

    it('still returns the booking id when the notification request fails or throws', async () => {
        mockedAddDoc.mockResolvedValueOnce({ id: 'b1' } as any);
        mockedFetch.mockRejectedValueOnce(new Error('network down'));
        const params = {
            houseId: 'house-1',
            userId: 'me',
            userName: 'Me',
            start: new Date('2026-07-10'),
            end: new Date('2026-07-15'),
            type: 'personal' as const,
            allowConflicts: true,
        };
        await expect(createBooking(params)).resolves.toBe('b1');

        mockedAddDoc.mockResolvedValueOnce({ id: 'b2' } as any);
        mockedFetch.mockResolvedValueOnce({ ok: false, status: 500 });
        await expect(createBooking(params)).resolves.toBe('b2');
    });

    it('skips the notification request when there is no signed-in user token', async () => {
        mockedAddDoc.mockResolvedValueOnce({ id: 'b3' } as any);
        vi.mocked(auth.currentUser!.getIdToken).mockResolvedValueOnce(undefined as any);

        await createBooking({
            houseId: 'house-1',
            userId: 'me',
            userName: 'Me',
            start: new Date('2026-07-10'),
            end: new Date('2026-07-15'),
            type: 'personal',
            allowConflicts: true,
        });

        expect(mockedFetch).not.toHaveBeenCalled();
    });
});

describe('deleteBooking', () => {
    it('deletes the booking document', async () => {
        mockedDeleteDoc.mockResolvedValueOnce(undefined);

        await deleteBooking('house-1', 'booking-1');

        expect(mockedDeleteDoc).toHaveBeenCalledTimes(1);
    });
});
