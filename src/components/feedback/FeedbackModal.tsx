import { useState } from 'react';
import { Star, X, Loader2, Send } from 'lucide-react';
import { feedbackService } from '@/services/feedbackService';
import { useAppStore } from '@/store/appStore';
import { useLocation } from 'react-router-dom';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
    const { currentUser } = useAppStore();
    const location = useLocation();

    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [canContact, setCanContact] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Vinsamlegast veldu stjörnugjöf');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await feedbackService.submitFeedback({
                userId: currentUser?.uid || 'anonymous',
                userName: currentUser?.name || 'Anonymous User',
                userEmail: currentUser?.email,
                rating,
                comment,
                canContact,
                path: location.pathname
            });

            setSubmitSuccess(true);
            setTimeout(() => {
                onClose();
                // Reset form after close
                setTimeout(() => {
                    setSubmitSuccess(false);
                    setRating(0);
                    setComment('');
                    setCanContact(true);
                }, 300);
            }, 2000);

        } catch (err) {
            console.error(err);
            setError('Eitthvað fór úrskeiðis. Reyndu aftur síðar.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-[#1a1a1a] p-4 flex justify-between items-center text-white">
                    <h3 className="font-serif font-bold text-lg">Gefa umsögn</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {submitSuccess ? (
                    <div className="p-8 text-center bg-stone-50">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in spin-in-90 duration-300">
                            <Send size={32} />
                        </div>
                        <h4 className="text-xl font-bold text-[#1a1a1a] mb-2">Takk fyrir!</h4>
                        <p className="text-stone-600">Ábendingin þín hjálpar okkur að gera betur.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Rating */}
                        <div className="text-center">
                            <p className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-3">Hvað finnst þér?</p>
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                        className="transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                                    >
                                        <Star
                                            size={32}
                                            className={`${(hoverRating || rating) >= star ? 'fill-amber text-amber' : 'text-stone-300'} transition-colors`}
                                            strokeWidth={1.5}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Comment */}
                        <div>
                            <label className="block text-sm font-bold text-[#1a1a1a] mb-2">
                                Hvað má betur fara? <span className="text-stone-400 font-normal">(valfrjálst)</span>
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Segðu okkur hvað þér finnst..."
                                className="w-full h-32 p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber transition-all resize-none text-stone-700"
                            />
                        </div>

                        {/* Contact Permission */}
                        <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 cursor-pointer transition-colors border border-transparent hover:border-stone-100">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${canContact ? 'bg-amber border-amber text-white' : 'border-stone-300 bg-white'}`}>
                                {canContact && <Send size={12} />}
                            </div>
                            <input
                                type="checkbox"
                                checked={canContact}
                                onChange={(e) => setCanContact(e.target.checked)}
                                className="hidden"
                            />
                            <span className="text-sm text-stone-600 select-none">Má hafa samband við mig ef þarf?</span>
                        </label>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center animate-in fade-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || rating === 0}
                            className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2
                                ${isSubmitting || rating === 0
                                    ? 'bg-stone-300 cursor-not-allowed'
                                    : 'bg-[#1a1a1a] hover:bg-stone-800 shadow-lg shadow-stone-200 active:scale-[0.98]'
                                }
                            `}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Sendi...
                                </>
                            ) : (
                                'Senda umsögn'
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
