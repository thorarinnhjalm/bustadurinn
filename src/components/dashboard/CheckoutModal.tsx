import { useState, useEffect } from 'react';
import { Loader2, LogOut, X, Package } from 'lucide-react';

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
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    // Per supply item: true = "Á þrotum" (out), false/absent = "Til" (in stock, default).
    const [suppliesOutMap, setSuppliesOutMap] = useState<Record<string, boolean>>({});

    // Reset checked state whenever the modal (re)opens or the checklist changes,
    // so a previous checkout's ticks don't leak into the next one.
    useEffect(() => {
        if (isOpen) {
            setCheckedItems({});
            setSuppliesOutMap({});
        }
    }, [isOpen, checklist, supplyChecklist]);

    if (!isOpen) return null;

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center text-amber">
                                <LogOut size={20} />
                            </div>
                            <div>
                                <h3 className="font-serif font-bold text-xl text-[#1a1a1a]">Skrá brottför</h3>
                                <p className="text-sm text-stone-500">Skráðu þig úr húsinu</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-stone-400 hover:text-[#1a1a1a]">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-[#1a1a1a] mb-2">
                                Skilaboð í gestabók (valfrjálst)
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => onMessageChange(e.target.value)}
                                placeholder="Takk fyrir okkur! Allt til fyrirmyndar..."
                                className="w-full h-24 p-3 rounded-xl border border-stone-200 focus:border-amber focus:ring-1 focus:ring-amber outline-none resize-none text-sm transition-all"
                            />
                        </div>

                        {hasChecklist ? (
                            <div className="bg-stone-50 p-4 rounded-xl">
                                <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-3">
                                    Gátlisti fyrir brottför (valfrjálst)
                                </p>
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
                            </div>
                        ) : (
                            <div className="bg-stone-50 p-4 rounded-xl text-xs text-stone-500">
                                <strong>Mundu:</strong> Læsa hurðum, loka gluggum og taka ruslið.
                            </div>
                        )}

                        {hasSupplyChecklist && (
                            <div className="bg-stone-50 p-4 rounded-xl">
                                <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-1 flex items-center gap-2">
                                    <Package size={14} /> Birgðastaða
                                </p>
                                <p className="text-xs text-stone-500 mb-3">
                                    Merktu við ef eitthvað er á þrotum — það fer sjálfkrafa á innkaupalistann.
                                </p>
                                <div className="space-y-2">
                                    {supplyChecklist.map((item) => {
                                        const isOut = !!suppliesOutMap[item];
                                        return (
                                            <div
                                                key={item}
                                                className="flex items-center justify-between gap-3 py-1"
                                            >
                                                <span className="text-sm text-stone-700">{item}</span>
                                                <div className="flex bg-white rounded-lg border border-stone-200 overflow-hidden text-xs font-bold">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSuppliesOutMap((prev) => ({ ...prev, [item]: false }))}
                                                        className={`px-3 py-1.5 transition-colors ${!isOut ? 'bg-emerald-500 text-white' : 'text-stone-500 hover:bg-stone-50'}`}
                                                    >
                                                        Til
                                                    </button>
                                                    <button
                                                        type="button"
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

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-stone-600 hover:bg-stone-100 transition-colors"
                            >
                                Hætta við
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={loading}
                                className="flex-1 bg-[#1a1a1a] text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                                Skrá brottför
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
