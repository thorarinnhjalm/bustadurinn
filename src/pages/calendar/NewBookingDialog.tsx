import { useId } from 'react';
import { AlertCircle } from 'lucide-react';
import type { BookingType } from '@/types/models';
import { toDateInputValue, fromDateInputValue } from '@/utils/localDate';
import Modal from '@/components/ui/Modal';
import type { NewBookingForm } from './calendarTypes';

interface NewBookingDialogProps {
    open: boolean;
    onClose: () => void;
    loading: boolean;
    error: string;
    newBooking: NewBookingForm;
    setNewBooking: (value: NewBookingForm) => void;
    onSubmit: () => void;
}

/** Booking Modal - the new-booking form */
export default function NewBookingDialog({
    open,
    onClose,
    loading,
    error,
    newBooking,
    setNewBooking,
    onSubmit,
}: NewBookingDialogProps) {
    const bookingFormId = useId();

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Ný bókun"
            size="md"
            dismissible={!loading}
            footer={
                <div className="flex gap-3 w-full">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-ghost flex-1"
                        disabled={loading}
                    >
                        Hætta við
                    </button>
                    <button
                        type="submit"
                        form={bookingFormId}
                        className="btn btn-primary flex-1"
                        disabled={loading}
                    >
                        {loading ? 'Bý til...' : 'Búa til bókun'}
                    </button>
                </div>
            }
        >
            <div>
                {error && (
                    <div role="alert" className="bg-red-500/10 border border-red-500 text-red-700 rounded p-4 mb-6 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                <form id={bookingFormId} className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
                    <div>
                        <label htmlFor={`${bookingFormId}-start`} className="label">Upphafsdagur</label>
                        <input
                            id={`${bookingFormId}-start`}
                            type="date"
                            className="input"
                            value={toDateInputValue(newBooking.start)}
                            onChange={(e) => {
                                const newStart = fromDateInputValue(e.target.value);
                                if (!newStart) return;

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
                        <label htmlFor={`${bookingFormId}-end`} className="label">Lokadagur</label>
                        <input
                            id={`${bookingFormId}-end`}
                            type="date"
                            className="input"
                            value={toDateInputValue(newBooking.end)}
                            onChange={(e) => {
                                const newEnd = fromDateInputValue(e.target.value);
                                // Cleared/invalid input: keep the previous value
                                if (!newEnd) return;
                                setNewBooking({ ...newBooking, end: newEnd });
                            }}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor={`${bookingFormId}-type`} className="label">Tegund bókunar</label>
                        <select
                            id={`${bookingFormId}-type`}
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
                        <label htmlFor={`${bookingFormId}-notes`} className="label">Athugasemd (valfrjálst)</label>
                        <textarea
                            id={`${bookingFormId}-notes`}
                            className="input min-h-[80px]"
                            placeholder="t.d. Fjölskyldusamkoma, páskahátíð..."
                            value={newBooking.notes}
                            onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                        />
                    </div>

                </form>
            </div>
        </Modal>
    );
}
