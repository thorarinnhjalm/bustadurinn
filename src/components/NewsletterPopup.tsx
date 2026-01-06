import { useState, useEffect } from 'react';
import { X, CheckCircle, Mail, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function NewsletterPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
    const [email, setEmail] = useState('');

    useEffect(() => {
        // Check if already dismissed or signed up
        const dismissedAt = localStorage.getItem('newsletter_popup_dismissed');
        if (dismissedAt) {
            const date = new Date(parseInt(dismissedAt));
            const now = new Date();
            const daysDiff = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
            if (daysDiff < 7) {
                return; // Don't show if dismissed within 7 days
            }
        }

        // Trigger on exit intent (desktop)
        const onMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0) {
                setIsOpen(true);
            }
        };

        // Trigger on timer (mobile/desktop fallback)
        const timer = setTimeout(() => {
            setIsOpen(true);
        }, 15000); // 15 seconds

        document.addEventListener('mouseleave', onMouseLeave);

        return () => {
            document.removeEventListener('mouseleave', onMouseLeave);
            clearTimeout(timer);
        };
    }, []);

    const handleDismiss = () => {
        setIsOpen(false);
        localStorage.setItem('newsletter_popup_dismissed', Date.now().toString());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            await addDoc(collection(db, 'newsletter_subscribers'), {
                email: email.toLowerCase().trim(),
                created_at: serverTimestamp(),
                source: 'popup',
                status: 'active'
            });
            setStatus('success');
            // Mark as dismissed/completed so it doesn't show again
            localStorage.setItem('newsletter_popup_dismissed', Date.now().toString());

            // Close after 3 seconds
            setTimeout(() => {
                setIsOpen(false);
            }, 3000);
        } catch (error) {
            console.error('Error signing up:', error);
            setStatus('idle'); // Allow retry
            alert('Eitthvað fór úrskeiðis. Reyndu aftur.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm transition-opacity animate-fade-in"
                onClick={handleDismiss}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 p-2 text-stone-400 hover:text-charcoal hover:bg-stone-100 rounded-full transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col md:flex-row">
                    {/* Image Side (Hidden on small mobile) */}
                    <div className="hidden md:block w-1/3 bg-charcoal relative overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?w=800&q=80"
                            alt="Cosy cabin"
                            className="absolute inset-0 w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-charcoal to-transparent"></div>
                        <div className="absolute bottom-6 left-6 text-white">
                            <p className="font-serif text-xl italic leading-tight">
                                "Friður er besti húsbúnaðurinn."
                            </p>
                        </div>
                    </div>

                    {/* Content Side */}
                    <div className="flex-1 p-8 md:p-10">
                        {status === 'success' ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-serif font-bold text-charcoal mb-2">Takk fyrir!</h3>
                                <p className="text-stone-600">Við höfum sett þig á listann.</p>
                            </div>
                        ) : (
                            <>
                                <div className="w-12 h-12 bg-amber/10 rounded-xl flex items-center justify-center mb-6">
                                    <Mail className="w-6 h-6 text-amber" />
                                </div>

                                <h2 className="text-2xl font-serif font-bold text-charcoal mb-3">
                                    Viltu betra skipulag?
                                </h2>
                                <p className="text-stone-600 mb-6 leading-relaxed">
                                    Skráðu þig á póstlistann og fáðu send ráð um hvernig má auka gleðina og minnka ágreining jafnóðum og við birtum þau.
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Netfang</label>
                                        <input
                                            type="email"
                                            required
                                            placeholder="nafn@netfang.is"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber transition-all"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="btn btn-primary w-full py-3"
                                    >
                                        {status === 'loading' ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" /> Skrái...
                                            </span>
                                        ) : 'Skrá mig á listann'}
                                    </button>
                                    <p className="text-xs text-stone-400 text-center">
                                        Enginn ruslpóstur. Bara gagnleg ráð.
                                    </p>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
