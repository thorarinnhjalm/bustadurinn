import { useState } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import Modal from '@/components/ui/Modal';

// Stable default: see CheckoutModal for why an inline `checklist = []` default
// parameter is unsafe here (creates a new array reference every render, which
// would loop the reset effect below since it keys on `checklist`).
const NO_CHECKLIST: string[] = [];

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    loading: boolean;
    onCheckIn: (checklist: Record<string, boolean>) => void;
    checklist?: string[];
}

export default function CheckInModal({
    isOpen,
    onClose,
    loading,
    onCheckIn,
    checklist = NO_CHECKLIST
}: CheckInModalProps) {
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

    // Reset checked state whenever the modal (re)opens or the checklist
    // changes, so a previous check-in's ticks don't leak into the next one.
    // Done during render (tracking the previous inputs) rather than in an effect.
    const [prevInputs, setPrevInputs] = useState({ isOpen, checklist });
    if (prevInputs.isOpen !== isOpen || prevInputs.checklist !== checklist) {
        setPrevInputs({ isOpen, checklist });
        if (isOpen) setCheckedItems({});
    }

    const toggleItem = (item: string) => {
        setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }));
    };

    const handleConfirm = () => {
        // Report the full item -> checked map (including untouched items as
        // `false`), not just the ones the user actually clicked.
        const fullMap: Record<string, boolean> = Object.fromEntries(
            checklist.map((item) => [item, !!checkedItems[item]])
        );
        onCheckIn(fullMap);
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title="Skrá komu"
            size="md"
            dismissible={!loading}
            footer={
                <div className="flex gap-3 w-full">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-stone-600 hover:bg-stone-100 transition-colors"
                    >
                        Hætta við
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 bg-[#1a1a1a] text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : <LogIn size={16} aria-hidden="true" />}
                        Skrá komu
                    </button>
                </div>
            }
        >
            <p className="text-sm text-stone-500 mb-4">Skráðu þig inn í húsið</p>
            <fieldset className="bg-stone-50 p-4 rounded-xl border-0 m-0 min-w-0">
                <legend className="text-xs font-bold text-stone-500 uppercase tracking-wide p-0 mb-3">
                    Komugátlisti (valfrjálst)
                </legend>
                <div className="space-y-2">
                    {checklist.map((item) => (
                        <label
                            key={item}
                            className="flex items-center gap-3 cursor-pointer select-none"
                        >
                            <input
                                type="checkbox"
                                checked={!!checkedItems[item]}
                                onChange={() => toggleItem(item)}
                                className="w-4 h-4 rounded border-stone-300 text-amber focus:ring-amber"
                            />
                            <span className="text-sm text-stone-700">{item}</span>
                        </label>
                    ))}
                </div>
            </fieldset>
        </Modal>
    );
}
