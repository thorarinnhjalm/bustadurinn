import { CheckCircle, AlertTriangle } from 'lucide-react';
import Modal from '@/components/ui/Modal';

export interface ConfirmModalState {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'info' | 'success';
    onConfirm: () => void;
}

interface ConfirmModalProps {
    confirmModal: ConfirmModalState | null;
    onClose: () => void;
}

/** Custom Confirmation Modal (nothing in the page currently opens it). */
export default function ConfirmModal({ confirmModal, onClose }: ConfirmModalProps) {
    return (
        <>
            {
                confirmModal && confirmModal.isOpen && (
                    <Modal
                        open
                        onClose={onClose}
                        title={confirmModal.title}
                        size="sm"
                        footer={
                            <div className="flex w-full gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg transition-colors"
                                >
                                    Hætta við
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmModal.onConfirm}
                                    className={`flex-1 py-3 px-4 font-bold rounded-lg shadow-md transition-transform motion-safe:active:scale-95 ${confirmModal.type === 'danger' ? 'bg-red-700 hover:bg-red-800 text-white' : confirmModal.type === 'success' ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-amber hover:bg-amber-600 text-charcoal'
                                        }`}
                                >
                                    Staðfesta
                                </button>
                            </div>
                        }
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm ${confirmModal.type === 'danger' ? 'bg-red-50 text-red-600' : confirmModal.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-stone-50 text-amber-ink'
                                }`}>
                                {confirmModal.type === 'success' ? <CheckCircle className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                            </div>
                            <p className="text-sm text-stone-600 leading-relaxed">{confirmModal.message}</p>
                        </div>
                    </Modal>
                )
            }
        </>
    );
}
