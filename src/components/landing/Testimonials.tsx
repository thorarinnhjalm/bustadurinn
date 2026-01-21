import type { Feedback } from '@/types/models';
import { Star, Quote } from 'lucide-react';

interface TestimonialsProps {
    reviews: Feedback[];
    loading?: boolean;
}

export default function Testimonials({ reviews, loading = false }: TestimonialsProps) {
    if (loading) return null; // Or a skeleton
    if (reviews.length === 0) return null; // Fallback to nothing if no featured reviews

    return (
        <section className="py-24 bg-white border-b border-stone-100 relative overflow-hidden">
            {/* Decor */}
            <div className="absolute top-0 right-0 p-12 opacity-5">
                <Quote size={200} />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-serif mb-4 text-charcoal">Það sem notendur segja</h2>
                    <p className="text-xl text-stone-500 max-w-2xl mx-auto">
                        Við hlustum á okkar notendur til að gera kerfið betra.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-bone p-8 rounded-2xl relative group hover:-translate-y-1 transition-transform duration-300">
                            {/* Quote Icon */}
                            <div className="absolute -top-4 left-8 bg-amber text-charcoal w-8 h-8 flex items-center justify-center rounded-full shadow-lg">
                                <Quote size={14} className="fill-charcoal" />
                            </div>

                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={16}
                                        className={`${i < review.rating ? 'fill-amber text-amber' : 'fill-stone-200 text-stone-200'}`}
                                    />
                                ))}
                            </div>

                            <p className="text-stone-700 leading-relaxed mb-6 font-light italic">
                                "{review.comment}"
                            </p>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-500 uppercase text-sm">
                                    {review.userName.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-charcoal">{review.userName}</div>
                                    <div className="text-xs text-stone-500">Notandi Bústaðurinn.is</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
