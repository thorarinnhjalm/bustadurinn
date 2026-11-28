import { format } from 'date-fns';
import { is } from 'date-fns/locale';
import { AlertCircle } from 'lucide-react';
import type { Booking } from '@/types/models';
import Modal from '@/components/ui/Modal';

interface ConflictDialogProps {
    conflictWarning: Booking[] | null;
    loading: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

/** Conflict Warning Modal - warn instead of hard-block, offer override */
export default function ConflictDialog({ conflictWarning, loading, onCancel, onConfirm }: ConflictDialogProps) {
    return (
        <Modal
            open={!!conflictWarning && conflictWarning.length > 0}
            onClose={onCancel}
            title="Skörun bókana"
            size="md"
            dismissible={!loading}
            footer={
                <div className="flex gap-3 w-full">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn btn-ghost flex-1"
                        disabled={loading}
                    >
                        Hætta við
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="btn btn-primary flex-1"
                        disabled={loading}
                    >
                        {loading ? 'Bý til...' : 'Bóka samt'}
                    </button>
                </div>
            }
        >
            <div role="alert" className="bg-amber/10 border border-amber text-amber-800 rounded p-4 mb-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm">Þessi bókun skarast á við:</span>
            </div>

            <ul className="space-y-2 mb-6 list-none p-0">
                {(conflictWarning ?? []).map((conflict) => (
                    <li key={conflict.id} className="bg-stone-50 rounded p-3 border border-stone-200">
                        <p className="font-medium text-charcoal">{conflict.user_name}</p>
                        <p className="text-sm text-stone-500">
                            {format(conflict.start, 'd. MMMM yyyy', { locale: is })} - {format(conflict.end, 'd. MMMM yyyy', { locale: is })}
                        </p>
                    </li>
                ))}
            </ul>

            <p className="text-sm text-stone-500">
                Þú getur samt bókað ef þið eruð sammála um að deila húsinu þessa daga.
            </p>
        </Modal>
    );
}
