import { useId, useState } from 'react';
import { Loader2, LogOut, Package } from 'lucide-react';
import Modal from '@/components/ui/Modal';

// Stable default: an inline `checklist = []` default parameter would create a
// new array reference every render, and since the reset effect below keys on
// `checklist`, that would loop render -> effect -> setState -> render forever.
const NO_CHECKLIST: string[] = [];

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    loading: boolean;
    onCheckout: (checklist: Record<string, boolean>, suppliesOut: string[]) => void;
    message: string;
    onMessageChange: (msg: string) => void;
    checklist?: string[];
    supplyChecklist?: string[];
}

export default function CheckoutModal({
    isOpen,
    onClose,
    loading,
    onCheckout,
    message,
    onMessageChange,
    checklist = NO_CHECKLIST,
    supplyChecklist = NO_CHECKLIST
}: CheckoutModalProps) {
    const messageId = useId();
    const supplyBaseId = useId();
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    // Per supply item: true = "Á þrotum" (out), false/absent = "Til" (in stock, default).
    const [suppliesOutMap, setSuppliesOutMap] = useState<Record<string, boolean>>({});

    // Reset checked state whenever the modal (re)opens or the checklist changes,
    // so a previous checkout's ticks don't leak into the next one. Done during
    // render (tracking the previous inputs) rather than in an effect.
    const [prevInputs, setPrevInputs] = useState({ isOpen, checklist, supplyChecklist });
    if (
        prevInputs.isOpen !== isOpen ||
        prevInputs.checklist !== checklist ||
        prevInputs.supplyChecklist !== supplyChecklist
    ) {
        setPrevInputs({ isOpen, checklist, supplyChecklist });
        if (isOpen) {
            setCheckedItems({});
            setSuppliesOutMap({});
        }
    }

    const hasChecklist = checklist.length > 0;
    const hasSupplyChecklist = supplyChecklist.length > 0;

    const toggleItem = (item: string) => {
        setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }));
    };

    const handleConfirm = () => {
        // Report the full item -> checked map (including untouched items as
        // `false`), not just the ones the user actually clicked.
        const fullMap: Record<string, boolean> = Object.fromEntries(
            checklist.map((item) => [item, !!checkedItems[item]])
        );
        const suppliesOut = supplyChecklist.filter((item) => !!suppliesOutMap[item]);
        onCheckout(fullMap, suppliesOut);
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title="Skrá brottför"
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
                        {loading ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : <LogOut size={16} aria-hidden="true" />}
                        Skrá brottför
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                        <p className="text-sm text-stone-500">Skráðu þig úr húsinu</p>
                        <div>
                            <label htmlFor={messageId} className="block text-sm font-bold text-[#1a1a1a] mb-2">
                                Skilaboð í gestabók (valfrjálst)
                            </label>
                            <textarea
                                id={messageId}
                                value={message}
                                onChange={(e) => onMessageChange(e.target.value)}
                                placeholder="Takk fyrir okkur! Allt til fyrirmyndar..."
                                className="w-full h-24 p-3 rounded-xl border border-stone-200 focus:border-amber focus:ring-1 focus:ring-amber outline-none resize-none text-sm transition-all"
                            />
                        </div>

                        {hasChecklist ? (
                            <fieldset className="bg-stone-50 p-4 rounded-xl border-0 m-0 min-w-0">
                                <legend className="text-xs font-bold text-stone-500 uppercase tracking-wide p-0 mb-3">
                                    Gátlisti fyrir brottför (valfrjálst)
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
                        ) : (
                            <div className="bg-stone-50 p-4 rounded-xl text-xs text-stone-500">
                                <strong>Mundu:</strong> Læsa hurðum, loka gluggum og taka ruslið.
                            </div>
                        )}

                        {hasSupplyChecklist && (
                            <div className="bg-stone-50 p-4 rounded-xl">
                                <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-1 flex items-center gap-2">
                                    <Package size={14} aria-hidden="true" /> Birgðastaða
                                </p>
                                <p className="text-xs text-stone-500 mb-3">
                                    Merktu við ef eitthvað er á þrotum — það fer sjálfkrafa á innkaupalistann.
                                </p>
                                <div className="space-y-2">
                                    {supplyChecklist.map((item, idx) => {
                                        const isOut = !!suppliesOutMap[item];
                                        const labelId = `${supplyBaseId}-${idx}`;
                                        return (
                                            <div
                                                key={item}
                                                className="flex items-center justify-between gap-3 py-1"
                                            >
                                                <span id={labelId} className="text-sm text-stone-700">{item}</span>
                                                <div role="group" aria-labelledby={labelId} className="flex bg-white rounded-lg border border-stone-200 overflow-hidden text-xs font-bold">
                                                    <button
                                                        type="button"
                                                        aria-pressed={!isOut}
                                                        onClick={() => setSuppliesOutMap((prev) => ({ ...prev, [item]: false }))}
                                                        className={`px-3 py-1.5 transition-colors ${!isOut ? 'bg-emerald-500 text-white' : 'text-stone-500 hover:bg-stone-50'}`}
                                                    >
                                                        Til
                                                    </button>
                                                    <button
                                                        type="button"
                                                        aria-pressed={isOut}
                                                        onClick={() => setSuppliesOutMap((prev) => ({ ...prev, [item]: true }))}
                                                        className={`px-3 py-1.5 transition-colors ${isOut ? 'bg-amber text-[#1a1a1a]' : 'text-stone-500 hover:bg-stone-50'}`}
                                                    >
                                                        Á þrotum
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
            </div>
        </Modal>
    );
}
