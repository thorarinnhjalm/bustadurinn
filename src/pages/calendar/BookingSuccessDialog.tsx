import { Check } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { SuccessBooking } from './calendarTypes';

interface BookingSuccessDialogProps {
    showSuccess: boolean;
    successBooking: SuccessBooking | null;
    onClose: () => void;
}

/** Success Modal */
export default function BookingSuccessDialog({ showSuccess, successBooking, onClose }: BookingSuccessDialogProps) {
    return (
        <Modal
            open={showSuccess && !!successBooking}
            onClose={onClose}
            title="Bókun staðfest!"
            size="md"
            footer={
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full px-6 py-3 bg-gradient-to-r from-charcoal to-stone-800 text-white rounded-xl font-bold hover:from-stone-800 hover:to-charcoal transition-all shadow-lg active:scale-[0.98]"
                >
                    Loka
                </button>
            }
        >
            {successBooking && (
                <div role="status" className="text-center">
                    {/* Success Icon */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 mb-4">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 relative" aria-hidden="true">
                            <Check className="w-10 h-10 text-green-700" strokeWidth={3} />
                            <div className="absolute inset-0 rounded-full bg-green-400 motion-safe:animate-ping opacity-20"></div>
                        </div>
                        <p className="text-stone-600">
                            <span className="font-bold">{successBooking.user_name}</span>
                            <br />
                            {successBooking.start.toLocaleDateString('is-IS', { day: 'numeric', month: 'long' })} - {successBooking.end.toLocaleDateString('is-IS', { day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                    <p className="text-sm text-stone-500">
                        Staðfesting hefur verið send í tölvupósti til allra meðeigenda
                    </p>
                </div>
            )}
        </Modal>
    );
}
