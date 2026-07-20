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
    getDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logger } from '@/utils/logger';
import type { Booking, BookingType, User } from '@/types/models';

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
 * (unless allowConflicts is true), then fans out notifications to the
 * house's owners (in-app, push, email), respecting each owner's
 * notification_settings. Notification failures are logged but never make
 * booking creation fail — the booking itself already succeeded.
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

    // Send notifications (don't block on this / don't fail booking creation)
    try {
        await sendBookingNotifications({ houseId, bookingId, userId, userName, start, end, type });
    } catch (notifyError) {
        logger.error('Failed to send booking notifications:', notifyError);
    }

    return bookingId;
}

interface SendBookingNotificationsParams {
    houseId: string;
    bookingId: string;
    userId: string;
    userName: string;
    start: Date;
    end: Date;
    type: BookingType;
}

async function sendBookingNotifications({
    houseId,
    bookingId,
    userId,
    userName,
    start,
    end,
    type,
}: SendBookingNotificationsParams): Promise<void> {
    // Fetch house to get owner IDs
    const houseDoc = await getDoc(doc(db, 'houses', houseId));
    const house = houseDoc.data();

    if (!house || !house.owner_ids) return;

    const ownerEmails: string[] = [];
    const allTokens: string[] = [];
    const houseName = house.name || 'Sumarhús';

    for (const ownerId of house.owner_ids) {
        // Don't notify the person who made the booking
        if (ownerId === userId) continue;

        const userDoc = await getDoc(doc(db, 'users', ownerId));
        const userData = userDoc.data() as User;
        if (!userData) continue;

        // Check Notification Settings
        const settings = userData.notification_settings;

        // 1. In-App Notification (Respecting Settings)
        const inAppEnabled = settings?.in_app?.new_bookings ?? true; // Default to true if not set
        if (inAppEnabled) {
            await addDoc(collection(db, 'notifications'), {
                user_id: ownerId,
                house_id: houseId,
                title: 'Ný bókun',
                message: `${userName} bókaði ${houseName}`,
                type: 'booking',
                read: false,
                data: {
                    booking_id: bookingId,
                },
                created_at: serverTimestamp(),
            });

            // Collect tokens for push if in-app is enabled
            if (userData.fcm_tokens && userData.fcm_tokens.length > 0) {
                allTokens.push(...userData.fcm_tokens);
            }
        }

        // 2. Email Notification (Respecting Settings)
        const emailEnabled = settings?.emails?.new_bookings ?? true;
        if (emailEnabled && userData.email) {
            ownerEmails.push(userData.email);
        }
    }

    // Send gathered emails via API
    if (ownerEmails.length > 0) {
        await fetch('/api/booking-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                houseName,
                userName,
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                bookingType: type,
                ownerEmails,
                language: 'is', // Logic for individual languages could be added here
            }),
        });
    }

    // Send Push Notifications via API
    if (allTokens.length > 0) {
        await fetch('/api/push-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tokens: allTokens,
                title: 'Ný bókun 🏠',
                body: `${userName} bókaði ${houseName} (${start.toLocaleDateString('is-IS')} - ${end.toLocaleDateString('is-IS')})`,
                data: {
                    link: 'https://www.bustadurinn.is/calendar',
                    booking_id: bookingId,
                },
            }),
        });
    }
}

/**
 * Deletes a booking.
 */
export async function deleteBooking(houseId: string, bookingId: string): Promise<void> {
    await deleteDoc(doc(db, 'houses', houseId, 'bookings', bookingId));
}
