import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MarketingLayout from '@/components/MarketingLayout';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Check, Star, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

export default function ForProvidersPage() {
    const navigate = useNavigate();
    const { currentUser } = useAppStore();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        category: 'snow_removal',
        service_areas: '', // Comma separated
        contact_email: '',
        contact_phone: '',
        website: '',
        description: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Parse service areas
            const areas = formData.service_areas.split(',').map(s => s.trim()).filter(Boolean);

            await addDoc(collection(db, 'service_providers'), {
                ...formData,
                service_areas: areas,
                status: 'active', // Open registration
                rating_avg: 0,
                rating_count: 0,
                created_at: serverTimestamp(),
                owner_uid: currentUser?.uid || null, // Link to user if logged in
            });

            setSuccess(true);
            // Optional: navigate to the marketplace itself after a delay?
        } catch (error) {
            console.error('Error registering provider:', error);
            alert('Villa kom upp við skráningu. Vinsamlegast reyndu aftur.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MarketingLayout>
            {/* Hero Section */}
            <section className="relative py-20 bg-charcoal text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20"></div>
                <div className="relative max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber/20 text-amber text-sm font-medium mb-6">
                            <Star className="w-4 h-4" />
                            <span>Fyrir verktaka og þjónustuaðila</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight text-white">
                            Fáðu fleiri verkefni í sumarhúsum
                        </h1>
                        <p className="text-lg text-stone-200 mb-8 leading-relaxed">
                            Torgið tengir þig beint við eigendur sumarhúsa á þínu þjónustosvæði.
                            Skráðu þig frítt og vertu sýnilegur þegar vantar snjómokstur, þrif, pípulagnir eða viðhald.
                        </p>
                        <ul className="space-y-4 mb-8">
                            {[
                                'Beinn aðgangur að hundruðum sumarhúsa',
                                'Sýnileiki á þínu svæði (t.d. Grímsnesi)',
                                'Engin milliliðagjöld - beint samband',
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-stone-300">
                                    <div className="p-1 rounded-full bg-green-500/20 text-green-400">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Registration Section */}
            <section id="register" className="py-20 bg-bone">
                <div className="max-w-3xl mx-auto px-6">
                    <div className="card bg-white shadow-xl p-8 md:p-12">
                        {success ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Check className="w-8 h-8" />
                                </div>
                                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">Skráning tókst!</h2>
                                <p className="text-grey-mid mb-8 max-w-md mx-auto">
                                    Takk fyrir að skrá þig. Þú ert nú sýnilegur á Torginu.
                                    Við mælum með að þú farir og skoðir skráninguna þína.
                                </p>
                                <button
                                    onClick={() => navigate('/thjonusta')}
                                    className="btn btn-primary"
                                >
                                    Fara á Torgið
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="text-center mb-10">
                                    <h2 className="text-3xl font-serif font-bold text-charcoal mb-4">Skráðu þjónustu þína</h2>
                                    <p className="text-grey-mid">Fylltu út formið hér að neðan. Það tekur innan við 2 mínútur.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-charcoal">Nafn fyrirtækis / Verktaka</label>
                                            <input
                                                type="text"
                                                required
                                                className="input w-full"
                                                placeholder="t.d. Snjómokstur Suðurlands"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-charcoal">Flokkur</label>
                                            <select
                                                className="input w-full"
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            >
                                                <option value="snow_removal">Snjómokstur</option>
                                                <option value="cleaning">Þrif & Umsjón</option>
                                                <option value="maintenance">Viðhald & Smíðar</option>
                                                <option value="plumbing">Pípulagnir</option>
                                                <option value="electrician">Rafvirki</option>
                                                <option value="hot_tub">Heitapottar</option>
                                                <option value="other">Annað</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-charcoal">Þjónustusvæði (aðskildu með kommu)</label>
                                        <input
                                            type="text"
                                            required
                                            className="input w-full"
                                            placeholder="t.d. Grímsnes, Bláskógabyggð, Skorradalur"
                                            value={formData.service_areas}
                                            onChange={e => setFormData({ ...formData, service_areas: e.target.value })}
                                        />
                                        <p className="text-xs text-grey-mid">Þetta hjálpar eigendum að finna þig eftir staðsetningu.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-charcoal">Lýsing á þjónustu</label>
                                        <textarea
                                            required
                                            rows={4}
                                            className="input w-full"
                                            placeholder="Lýstu þjónustunni þinni stuttlega..."
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-charcoal">Netfang</label>
                                            <input
                                                type="email"
                                                required
                                                className="input w-full"
                                                value={formData.contact_email}
                                                onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-charcoal">Símanúmer</label>
                                            <input
                                                type="tel"
                                                required
                                                className="input w-full"
                                                value={formData.contact_phone}
                                                onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-charcoal">Vefsíða (valfrjálst)</label>
                                        <input
                                            type="url"
                                            className="input w-full"
                                            placeholder="https://..."
                                            value={formData.website}
                                            onChange={e => setFormData({ ...formData, website: e.target.value })}
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="btn btn-primary w-full py-4 text-lg shadow-lg hover:translate-y-[-2px] transition-all"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                            ) : (
                                                'Skrá mig frítt á Torgið'
                                            )}
                                        </button>
                                        <p className="text-center text-xs text-grey-mid mt-4">
                                            Með því að skrá þig samþykkir þú að upplýsingarnar séu sýnilegar notendum Bústaðurinn.is
                                        </p>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
