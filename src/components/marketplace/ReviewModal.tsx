import React, { useId, useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { db } from '@/lib/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { logger } from '@/utils/logger';
import { useAppStore } from '@/store/appStore';
import type { ServiceProvider } from '@/types/models';

interface ReviewModalProps {
    provider: ServiceProvider;
    onClose: () => void;
    onReviewSubmitted: () => void;
}

export default function ReviewModal({ provider, onClose, onReviewSubmitted }: ReviewModalProps) {
    const { currentUser } = useAppStore();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const formId = useId();
    const commentId = useId();
    const ratingLabelId = useId();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        if (rating === 0) {
            setError('Veldu einkunn með því að smella á stjörnu.');
            return;
        }
        if (!currentUser) return;

        setError('');
        setLoading(true);

        try {
            // One review per user and provider (deterministic id; rules allow create only).
            // rating_avg / rating_count on the provider doc are computed from the
            // reviews when the marketplace loads, because users cannot write provider docs.
            const reviewRef = doc(db, 'service_reviews', `${provider.id}_${currentUser.uid}`);
            const existing = await getDoc(reviewRef);
            if (existing.exists()) {
                setError('Þú hefur þegar gefið þessum þjónustuaðila umsögn.');
                return;
            }
            await setDoc(reviewRef, {
                provider_id: provider.id,
                user_id: currentUser.uid,
                user_name: (currentUser.name || 'Notandi').slice(0, 100),
                rating: rating,
                comment: comment.trim().slice(0, 1000),
                created_at: serverTimestamp()
            });

            onReviewSubmitted();
            onClose();
        } catch (error) {
            logger.error('Error submitting review:', error);
            setError('Villa kom upp við að senda inn umsögn.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open
            onClose={onClose}
            title="Gefðu einkunn"
            size="md"
            footer={
                <button
                    type="submit"
                    form={formId}
                    aria-busy={loading}
                    className="btn btn-primary w-full py-3"
                >
                    {loading ? (
                        <span role="status">
                            <Loader2 aria-hidden="true" className="w-5 h-5 animate-spin mx-auto" />
                            <span className="sr-only">Hleð…</span>
                        </span>
                    ) : 'Senda umsögn'}
                </button>
            }
        >
            <p className="text-grey-mid mb-6">Hvernig var þjónustan hjá {provider.name}?</p>

            <form id={formId} onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <p id={ratingLabelId} className="sr-only">Einkunn</p>
                    <div role="group" aria-labelledby={ratingLabelId} className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                aria-label={`${star} af 5 stjörnum`}
                                aria-pressed={rating === star}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="p-1 transition-transform motion-safe:hover:scale-110"
                            >
                                <Star
                                    size={32}
                                    aria-hidden="true"
                                    className={`${star <= (hoverRating || rating)
                                        ? 'fill-amber text-amber-ink'
                                        : 'text-stone-300'
                                        } transition-colors`}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor={commentId} className="text-sm font-medium text-charcoal">Umsögn (valfrjálst)</label>
                    <textarea
                        id={commentId}
                        className="input w-full min-h-[100px]"
                        placeholder="Segðu okkur frá upplifun þinni..."
                        value={comment}
                        maxLength={1000}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </div>

                <div role="alert">
                    {error && <p className="text-sm text-red-700">{error}</p>}
                </div>
            </form>
        </Modal>
    );
}
