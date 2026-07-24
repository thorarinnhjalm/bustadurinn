/**
 * fairnessService tests.
 * Mocking pattern follows bookingService.test.ts (mock '@/lib/firebase' and
 * 'firebase/firestore', assert on the mocked getDocs/getDoc call sequence).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDocs, getDoc } from 'firebase/firestore';
import { addMonths, addDays } from 'date-fns';
import {
    getHolidayHistory,
    getHolidayPriority,
    checkFairnessForBooking,
    getOpensToAllAt,
    PRIORITY_WINDOW_MONTHS,
} from './fairnessService';
import { getContestedHolidayWindows } from '@/utils/icelandicHolidays';
import type { House } from '@/types/models';

vi.mock('@/lib/firebase', () => ({
    db: {},
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
    getDoc: vi.fn(),
    serverTimestamp: vi.fn(() => 'server-timestamp'),
}));

const mockedGetDocs = vi.mocked(getDocs);
const mockedGetDoc = vi.mocked(getDoc);

function fakeTimestamp(date: Date) {
    return { toDate: () => date };
}

function bookingSnapshotDoc(id: string, data: Record<string, any>) {
    return { id, data: () => data };
}

function bookingsSnapshot(docs: ReturnType<typeof bookingSnapshotDoc>[]) {
    return { docs } as unknown as Awaited<ReturnType<typeof getDocs>>;
}

function booking(
    id: string,
    userId: string,
    userName: string,
    start: Date,
    end: Date,
    createdAt: Date
) {
    return bookingSnapshotDoc(id, {
        house_id: 'house-1',
        user_id: userId,
        user_name: userName,
        start: fakeTimestamp(start),
        end: fakeTimestamp(end),
        type: 'personal',
        created_at: fakeTimestamp(createdAt),
    });
}

const baseHouse: House = {
    id: 'house-1',
    name: 'Sumarbústaður',
    address: '',
    location: { lat: 0, lng: 0 },
    manager_id: 'u1',
    owner_ids: ['u1', 'u2'],
    holiday_mode: 'fairness',
    created_at: new Date(),
    updated_at: new Date(),
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('getOpensToAllAt', () => {
    it('is PRIORITY_WINDOW_MONTHS before the window start', () => {
        const window = getContestedHolidayWindows(2026).find((w) => w.key === 'jol')!;
        const opensToAllAt = getOpensToAllAt(window);
        expect(opensToAllAt.getTime()).toBe(addMonths(window.start, -PRIORITY_WINDOW_MONTHS).getTime());
    });
});

describe('getHolidayHistory', () => {
    it('picks the family covering the most nights each year, and empty years resolve to nulls', async () => {
        // yearsBack=3, now = 2026-01-01 -> examines 2023, 2024, 2025 (ascending).
        const now = new Date(2026, 0, 1);
        const w2023 = getContestedHolidayWindows(2023).find((w) => w.key === 'verslunarmannahelgi')!;
        const w2024 = getContestedHolidayWindows(2024).find((w) => w.key === 'verslunarmannahelgi')!;
        const w2025 = getContestedHolidayWindows(2025).find((w) => w.key === 'verslunarmannahelgi')!;

        // 2023: nobody booked it.
        mockedGetDocs.mockResolvedValueOnce(bookingsSnapshot([]));
        // 2024: user A covers the full window (most nights).
        mockedGetDocs.mockResolvedValueOnce(
            bookingsSnapshot([booking('b1', 'userA', 'Anna', w2024.start, w2024.end, new Date(2024, 0, 1))])
        );
        // 2025: user B covers 1 night, user A covers 3 nights -> A wins on nights.
        mockedGetDocs.mockResolvedValueOnce(
            bookingsSnapshot([
                booking('b2', 'userB', 'Bjarni', w2025.start, addDays(w2025.start, 1), new Date(2025, 0, 1)),
                booking(
                    'b3',
                    'userA',
                    'Anna',
                    addDays(w2025.start, 1),
                    w2025.end,
                    new Date(2025, 0, 2)
                ),
            ])
        );

        const history = await getHolidayHistory('house-1', 'verslunarmannahelgi', { yearsBack: 3, now });

        expect(history).toEqual([
            { year: 2023, heldByUserId: null, heldByUserName: null },
            { year: 2024, heldByUserId: 'userA', heldByUserName: 'Anna' },
            { year: 2025, heldByUserId: 'userA', heldByUserName: 'Anna' },
        ]);
        expect(mockedGetDocs).toHaveBeenCalledTimes(3);
        // Sanity: window boundaries used are the real computed ones, not fixtures.
        expect(w2023.key).toBe('verslunarmannahelgi');
    });

    it('breaks a nights tie by earliest created_at', async () => {
        const now = new Date(2025, 0, 1); // examines 2022-2024, we only assert on 2024
        const w2022 = getContestedHolidayWindows(2022).find((w) => w.key === 'jol')!;
        const w2023 = getContestedHolidayWindows(2023).find((w) => w.key === 'jol')!;
        const w2024 = getContestedHolidayWindows(2024).find((w) => w.key === 'jol')!;

        mockedGetDocs.mockResolvedValueOnce(bookingsSnapshot([])); // 2022
        mockedGetDocs.mockResolvedValueOnce(bookingsSnapshot([])); // 2023
        mockedGetDocs.mockResolvedValueOnce(
            bookingsSnapshot([
                // Both cover exactly 2 nights of the 4-night window -> tie on nights.
                booking('later', 'userLate', 'Later', w2024.start, addDays(w2024.start, 2), new Date(2024, 5, 2)),
                booking(
                    'earlier',
                    'userEarly',
                    'Earlier',
                    addDays(w2024.start, 2),
                    w2024.end,
                    new Date(2024, 5, 1) // created first
                ),
            ])
        );

        const history = await getHolidayHistory('house-1', 'jol', { yearsBack: 3, now });
        const entry2024 = history.find((h) => h.year === 2024)!;

        expect(entry2024.heldByUserId).toBe('userEarly');
        expect(entry2024.heldByUserName).toBe('Earlier');
        void w2022;
        void w2023;
    });
});

describe('getHolidayPriority', () => {
    it('ranks never-held owners above held ones (ownerIds order among never-held), and open when nobody held it', async () => {
        // All 3 lookback years empty for everyone -> nobody has ever held it.
        mockedGetDocs
            .mockResolvedValueOnce(bookingsSnapshot([]))
            .mockResolvedValueOnce(bookingsSnapshot([]))
            .mockResolvedValueOnce(bookingsSnapshot([]));

        const window = getContestedHolidayWindows(2026).find((w) => w.key === 'paskar')!;
        const priority = await getHolidayPriority('house-1', window, ['u2', 'u1', 'u3']);

        expect(priority.ranking).toEqual(['u2', 'u1', 'u3']);
        // No rotation basis without history: topUserId must be null (open to
        // everyone) rather than granting ownerIds[0] arbitrary priority.
        expect(priority.topUserId).toBeNull();
        expect(priority.opensToAllAt.getTime()).toBe(addMonths(window.start, -PRIORITY_WINDOW_MONTHS).getTime());

        // With actual history (u1 held 2025), never-held members rank first
        // in ownerIds order and the top of the ranking is the topUserId.
        const w2025 = getContestedHolidayWindows(2025).find((w) => w.key === 'paskar')!;
        mockedGetDocs
            .mockResolvedValueOnce(bookingsSnapshot([]))
            .mockResolvedValueOnce(bookingsSnapshot([]))
            .mockResolvedValueOnce(
                bookingsSnapshot([booking('b25', 'u1', 'Anna', w2025.start, w2025.end, new Date(2025, 2, 1))])
            );
        const withHistory = await getHolidayPriority('house-1', window, ['u2', 'u1', 'u3']);
        expect(withHistory.ranking).toEqual(['u2', 'u3', 'u1']);
        expect(withHistory.topUserId).toBe('u2');
    });

    it('ranks the owner who held it longest ago above one who held it more recently', async () => {
        const window = getContestedHolidayWindows(2026).find((w) => w.key === 'paskar')!;
        // now = window.start (2026) -> lookback years 2023, 2024, 2025.
        const w2023 = getContestedHolidayWindows(2023).find((w) => w.key === 'paskar')!;
        const w2024 = getContestedHolidayWindows(2024).find((w) => w.key === 'paskar')!;
        const w2025 = getContestedHolidayWindows(2025).find((w) => w.key === 'paskar')!;

        // 2023: u1 held it (longest ago).
        mockedGetDocs.mockResolvedValueOnce(
            bookingsSnapshot([booking('b1', 'u1', 'Owner 1', w2023.start, w2023.end, new Date(2023, 0, 1))])
        );
        // 2024: nobody.
        mockedGetDocs.mockResolvedValueOnce(bookingsSnapshot([]));
        // 2025: u2 held it (most recent).
        mockedGetDocs.mockResolvedValueOnce(
            bookingsSnapshot([booking('b2', 'u2', 'Owner 2', w2025.start, w2025.end, new Date(2025, 0, 1))])
        );

        const priority = await getHolidayPriority('house-1', window, ['u1', 'u2']);

        // Both have held it, so ranked by longest-ago: u1 (2023) before u2 (2025).
        expect(priority.ranking).toEqual(['u1', 'u2']);
        expect(priority.topUserId).toBe('u1');
        void w2024;
    });
});

describe('checkFairnessForBooking', () => {
    it('allows single-owner houses without any reads', async () => {
        const window = getContestedHolidayWindows(2026).find((w) => w.key === 'jol')!;
        const result = await checkFairnessForBooking(
            'house-1',
            'u1',
            window.start,
            addDays(window.start, 1),
            ['u1'],
            baseHouse
        );

        expect(result).toEqual({ allowed: true });
        expect(mockedGetDocs).not.toHaveBeenCalled();
        expect(mockedGetDoc).not.toHaveBeenCalled();
    });

    it('allows bookings when the house is not in fairness mode, without any reads', async () => {
        const window = getContestedHolidayWindows(2026).find((w) => w.key === 'jol')!;
        const house: House = { ...baseHouse, holiday_mode: 'first_come' };
        const result = await checkFairnessForBooking(
            'house-1',
            'u2',
            window.start,
            addDays(window.start, 1),
            ['u1', 'u2'],
            house
        );

        expect(result).toEqual({ allowed: true });
        expect(mockedGetDocs).not.toHaveBeenCalled();
    });

    it('allows non-contested dates without any reads', async () => {
        // A random midsummer week that overlaps no contested window.
        const start = new Date(2026, 6, 1); // July 1
        const end = new Date(2026, 6, 5);

        const result = await checkFairnessForBooking('house-1', 'u2', start, end, ['u1', 'u2'], baseHouse);

        expect(result).toEqual({ allowed: true });
        expect(mockedGetDocs).not.toHaveBeenCalled();
        expect(mockedGetDoc).not.toHaveBeenCalled();
    });

    it('allows the booking once the window has already opened to everyone, without any reads', async () => {
        const window = getContestedHolidayWindows(2026).find((w) => w.key === 'jol')!;
        const opensToAllAt = getOpensToAllAt(window);
        const afterOpen = addDays(opensToAllAt, 1);

        const result = await checkFairnessForBooking(
            'house-1',
            'u2',
            window.start,
            addDays(window.start, 1),
            ['u1', 'u2'],
            baseHouse,
            { now: afterOpen }
        );

        expect(result).toEqual({ allowed: true });
        expect(mockedGetDocs).not.toHaveBeenCalled();
    });

    it('allows EVERYONE before the window opens when nobody has held the holiday in the lookback (no rotation basis)', async () => {
        const window = getContestedHolidayWindows(2026).find((w) => w.key === 'jol')!;
        const beforeOpen = addDays(getOpensToAllAt(window), -1);

        // All three lookback years empty: a fresh house with no history.
        mockedGetDocs
            .mockResolvedValueOnce(bookingsSnapshot([]))
            .mockResolvedValueOnce(bookingsSnapshot([]))
            .mockResolvedValueOnce(bookingsSnapshot([]));

        // u2 is NOT first in ownerIds — under the old (buggy) behavior
        // ownerIds[0] got arbitrary exclusive priority and u2 was blocked.
        const result = await checkFairnessForBooking(
            'house-1',
            'u2',
            window.start,
            addDays(window.start, 1),
            ['u1', 'u2'],
            baseHouse,
            { now: beforeOpen }
        );

        expect(result).toEqual({ allowed: true });
    });

    it('allows the top-priority user (held longest ago) to book before the window opens', async () => {
        const window = getContestedHolidayWindows(2026).find((w) => w.key === 'jol')!;
        const beforeOpen = addDays(getOpensToAllAt(window), -1);
        const w2024 = getContestedHolidayWindows(2024).find((w) => w.key === 'jol')!;
        const w2025 = getContestedHolidayWindows(2025).find((w) => w.key === 'jol')!;

        // u1 held jól 2024, u2 held jól 2025 -> u1 (longest ago) is top.
        mockedGetDocs
            .mockResolvedValueOnce(bookingsSnapshot([])) // 2023
            .mockResolvedValueOnce(
                bookingsSnapshot([booking('b24', 'u1', 'Anna', w2024.start, w2024.end, new Date(2024, 10, 1))])
            )
            .mockResolvedValueOnce(
                bookingsSnapshot([booking('b25', 'u2', 'Jón', w2025.start, w2025.end, new Date(2025, 10, 1))])
            );

        const result = await checkFairnessForBooking(
            'house-1',
            'u1',
            window.start,
            addDays(window.start, 1),
            ['u1', 'u2'],
            baseHouse,
            { now: beforeOpen }
        );

        expect(result).toEqual({ allowed: true });
    });

    it('blocks a non-priority user before the window opens, naming the holiday and the top user via ownerNames', async () => {
        const window = getContestedHolidayWindows(2026).find((w) => w.key === 'jol')!;
        const beforeOpen = addDays(getOpensToAllAt(window), -1);
        const w2025 = getContestedHolidayWindows(2025).find((w) => w.key === 'jol')!;

        // u2 held jól last year, u1 never has -> u1 is top priority.
        mockedGetDocs
            .mockResolvedValueOnce(bookingsSnapshot([])) // 2023
            .mockResolvedValueOnce(bookingsSnapshot([])) // 2024
            .mockResolvedValueOnce(
                bookingsSnapshot([booking('b25', 'u2', 'Jón', w2025.start, w2025.end, new Date(2025, 10, 1))])
            );

        const result = await checkFairnessForBooking(
            'house-1',
            'u2', // held it last year; u1's turn now
            window.start,
            addDays(window.start, 1),
            ['u1', 'u2'],
            baseHouse,
            { now: beforeOpen, ownerNames: { u1: 'Anna' } }
        );

        expect(result.allowed).toBe(false);
        if (!result.allowed) {
            expect(result.holidayKey).toBe('jol');
            expect(result.reason).toContain('Jólin');
            expect(result.reason).toContain('Anna');
        }
        // Name supplied via ownerNames -> no extra getDoc read for it.
        expect(mockedGetDoc).not.toHaveBeenCalled();
    });

    it('falls back to a Firestore read to resolve the top user name when ownerNames is not supplied', async () => {
        const window = getContestedHolidayWindows(2026).find((w) => w.key === 'jol')!;
        const beforeOpen = addDays(getOpensToAllAt(window), -1);
        const w2025 = getContestedHolidayWindows(2025).find((w) => w.key === 'jol')!;

        // u2 held jól last year -> u1 (never held) is top priority, u2 blocked.
        mockedGetDocs
            .mockResolvedValueOnce(bookingsSnapshot([]))
            .mockResolvedValueOnce(bookingsSnapshot([]))
            .mockResolvedValueOnce(
                bookingsSnapshot([booking('b25', 'u2', 'Jón', w2025.start, w2025.end, new Date(2025, 10, 1))])
            );
        mockedGetDoc.mockResolvedValueOnce({ data: () => ({ name: 'Fetched Name' }) } as any);

        const result = await checkFairnessForBooking(
            'house-1',
            'u2',
            window.start,
            addDays(window.start, 1),
            ['u1', 'u2'],
            baseHouse,
            { now: beforeOpen }
        );

        expect(result.allowed).toBe(false);
        if (!result.allowed) {
            expect(result.reason).toContain('Fetched Name');
        }
        expect(mockedGetDoc).toHaveBeenCalledTimes(1);
    });
});
