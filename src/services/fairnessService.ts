/**
 * Fairness Service (ROADMAP_2026 Phase 2.2-2.3 — Holiday fairness rotation)
 *
 * Replaces the old 1-year-lookback "you had it last year -> blocked" rule
 * (formerly `checkFairness` in CalendarPage.tsx) with a rotation-priority
 * model computed live from the bookings subcollection — there is no
 * dedicated fairness-ledger collection; history is derived on every call.
 *
 * Booking date semantics match bookingService.ts: `end` is an EXCLUSIVE
 * checkout day. `rangesOverlap` is reused (not reimplemented) to test window
 * overlap, and history queries follow the exact same
 * `where('end', '>', windowStart) + orderBy('end') + client-side filter`
 * pattern as `findConflictingBookings`.
 */

import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    doc,
    getDoc,
} from 'firebase/firestore';
import { subMonths, format, differenceInCalendarDays, getYear } from 'date-fns';
import { is } from 'date-fns/locale';
import { db } from '@/lib/firebase';
import { logger } from '@/utils/logger';
import { rangesOverlap } from '@/services/bookingService';
import {
    getContestedHolidayWindows,
    CONTESTED_HOLIDAY_KEYS,
} from '@/utils/icelandicHolidays';
import type { ContestedHolidayKey, ContestedHolidayWindow } from '@/utils/icelandicHolidays';
import type { Booking, House, User } from '@/types/models';

/** How long before a contested window's start it opens up to every member. */
export const PRIORITY_WINDOW_MONTHS = 3;

export interface HolidayHistoryEntry {
    year: number;
    heldByUserId: string | null;
    heldByUserName: string | null;
}

export interface HolidayPriority {
    /** userIds ordered best-claim-first. */
    ranking: string[];
    topUserId: string | null;
    /** The moment this window stops being priority-gated and opens to everyone. */
    opensToAllAt: Date;
    history: HolidayHistoryEntry[];
}

export type FairnessCheckResult =
    | { allowed: true }
    | { allowed: false; reason: string; holidayKey: ContestedHolidayKey };

/**
 * Pure: a window's priority cutoff is deterministic from its start date, so
 * this needs no reads. Exported so callers (e.g. checkFairnessForBooking)
 * can short-circuit before paying for a history query.
 */
export function getOpensToAllAt(window: ContestedHolidayWindow): Date {
    return subMonths(window.start, PRIORITY_WINDOW_MONTHS);
}

/**
 * Fetches bookings for `houseId` that overlap `window`, using the same
 * fresh-read pattern as bookingService.findConflictingBookings.
 */
async function fetchWindowBookings(
    houseId: string,
    window: ContestedHolidayWindow
): Promise<Booking[]> {
    const q = query(
        collection(db, 'houses', houseId, 'bookings'),
        where('end', '>', window.start),
        orderBy('end')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs
        .map((docSnap) => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                start: data.start.toDate(),
                end: data.end.toDate(),
                created_at: data.created_at?.toDate() || new Date(),
            } as Booking;
        })
        .filter((booking) => rangesOverlap(window.start, window.end, booking.start, booking.end));
}

/**
 * Given the bookings overlapping a window, picks the family that "held" it:
 * whoever covers the most nights of the window; ties broken by earliest
 * created_at (first to book it).
 */
function pickWindowWinner(
    bookings: Booking[],
    window: ContestedHolidayWindow
): { heldByUserId: string | null; heldByUserName: string | null } {
    if (bookings.length === 0) {
        return { heldByUserId: null, heldByUserName: null };
    }

    const perUser = new Map<string, { nights: number; earliestCreatedAt: Date; userName: string }>();

    for (const booking of bookings) {
        const overlapStart = booking.start > window.start ? booking.start : window.start;
        const overlapEnd = booking.end < window.end ? booking.end : window.end;
        const nights = Math.max(0, differenceInCalendarDays(overlapEnd, overlapStart));

        const existing = perUser.get(booking.user_id);
        if (existing) {
            existing.nights += nights;
            if (booking.created_at < existing.earliestCreatedAt) {
                existing.earliestCreatedAt = booking.created_at;
            }
        } else {
            perUser.set(booking.user_id, {
                nights,
                earliestCreatedAt: booking.created_at,
                userName: booking.user_name,
            });
        }
    }

    let winnerId: string | null = null;
    let winner: { nights: number; earliestCreatedAt: Date; userName: string } | null = null;

    for (const [userId, stats] of perUser) {
        const isBetter =
            !winner ||
            stats.nights > winner.nights ||
            (stats.nights === winner.nights && stats.earliestCreatedAt < winner.earliestCreatedAt);

        if (isBetter) {
            winner = stats;
            winnerId = userId;
        }
    }

    return { heldByUserId: winnerId, heldByUserName: winner?.userName ?? null };
}

/**
 * Computes who held a given contested-holiday window in each of the past
 * `yearsBack` years (default 3), relative to `now`.
 *
 * `now` anchors the lookback: the years examined are
 * `[getYear(now) - yearsBack, ..., getYear(now) - 1]`. For all four window
 * keys, `getYear(window.start) === window's key year` (only `aramot`'s *end*
 * crosses into the next calendar year), so passing a specific window's
 * `start` as `now` (as `getHolidayPriority` does below) correctly anchors
 * the lookback to that window's own year rather than to wall-clock "today".
 *
 * Returned entries are ordered ascending by year (oldest first).
 */
export async function getHolidayHistory(
    houseId: string,
    key: ContestedHolidayKey,
    { yearsBack = 3, now = new Date() }: { yearsBack?: number; now?: Date } = {}
): Promise<HolidayHistoryEntry[]> {
    const refYear = getYear(now);
    const years: number[] = [];
    for (let y = refYear - yearsBack; y <= refYear - 1; y++) {
        years.push(y);
    }

    const entries = await Promise.all(
        years.map(async (year) => {
            const window = getContestedHolidayWindows(year).find((w) => w.key === key);
            /* istanbul ignore next -- key is always one of the 4 known keys */
            if (!window) {
                return { year, heldByUserId: null, heldByUserName: null };
            }
            const bookings = await fetchWindowBookings(houseId, window);
            return { year, ...pickWindowWinner(bookings, window) };
        })
    );

    return entries;
}

/**
 * Computes rotation priority for a specific contested-holiday window among
 * `ownerIds`. Ranking rule: members who never held this window (within the
 * lookback) rank above members who did, in `ownerIds` order; among members
 * who did hold it, whoever held it longest ago ranks first.
 */
export async function getHolidayPriority(
    houseId: string,
    window: ContestedHolidayWindow,
    ownerIds: string[],
    { yearsBack = 3 }: { yearsBack?: number } = {}
): Promise<HolidayPriority> {
    const history = await getHolidayHistory(houseId, window.key, { yearsBack, now: window.start });

    // Most recent year (within the lookback) each owner held this window.
    const lastHeldYear = new Map<string, number>();
    for (const entry of history) {
        if (entry.heldByUserId && ownerIds.includes(entry.heldByUserId)) {
            const prev = lastHeldYear.get(entry.heldByUserId);
            if (prev === undefined || entry.year > prev) {
                lastHeldYear.set(entry.heldByUserId, entry.year);
            }
        }
    }

    const neverHeld = ownerIds.filter((id) => !lastHeldYear.has(id));
    const held = ownerIds
        .filter((id) => lastHeldYear.has(id))
        .sort((a, b) => lastHeldYear.get(a)! - lastHeldYear.get(b)!); // oldest last-held first

    const ranking = [...neverHeld, ...held];

    // No rotation basis: if NOBODY held this window within the lookback there
    // is no "turn" to protect, so the window is open to everyone (topUserId
    // null => checkFairnessForBooking allows). Without this, ownerIds[0] got
    // arbitrary exclusive priority — which locked jól/áramót for every house
    // the day the rotation launched, since no house had any history yet.
    const topUserId = held.length === 0 ? null : ranking[0] ?? null;

    return {
        ranking,
        topUserId,
        opensToAllAt: getOpensToAllAt(window),
        history,
    };
}

/** Best-effort display-name lookup for a user, used only when the caller
 * doesn't supply a preloaded `ownerNames` map to checkFairnessForBooking. */
async function resolveUserName(userId: string): Promise<string> {
    try {
        const userSnap = await getDoc(doc(db, 'users', userId));
        const data = userSnap.data() as User | undefined;
        return data?.name ?? 'öðrum meðlim';
    } catch (err) {
        logger.error('fairnessService: failed to resolve user name', userId, err);
        return 'öðrum meðlim';
    }
}

function findOverlappingContestedWindows(
    start: Date,
    end: Date,
    allowedKeys: ContestedHolidayKey[]
): ContestedHolidayWindow[] {
    const years = new Set<number>([
        getYear(start) - 1,
        getYear(start),
        getYear(end),
        getYear(end) + 1,
    ]);

    const windows: ContestedHolidayWindow[] = [];
    for (const year of years) {
        windows.push(...getContestedHolidayWindows(year));
    }

    return windows
        .filter((w) => allowedKeys.includes(w.key) && rangesOverlap(start, end, w.start, w.end))
        .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Checks whether `userId` may book [start, end) at `houseId`, applying the
 * holiday fairness rotation. Mirrors the old CalendarPage `checkFairness`
 * guard: it only applies when `house.holiday_mode === 'fairness'`, and
 * single-owner houses are always allowed (nothing to rotate).
 *
 * Which windows are contested is taken from `house.contested_holidays` when
 * set and non-empty, else all four defaults (paskar, verslunarmannahelgi,
 * jol, aramot).
 *
 * Zero Firestore reads occur unless a contested window actually overlaps
 * [start, end) AND that window hasn't yet opened to everyone — the
 * opens-to-all cutoff is computed from the window's start date alone
 * (`getOpensToAllAt`), so already-open windows also skip the history query.
 *
 * Name resolution for the "whose turn is it" message: pass a preloaded
 * `ownerNames` map (userId -> display name) via `options` to avoid an extra
 * read; if omitted, the top-priority user's name is fetched from the `users`
 * collection on demand.
 */
export async function checkFairnessForBooking(
    houseId: string,
    userId: string,
    start: Date,
    end: Date,
    ownerIds: string[],
    house: House,
    options: { ownerNames?: Record<string, string>; now?: Date } = {}
): Promise<FairnessCheckResult> {
    if (ownerIds.length <= 1) {
        return { allowed: true };
    }

    if (house.holiday_mode !== 'fairness') {
        return { allowed: true };
    }

    const allowedKeys =
        house.contested_holidays && house.contested_holidays.length > 0
            ? house.contested_holidays
            : CONTESTED_HOLIDAY_KEYS;

    const overlappingWindows = findOverlappingContestedWindows(start, end, allowedKeys);

    if (overlappingWindows.length === 0) {
        return { allowed: true };
    }

    const now = options.now ?? new Date();

    for (const window of overlappingWindows) {
        const opensToAllAt = getOpensToAllAt(window);
        if (now >= opensToAllAt) continue;

        const priority = await getHolidayPriority(houseId, window, ownerIds);

        if (priority.topUserId === null || priority.topUserId === userId) continue;

        const topUserName =
            options.ownerNames?.[priority.topUserId] ?? (await resolveUserName(priority.topUserId));

        return {
            allowed: false,
            holidayKey: window.key,
            reason: `${window.name}: Það er röðin komin að ${topUserName} að bóka þessa helgi samkvæmt sanngirnisreglu. Bókun opnast öllum meðlimum ${format(opensToAllAt, 'd. MMMM yyyy', { locale: is })}.`,
        };
    }

    return { allowed: true };
}
