import { useState, useCallback, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Booking, BookingType, House, User } from '@/types/models';
import type { ContestedHolidayWindow } from '@/utils/icelandicHolidays';
import { analytics } from '@/utils/analytics';
import { rangesOverlap, createBooking, BookingConflictError } from '@/services/bookingService';
import { checkFairnessForBooking } from '@/services/fairnessService';
import { logger } from '@/utils/logger';
import { celebrateBooking } from './celebrate';
import { startOfToday } from './calendarTypes';
import type { NewBookingForm, SuccessBooking } from './calendarTypes';

interface UseBookingFormArgs {
    houseId: string | undefined;
    currentUser: User | null;
    currentHouse: House | null;
    bookings: Booking[];
    loadBookings: () => Promise<void>;
}

/**
 * State and submit flow of the new-booking form, the conflict warning and the
 * success dialog. `error`/`loading` are shared with the delete flow, so the
 * setters are exposed.
 */
export function useBookingForm({ houseId, currentUser, currentHouse, bookings, loadBookings }: UseBookingFormArgs) {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [successBooking, setSuccessBooking] = useState<SuccessBooking | null>(null);
    // Conflicting bookings surfaced to the user as a warning-with-override, not a hard block
    const [conflictWarning, setConflictWarning] = useState<Booking[] | null>(null);

    // House Settings for Booking Rules
    const [houseSettings, setHouseSettings] = useState<any>(null);

    useEffect(() => {
        if (!houseId) return;

        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'houses', houseId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {

                    const houseData = docSnap.data() as any;
                    setHouseSettings(houseData);
                }

            } catch (e) {
                logger.error("Error fetching house settings", e);
            }
        };
        fetchSettings();
    }, [houseId]);

    // New booking form state
    const [newBooking, setNewBooking] = useState<NewBookingForm>({
        start: startOfToday(),
        end: startOfToday(),
        type: 'personal' as BookingType,
        notes: ''
    });

    // Fast client-side conflict pre-check against already-loaded bookings (instant UX).
    // This is NOT authoritative — createBooking() re-checks against a fresh Firestore
    // read right before writing, since this component's `bookings` state can be stale.
    const findLocalConflicts = useCallback((start: Date, end: Date): Booking[] => {
        return bookings.filter(booking => rangesOverlap(start, end, booking.start, booking.end));
    }, [bookings]);

    const handleCreateBooking = async (overrideConflicts: boolean = false) => {
        if (!currentUser) {
            setError('Engin notandi skráður inn');
            return;
        }

        if (!houseId) {
            setError('Ekkert hús valið. Vinsamlegast veldu hús fyrst.');
            return;
        }

        // Validate dates. Same first and last day is a valid one-day booking
        // (normalised to [d, d+1) by bookingService); only a reversed range is rejected.
        if (newBooking.end < newBooking.start) {
            setError('Lokadagur getur ekki verið á undan upphafsdegi.');
            return;
        }

        // Fast client-side pre-check for instant UX. Not authoritative — skipped
        // entirely when the user has already chosen to override (Bóka samt).
        if (!overrideConflicts) {
            const localConflicts = findLocalConflicts(newBooking.start, newBooking.end);
            if (localConflicts.length > 0) {
                setConflictWarning(localConflicts);
                return;
            }
        }

        setLoading(true);
        setError('');

        try {
            // Check Fairness (Sanngirnisregla) - a hard block when it returns
            // not-allowed, even on the conflict-override path. Self-guards
            // internally: zero reads unless the house is in 'fairness' mode, has
            // 2+ owners, and the dates hit a contested window that hasn't opened
            // to everyone yet. The check itself is advisory: if it fails (network
            // etc.) we log it and carry on with the booking.
            const fairnessHouse = currentHouse ?? (houseSettings as House | null);
            if (fairnessHouse) {
                try {
                    const fairness = await checkFairnessForBooking(
                        houseId,
                        currentUser.uid,
                        newBooking.start,
                        newBooking.end,
                        fairnessHouse.owner_ids || [],
                        fairnessHouse
                    );
                    if (!fairness.allowed) {
                        setError(fairness.reason);
                        return;
                    }
                } catch (fairnessError) {
                    logger.warn('Fairness check failed, continuing with booking:', fairnessError);
                }
            }

            await createBooking({
                houseId,
                userId: currentUser.uid,
                userName: currentUser.name || currentUser.email || '',
                start: newBooking.start,
                end: newBooking.end,
                type: newBooking.type,
                notes: newBooking.notes,
                allowConflicts: overrideConflicts
            });

            // Reload bookings
            await loadBookings();

            // Track in Google Analytics
            analytics.bookingCreated(newBooking.type);

            // Store booking info for success modal
            setSuccessBooking({
                user_name: currentUser.name || currentUser.email || 'Þú',
                start: newBooking.start,
                end: newBooking.end
            });

            // Close booking modal and show success
            setConflictWarning(null);
            setShowModal(false);
            setShowSuccess(true);

            // Confetti celebration! (skipped for users who prefer reduced motion)
            celebrateBooking();

            setNewBooking({
                start: startOfToday(),
                end: startOfToday(),
                type: 'personal',
                notes: ''
            });
        } catch (err: any) {
            if (err instanceof BookingConflictError) {
                // Fresh conflicts appeared between page load and submit (or the
                // client-side pre-check missed them) - surface the same warning dialog.
                setConflictWarning(err.conflicts);
            } else {
                logger.error('Error creating booking:', err);
                setError('Villa kom upp við að búa til bókun. Reyndu aftur.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmConflictingBooking = () => {
        setConflictWarning(null);
        handleCreateBooking(true);
    };

    const handleSelectSlot = useCallback((slotInfo: any) => {
        const { start, end } = slotInfo;
        if (!start || !end) return;

        // Whole-day booking: snap both to local midnight (end stays the
        // exclusive checkout day react-big-calendar reports).
        const s0 = new Date(start);
        const e0 = new Date(end);
        setNewBooking(prev => ({
            ...prev,
            start: new Date(s0.getFullYear(), s0.getMonth(), s0.getDate()),
            end: new Date(e0.getFullYear(), e0.getMonth(), e0.getDate())
        }));
        setShowModal(true);
    }, []);

    // Pre-fills the new-booking form with a contested-holiday window's dates
    // (same exclusive-end semantics as newBooking.end already uses) and opens
    // the booking modal, mirroring handleSelectSlot above.
    const handleClaimWindow = useCallback((window: ContestedHolidayWindow) => {
        setNewBooking(prev => ({
            ...prev,
            start: window.start,
            end: window.end
        }));
        setError('');
        setConflictWarning(null);
        setShowModal(true);
    }, []);

    const openModal = () => setShowModal(true);
    const closeModal = () => { setShowModal(false); setConflictWarning(null); };
    const dismissConflict = () => setConflictWarning(null);
    const closeSuccess = () => setShowSuccess(false);

    return {
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
    };
}
