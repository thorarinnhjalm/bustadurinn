import { useCallback, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/styles/calendar.css'; // must follow the library CSS
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { dateLocales, calendarMessages, type SupportedLanguage } from '@/utils/i18n';
import { isHoliday } from '@/utils/icelandicHolidays';
import CalendarToolbar from './CalendarToolbar';
import type { BookingEvent } from './calendarTypes';

interface BookingMonthViewProps {
    language: SupportedLanguage;
    events: BookingEvent[];
    date: Date;
    onNavigate: (newDate: Date) => void;
    onView: (newView: any) => void;
    onSelectSlot: (slotInfo: any) => void;
    onSelectEvent: (event: BookingEvent) => void;
}

export default function BookingMonthView({
    language,
    events,
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

    // Holidays get an amber tint with a thin amber line along the top of the cell.
    // Booked days need no tint of their own: the booking bar already marks them.
    const dayPropGetter = useCallback((date: Date) => {
        const holiday = isHoliday(date);
        if (!holiday) return {};
        return {
            style: {
                backgroundColor: holiday.importance === 'high' ? '#fbefd5' : '#fdf7e8',
                boxShadow: 'inset 0 2px 0 #e8b058',
            },
        };
    }, []);

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
                }
            })}
        />
    );
}
