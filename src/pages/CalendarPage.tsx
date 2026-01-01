/**
 * Calendar Page - Booking Management
 * View bookings, create new bookings, prevent conflicts
 * Supports multiple languages and highlights Icelandic holidays
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css'; // Add base styles
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { Plus, X, AlertCircle, Calendar as CalendarIcon, ArrowLeft, ChevronLeft, ChevronRight, Clock, Trash2 } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';
import type { Booking, BookingType } from '@/types/models';
import { dateLocales, calendarMessages, bookingTypeLabels, type SupportedLanguage } from '@/utils/i18n';
import { getIcelandicHolidays, isHoliday, includesMajorHoliday } from '@/utils/icelandicHolidays';
import { analytics } from '@/utils/analytics';
import MobileNav from '@/components/MobileNav';

// View type derived from string as generic View type import is tricky
type CalendarView = 'month' | 'week' | 'work_week' | 'day' | 'agenda';

interface CustomToolbarProps {
    date: Date;
    view: CalendarView;
    views: CalendarView[];
    label: string;
    onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE', newDate?: Date) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onView: (view: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    localizer: { messages: any };
}

const CustomToolbar = ({ label, onNavigate, onView, view }: CustomToolbarProps) => {
    return (
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        className="p-2 h-10 w-10 rounded-full flex items-center justify-center border border-stone-300 hover:bg-stone-100 bg-white shadow-md active:scale-95 transition-all"
                        onClick={() => onNavigate('PREV')}
                        aria-label="Previous"
                    >
                        <ChevronLeft className="w-6 h-6 text-stone-800" />
                    </button>
                    <button
                        className="p-2 h-10 w-10 rounded-full flex items-center justify-center border border-stone-300 hover:bg-stone-100 bg-white shadow-md active:scale-95 transition-all"
                        onClick={() => onNavigate('NEXT')}
                        aria-label="Next"
                    >
                        <ChevronRight className="w-6 h-6 text-stone-800" />
                    </button>
                    <h2 className="text-xl font-serif font-bold text-charcoal ml-2 capitalize">
                        {label}
                    </h2>
                </div>

                <button
                    className="btn btn-secondary text-sm hidden md:flex"
                    onClick={() => onNavigate('TODAY')}
                >
                    Í dag
                </button>
            </div>

            {/* View Switcher - Segmented Control Style (Month and List only) */}
            <div className="flex p-1 bg-stone-100 rounded-lg self-center md:self-start w-full md:w-auto">
                <button
                    onClick={() => onView('month')}
                    className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all ${view === 'month'
                        ? 'bg-white text-charcoal shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                        }`}
                >
                    Mánuður
                </button>
                <button
                    onClick={() => onView('agenda')}
                    className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all ${view === 'agenda'
                        ? 'bg-white text-charcoal shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                        }`}
                >
                    Listi
                </button>
            </div>
        </div>
    );
};

const CustomAgendaEvent = ({ event }: { event: BookingEvent }) => {
    // Format date range nicely: "17. - 20. júní"
    const formatDateRange = (start: Date, end: Date) => {
        const startDay = start.getDate();
        const endDay = end.getDate();
        const sameMonth = start.getMonth() === end.getMonth();

        if (sameMonth) {
            const month = start.toLocaleDateString('is-IS', { month: 'long' });
            return `${startDay}. - ${endDay}. ${month}`;
        } else {
            const startMonth = start.toLocaleDateString('is-IS', { month: 'short' });
            const endMonth = end.toLocaleDateString('is-IS', { month: 'short' });
            return `${startDay}. ${startMonth} - ${endDay}. ${endMonth}`;
        }
    };

    return (
        <div className="flex flex-col py-3 px-2 border-l-4" style={{
            borderLeftColor: event.booking.type === 'personal' ? '#e8b058' :
                event.booking.type === 'rental' ? '#10b981' :
                    event.booking.type === 'maintenance' ? '#ef4444' : '#6366f1'
        }}>
            <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-charcoal text-lg">
                    {event.booking.user_name}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${event.booking.type === 'personal' ? 'bg-amber/10 text-amber-dark' :
                    event.booking.type === 'rental' ? 'bg-green-100 text-green-700' :
                        event.booking.type === 'maintenance' ? 'bg-red-100 text-red-700' :
                            'bg-indigo-100 text-indigo-700'
                    }`}>
                    {event.title.split(' - ')[1] || event.title}
                </span>
            </div>

            {/* Date Range - More Prominent */}
            <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="w-4 h-4 text-amber" />
                <span className="text-base font-semibold text-stone-700">
                    {formatDateRange(event.start, event.end)}
                </span>
            </div>

            {event.booking.notes && (
                <p className="text-sm text-stone-600 bg-stone-50 rounded p-2 mb-2">
                    {event.booking.notes}
                </p>
            )}

            {/* Created date */}
            {event.booking.created_at && (
                <div className="flex items-center text-xs text-stone-400 mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    Bókað: {event.booking.created_at.toLocaleDateString('is-IS', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
            )}
        </div>
    );
};


interface BookingEvent {
    id: string;
    booking: Booking;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resource?: any;
}

export default function CalendarPage() {
    const navigate = useNavigate();
    const { user: currentUser } = useEffectiveUser();
    const currentHouse = useAppStore((state) => state.currentHouse);
    const houseId = currentHouse?.id || currentUser?.house_ids?.[0];
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [events, setEvents] = useState<BookingEvent[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Pull-to-refresh state
    const [isPulling, setIsPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Language preference (default to Icelandic, but can be changed)
    const [language] = useState<SupportedLanguage>('is');
    // Only use month and agenda views (no week view with hours)
    const [view, setView] = useState<CalendarView>(window.innerWidth < 768 ? 'agenda' : 'month');
    const [date, setDate] = useState(new Date());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleViewChange = (newView: any) => {
        setView(newView);
    };

    const handleNavigate = (newDate: Date) => {
        setDate(newDate);
    };

    // Touch handling for pull-to-refresh only
    const [touchStartY, setTouchStartY] = useState<number | null>(null);
    const [scrollTop, setScrollTop] = useState(0);

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchStartY(e.targetTouches[0].clientY);

        // Store current scroll position
        const scrollableElement = document.querySelector('.calendar-container');
        setScrollTop(scrollableElement?.scrollTop || 0);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        // Handle pull-to-refresh only (vertical pull from top)
        if (touchStartY !== null && scrollTop === 0) {
            const currentY = e.targetTouches[0].clientY;
            const pullDist = currentY - touchStartY;

            // Only trigger when pulling down (positive distance) and at top of page
            if (pullDist > 0 && pullDist < 150) {
                setIsPulling(true);
                setPullDistance(pullDist);
                e.preventDefault(); // Prevent default scroll when pulling
            }
        }
    };

    const onTouchEnd = async () => {
        // Handle pull-to-refresh only
        if (isPulling && pullDistance > 80) {
            setIsRefreshing(true);
            await loadBookings();
            setTimeout(() => {
                setIsRefreshing(false);
                setIsPulling(false);
                setPullDistance(0);
            }, 500);
        } else {
            setIsPulling(false);
            setPullDistance(0);
        }
    };

    // House Settings for Booking Rules
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [houseSettings, setHouseSettings] = useState<any>(null);

    useEffect(() => {
        if (!houseId) return;

        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'houses', houseId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const houseData = docSnap.data() as any;
                    setHouseSettings(houseData);
                }

            } catch (e) {
                console.error("Error fetching house settings", e);
            }
        };
        fetchSettings();
    }, [houseId]);

    // New booking form state
    const [newBooking, setNewBooking] = useState({
        start: new Date(),
        end: new Date(),
        type: 'personal' as BookingType,
        notes: ''
    });

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

    // Helper functions
    const getBookingTypeLabel = useCallback((type: BookingType): string => {
        return bookingTypeLabels[language][type] || type;
    }, [language]);

    const loadBookings = useCallback(async () => {
        if (!houseId) return;

        try {
            const q = query(collection(db, 'bookings'), where('house_id', '==', houseId));
            const snapshot = await getDocs(q);

            const bookingsData = snapshot.docs.map(doc => {
                const data = doc.data();
                let start = data.start.toDate();
                let end = data.end.toDate();

                // Sanitize dates: If end is before start, fix it for display
                if (end < start) {
                    console.warn(`Booking ${doc.id} has invalid dates (end < start). Fixing for display.`);
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
            console.error('Error loading bookings:', err);
        }
    }, [houseId, getBookingTypeLabel]);

    // Check conflicts helper
    const checkConflicts = useCallback((start: Date, end: Date): boolean => {
        return bookings.some(booking => {
            // Check if dates overlap
            return (start < booking.end && end > booking.start);
        });
    }, [bookings]);

    // Check fairness helper
    const checkFairness = useCallback(async (start: Date, end: Date, userId: string): Promise<{ allowed: boolean; reason?: string }> => {
        // Only apply if house is in 'fairness' mode
        if (houseSettings?.holiday_mode !== 'fairness') {
            return { allowed: true };
        }

        // Check if booking overlaps a major holiday
        const holiday = includesMajorHoliday(start, end);
        if (!holiday) {
            return { allowed: true };
        }

        // Check if user had this holiday LAST year
        const lastYear = start.getFullYear() - 1;

        try {
            const startOfLastYear = new Date(lastYear, 0, 1);
            const endOfLastYear = new Date(lastYear, 11, 31, 23, 59, 59);

            const q = query(
                collection(db, 'bookings'),
                where('house_id', '==', houseId),
                where('user_id', '==', userId),
                where('start', '>=', startOfLastYear),
                where('start', '<=', endOfLastYear)
            );

            const snapshot = await getDocs(q);
            const lastYearBookings = snapshot.docs.map(doc => ({
                ...doc.data(),
                start: doc.data().start.toDate(),
                end: doc.data().end.toDate()
            })) as Booking[];

            const hadHoliday = lastYearBookings.some(booking => {
                const bookingHoliday = includesMajorHoliday(booking.start, booking.end);
                return bookingHoliday?.name === holiday.name;
            });

            if (hadHoliday) {
                return {
                    allowed: false,
                    reason: `Sanngirnisregla: Þú varst með ${holiday.name} í fyrra (${lastYear}). Aðrir eiga forgang í ár.`
                };
            }

        } catch (err) {
            console.error('Error checking fairness:', err);
        }

        return { allowed: true };
    }, [houseSettings, houseId]);


    // Load bookings from Firestore
    useEffect(() => {
        loadBookings();
    }, [loadBookings]);

    // Get Icelandic holidays for current year
    const holidays = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return getIcelandicHolidays(currentYear);
    }, []);

    const handleCreateBooking = async () => {
        if (!currentUser) {
            setError('Engin notandi skráður inn');
            return;
        }

        if (!houseId) {
            setError('Ekkert hús valið. Vinsamlegast veldu hús fyrst.');
            return;
        }

        // Check for conflicts
        if (checkConflicts(newBooking.start, newBooking.end)) {
            setError('Það er þegar bókun á þessum dagsetningum. Vinsamlegast veldu aðrar dagsetningar.');
            return;
        }

        // Validate dates
        if (newBooking.end < newBooking.start) {
            setError('Lokadagur getur ekki verið á undan upphafsdegi.');
            return;
        }

        setLoading(true);
        setError('');

        // Check Fairness (Sanngirnisregla)
        const fairness = await checkFairness(newBooking.start, newBooking.end, currentUser.uid);
        if (!fairness.allowed) {
            setError(fairness.reason || 'Bókun ekki leyfileg.');
            setLoading(false);
            return;
        }

        try {
            await addDoc(collection(db, 'bookings'), {
                house_id: houseId,
                user_id: currentUser.uid,
                user_name: currentUser.name || currentUser.email,
                start: newBooking.start,
                end: newBooking.end,
                type: newBooking.type,
                notes: newBooking.notes,
                created_at: serverTimestamp()
            });

            // Send email notification (don't block on this)
            try {
                // Fetch house to get owner emails
                const houseDoc = await getDoc(doc(db, 'houses', houseId));
                const house = houseDoc.data();

                if (house && house.owner_ids) {
                    // Fetch owner emails
                    const ownerEmails: string[] = [];
                    for (const ownerId of house.owner_ids) {
                        const userDoc = await getDoc(doc(db, 'users', ownerId));
                        const userData = userDoc.data();
                        if (userData?.email) {
                            ownerEmails.push(userData.email);
                        }
                    }

                    // Send notification
                    await fetch('/api/booking-notification', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            houseName: house.name || 'Sumarhús',
                            userName: currentUser.name || currentUser.email,
                            startDate: newBooking.start.toISOString(),
                            endDate: newBooking.end.toISOString(),
                            bookingType: newBooking.type,
                            ownerEmails,
                            language: currentUser.language || 'is'
                        })
                    });
                }
            } catch (emailError) {
                console.error('Failed to send booking notification:', emailError);
                // Don't fail the booking if email fails
            }

            // Reload bookings
            await loadBookings();

            // Track in Google Analytics
            analytics.bookingCreated(newBooking.type);

            // Close modal
            setShowModal(false);
            setNewBooking({
                start: new Date(),
                end: new Date(),
                type: 'personal',
                notes: ''
            });
        } catch (err: any) {
            console.error('Error creating booking:', err);
            setError('Villa kom upp við að búa til bókun: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
        setNewBooking(prev => ({
            ...prev,
            start,
            end
        }));
        setShowModal(true);
    }, []);

    const handleSelectEvent = useCallback((event: BookingEvent) => {
        setSelectedBooking(event.booking);
    }, []);

    const handleDeleteBooking = async () => {
        if (!selectedBooking) return;
        if (!confirm('Ertu viss um að þú viljir eyða þessari bókun?')) return;

        setLoading(true);
        try {
            await deleteDoc(doc(db, 'bookings', selectedBooking.id));

            // Reload bookings
            await loadBookings();
            setSelectedBooking(null);

            // Track analytics
            // analytics.bookingDeleted(); 
        } catch (err) {
            console.error("Error deleting booking:", err);
            setError("Gat ekki eytt bókun.");
        } finally {
            setLoading(false);
        }
    };

    // Custom day cell style to highlight holidays
    const dayPropGetter = useCallback((date: Date) => {
        const holiday = isHoliday(date);
        if (holiday) {
            return {
                style: {
                    backgroundColor: holiday.importance === 'high' ? '#fef3c7' : '#fef9e7',
                    border: '1px solid #f59e0b'
                }
            };
        }
        return {};
    }, []);

    return (
        <div className="min-h-screen bg-bone">
            {/* Header */}
            <div className="bg-white border-b border-grey-warm">
                <div className="container mx-auto px-6 py-6">
                    <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-4">
                        <div className="w-full md:w-auto">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex items-center text-grey-mid hover:text-charcoal mb-4 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Til baka
                            </button>
                            <h1 className="text-3xl font-serif mb-2">Bókunardagatal</h1>
                            <p className="text-grey-mid">Skipulagðu dvöl í sumarhúsinu</p>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                            <button
                                onClick={() => setShowModal(true)}
                                className="btn btn-primary flex items-center gap-2 whitespace-nowrap"
                            >
                                <Plus className="w-5 h-5" />
                                Ný bókun
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar */}
            <div className="container mx-auto px-4 py-4 md:px-6 md:py-8 pb-24 md:pb-8">
                {/* Pull-to-refresh indicator */}
                {(isPulling || isRefreshing) && (
                    <div
                        className="fixed top-0 left-0 right-0 flex justify-center items-center transition-all duration-200 z-40"
                        style={{
                            transform: `translateY(${isPulling ? pullDistance - 40 : 0}px)`,
                            opacity: isPulling ? Math.min(pullDistance / 80, 1) : 0
                        }}
                    >
                        <div className="bg-white rounded-full shadow-lg p-3 flex items-center gap-2">
                            {isRefreshing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-amber border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm font-medium text-stone-600">Hleð inn...</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-5 h-5 text-amber">↓</div>
                                    <span className="text-sm font-medium text-stone-600">
                                        {pullDistance > 80 ? 'Sleppa til að endurnýja' : 'Draga niður'}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm p-2 md:p-6 overflow-hidden">
                    <div
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                        className="h-full calendar-container"
                        style={{ overflowY: 'auto' }}
                    >
                        <BigCalendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            className="h-[65vh] md:h-[700px] font-sans"
                            onSelectSlot={handleSelectSlot}
                            onSelectEvent={handleSelectEvent}
                            selectable
                            popup
                            components={{
                                toolbar: CustomToolbar,
                                agenda: {
                                    event: CustomAgendaEvent
                                }
                            }}
                            views={['month', 'agenda']}
                            view={view}
                            onView={handleViewChange}
                            date={date}
                            onNavigate={handleNavigate}
                            culture={language}
                            messages={calendarMessages[language]}
                            dayPropGetter={dayPropGetter}
                            eventPropGetter={(event: BookingEvent) => ({
                                style: {
                                    backgroundColor: event.booking.type === 'personal' ? '#e8b058' :
                                        event.booking.type === 'rental' ? '#10b981' :
                                            event.booking.type === 'maintenance' ? '#ef4444' : '#6366f1',
                                    // Agenda view color override (since we provide custom component, this usually affects the dot or line)
                                    borderLeft: view === 'agenda' ? `4px solid ${event.booking.type === 'personal' ? '#e8b058' :
                                        event.booking.type === 'rental' ? '#10b981' :
                                            event.booking.type === 'maintenance' ? '#ef4444' : '#6366f1'
                                        }` : undefined,
                                    borderRadius: '4px',
                                    opacity: 1,
                                    color: 'white',
                                    border: '0px',
                                    display: 'block',
                                    padding: '2px 5px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }
                            })}
                        // All-day events only, no time slots needed
                        />
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-6 flex gap-6 justify-center flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-amber"></div>
                        <span className="text-sm text-grey-dark">{bookingTypeLabels[language].personal}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-500"></div>
                        <span className="text-sm text-grey-dark">{bookingTypeLabels[language].rental}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-500"></div>
                        <span className="text-sm text-grey-dark">{bookingTypeLabels[language].maintenance}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-indigo-500"></div>
                        <span className="text-sm text-grey-dark">{bookingTypeLabels[language].guest}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b' }}></div>
                        <span className="text-sm text-grey-dark">🇮🇸 Frídagur</span>
                    </div>
                </div>

                {/* Holiday Info */}
                {holidays.length > 0 && (
                    <div className="mt-6 card">
                        <div className="flex items-center gap-2 mb-4">
                            <CalendarIcon className="w-5 h-5 text-amber" />
                            <h3 className="text-lg font-serif">Íslenskir frídagar {new Date().getFullYear()}</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            {holidays.slice(0, 6).map((holiday, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <span className="text-grey-mid">{holiday.date.toLocaleDateString('is-IS', { month: 'short', day: 'numeric' })}</span>
                                    <span className="text-grey-dark">{holiday.name}</span>
                                </div>
                            ))}
                        </div>
                        {holidays.length > 6 && (
                            <p className="text-xs text-grey-mid mt-3">+ {holidays.length - 6} fleiri frídagar</p>
                        )}
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-serif">Ný bókun</h2>
                                <button onClick={() => setShowModal(false)} className="text-grey-mid hover:text-charcoal">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500 text-red-700 rounded p-4 mb-6 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleCreateBooking(); }}>
                                <div>
                                    <label className="label">Upphafsdagur</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={newBooking.start.toISOString().split('T')[0]}
                                        onChange={(e) => {
                                            const newStart = new Date(e.target.value);
                                            // If new start is after current end, update end to match start
                                            let newEnd = newBooking.end;
                                            if (newStart > newBooking.end) {
                                                newEnd = newStart;
                                            }
                                            setNewBooking({ ...newBooking, start: newStart, end: newEnd });
                                        }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="label">Lokadagur</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={newBooking.end.toISOString().split('T')[0]}
                                        onChange={(e) => setNewBooking({ ...newBooking, end: new Date(e.target.value) })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="label">Tegund bókunar</label>
                                    <select
                                        className="input"
                                        value={newBooking.type}
                                        onChange={(e) => setNewBooking({ ...newBooking, type: e.target.value as BookingType })}
                                    >
                                        <option value="personal">Persónuleg (fjölskyldan mín)</option>
                                        <option value="guest">Gestur</option>
                                        <option value="rental">Útleiga</option>
                                        <option value="maintenance">Viðhald</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="label">Athugasemd (valfrjálst)</label>
                                    <textarea
                                        className="input min-h-[80px]"
                                        placeholder="t.d. Fjölskyldusamkoma, páskahátíð..."
                                        value={newBooking.notes}
                                        onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="btn btn-ghost flex-1"
                                        disabled={loading}
                                    >
                                        Hætta við
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary flex-1"
                                        disabled={loading}
                                    >
                                        {loading ? 'Bý til...' : 'Búa til bókun'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* View/Delete Booking Modal */}
            {selectedBooking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-serif">Bókun</h2>
                            <button onClick={() => setSelectedBooking(null)} className="text-grey-mid hover:text-charcoal">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-xs text-stone-500 uppercase tracking-wider font-bold">Bókað af</label>
                                <p className="text-lg font-medium">{selectedBooking.user_name}</p>
                                {/* Added Created At Date */}
                                {selectedBooking.created_at && (
                                    <p className="text-xs text-stone-400 mt-1">
                                        Bókað þann: {selectedBooking.created_at.toLocaleDateString('is-IS')}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-stone-500 uppercase tracking-wider font-bold">Frá</label>
                                    <p>{selectedBooking.start.toLocaleDateString('is-IS')}</p>
                                    <p className="text-sm text-stone-500">{selectedBooking.start.toLocaleTimeString('is-IS', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-stone-500 uppercase tracking-wider font-bold">Til</label>
                                    <p>{selectedBooking.end.toLocaleDateString('is-IS')}</p>
                                    <p className="text-sm text-stone-500">{selectedBooking.end.toLocaleTimeString('is-IS', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-stone-500 uppercase tracking-wider font-bold">Tegund</label>
                                <span className={`inline-block mt-1 px-2 py-1 rounded text-sm font-medium ${selectedBooking.type === 'personal' ? 'bg-amber/10 text-amber-dark' :
                                    selectedBooking.type === 'rental' ? 'bg-green-100 text-green-700' :
                                        selectedBooking.type === 'maintenance' ? 'bg-red-100 text-red-700' :
                                            'bg-indigo-100 text-indigo-700'
                                    }`}>
                                    {getBookingTypeLabel(selectedBooking.type)}
                                </span>
                            </div>

                            {selectedBooking.notes && (
                                <div>
                                    <label className="text-xs text-stone-500 uppercase tracking-wider font-bold">Athugasemd</label>
                                    <p className="text-stone-700 bg-stone-50 p-3 rounded mt-1">{selectedBooking.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Only allow deletion if user owns the booking */}
                        {(currentUser?.uid === selectedBooking.user_id) && (
                            <div className="flex gap-3 pt-4 border-t border-stone-100">
                                <button
                                    onClick={handleDeleteBooking}
                                    className="btn bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 flex-1 flex items-center justify-center gap-2"
                                    disabled={loading}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {loading ? 'Eyði...' : 'Eyða Bókun'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <MobileNav />
        </div >
    );
}
