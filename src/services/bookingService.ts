/**
 * Booking Service
 * Handles creation, deletion, and conflict-checking for house bookings.
 *
 * Booking date semantics (verified against CalendarPage.tsx):
 * - The "Ný bókun" form uses `<input type="date">`. Reading its value with
 *   `new Date('YYYY-MM-DD')` parses it as UTC midnight; writing it back uses
 *   `toISOString().split('T')[0]`, which round-trips losslessly. Iceland does
 *   not observe DST and sits at UTC+0 year-round, so UTC midnight and Reykjavík
 *   local midnight coincide — there is no cross-timezone drift to worry about.
 * - When a range is selected by dragging on the month calendar
 *   (react-big-calendar `onSelectSlot`), the library already returns `end` as
 *   midnight of the day AFTER the last selected day (an exclusive "checkout
 *   day" convention), matching the manual date-input case above.
 * - The pre-existing `checkConflicts` in CalendarPage encodes this: it treats
 *   `end` as an exclusive boundary (`start < booking.end && end > booking.start`),
 *   i.e. a booking that checks out on day X and another that checks in on day X
 *   do NOT conflict. `rangesOverlap` below preserves that exact boundary
 *   behavior so conflict detection doesn't change semantics during the
 *   extraction.
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

/**
 * Pure overlap test for two date ranges. `end` is treated as an EXCLUSIVE
 * boundary (checkout day) on both ranges: a range ending on day X and a range
 * starting on day X do NOT overlap. Strict inequalities on both sides achieve
 * this. A degenerate/invalid range (`end <= start`, e.g. a same-day or
 * reversed range) covers zero time and is explicitly treated as empty, so it
 * never overlaps anything — without this guard the two inequalities alone
 * can accidentally evaluate to true for a reversed range depending on where
 * its (swapped) endpoints happen to fall relative to the other range.
 */
export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
    if (aEnd <= aStart || bEnd <= bStart) return false;
    return aStart < bEnd && aEnd > bStart;
}

/**
 * Fetches bookings for a house that could conflict with [start, end), using a
 * fresh Firestore read at call time (not cached component state).
 *
 * IMPORTANT: The Firestore Web SDK cannot run queries inside a transaction,
 * so this is a race-window-narrowing check, not a transactional guarantee.
 * Two users can still race between this check and the write. True atomicity
 * would require either an Admin SDK API route that does the check-and-write
 * server-side, or a dedicated bookings-index document with transactional
 * writes — both are future work, not implemented here.
 */
export async function findConflictingBookings(
    houseId: string,
    start: Date,
    end: Date
): Promise<Booking[]> {
    const q = query(
        collection(db, 'houses', houseId, 'bookings'),
        where('end', '>', start),
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

    if (!allowConflicts) {
        const conflicts = await findConflictingBookings(houseId, start, end);
        if (conflicts.length > 0) {
            throw new BookingConflictError(conflicts);
        }
    }

    const docRef = await addDoc(collection(db, 'houses', houseId, 'bookings'), {
        house_id: houseId,
        user_id: userId,
        user_name: userName,
        start,
        end,
        type,
        notes: notes || '',
        created_at: serverTimestamp(),
    });

    const bookingId = docRef.id;

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
