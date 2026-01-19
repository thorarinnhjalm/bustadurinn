import { Loader2, LogOut, X } from 'lucide-react';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    loading: boolean;
    onCheckout: () => void;
    message: string;
    onMessageChange: (msg: string) => void;
}

export default function CheckoutModal({
    isOpen,
    onClose,
    loading,
    onCheckout,
    message,
    onMessageChange
}: CheckoutModalProps) {
    if (!isOpen) return null;

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

                        <div className="bg-stone-50 p-4 rounded-xl text-xs text-stone-500">
                            <strong>Mundu:</strong> Læsa hurðum, loka gluggum og taka ruslið.
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-stone-600 hover:bg-stone-100 transition-colors"
                            >
                                Hætta við
                            </button>
                            <button
                                onClick={onCheckout}
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
