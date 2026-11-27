/**
 * Booking Service
 * Handles creation, deletion, and conflict-checking for house bookings.
 *
 * DATE CONVENTION (whole-day ranges, `end` is EXCLUSIVE):
 * - A booking is stored as [start, end) where both are LOCAL midnights and
 *   `end` is the check-out day (react-big-calendar all-day events and
 *   `onSelectSlot` use the same convention: dragging 10th-14th gives
 *   end = 15th 00:00). The booking occupies the nights of start .. end-1.
 * - A booking that checks out on day X and one that checks in on day X do NOT
 *   conflict (back-to-back stays are allowed).
 * - A same-day pick (first day == last day in the form) means a ONE-DAY
 *   booking, not an empty one. It is normalised to [d, d+1 day) on save
 *   (`normalizeBookingRange`), and `rangesOverlap` applies the same rule to
 *   any range shorter than one day, so such a booking occupies that day and
 *   conflicts with anything covering it. Multi-day ranges are unchanged.
 * - Only a reversed range (end < start) is treated as empty / invalid.
 * - Date inputs must use `@/utils/localDate` (local midnight), never
 *   toISOString()/new Date('yyyy-MM-dd') (UTC).
 */

import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { logger } from '@/utils/logger';
import type { Booking, BookingType } from '@/types/models';

/** Returns `start` plus one calendar day (local time). */
function addOneDay(start: Date): Date {
    const d = new Date(start.getTime());
    d.setDate(d.getDate() + 1);
    return d;
}

/**
 * Applies the one-day minimum: a range shorter than one day (including a
 * same-day pick where end == start) is widened to [start, start + 1 day).
 * Ranges of a day or longer, and reversed ranges (end < start), are returned
 * unchanged.
 */
export function normalizeBookingRange(start: Date, end: Date): { start: Date; end: Date } {
    if (end >= start && end < addOneDay(start)) {
        return { start, end: addOneDay(start) };
    }
    return { start, end };
}

/**
 * Pure overlap test for two date ranges. `end` is an EXCLUSIVE boundary
 * (checkout day) on both ranges: a range ending on day X and a range starting
 * on day X do NOT overlap. A range shorter than one day (e.g. a same-day,
 * one-day booking) is treated as occupying one full day. A reversed range
 * (`end < start`) is empty and never overlaps anything.
 */
export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
    if (aEnd < aStart || bEnd < bStart) return false;
    const a = normalizeBookingRange(aStart, aEnd);
    const b = normalizeBookingRange(bStart, bEnd);
    return a.start < b.end && a.end > b.start;
}

/**
 * Fetches bookings for a house that could conflict with [start, end), using a
 * fresh Firestore read at call time (not cached component state).
 *
 * IMPORTANT: The Firestore Web SDK cannot run queries inside a transaction,
 * so this alone is not a transactional guarantee. createBooking narrows the
 * race by re-running this query AFTER the write and rolling back the loser
 * (see createBooking). True atomicity would require an Admin SDK API route or
 * a dedicated bookings-index document with transactional writes (future work).
 */
export async function findConflictingBookings(
    houseId: string,
    start: Date,
    end: Date
): Promise<Booking[]> {
    const q = query(
        collection(db, 'houses', houseId, 'bookings'),
        // '>=' so a legacy zero-length booking (end == start) is still fetched;
        // rangesOverlap does the exact filtering.
        where('end', '>=', start),
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
        .filter((booking) => rangesOverlap(start, end, booking.start, booking.end));
}

/**
 * Thrown by createBooking when fresh conflicts are detected and the caller
 * did not pass allowConflicts: true. Carries the conflicting bookings so the
 * UI can show them in a warning dialog.
 */
export class BookingConflictError extends Error {
    conflicts: Booking[];

    constructor(conflicts: Booking[]) {
        super('Booking conflicts with existing reservation(s)');
        this.name = 'BookingConflictError';
        this.conflicts = conflicts;
    }
}

export interface CreateBookingParams {
    houseId: string;
    userId: string;
    userName: string;
    start: Date;
    end: Date;
    type: BookingType;
    notes?: string;
    /** Skip the conflict re-check (used for the "Bóka samt" override flow). */
    allowConflicts?: boolean;
}

/**
 * Creates a booking. Re-checks for conflicts immediately before writing
 * (unless allowConflicts is true), then asks `/api/booking-notification` to
 * notify the house's other owners (in-app, push, email) server-side,
 * respecting each owner's notification_settings. Notification failures are
 * logged but never make booking creation fail — the booking already succeeded.
 *
 * Returns the new booking's document id.
 */
export async function createBooking(params: CreateBookingParams): Promise<string> {
    const { houseId, userId, userName, start, end, type, notes, allowConflicts } = params;

    if (end < start) {
        throw new Error('Invalid booking range: end is before start');
    }

    if (!allowConflicts) {
        const conflicts = await findConflictingBookings(houseId, start, end);
        if (conflicts.length > 0) {
            throw new BookingConflictError(conflicts);
        }
    }

    // One-day minimum (same-day pick => [d, d+1 day)), see convention above.
    const range = normalizeBookingRange(start, end);

    const docRef = await addDoc(collection(db, 'houses', houseId, 'bookings'), {
        house_id: houseId,
        user_id: userId,
        user_name: userName,
        start: range.start,
        end: range.end,
        type,
        notes: notes || '',
        created_at: serverTimestamp(),
    });

    const bookingId = docRef.id;

    // Post-write race check (check-then-write is not atomic). If an overlapping
    // booking was created in the meantime, exactly one of the racing writers
    // rolls back: the one with the later created_at, ties broken by the greater
    // doc id. Skipped when the user explicitly chose "Bóka samt".
    if (!allowConflicts) {
        let losingTo: Booking[] = [];
        try {
            const after = await findConflictingBookings(houseId, range.start, range.end);
            const self = after.find((b) => b.id === bookingId);
            const others = after.filter((b) => b.id !== bookingId);
            const selfCreated = self?.created_at ?? new Date();
            losingTo = others.filter((o) => {
                const diff = selfCreated.getTime() - o.created_at.getTime();
                return diff > 0 || (diff === 0 && bookingId > o.id);
            });
        } catch (raceCheckError) {
            logger.warn('Post-write booking conflict check failed:', raceCheckError);
        }

        if (losingTo.length > 0) {
            try {
                await deleteDoc(doc(db, 'houses', houseId, 'bookings', bookingId));
            } catch (rollbackError) {
                logger.error('Failed to roll back conflicting booking:', rollbackError);
                return bookingId;
            }
            throw new BookingConflictError(losingTo);
        }
    }

    // Ask the server to notify co-owners (in-app, email, push). The server
    // resolves recipients and honours their notification settings. Failures are
    // logged but never make booking creation fail.
    try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
            logger.warn('Skipping booking notifications: no signed-in user');
        } else {
            const response = await fetch('/api/booking-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ houseId, bookingId, language: 'is' }),
            });
            if (!response.ok) {
                logger.warn('Booking notification request failed:', response.status);
            }
        }
    } catch (notifyError) {
        logger.warn('Failed to send booking notifications:', notifyError);
    }

    return bookingId;
}

/**
 * Deletes a booking.
 */
export async function deleteBooking(houseId: string, bookingId: string): Promise<void> {
    await deleteDoc(doc(db, 'houses', houseId, 'bookings', bookingId));
}
