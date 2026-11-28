import { Calendar, User, Clock, AlignLeft } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { format } from 'date-fns';
import { is } from 'date-fns/locale';
import { bookingNights } from '@/utils/localDate';
import type { Booking, House, User as AppUser } from '@/types/models';

interface BookingDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking;
    currentHouse?: House | null;
    currentUser?: AppUser | null;
}

export default function BookingDetailModal({ isOpen, onClose, booking, currentHouse: _ch, currentUser: _cu }: BookingDetailModalProps) {
    const startDate = booking.start instanceof Date ? booking.start : new Date(booking.start);
    const endDate = booking.end instanceof Date ? booking.end : new Date(booking.end);

    // Calculate nights
    const nights = bookingNights(startDate, endDate);

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title="Bókun"
            size="lg"
            footer={
                <button type="button" onClick={onClose} className="w-full bg-[#1a1a1a] text-white py-3 rounded-xl font-bold text-sm hover:bg-stone-800 transition-colors">
                    Loka
                </button>
            }
        >
            <div>
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center text-amber-ink">
                            <Calendar size={20} aria-hidden="true" />
                        </div>
                        <p className="text-sm text-stone-500">{format(startDate, 'd. MMMM', { locale: is })} - {format(endDate, 'd. MMMM yyyy', { locale: is })}</p>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-stone-50 p-4 rounded-xl">
                                <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-1">Hver</p>
                                <div className="flex items-center gap-2 font-medium text-[#1a1a1a]">
                                    <User size={16} className="text-amber" />
                                    {booking.user_name || 'Óþekktur'}
                                </div>
                            </div>
                            <div className="bg-stone-50 p-4 rounded-xl">
                                <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-1">Lengd</p>
                                <div className="flex items-center gap-2 font-medium text-[#1a1a1a]">
                                    <Clock size={16} className="text-amber" />
                                    {nights} nætur
                                </div>
                            </div>
                        </div>

                        {booking.notes && (
                            <div>
                                <h4 className="flex items-center gap-2 text-sm font-bold text-[#1a1a1a] mb-2">
                                    <AlignLeft size={16} className="text-amber" />
                                    Athugasemdir
                                </h4>
                                <p className="text-stone-600 text-sm bg-stone-50 p-4 rounded-xl">
                                    {booking.notes}
                                </p>
                            </div>
                        )}

                        {/* Debug/Admin Info */}
                        <div className="pt-2 text-[10px] text-stone-300">
                            ID: {booking.id} | Type: {booking.type}
                        </div>

                    </div>
                </div>
            </div>
        </Modal>
    );
}
