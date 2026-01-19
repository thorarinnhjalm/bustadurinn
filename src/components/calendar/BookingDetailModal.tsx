import { X, Calendar, User, Clock, AlignLeft } from 'lucide-react';
import { format } from 'date-fns';
import { is } from 'date-fns/locale';
import type { Booking, House, User as AppUser } from '@/types/models';

interface BookingDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking;
    currentHouse?: House | null;
    currentUser?: AppUser | null;
}

export default function BookingDetailModal({ isOpen, onClose, booking, currentHouse: _ch, currentUser: _cu }: BookingDetailModalProps) {
    if (!isOpen) return null;

    const startDate = booking.start instanceof Date ? booking.start : new Date(booking.start);
    const endDate = booking.end instanceof Date ? booking.end : new Date(booking.end);

    // Calculate nights
    const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center text-amber">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <h3 className="font-serif font-bold text-xl text-[#1a1a1a]">Bókun</h3>
                                <p className="text-sm text-stone-500">{format(startDate, 'd. MMMM', { locale: is })} - {format(endDate, 'd. MMMM yyyy', { locale: is })}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-stone-400 hover:text-[#1a1a1a]">
                            <X size={20} />
                        </button>
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

                        <div className="pt-2">
                            <button onClick={onClose} className="w-full bg-[#1a1a1a] text-white py-3 rounded-xl font-bold text-sm hover:bg-stone-800 transition-colors">
                                Loka
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
