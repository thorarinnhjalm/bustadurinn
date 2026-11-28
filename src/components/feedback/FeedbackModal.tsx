import { useId, useState } from 'react';
import { Star, Loader2, Send } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { logger } from '@/utils/logger';
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

    const ratingLabelId = useId();
    const commentId = useId();

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
            logger.error('Feedback submit failed', err);
            setError('Eitthvað fór úrskeiðis. Reyndu aftur síðar.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title="Gefa umsögn"
            size="md"
            dismissible={!isSubmitting}
        >
            <div>
                {submitSuccess ? (
                    <div role="status" className="p-8 text-center bg-stone-50">
                        <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-4 motion-safe:animate-in motion-safe:zoom-in motion-safe:spin-in-90 duration-300">
                            <Send size={32} aria-hidden="true" />
                        </div>
                        <h4 className="text-xl font-bold text-[#1a1a1a] mb-2">Takk fyrir!</h4>
                        <p className="text-stone-600">Ábendingin þín hjálpar okkur að gera betur.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="pt-1 space-y-6">
                        {/* Rating */}
                        <div className="text-center">
                            <p id={ratingLabelId} className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-3">Hvað finnst þér?</p>
                            <div role="group" aria-labelledby={ratingLabelId} className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        aria-label={`${star} af 5 stjörnum`}
                                        aria-pressed={rating === star}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                        className="transition-transform motion-safe:hover:scale-110 active:scale-95 rounded-md"
                                    >
                                        <Star
                                            size={32}
                                            aria-hidden="true"
                                            className={`${(hoverRating || rating) >= star ? 'fill-amber text-amber' : 'text-stone-300'} transition-colors`}
                                            strokeWidth={1.5}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Comment */}
                        <div>
                            <label htmlFor={commentId} className="block text-sm font-bold text-[#1a1a1a] mb-2">
                                Hvað má betur fara? <span className="text-stone-500 font-normal">(valfrjálst)</span>
                            </label>
                            <textarea
                                id={commentId}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Segðu okkur hvað þér finnst..."
                                className="w-full h-32 p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber transition-all resize-none text-stone-700"
                            />
                        </div>

                        {/* Contact Permission */}
                        <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 cursor-pointer transition-colors border border-transparent hover:border-stone-100">
                            <input
                                type="checkbox"
                                checked={canContact}
                                onChange={(e) => setCanContact(e.target.checked)}
                                className="peer sr-only"
                            />
                            <div aria-hidden="true" className={`w-5 h-5 rounded border flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-charcoal peer-focus-visible:ring-offset-2 ${canContact ? 'bg-amber border-amber text-charcoal' : 'border-stone-300 bg-white'}`}>
                                {canContact && <Send size={12} />}
                            </div>
                            <span className="text-sm text-stone-600 select-none">Má hafa samband við mig ef þarf?</span>
                        </label>

                        {/* Error Message */}
                        {error && (
                            <div role="alert" className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2">
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
                                    <Loader2 size={20} className="motion-safe:animate-spin" aria-hidden="true" />
                                    Sendi...
                                </>
                            ) : (
                                'Senda umsögn'
                            )}
                        </button>
                    </form>
                )}
            </div>
        </Modal>
    );
}
