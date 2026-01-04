import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircle, ArrowRight, Loader2, Mail } from 'lucide-react';

interface NewsletterSignupProps {
    variant?: 'compact' | 'full';
}

export default function NewsletterSignup({ variant = 'full' }: NewsletterSignupProps) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        setError('');

        try {
            // Save to Firestore directly
            // Public users don't have read access to check if exists, so we just add
            await addDoc(collection(db, 'newsletter_subscribers'), {
                email: email.toLowerCase().trim(),
                created_at: serverTimestamp(),
                source: window.location.pathname,
                status: 'active'
            });

            setStatus('success');
            setEmail('');
        } catch (err: any) {
            console.error('Newsletter Error:', err);
            setError('Eitthvað fór úrskeiðis. Vinsamlegast reyndu aftur.');
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                <h4 className="text-xl font-bold text-charcoal mb-2">Takk fyrir!</h4>
                <p className="text-stone-500">Við höfum móttekið skráninguna þína.</p>
            </div>
        );
    }

    if (variant === 'compact') {
        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group">
                    <input
                        type="email"
                        required
                        placeholder="Netfangið þitt"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber/50 focus:bg-white/15 transition-all duration-300"
                    />
                    <button
                        disabled={status === 'loading'}
                        className="absolute right-2 top-2 p-2 bg-amber text-charcoal rounded-lg hover:bg-amber-dark transition-all duration-300 disabled:opacity-50 shadow-lg active:scale-95"
                        aria-label="Skrá mig"
                    >
                        {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                    </button>
                </div>
                {error && <p className="text-red-300 text-xs font-medium animate-shake text-center">{error}</p>}
                <p className="text-[10px] text-stone-300 text-center opacity-70 tracking-wide font-medium">
                    Enginn ruslpóstur. Hægt er að afskrá sig hvenær sem er.
                </p>
            </form>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl border border-stone-100 max-w-2xl mx-auto overflow-hidden relative group">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-amber/5 rounded-full blur-2xl group-hover:bg-amber/10 transition-colors"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="w-16 h-16 bg-amber/10 rounded-2xl flex items-center justify-center shrink-0">
                    <Mail className="w-8 h-8 text-amber" />
                </div>

                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-serif font-bold mb-2">Fróðleikur og ráð í póstinn</h3>
                    <p className="text-stone-500 mb-6">
                        Fáðu hagnýt ráð um rekstur sumarhúsa og tilkynningar þegar við bætum við nýjum eiginleikum.
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="email"
                            required
                            placeholder="Netfangið þitt"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input flex-1"
                        />
                        <button
                            disabled={status === 'loading'}
                            className="btn btn-primary whitespace-nowrap px-8"
                        >
                            {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                            Skrá mig
                        </button>
                    </form>
                    {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
                </div>
            </div>
        </div>
    );
}
