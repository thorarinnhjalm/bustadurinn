/**
 * arbokService pure-aggregation tests.
 *
 * Only the mock-free pure functions are tested here (no Firestore reads
 * involved) — buildYearbook itself is a thin resilient wrapper around these
 * plus getHolidayHistory (already covered by fairnessService.test.ts).
 */

import { describe, it, expect } from 'vitest';
import {
    clampBookingNights,
    aggregateFamilyNights,
    computeMonthlyNights,
    computeBusiestMonth,
    computeLongestStay,
    computeFirstAndLastVisit,
    computeBookingTypeBreakdown,
    selectYearGuestbookEntries,
    GUESTBOOK_DISPLAY_CAP,
} from './arbokService';
import type { Booking, GuestbookEntry } from '@/types/models';

function booking(overrides: Partial<Booking> & Pick<Booking, 'user_id' | 'user_name' | 'start' | 'end'>): Booking {
    return {
        id: overrides.id ?? 'b1',
        house_id: 'house-1',
        type: overrides.type ?? 'personal',
        created_at: overrides.created_at ?? overrides.start,
        ...overrides,
    };
}

describe('clampBookingNights', () => {
    it('counts plain within-year nights via calendar-day difference', () => {
        const nights = clampBookingNights(
            { start: new Date(2026, 5, 1), end: new Date(2026, 5, 5) },
            2026
        );
        expect(nights).toBe(4);
    });

    it('clamps a stay that runs past the year boundary', () => {
        // Dec 28 -> Jan 3 (next year): only Dec 28-31 (4 nights: 28,29,30,31) counts for 2026.
        const nights = clampBookingNights(
            { start: new Date(2026, 11, 28), end: new Date(2027, 0, 3) },
            2026
        );
        expect(nights).toBe(4);
    });

    it('clamps a stay that starts before the year boundary', () => {
        // Dec 30 (prev year) -> Jan 3: only Jan 1-3 (2 nights) counts for 2026.
        const nights = clampBookingNights(
            { start: new Date(2025, 11, 30), end: new Date(2026, 0, 3) },
            2026
        );
        expect(nights).toBe(2);
    });

    it('never returns negative nights for a degenerate/reversed range', () => {
        const nights = clampBookingNights(
            { start: new Date(2026, 5, 5), end: new Date(2026, 5, 1) },
            2026
        );
        expect(nights).toBe(0);
    });
});

describe('aggregateFamilyNights', () => {
    it('groups by user_id, sums nights, counts bookings, sorted desc by nights', () => {
        const bookings = [
            booking({ id: 'b1', user_id: 'u1', user_name: 'Anna', start: new Date(2026, 0, 1), end: new Date(2026, 0, 4) }), // 3
            booking({ id: 'b2', user_id: 'u1', user_name: 'Anna', start: new Date(2026, 3, 1), end: new Date(2026, 3, 3) }), // 2
            booking({ id: 'b3', user_id: 'u2', user_name: 'Bjarni', start: new Date(2026, 6, 1), end: new Date(2026, 6, 11) }), // 10
        ];

        const result = aggregateFamilyNights(bookings, 2026);

        expect(result).toEqual([
            { userId: 'u2', userName: 'Bjarni', nights: 10, bookings: 1 },
            { userId: 'u1', userName: 'Anna', nights: 5, bookings: 2 },
        ]);
    });

    it('returns an empty array for no bookings', () => {
        expect(aggregateFamilyNights([], 2026)).toEqual([]);
    });
});

describe('computeMonthlyNights / computeBusiestMonth', () => {
    it('attributes nights of a multi-month stay to the correct months', () => {
        // July 28 -> Aug 3 (exclusive end): 4 nights in July (28,29,30,31), 2 in August (1,2).
        const bookings = [
            booking({ user_id: 'u1', user_name: 'Anna', start: new Date(2026, 6, 28), end: new Date(2026, 7, 3) }),
        ];

        const monthly = computeMonthlyNights(bookings, 2026);
        expect(monthly[6].nights).toBe(4); // July
        expect(monthly[7].nights).toBe(2); // August

        const busiest = computeBusiestMonth(bookings, 2026);
        expect(busiest).toEqual({ month: 6, nights: 4 });
    });

    it('returns null busiest month when there are no bookings', () => {
        expect(computeBusiestMonth([], 2026)).toBeNull();
    });
});

describe('computeLongestStay', () => {
    it('picks the booking with the most clamped nights', () => {
        const bookings = [
            booking({ user_id: 'u1', user_name: 'Anna', start: new Date(2026, 0, 1), end: new Date(2026, 0, 4) }), // 3
            booking({ user_id: 'u2', user_name: 'Bjarni', start: new Date(2026, 6, 1), end: new Date(2026, 6, 15) }), // 14
        ];

        const longest = computeLongestStay(bookings, 2026);
        expect(longest?.userId).toBe('u2');
        expect(longest?.nights).toBe(14);
    });

    it('returns null when there are no bookings', () => {
        expect(computeLongestStay([], 2026)).toBeNull();
    });
});

describe('computeFirstAndLastVisit', () => {
    it('orders by booking start date', () => {
        const bookings = [
            booking({ user_id: 'u2', user_name: 'Bjarni', start: new Date(2026, 6, 1), end: new Date(2026, 6, 5) }),
            booking({ user_id: 'u1', user_name: 'Anna', start: new Date(2026, 0, 10), end: new Date(2026, 0, 12) }),
        ];

        const { first, last } = computeFirstAndLastVisit(bookings);
        expect(first?.userId).toBe('u1');
        expect(last?.userId).toBe('u2');
    });

    it('returns nulls for an empty year', () => {
        expect(computeFirstAndLastVisit([])).toEqual({ first: null, last: null });
    });
});

describe('computeBookingTypeBreakdown', () => {
    it('counts each type, zero-filling absent ones', () => {
        const bookings = [
            booking({ user_id: 'u1', user_name: 'Anna', start: new Date(), end: new Date(), type: 'personal' }),
            booking({ user_id: 'u1', user_name: 'Anna', start: new Date(), end: new Date(), type: 'personal' }),
            booking({ user_id: 'u1', user_name: 'Anna', start: new Date(), end: new Date(), type: 'guest' }),
        ];

        expect(computeBookingTypeBreakdown(bookings)).toEqual({
            personal: 2,
            guest: 1,
            rental: 0,
            maintenance: 0,
        });
    });
});

describe('selectYearGuestbookEntries', () => {
    const entries: GuestbookEntry[] = [
        { id: 'g1', house_id: 'h1', author: 'Anna', message: 'Frábært sumar', created_at: new Date(2026, 5, 1) },
        { id: 'g2', house_id: 'h1', author: 'Bjarni', message: 'Kom aftur næsta ár', created_at: new Date(2026, 7, 10) },
        { id: 'g3', house_id: 'h1', author: 'Carl', message: 'Gamalt ár', created_at: new Date(2025, 5, 1) },
    ];

    it('filters to the target year and sorts most-recent-first', () => {
        const { quotes, totalCount } = selectYearGuestbookEntries(entries, 2026);
        expect(totalCount).toBe(2);
        expect(quotes.map((q) => q.id)).toEqual(['g2', 'g1']);
    });

    it('caps the number of returned quotes', () => {
        const many: GuestbookEntry[] = Array.from({ length: 20 }, (_, i) => ({
            id: `g${i}`,
            house_id: 'h1',
            author: 'Anna',
            message: 'x',
            created_at: new Date(2026, 0, i + 1),
        }));

        const { quotes, totalCount } = selectYearGuestbookEntries(many, 2026);
        expect(totalCount).toBe(20);
        expect(quotes).toHaveLength(GUESTBOOK_DISPLAY_CAP);
    });

    it('returns empty results for a year with no entries', () => {
        const { quotes, totalCount } = selectYearGuestbookEntries(entries, 2020);
        expect(quotes).toEqual([]);
        expect(totalCount).toBe(0);
    });
});
