import { useState, useCallback, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Booking, BookingType } from '@/types/models';
import { bookingTypeLabels, type SupportedLanguage } from '@/utils/i18n';
import { logger } from '@/utils/logger';
import type { BookingEvent } from './calendarTypes';

/**
 * Subscribes to a house's bookings (Timestamp -> Date) and derives the matching calendar events.
 * Dates follow the [start, end) local-midnight convention documented at the top of
 * `src/services/bookingService.ts`. The listener keeps the calendar current when a co-owner
 * books or deletes something, and also delivers this user's own writes, so there is no
 * separate reload after a create or delete.
 */
export function useBookings(houseId: string | undefined, language: SupportedLanguage) {
    const [bookings, setBookings] = useState<Booking[]>([]);

    // Helper functions
    const getBookingTypeLabel = useCallback((type: BookingType): string => {
        return bookingTypeLabels[language][type] || type;
    }, [language]);

    useEffect(() => {
        if (!houseId) return;

        const q = query(
            collection(db, 'houses', houseId, 'bookings'),
            orderBy('start', 'desc'),
            limit(500)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const bookingsData = snapshot.docs.map(doc => {
                const data = doc.data();
                const start = data.start.toDate();
                let end = data.end.toDate();

                // Sanitize dates: If end is before start, fix it for display
                if (end < start) {
                    logger.warn(`Booking ${doc.id} has invalid dates (end < start). Fixing for display.`);
                    // Swap them or just set end to start + 1 hour as fallback,
                    // but usually swapping is what happened (wrong order picked)
                    // or just user error. Let's force end to be at least start.
                    end = new Date(start.getTime() + 60 * 60 * 1000);
                }

                return {
                    id: doc.id,
                    ...data,
                    start,
                    end,
                    created_at: data.created_at?.toDate() || new Date()
                } as Booking;
            });

            setBookings(bookingsData);
        }, (err) => {
            logger.error('Error loading bookings:', err);
        });

        return unsubscribe;
    }, [houseId]);

    // Convert to calendar events - mark as all-day events
    const events: BookingEvent[] = useMemo(() => bookings.map(booking => ({
        id: booking.id,
        title: `${booking.user_name} - ${getBookingTypeLabel(booking.type)}`,
        start: booking.start,
        end: booking.end,
        allDay: true,
        booking
    })), [bookings, getBookingTypeLabel]);

    return { bookings, events, getBookingTypeLabel };
}
