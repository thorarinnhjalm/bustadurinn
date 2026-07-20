/**
 * Árbók (Yearbook) Service
 *
 * Aggregates a read-only "year in review" for a house: bookings, guestbook
 * entries, and contested-holiday rotation winners for a given calendar year.
 *
 * Data sources (verified against the actual code, not docs):
 * - Bookings: `houses/{houseId}/bookings` subcollection. `end` is an
 *   EXCLUSIVE checkout day (see bookingService.ts). Fetched by a range query
 *   on `start` (`>= yearStart && < yearEnd`), matching the single-field range
 *   pattern used elsewhere (findConflictingBookings, fetchWindowBookings).
 *   Note: a booking that STARTS before the year but checks out inside it
 *   (e.g. booked Dec 30 last year, checks out Jan 3) is not picked up by this
 *   query — only bookings starting within the year are counted, with their
 *   nights clamped down if they run past the year's end.
 * - Guestbook: top-level `guestbook` collection (NOT `guestbook_entries` —
 *   that name doesn't exist anywhere in the code; confirmed via
 *   DashboardPage.tsx's checkout write, GuestPage.tsx, and
 *   GuestbookViewer.tsx, which all use `collection(db, 'guestbook')`).
 *   Entries: `{ house_id, author, message, created_at }`. Queried the same
 *   way GuestbookViewer does (equality on house_id + orderBy created_at
 *   desc, which is already indexed since that query ships in production),
 *   then filtered to the target year client-side to avoid depending on a new
 *   composite index.
 * - Holiday rotation winners: `getHolidayHistory` from `fairnessService.ts`.
 *   That function's `now` anchors the lookback window to
 *   `[getYear(now) - yearsBack, getYear(now) - 1]` (strictly BEFORE now's
 *   year). To get the winner FOR year Y, `now` must be anchored in year Y+1
 *   with `yearsBack: 1` — verified directly against
 *   `getHolidayHistory`'s implementation and its test
 *   (`fairnessService.test.ts`, "picks the family covering the most nights
 *   each year": `now = 2026-01-01` examines `[2023, 2024, 2025]`, i.e.
 *   `getYear(now) - 1`).
 *
 * Resilience: each sub-fetch (bookings, guestbook, each of the 4 holiday
 * windows) is individually try/caught so a single failing read degrades only
 * that section to an empty result — `buildYearbook` itself never throws.
 */

import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { differenceInCalendarDays, addDays, getYear } from 'date-fns';
import { db } from '@/lib/firebase';
import { logger } from '@/utils/logger';
import { getHolidayHistory } from '@/services/fairnessService';
import {
    getContestedHolidayWindows,
    CONTESTED_HOLIDAY_KEYS,
} from '@/utils/icelandicHolidays';
import type { ContestedHolidayKey } from '@/utils/icelandicHolidays';
import type { Booking, BookingType, GuestbookEntry, House } from '@/types/models';

/** Most recent guestbook entries surfaced on the árbók page. */
export const GUESTBOOK_DISPLAY_CAP = 12;

export interface FamilyNightsEntry {
    userId: string;
    userName: string;
    nights: number;
    bookings: number;
}

export interface MonthNights {
    /** 0-indexed (0 = January), matching JS Date#getMonth. */
    month: number;
    nights: number;
}

export interface LongestStayEntry {
    userId: string;
    userName: string;
    /** Nights clamped to the árbók year. */
    nights: number;
    /** Actual (unclamped) booking start/end, for display. */
    start: Date;
    end: Date;
}

export interface VisitSummary {
    userId: string;
    userName: string;
    start: Date;
    end: Date;
}

export interface HolidayResult {
    key: ContestedHolidayKey;
    name: string;
    winnerUserId: string | null;
    winnerUserName: string | null;
}

export interface GuestbookQuote {
    id: string;
    author: string;
    message: string;
    date: Date;
}

export type BookingTypeBreakdown = Record<BookingType, number>;

export interface Yearbook {
    houseId: string;
    houseName: string;
    year: number;
    totalNights: number;
    totalBookings: number;
    /** Sorted descending by nights. */
    familyNights: FamilyNightsEntry[];
    busiestMonth: MonthNights | null;
    longestStay: LongestStayEntry | null;
    firstVisit: VisitSummary | null;
    lastVisit: VisitSummary | null;
    holidays: HolidayResult[];
    /** Most recent entries, capped at GUESTBOOK_DISPLAY_CAP. */
    guestbookEntries: GuestbookQuote[];
    guestbookTotalCount: number;
    bookingTypeBreakdown: BookingTypeBreakdown;
}

/* =============================================================================
   PURE AGGREGATION (exported for unit testing — no Firestore involved)
   ============================================================================= */

/**
 * Nights a booking contributes to `year`, clamping the end down to the
 * year's boundary if the stay runs past Dec 31 (and the start up to Jan 1,
 * for defensiveness, even though the fetch query already guarantees
 * `start >= yearStart`).
 */
export function clampBookingNights(booking: Pick<Booking, 'start' | 'end'>, year: number): number {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);
    const start = booking.start < yearStart ? yearStart : booking.start;
    const end = booking.end > yearEnd ? yearEnd : booking.end;
    const nights = differenceInCalendarDays(end, start);
    return nights > 0 ? nights : 0;
}

/** Nights + booking count per family (grouped by user_id), sorted by nights desc. */
export function aggregateFamilyNights(
    bookings: Pick<Booking, 'user_id' | 'user_name' | 'start' | 'end'>[],
    year: number
): FamilyNightsEntry[] {
    const map = new Map<string, FamilyNightsEntry>();

    for (const booking of bookings) {
        const nights = clampBookingNights(booking, year);
        const existing = map.get(booking.user_id);
        if (existing) {
            existing.nights += nights;
            existing.bookings += 1;
        } else {
            map.set(booking.user_id, {
                userId: booking.user_id,
                userName: booking.user_name,
                nights,
                bookings: 1,
            });
        }
    }

    return Array.from(map.values()).sort((a, b) => b.nights - a.nights);
}

/** Nights per calendar month (0-11), counted day-by-day so multi-month stays
 * are attributed to the months they actually fall in. */
export function computeMonthlyNights(
    bookings: Pick<Booking, 'start' | 'end'>[],
    year: number
): MonthNights[] {
    const counts = new Array(12).fill(0) as number[];
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);

    for (const booking of bookings) {
        let cursor = booking.start < yearStart ? yearStart : booking.start;
        const end = booking.end > yearEnd ? yearEnd : booking.end;
        while (cursor < end) {
            counts[cursor.getMonth()] += 1;
            cursor = addDays(cursor, 1);
        }
    }

    return counts.map((nights, month) => ({ month, nights }));
}

/** The single month with the most booked nights, or null if the year had none. */
export function computeBusiestMonth(
    bookings: Pick<Booking, 'start' | 'end'>[],
    year: number
): MonthNights | null {
    const monthly = computeMonthlyNights(bookings, year);
    let best: MonthNights | null = null;
    for (const entry of monthly) {
        if (!best || entry.nights > best.nights) best = entry;
    }
    return best && best.nights > 0 ? best : null;
}

/** The single longest stay of the year, or null if there were none. */
export function computeLongestStay(
    bookings: Pick<Booking, 'user_id' | 'user_name' | 'start' | 'end'>[],
    year: number
): LongestStayEntry | null {
    let best: LongestStayEntry | null = null;
    for (const booking of bookings) {
        const nights = clampBookingNights(booking, year);
        if (nights <= 0) continue;
        if (!best || nights > best.nights) {
            best = {
                userId: booking.user_id,
                userName: booking.user_name,
                nights,
                start: booking.start,
                end: booking.end,
            };
        }
    }
    return best;
}

/** First and last visit of the year, ordered by booking start date. */
export function computeFirstAndLastVisit(
    bookings: Pick<Booking, 'user_id' | 'user_name' | 'start' | 'end'>[]
): { first: VisitSummary | null; last: VisitSummary | null } {
    if (bookings.length === 0) return { first: null, last: null };

    const sorted = [...bookings].sort((a, b) => a.start.getTime() - b.start.getTime());
    const toSummary = (b: (typeof sorted)[number]): VisitSummary => ({
        userId: b.user_id,
        userName: b.user_name,
        start: b.start,
        end: b.end,
    });

    return { first: toSummary(sorted[0]), last: toSummary(sorted[sorted.length - 1]) };
}

/** Booking count by type; all four keys always present (zero-filled). */
export function computeBookingTypeBreakdown(
    bookings: Pick<Booking, 'type'>[]
): BookingTypeBreakdown {
    const breakdown: BookingTypeBreakdown = {
        personal: 0,
        guest: 0,
        rental: 0,
        maintenance: 0,
    };
    for (const booking of bookings) {
        if (booking.type in breakdown) breakdown[booking.type] += 1;
    }
    return breakdown;
}

/**
 * Filters guestbook entries down to `year` and returns the most recent
 * `cap` of them (for display) alongside the total count for that year.
 */
export function selectYearGuestbookEntries(
    entries: Pick<GuestbookEntry, 'id' | 'author' | 'message' | 'created_at'>[],
    year: number,
    cap: number = GUESTBOOK_DISPLAY_CAP
): { quotes: GuestbookQuote[]; totalCount: number } {
    const inYear = entries.filter((e) => getYear(e.created_at) === year);
    const sorted = [...inYear].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    return {
        quotes: sorted.slice(0, cap).map((e) => ({
            id: e.id,
            author: e.author,
            message: e.message,
            date: e.created_at,
        })),
        totalCount: inYear.length,
    };
}

/* =============================================================================
   FIRESTORE FETCHES (each individually resilient — failures degrade to empty)
   ============================================================================= */

async function fetchYearBookings(houseId: string, year: number): Promise<Booking[]> {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);

    const q = query(
        collection(db, 'houses', houseId, 'bookings'),
        where('start', '>=', yearStart),
        where('start', '<', yearEnd),
        orderBy('start')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            start: data.start.toDate(),
            end: data.end.toDate(),
            created_at: data.created_at?.toDate() || new Date(),
        } as Booking;
    });
}

async function fetchHouseGuestbook(houseId: string): Promise<GuestbookEntry[]> {
    // Same query shape as GuestbookViewer.tsx (equality on house_id + orderBy
    // created_at desc) so it reuses that feature's existing composite index
    // rather than requiring a new one for a created_at range filter.
    const q = query(
        collection(db, 'guestbook'),
        where('house_id', '==', houseId),
        orderBy('created_at', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            created_at: data.created_at?.toDate() || new Date(),
        } as GuestbookEntry;
    });
}

async function fetchHolidayResults(houseId: string, year: number): Promise<HolidayResult[]> {
    // getHolidayHistory examines years strictly before now's year, so anchor
    // `now` in year+1 with yearsBack: 1 to get exactly year's result.
    const anchor = new Date(year + 1, 0, 1);
    const windows = getContestedHolidayWindows(year);

    return Promise.all(
        CONTESTED_HOLIDAY_KEYS.map(async (key): Promise<HolidayResult> => {
            const window = windows.find((w) => w.key === key);
            const name = window?.name ?? key;
            try {
                const history = await getHolidayHistory(houseId, key, { yearsBack: 1, now: anchor });
                const entry = history[0];
                return {
                    key,
                    name,
                    winnerUserId: entry?.heldByUserId ?? null,
                    winnerUserName: entry?.heldByUserName ?? null,
                };
            } catch (err) {
                logger.error('arbokService: failed to fetch holiday history', key, err);
                return { key, name, winnerUserId: null, winnerUserName: null };
            }
        })
    );
}

/* =============================================================================
   PUBLIC ENTRY POINT
   ============================================================================= */

/**
 * Builds the full árbók (yearbook) for `houseId`/`year`. Read-only. Never
 * throws — a failing sub-fetch degrades that section to an empty result so
 * the page can still render everything else.
 */
export async function buildYearbook(houseId: string, year: number, house: House): Promise<Yearbook> {
    const [bookings, guestbook, holidays] = await Promise.all([
        fetchYearBookings(houseId, year).catch((err) => {
            logger.error('arbokService: failed to fetch bookings', err);
            return [] as Booking[];
        }),
        fetchHouseGuestbook(houseId).catch((err) => {
            logger.error('arbokService: failed to fetch guestbook', err);
            return [] as GuestbookEntry[];
        }),
        fetchHolidayResults(houseId, year).catch((err) => {
            logger.error('arbokService: failed to fetch holiday results', err);
            return [] as HolidayResult[];
        }),
    ]);

    const familyNights = aggregateFamilyNights(bookings, year);
    const busiestMonth = computeBusiestMonth(bookings, year);
    const longestStay = computeLongestStay(bookings, year);
    const { first, last } = computeFirstAndLastVisit(bookings);
    const bookingTypeBreakdown = computeBookingTypeBreakdown(bookings);
    const { quotes, totalCount } = selectYearGuestbookEntries(guestbook, year);
    const totalNights = familyNights.reduce((sum, f) => sum + f.nights, 0);

    return {
        houseId,
        houseName: house.name,
        year,
        totalNights,
        totalBookings: bookings.length,
        familyNights,
        busiestMonth,
        longestStay,
        firstVisit: first,
        lastVisit: last,
        holidays,
        guestbookEntries: quotes,
        guestbookTotalCount: totalCount,
        bookingTypeBreakdown,
    };
}
