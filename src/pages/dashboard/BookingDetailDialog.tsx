import type { Booking, House, User } from '@/types/models';
import ErrorBoundary from '@/components/ErrorBoundary';
import BookingDetailModal from '@/components/calendar/BookingDetailModal';
import ModalErrorFallback from './ModalErrorFallback';

interface BookingDetailDialogProps {
    booking: Booking;
    currentHouse: House;
    currentUser: User | null;
    open: boolean;
    onClose: () => void;
}

/** Booking detail dialog for the next-booking card, with its error fallback. */
export default function BookingDetailDialog({ booking, currentHouse, currentUser, open, onClose }: BookingDetailDialogProps) {
    return (
        <ErrorBoundary fallback={
            <ModalErrorFallback open={open} onClose={onClose} message="Ekki tókst að hlaða bókunarglugga" />
        }>
            <BookingDetailModal
                isOpen={open}
                onClose={onClose}
                booking={booking}
                currentHouse={currentHouse}
                currentUser={currentUser}
            />
        </ErrorBoundary>
    );
}
