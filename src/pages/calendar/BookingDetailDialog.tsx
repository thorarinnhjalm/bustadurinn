import { AlertCircle, Trash2 } from 'lucide-react';
import type { Booking, BookingType, House } from '@/types/models';
import Modal from '@/components/ui/Modal';

interface BookingDetailDialogProps {
    selectedBooking: Booking | null;
    onClose: () => void;
    loading: boolean;
    error: string;
    currentUserId: string | undefined;
    currentHouse: House | null;
    showDeleteConfirm: boolean;
    setShowDeleteConfirm: (value: boolean) => void;
    onDelete: () => void;
    getTypeLabel: (type: BookingType) => string;
}

/** View/Delete Booking Modal */
export default function BookingDetailDialog({
    selectedBooking,
    onClose,
    loading,
    error,
    currentUserId,
    currentHouse,
    showDeleteConfirm,
    setShowDeleteConfirm,
    onDelete,
    getTypeLabel,
}: BookingDetailDialogProps) {
    return (
        <Modal
            open={!!selectedBooking}
            onClose={onClose}
            title="Bókun"
            size="md"
            dismissible={!loading}
        >
            {selectedBooking && (
                <div>
                    {error && (
                        <div role="alert" className="bg-red-500/10 border border-red-500 text-red-700 rounded p-4 mb-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <div className="space-y-4 mb-6">
                        <div>
                            <p className="text-xs text-stone-500 uppercase tracking-wider font-bold">Bókað af</p>
                            <p className="text-lg font-medium">{selectedBooking.user_name}</p>
                            {/* Added Created At Date */}
                            {selectedBooking.created_at && (
                                <p className="text-xs text-stone-500 mt-1">
                                    Bókað þann: {selectedBooking.created_at.toLocaleDateString('is-IS')}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-stone-500 uppercase tracking-wider font-bold">Frá</p>
                                <p>{selectedBooking.start.toLocaleDateString('is-IS')}</p>
                            </div>
                            <div>
                                <p className="text-xs text-stone-500 uppercase tracking-wider font-bold">Til</p>
                                <p>{selectedBooking.end.toLocaleDateString('is-IS')}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-stone-500 uppercase tracking-wider font-bold">Tegund</p>
                            <span className={`inline-block mt-1 px-2 py-1 rounded text-sm font-medium ${selectedBooking.type === 'personal' ? 'bg-amber/10 text-amber-dark' :
                                selectedBooking.type === 'rental' ? 'bg-green-100 text-green-700' :
                                    selectedBooking.type === 'maintenance' ? 'bg-red-100 text-red-700' :
                                        'bg-indigo-100 text-indigo-700'
                                }`}>
                                {getTypeLabel(selectedBooking.type)}
                            </span>
                        </div>

                        {selectedBooking.notes && (
                            <div>
                                <p className="text-xs text-stone-500 uppercase tracking-wider font-bold">Athugasemd</p>
                                <p className="text-stone-700 bg-stone-50 p-3 rounded mt-1">{selectedBooking.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Allow deletion if user owns the booking OR is house member (manager or co-owner) */}
                    {(currentUserId === selectedBooking.user_id || currentHouse?.manager_id === currentUserId || currentHouse?.owner_ids?.includes(currentUserId || '')) && (
                        <div className="pt-4 border-t border-stone-100">
                            {!showDeleteConfirm ? (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="btn bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 w-full flex items-center justify-center gap-2"
                                    disabled={loading}
                                >
                                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                                    Eyða Bókun
                                </button>
                            ) : (
                                <div>
                                    <p className="text-sm text-red-600 font-medium mb-3 text-center">Ertu viss um að þú viljir eyða þessari bókun?</p>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowDeleteConfirm(false)}
                                            className="btn btn-ghost flex-1"
                                            disabled={loading}
                                        >
                                            Hætta við
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDelete()}
                                            className="btn bg-red-600 text-white hover:bg-red-700 flex-1 flex items-center justify-center gap-2"
                                            disabled={loading}
                                        >
                                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                                            {loading ? 'Eyði...' : 'Já, eyða'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}
