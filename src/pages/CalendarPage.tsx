/**
 * Calendar Page - Booking Management
 * View bookings, create new bookings, prevent conflicts
 * Supports multiple languages and highlights Icelandic holidays
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { Plus, X, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore } from '@/store/appStore';
import type { Booking, BookingType } from '@/types/models';
import { dateLocales, calendarMessages, bookingTypeLabels, type SupportedLanguage } from '@/utils/i18n';
import { getIcelandicHolidays, isHoliday, includesMajorHoliday } from '@/utils/icelandicHolidays';
import 'react-big-calendar/lib/css/react-big-calendar.css';

interface BookingEvent {
    id: string;
    booking: Booking;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: any;
}

export default function CalendarPage() {
    const currentUser = useAppStore((state) => state.currentUser);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [events, setEvents] = useState<BookingEvent[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Language preference (default to Icelandic, but can be changed)
    const [language, setLanguage] = useState<SupportedLanguage>('is');

    // Hardcoded house ID for now (TODO: Get from context/route)
    const houseId = 'demo-house-id';

    // House Settings for Booking Rules
    const [houseSettings, setHouseSettings] = useState<any>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'houses', houseId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setHouseSettings(docSnap.data());
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

    // Get Icelandic holidays for current year
    const holidays = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return getIcelandicHolidays(currentYear);
    }, []);

    // Load bookings from Firestore
    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            const q = query(collection(db, 'bookings'), where('house_id', '==', houseId));
            const snapshot = await getDocs(q);

            const bookingsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                start: doc.data().start.toDate(),
                end: doc.data().end.toDate(),
                created_at: doc.data().created_at.toDate()
            })) as Booking[];

            setBookings(bookingsData);

            // Convert to calendar events
            const calendarEvents: BookingEvent[] = bookingsData.map(booking => ({
                id: booking.id,
                title: `${booking.user_name} - ${getBookingTypeLabel(booking.type)}`,
                start: booking.start,
                end: booking.end,
                booking
            }));

            setEvents(calendarEvents);
        } catch (err) {
            console.error('Error loading bookings:', err);
        }
    };

    const getBookingTypeLabel = (type: BookingType): string => {
        return bookingTypeLabels[language][type] || type;
    };

    const checkConflicts = (start: Date, end: Date): boolean => {
        return bookings.some(booking => {
            // Check if dates overlap
            return (start < booking.end && end > booking.start);
        });
    };

    const checkFairness = async (start: Date, end: Date, userId: string): Promise<{ allowed: boolean; reason?: string }> => {
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
    };

    const handleCreateBooking = async () => {
        if (!currentUser) {
            setError('Engin notandi skráður inn');
            return;
        }

        // Check for conflicts
        if (checkConflicts(newBooking.start, newBooking.end)) {
            setError('Það er þegar bókun á þessum dagsetningum. Vinsamlegast veldu aðrar dagsetningar.');
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

            // Reload bookings
            await loadBookings();

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
        alert(`Bókun: ${event.booking.user_name}\n${event.booking.start.toLocaleDateString()} - ${event.booking.end.toLocaleDateString()}\nTegund: ${getBookingTypeLabel(event.booking.type)}\nAthugasemd: ${event.booking.notes || 'Engin'}`);
    }, [language]);

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
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-serif mb-2">Bókunardagatal</h1>
                            <p className="text-grey-mid">Skipulagðu dvöl í sumarhúsinu</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Language Selector */}
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                                className="input py-2 px-3"
                            >
                                <option value="is">🇮🇸 Íslenska</option>
                                <option value="en">🇬🇧 English</option>
                                <option value="de">🇩🇪 Deutsch</option>
                                <option value="fr">🇫🇷 Français</option>
                                <option value="es">🇪🇸 Español</option>
                            </select>

                            <button
                                onClick={() => setShowModal(true)}
                                className="btn btn-primary flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Ný bókun
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar */}
            <div className="container mx-auto px-6 py-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <BigCalendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 700 }}
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        selectable
                        popup
                        views={['month', 'week', 'day']}
                        defaultView="month"
                        messages={calendarMessages[language]}
                        dayPropGetter={dayPropGetter}
                        eventPropGetter={(event: BookingEvent) => ({
                            style: {
                                backgroundColor: event.booking.type === 'personal' ? '#e8b058' :
                                    event.booking.type === 'rental' ? '#10b981' :
                                        event.booking.type === 'maintenance' ? '#ef4444' : '#6366f1',
                                borderRadius: '4px',
                                opacity: 0.8,
                                color: 'white',
                                border: '0px',
                                display: 'block'
                            }
                        })}
                    />
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
            {showModal && (
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
                                    onChange={(e) => setNewBooking({ ...newBooking, start: new Date(e.target.value) })}
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
            )}
        </div>
    );
}
