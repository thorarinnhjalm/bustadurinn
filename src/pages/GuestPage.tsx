import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Wifi, MapPin, Book, Key, Phone, Loader2, Home } from 'lucide-react';

export default function GuestPage() {
    const { token } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchView = async () => {
            if (!token) return;
            try {
                const docSnap = await getDoc(doc(db, 'guest_views', token));
                if (docSnap.exists()) {
                    setData(docSnap.data());
                } else {
                    setError('Hlekkurinn er útrunninn eða ógildur.');
                }
            } catch (err) {
                console.error(err);
                setError('Villa kom upp. Gakktu úr skugga um að hlekkurinn sé réttur.');
            } finally {
                setLoading(false);
            }
        };
        fetchView();
    }, [token]);

    if (loading) return <div className="flex h-screen items-center justify-center bg-bone"><Loader2 className="animate-spin text-charcoal" /></div>;

    if (error) return (
        <div className="flex h-screen items-center justify-center p-6 text-center bg-bone">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-grey-warm">
                <h2 className="text-xl font-serif mb-2 text-charcoal">Upplýsingar fannst ekki</h2>
                <p className="text-grey-dark">{error}</p>
            </div>
        </div>
    );

    if (!data) return null;

    return (
        <div className="min-h-screen bg-bone pb-12 font-sans text-charcoal">
            {/* Header */}
            <header className="bg-charcoal text-white pt-8 pb-12 px-6 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
                    <Home className="w-48 h-48" />
                </div>
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
                        <Home className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-serif font-medium leading-tight">{data.name}</h1>
                        <p className="text-sm text-white/70 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {data.address}
                        </p>
                    </div>
                </div>
            </header>

            <div className="p-4 container mx-auto max-w-lg space-y-4 -mt-8 relative z-20">

                {/* Check In/Out */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-grey-warm text-center">
                        <div className="text-[10px] text-grey-mid uppercase tracking-widest font-bold mb-1">Innritun</div>
                        <div className="text-2xl font-serif">{data.check_in_time || '16:00'}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-grey-warm text-center">
                        <div className="text-[10px] text-grey-mid uppercase tracking-widest font-bold mb-1">Útritun</div>
                        <div className="text-2xl font-serif">{data.check_out_time || '12:00'}</div>
                    </div>
                </div>

                {/* WiFi */}
                {(data.wifi_ssid || data.wifi_password) && (
                    <div className="bg-charcoal text-white p-6 rounded-xl shadow-lg overflow-hidden relative">
                        <div className="absolute -right-4 -bottom-4 opacity-10 transform rotate-12">
                            <Wifi className="w-32 h-32" />
                        </div>
                        <h3 className="flex items-center gap-2 font-medium text-lg mb-4 text-amber">
                            <Wifi className="w-5 h-5" /> Internet
                        </h3>
                        <div className="space-y-4 relative z-10">
                            <div>
                                <label className="text-xs text-white/50 block mb-1">Net (SSID)</label>
                                <div className="font-mono text-xl">{data.wifi_ssid || '—'}</div>
                            </div>
                            <div>
                                <label className="text-xs text-white/50 block mb-1">Lykilorð</label>
                                <div
                                    className="font-mono text-xl bg-white/10 inline-block px-3 py-1.5 rounded select-all cursor-pointer hover:bg-white/20 transition-colors"
                                    onClick={() => {
                                        navigator.clipboard.writeText(data.wifi_password);
                                        // Simple toast could go here
                                    }}
                                >
                                    {data.wifi_password || '—'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rules */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-grey-warm">
                    <h3 className="flex items-center gap-2 font-medium text-lg mb-4 text-charcoal">
                        <Book className="w-5 h-5 text-amber" /> Húsreglur
                    </h3>
                    <div className="whitespace-pre-wrap text-grey-dark text-sm leading-relaxed">
                        {data.house_rules || 'Engar sérstakar reglur skráðar.'}
                    </div>
                </div>

                {/* Access */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-grey-warm">
                    <h3 className="flex items-center gap-2 font-medium text-lg mb-4 text-charcoal">
                        <Key className="w-5 h-5 text-amber" /> Aðgangur
                    </h3>
                    <div className="whitespace-pre-wrap text-grey-dark text-sm leading-relaxed">
                        {data.access_instructions || 'Engar leiðbeiningar skráðar.'}
                    </div>
                </div>

                {/* Directions */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-grey-warm">
                    <h3 className="flex items-center gap-2 font-medium text-lg mb-4 text-charcoal">
                        <MapPin className="w-5 h-5 text-amber" /> Leiðarlýsing
                    </h3>
                    <div className="whitespace-pre-wrap text-grey-dark text-sm leading-relaxed">
                        {data.directions || 'Engar leiðbeiningar skráðar.'}
                    </div>
                </div>

                {/* Emergency */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200 ring-1 ring-red-100">
                    <h3 className="flex items-center gap-2 font-medium text-lg mb-3 text-red-600">
                        <Phone className="w-5 h-5" /> Neyðarnúmer
                    </h3>
                    <div className="whitespace-pre-wrap text-charcoal font-medium text-lg">
                        {data.emergency_contact || '112'}
                    </div>
                </div>

            </div>

            <div className="text-center mt-12 text-grey-mid text-xs opacity-50 pb-8">
                Bústaðurinn.is — Digital Guestbook
            </div>
        </div>
    );
}
