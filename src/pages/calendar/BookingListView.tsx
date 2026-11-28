import { Calendar as CalendarIcon } from 'lucide-react';
import type { Booking, BookingType } from '@/types/models';
import EmptyState from '@/components/EmptyState';
import BookingCard from './BookingCard';

// Custom Bookings List View - shows all bookings as cards (one per booking)
const BookingListView = ({
    bookings,
    onSelectBooking,
    getTypeLabel
}: {
    bookings: Booking[];
    onSelectBooking: (booking: Booking) => void;
    getTypeLabel: (type: BookingType) => string;
}) => {
    // Sort bookings by start date
    // Upcoming: Nearest first
    const now = new Date();
    // Reset time to start of today so bookings ending today aren't "past" yet
    now.setHours(0, 0, 0, 0);

    const upcoming = bookings
        .filter(b => b.end >= now)
        .sort((a, b) => a.start.getTime() - b.start.getTime());

    // Group helper
    const groupBookings = (list: Booking[]) => {
        const grouped: { [key: string]: Booking[] } = {};
        list.forEach(booking => {
            const monthKey = booking.start.toLocaleDateString('is-IS', { month: 'long', year: 'numeric' });
            if (!grouped[monthKey]) {
                grouped[monthKey] = [];
            }
            grouped[monthKey].push(booking);
        });
        return grouped;
    };

    const upcomingGroups = groupBookings(upcoming);

    if (bookings.length === 0) {
        return (
            <EmptyState
                icon={CalendarIcon}
                title="Engar bókanir ennþá"
                description="Dagatalið bíður þín! Bókaðu fyrstu dvölina og haltu utan um hverjir nýta húsið."
            />
        );
    }

    if (upcoming.length === 0) {
        return (
            <div className="text-center py-12 bg-stone-50 rounded-lg border border-stone-200">
                <CalendarIcon className="w-12 h-12 text-stone-300 mx-auto mb-3" aria-hidden="true" />
                <p className="text-stone-500 font-medium">Engar framtíðarbókanir</p>
                <p className="text-sm text-stone-500 mt-1">Eldri bókanir eru ekki sýndar í þessum lista.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {Object.entries(upcomingGroups).map(([month, monthBookings]) => (
                <div key={month}>
                    <h3 className="text-lg font-serif font-bold text-charcoal mb-3 capitalize sticky top-0 bg-white py-2 z-10 border-b border-stone-100">
                        {month}
                    </h3>
                    <div className="space-y-3">
                        {monthBookings.map(booking => (
                            <BookingCard
                                key={booking.id}
                                booking={booking}
                                onClick={onSelectBooking}
                                getTypeLabel={getTypeLabel}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BookingListView;
