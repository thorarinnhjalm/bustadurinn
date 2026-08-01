import type { Feedback } from '@/types/models';
import { Quote } from 'lucide-react';

interface TestimonialsProps {
    reviews?: Feedback[];
    loading?: boolean;
}

export default function Testimonials({ loading = false }: TestimonialsProps) {
    if (loading) return null;

    return (
        // Hidden on mobile: the cross-origin umsognin.is iframe below creates
        // its own stacking/hit-testing context and was intercepting taps meant
        // for the mobile menu. Desktop is unaffected, so the reviews stay there
        // rather than being removed outright.
        <section className="hidden md:block py-24 bg-charcoal border-b border-stone-800 relative overflow-hidden">
            {/* Decor */}
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <Quote size={200} color="white" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-serif mb-4 text-white">Það sem notendur segja</h2>
                    <p className="text-xl text-stone-300 max-w-2xl mx-auto">
                        Við hlustum á okkar notendur til að gera kerfið betra.
                    </p>
                </div>

                <div className="flex justify-center w-full">
                    <iframe 
                        src="https://umsognin.is/d/bustadurinn-is?theme=glass&color=%23ffffff&minRating=3" 
                        width="100%" 
                        height="280px" 
                        style={{ border: 'none', overflow: 'hidden' }}
                        title="Umsagnir"
                    ></iframe>
                </div>
            </div>
        </section>
    );
}
