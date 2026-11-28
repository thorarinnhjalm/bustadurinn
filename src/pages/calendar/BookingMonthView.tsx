import { useCallback, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css'; // Add base styles
import { format, parse, startOfWeek, getDay } from 'date-fns';
import type { Booking } from '@/types/models';
import { dateLocales, calendarMessages, type SupportedLanguage } from '@/utils/i18n';
import { isHoliday } from '@/utils/icelandicHolidays';
import CalendarToolbar from './CalendarToolbar';
import type { BookingEvent } from './calendarTypes';

interface BookingMonthViewProps {
    language: SupportedLanguage;
    events: BookingEvent[];
    bookings: Booking[];
    date: Date;
    onNavigate: (newDate: Date) => void;
    onView: (newView: any) => void;
    onSelectSlot: (slotInfo: any) => void;
    onSelectEvent: (event: BookingEvent) => void;
}

export default function BookingMonthView({
    language,
    events,
    bookings,
    date,
    onNavigate,
    onView,
    onSelectSlot,
    onSelectEvent,
}: BookingMonthViewProps) {
    // Create localizer with current language
    const localizer = useMemo(() => {
        const locale = dateLocales[language];
        return dateFnsLocalizer({
            format: (date: Date, formatStr: string) => format(date, formatStr, { locale }),
            parse: (str: string, formatStr: string) => parse(str, formatStr, new Date(), { locale }),
            startOfWeek: (date: Date) => startOfWeek(date, { locale }),
            getDay,
            locales: { [language]: locale },
        });
    }, [language]);

    // Custom day cell style to highlight holidays AND booked days
    const dayPropGetter = useCallback((date: Date) => {
        // Check if this day has any bookings
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const hasBooking = bookings.some(booking => {
            const bookingStart = new Date(booking.start);
            bookingStart.setHours(0, 0, 0, 0);
            const bookingEnd = new Date(booking.end);
            bookingEnd.setHours(23, 59, 59, 999);
            // Check if this date falls within the booking range
            return dayStart >= bookingStart && dayStart <= bookingEnd;
        });

        const holiday = isHoliday(date);

        // Priority: Holiday styles take precedence, then booked days
        if (holiday) {
            return {
                style: {
                    backgroundColor: holiday.importance === 'high' ? '#fef3c7' : '#fef9e7',
                    border: '1px solid #f59e0b'
                }
            };
        }

        // If the day has a booking, give it a subtle background
        if (hasBooking) {
            return {
                style: {
                    backgroundColor: '#f0fdf4', // Very light green to indicate occupied
                    borderLeft: '3px solid #22c55e'
                }
            };
        }

        return {};
    }, [bookings]);

    return (
        <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            className="font-sans"
            style={{ height: '100%', minHeight: '600px' }}
            onSelectSlot={onSelectSlot}
            onSelectEvent={onSelectEvent}
            selectable={true}
            popup={true}
            components={{
                toolbar: CalendarToolbar
            }}
            views={['month']}
            view="month"
            onView={onView}
            date={date}
            onNavigate={onNavigate}
            culture={language}
            messages={calendarMessages[language]}
            dayPropGetter={dayPropGetter}
            eventPropGetter={(event: BookingEvent) => ({
                style: {
                    backgroundColor: event.booking.type === 'personal' ? '#e8b058' :
                        event.booking.type === 'rental' ? '#047857' :
                            event.booking.type === 'maintenance' ? '#dc2626' : '#4f46e5',
                    borderRadius: '4px',
                    opacity: 1,
                    // White on amber is 1.9:1; the other three fills are dark enough for white (>= 4.8:1)
                    color: event.booking.type === 'personal' ? '#1a1a1a' : 'white',
                    border: '0px',
                    display: 'block',
                    padding: '2px 5px',
                    fontSize: '13px',
                    fontWeight: 500,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }
            })}
        />
    );
}
