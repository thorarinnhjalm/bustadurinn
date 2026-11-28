import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import type { Booking, BookingType } from '@/types/models';

// Custom Booking Card for the list view - shows ONE card per booking with full date range
const BookingCard = ({ booking, onClick, getTypeLabel }: {
    booking: Booking;
    onClick: (booking: Booking) => void;
    getTypeLabel: (type: BookingType) => string;
}) => {
    // Format date range nicely: "17. - 20. júní"
    const formatDateRange = (start: Date, end: Date) => {
        const startDay = start.getDate();
        const endDay = end.getDate();
        const sameMonth = start.getMonth() === end.getMonth();
        const sameYear = start.getFullYear() === end.getFullYear();

        if (sameMonth && sameYear) {
            const month = start.toLocaleDateString('is-IS', { month: 'long' });
            if (startDay === endDay) {
                return `${startDay}. ${month}`;
            }
            return `${startDay}. - ${endDay}. ${month}`;
        } else if (sameYear) {
            const startMonth = start.toLocaleDateString('is-IS', { month: 'short' });
            const endMonth = end.toLocaleDateString('is-IS', { month: 'short' });
            return `${startDay}. ${startMonth} - ${endDay}. ${endMonth}`;
        } else {
            return `${start.toLocaleDateString('is-IS')} - ${end.toLocaleDateString('is-IS')}`;
        }
    };

    // Calculate number of nights
    const nights = Math.max(1, Math.ceil((booking.end.getTime() - booking.start.getTime()) / (1000 * 60 * 60 * 24)));

    const typeColors = {
        personal: { bg: 'bg-amber/10', text: 'text-amber-700', border: 'border-l-amber' },
        rental: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-l-green-500' },
        maintenance: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-l-red-500' },
        guest: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-l-indigo-500' }
    };

    const colors = typeColors[booking.type] || typeColors.personal;

    return (
        <button
            type="button"
            onClick={() => onClick(booking)}
            className={`block w-full text-left bg-white rounded-lg border border-stone-200 shadow-sm p-4 cursor-pointer hover:shadow-md transition-all border-l-4 ${colors.border}`}
        >
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="font-bold text-charcoal text-lg">{booking.user_name}</h3>
                    <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider mt-1 ${colors.bg} ${colors.text}`}>
                        {getTypeLabel(booking.type)}
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold text-charcoal">{nights}</span>
                    <span className="text-xs text-stone-500 block">{nights === 1 ? 'nótt' : 'nætur'}</span>
                </div>
            </div>

            {/* Date Range - Prominent */}
            <div className="flex items-center gap-2 mb-2 bg-stone-50 rounded-lg p-3">
                <CalendarIcon className="w-5 h-5 text-amber-ink flex-shrink-0" aria-hidden="true" />
                <span className="text-base font-semibold text-stone-700">
                    {formatDateRange(booking.start, booking.end)}
                </span>
            </div>

            {booking.notes && (
                <p className="text-sm text-stone-600 bg-stone-50 rounded p-2 mb-2 mt-2">
                    {booking.notes}
                </p>
            )}

            {/* Created date */}
            {booking.created_at && (
                <div className="flex items-center text-xs text-stone-500 mt-2">
                    <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
                    Bókað: {booking.created_at.toLocaleDateString('is-IS', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
            )}
        </button>
    );
};

export default BookingCard;
