/**
 * Calendar Page - Booking Management
 * View bookings, create new bookings, prevent conflicts
 * Supports multiple languages and highlights Icelandic holidays
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Plus, Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';
import type { Booking } from '@/types/models';
import { bookingTypeLabels, type SupportedLanguage } from '@/utils/i18n';
import { getIcelandicHolidays } from '@/utils/icelandicHolidays';
import { deleteBooking } from '@/services/bookingService';
import { logger } from '@/utils/logger';
import MobileNav from '@/components/MobileNav';
import HolidayFairnessPanel from '@/components/calendar/HolidayFairnessPanel';
import BookingListView from './calendar/BookingListView';
import BookingMonthView from './calendar/BookingMonthView';
import NewBookingDialog from './calendar/NewBookingDialog';
import ConflictDialog from './calendar/ConflictDialog';
import BookingDetailDialog from './calendar/BookingDetailDialog';
import BookingSuccessDialog from './calendar/BookingSuccessDialog';
import { useBookings } from './calendar/useBookings';
import { useBookingForm } from './calendar/useBookingForm';
import type { BookingEvent, CalendarView } from './calendar/calendarTypes';

export default function CalendarPage() {
    const { user: currentUser } = useEffectiveUser();
    const currentHouse = useAppStore((state) => state.currentHouse);
    const houseId = currentHouse?.id || currentUser?.house_ids?.[0];
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Language preference (default to Icelandic, but can be changed)
    const [language] = useState<SupportedLanguage>('is');
    // Only use month and agenda views (no week view with hours)
    const [view, setView] = useState<CalendarView>(window.innerWidth < 768 ? 'agenda' : 'month');
    const [date, setDate] = useState(new Date());

    // Handle window resize to switch views
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768 && view === 'agenda') {
                setView('month');
            } else if (window.innerWidth < 768 && view === 'month') {
                setView('agenda');
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [view]);

    const handleViewChange = (newView: any) => {
        setView(newView);
    };

    const handleNavigate = (newDate: Date) => {
        setDate(newDate);
    };

    const { bookings, events, loadBookings, getBookingTypeLabel } = useBookings(houseId, language);

    const {
        newBooking,
        setNewBooking,
        showModal,
        openModal,
        closeModal,
        error,
        setError,
        loading,
        setLoading,
        conflictWarning,
        dismissConflict,
        showSuccess,
        successBooking,
        closeSuccess,
        handleCreateBooking,
        handleConfirmConflictingBooking,
        handleSelectSlot,
        handleClaimWindow,
    } = useBookingForm({ houseId, currentUser, currentHouse, bookings, loadBookings });

    // Get Icelandic holidays for current year
    const holidays = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return getIcelandicHolidays(currentYear);
    }, []);

    const handleSelectEvent = useCallback((event: BookingEvent) => {
        setSelectedBooking(event.booking);
    }, []);

    const handleDeleteBooking = async () => {
        if (!selectedBooking || !houseId) return;

        setLoading(true);
        setError(''); // Clear any previous errors
        setShowDeleteConfirm(false); // Hide confirmation buttons

        try {
            await deleteBooking(houseId, selectedBooking.id);

            // Reload bookings
            await loadBookings();
            setSelectedBooking(null);

            // Track analytics
            // analytics.bookingDeleted();
        } catch (err: any) {
            logger.error('Error deleting booking:', err);

            // Provide user-friendly error messages based on error code
            let userMessage = "Gat ekki eytt bókun.";

            if (err.code === 'permission-denied') {
                userMessage = "Þú hefur ekki réttindi til að eyða þessari bókun. Aðeins sá sem bjó til bókun eða stjórnandi sumarhússins getur eytt henni.";
            } else if (err.code === 'not-found') {
                userMessage = "Bókun fannst ekki. Hún kann að hafa verið eytt nú þegar.";
            } else if (err.code === 'unavailable') {
                userMessage = "Ekki var hægt að ná sambandi við netþjón. Athugaðu nettenginguna þína.";
            }

            setError(userMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-bone">
            {/* Header */}
            <div className="bg-white border-b border-grey-warm relative md:sticky md:top-0 z-30 shadow-sm">
                <div className="container mx-auto px-6 py-6">
                    <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-4">
                        <div className="w-full md:w-auto">
                            <Link
                                to="/dashboard"
                                className="inline-flex items-center text-grey-mid hover:text-charcoal mb-4 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                                Til baka
                            </Link>
                            <h1 className="text-3xl font-serif mb-2">Bókunardagatal</h1>
                            <p className="text-grey-mid">Skipulagðu dvöl í sumarhúsinu</p>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                            <button
                                type="button"
                                onClick={openModal}
                                className="btn btn-primary flex items-center gap-2 whitespace-nowrap"
                            >
                                <Plus className="w-5 h-5" aria-hidden="true" />
                                Ný bókun
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar */}
            <div className="container mx-auto px-4 py-4 md:px-6 md:py-8 pb-24 md:pb-8">
                {/* View Toggle - Controls Month vs List View */}
                <div role="group" aria-label="Yfirlit dagatals" className="flex p-1 bg-stone-100 rounded-lg mb-4 w-full md:w-auto md:inline-flex">
                    <button
                        type="button"
                        aria-pressed={view === 'month'}
                        onClick={() => setView('month')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all ${view === 'month'
                            ? 'bg-white text-charcoal shadow-sm'
                            : 'text-stone-500 hover:text-stone-700'
                            }`}
                    >
                        Mánuður
                    </button>
                    <button
                        type="button"
                        aria-pressed={view === 'agenda'}
                        onClick={() => setView('agenda')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all ${view === 'agenda'
                            ? 'bg-white text-charcoal shadow-sm'
                            : 'text-stone-500 hover:text-stone-700'
                            }`}
                    >
                        Listi
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-2 md:p-6 mb-8">
                    <div
                        className="calendar-wrapper"
                        style={{ height: view === 'month' ? '750px' : 'auto', minHeight: '600px' }}
                    >
                        {/* Show Month Calendar OR List View based on selected view */}
                        {view === 'month' ? (
                            <BookingMonthView
                                language={language}
                                events={events}
                                bookings={bookings}
                                date={date}
                                onNavigate={handleNavigate}
                                onView={handleViewChange}
                                onSelectSlot={handleSelectSlot}
                                onSelectEvent={handleSelectEvent}
                            />
                        ) : (
                            /* Custom List View - Shows one card per booking with full date range */
                            <div className="min-h-[65vh] md:min-h-[700px]">
                                <h2 className="text-xl font-serif font-bold text-charcoal mb-4">
                                    Allar bókanir
                                </h2>
                                <BookingListView
                                    bookings={bookings}
                                    onSelectBooking={(booking) => setSelectedBooking(booking)}
                                    getTypeLabel={getBookingTypeLabel}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Legend */}
                <div role="group" aria-label="Skýringar á litum" className="mt-6 flex gap-6 justify-center flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-amber" aria-hidden="true"></div>
                        <span className="text-sm text-grey-dark">{bookingTypeLabels[language].personal}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-500" aria-hidden="true"></div>
                        <span className="text-sm text-grey-dark">{bookingTypeLabels[language].rental}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-500" aria-hidden="true"></div>
                        <span className="text-sm text-grey-dark">{bookingTypeLabels[language].maintenance}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-indigo-500" aria-hidden="true"></div>
                        <span className="text-sm text-grey-dark">{bookingTypeLabels[language].guest}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b' }} aria-hidden="true"></div>
                        <span className="text-sm text-grey-dark"><span aria-hidden="true">🇮🇸</span> Frídagur</span>
                    </div>
                </div>

                {/* Holiday Fairness (Stórhelgar) — only relevant for multi-owner houses using the rotation */}
                {houseId && currentHouse?.holiday_mode === 'fairness' && (currentHouse.owner_ids?.length ?? 0) >= 2 && (
                    <HolidayFairnessPanel
                        houseId={houseId}
                        ownerIds={currentHouse.owner_ids}
                        onClaimWindow={handleClaimWindow}
                    />
                )}

                {/* Holiday Info */}
                {holidays.length > 0 && (
                    <div className="mt-6 card">
                        <div className="flex items-center gap-2 mb-4">
                            <CalendarIcon className="w-5 h-5 text-amber-ink" aria-hidden="true" />
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

            <NewBookingDialog
                open={showModal}
                onClose={closeModal}
                loading={loading}
                error={error}
                newBooking={newBooking}
                setNewBooking={setNewBooking}
                onSubmit={() => handleCreateBooking()}
            />

            <ConflictDialog
                conflictWarning={conflictWarning}
                loading={loading}
                onCancel={dismissConflict}
                onConfirm={handleConfirmConflictingBooking}
            />

            <BookingDetailDialog
                selectedBooking={selectedBooking}
                onClose={() => setSelectedBooking(null)}
                loading={loading}
                error={error}
                currentUserId={currentUser?.uid}
                currentHouse={currentHouse}
                showDeleteConfirm={showDeleteConfirm}
                setShowDeleteConfirm={setShowDeleteConfirm}
                onDelete={handleDeleteBooking}
                getTypeLabel={getBookingTypeLabel}
            />

            <BookingSuccessDialog
                showSuccess={showSuccess}
                successBooking={successBooking}
                onClose={closeSuccess}
            />
            <MobileNav />
        </main>
    );
}
