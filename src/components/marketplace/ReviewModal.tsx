import React, { useState } from 'react';
import { Star, X, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, doc, serverTimestamp, runTransaction } from 'firebase/firestore';
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;
        if (!currentUser) return;

        setLoading(true);

        try {
            await runTransaction(db, async (transaction) => {
                // 1. Create review doc ref
                const reviewRef = doc(collection(db, 'service_reviews'));

                // 2. Read provider doc to get latest stats (locking it)
                const providerRef = doc(db, 'service_providers', provider.id);
                const providerDoc = await transaction.get(providerRef);

                if (!providerDoc.exists()) {
                    throw new Error("Provider does not exist!");
                }

                const currentData = providerDoc.data();
                const currentCount = currentData.rating_count || 0;
                const currentAvg = currentData.rating_avg || 0;

                // 3. Calculate new average
                // (OldAvg * OldCount + NewRating) / (OldCount + 1)
                const newCount = currentCount + 1;
                const newAvg = ((currentAvg * currentCount) + rating) / newCount;

                // 4. Write review
                transaction.set(reviewRef, {
                    provider_id: provider.id,
                    user_id: currentUser.uid,
                    user_name: currentUser.name || 'Notandi',
                    rating: rating,
                    comment: comment,
                    created_at: serverTimestamp()
                });

                // 5. Update provider stats
                transaction.update(providerRef, {
                    rating_count: newCount,
                    rating_avg: newAvg
                });
            });

            onReviewSubmitted();
            onClose();
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Villa kom upp við að senda inn umsögn.');
        } finally {
            setLoading(false);
        }

        // Send notification email (fire and forget)
        if (provider.contact_email) {
            fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateId: 'general_notification',
                    to: provider.contact_email,
                    variables: {
                        title: 'Ný umsögn á Torginu! ⭐',
                        message: `Þú hefur fengið nýja ${rating} stjörnu umsögn frá ${currentUser.name || 'notanda'}. Kíktu á Torgið til að sjá hvað viðskiptavinir eru að segja.`,
                        actionUrl: 'https://bustadurinn.is/thjonusta'
                    }
                })
            }).catch(console.error); // Log error but don't block UI
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-stone-400 hover:text-charcoal transition-colors"
                >
                    <X size={24} />
                </button>

                <h3 className="text-2xl font-serif font-bold text-charcoal mb-2">Gefðu einkunn</h3>
                <p className="text-grey-mid mb-6">Hvernig var þjónustan hjá {provider.name}?</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="p-1 transition-transform hover:scale-110 focus:outline-none"
                            >
                                <Star
                                    size={32}
                                    className={`${star <= (hoverRating || rating)
                                        ? 'fill-amber text-amber'
                                        : 'text-stone-300'
                                        } transition-colors`}
                                />
                            </button>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-charcoal">Umsögn (valfrjálst)</label>
                        <textarea
                            className="input w-full min-h-[100px]"
                            placeholder="Segðu okkur frá upplifun þinni..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || rating === 0}
                        className="btn btn-primary w-full py-3"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Senda umsögn'}
                    </button>
                </form>
            </div>
        </div>
    );
}
