import { useState, useCallback, useEffect } from 'react';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Booking, BookingType } from '@/types/models';
import { bookingTypeLabels, type SupportedLanguage } from '@/utils/i18n';
import { logger } from '@/utils/logger';
import type { BookingEvent } from './calendarTypes';

/**
 * Loads a house's bookings (Timestamp -> Date) and the matching calendar events.
 * Dates follow the [start, end) local-midnight convention documented at the top
 * of `src/services/bookingService.ts`. Loads on mount / when houseId changes and
 * exposes `loadBookings` to reload after a write.
 */
export function useBookings(houseId: string | undefined, language: SupportedLanguage) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [events, setEvents] = useState<BookingEvent[]>([]);

    // Helper functions
    const getBookingTypeLabel = useCallback((type: BookingType): string => {
        return bookingTypeLabels[language][type] || type;
    }, [language]);

    const loadBookings = useCallback(async () => {
        if (!houseId) return;

        try {
            const q = query(
                collection(db, 'houses', houseId, 'bookings'),
                orderBy('start', 'desc'),
                limit(500)
            );
            const snapshot = await getDocs(q);

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

            // Convert to calendar events - mark as all-day events
            const calendarEvents: BookingEvent[] = bookingsData.map(booking => ({
                id: booking.id,
                title: `${booking.user_name} - ${getBookingTypeLabel(booking.type)}`,
                start: booking.start,
                end: booking.end,
                allDay: true,
                booking
            }));

            setEvents(calendarEvents);
        } catch (err) {
            logger.error('Error loading bookings:', err);
        }
    }, [houseId, getBookingTypeLabel]);

    // Load bookings from Firestore
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadBookings();
    }, [loadBookings]);

    return { bookings, events, loadBookings, getBookingTypeLabel };
}
