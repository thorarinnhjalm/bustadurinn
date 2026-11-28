import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import MarketingLayout from '@/components/MarketingLayout';
import { db } from '@/lib/firebase';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Check, Star, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { logger } from '@/utils/logger';


export default function ForProvidersPage() {
    const { currentUser } = useAppStore();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formError, setFormError] = useState('');
    const uid = useId();
    const fieldId = (name: string) => `${uid}-${name}`;

    const [formData, setFormData] = useState({
        name: '',
        category: 'snow_removal',
        service_areas: '', // Comma separated
        contact_email: '',
        contact_phone: '',
        website: '',
        description: '',
        address: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setFormError('');
        setLoading(true);

        try {
            // Parse service areas
            const areas = formData.service_areas.split(',').map(s => s.trim()).filter(Boolean);

            // Keep in sync with the limits in firestore.rules (service_providers create).
            if (
                formData.name.length > 100 || formData.description.length > 2000 ||
                formData.contact_email.length > 200 || formData.contact_phone.length > 50 ||
                formData.website.length > 300 || formData.address.length > 300 ||
                areas.length > 20 || areas.some(a => a.length > 100)
            ) {
                setFormError('Einn eða fleiri reitir eru of langir. Vinsamlegast styttu textann og reyndu aftur.');
                return;
            }

            // Contact details go to service_provider_contacts (signed-in readers only);
            // both docs are written in one batch under a client-generated id.
            const { contact_email, contact_phone, address, ...publicFields } = formData;
            const owner_uid = currentUser?.uid || null; // Link to user if logged in
            const providerRef = doc(collection(db, 'service_providers'));
            const batch = writeBatch(db);
            batch.set(providerRef, {
                ...publicFields,
                service_areas: areas,
                status: 'pending', // Applications are reviewed by an admin before they appear on Torgið
                rating_avg: 0,
                rating_count: 0,
                created_at: serverTimestamp(),
                owner_uid,
            });
            batch.set(doc(db, 'service_provider_contacts', providerRef.id), {
                contact_email,
                contact_phone,
                address,
                owner_uid,
            });
            await batch.commit();

            setSuccess(true);
        } catch (error) {
            logger.error('Error registering provider:', error);
            setFormError('Villa kom upp við skráningu. Vinsamlegast reyndu aftur.');
        } finally {
            setLoading(false);
        }
    };

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Verktakar og Þjónusta fyrir Sumarhús",
        "description": "Skráðu þig frítt og fáðu fleiri verkefni í sumarhúsum. Snjómokstur, pípulagnir, smíðavinna og fleira.",
        "url": "https://www.bustadurinn.is/verktakar",
        "audience": {
            "@type": "BusinessAudience",
            "audienceType": "Contractors, Service Providers"
        }
    };

    return (
        <MarketingLayout
            title="Verktakar og Þjónusta fyrir Sumarhús | Skráðu þig frítt"
            description="Ertu verktaki eða þjónustuaðili? Skráðu þig frítt á Bústaðurinn.is og fáðu verkefni í sumarhúsum. Snjómokstur, pípulagnir, smíðavinna og fleira."
            keywords="verktakar, sumarhús, snjómokstur, pípulagnir, smíðavinna, þjónusta, verktakaskráning, iðnaðarmenn"
            canonical="https://www.bustadurinn.is/verktakar"
            structuredData={jsonLd}
        >
            {/* Hero Section */}
            <section className="relative py-20 bg-charcoal text-white overflow-hidden">
                <div aria-hidden="true" className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20"></div>
                <div className="relative max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber/20 text-amber text-sm font-medium mb-6">
                            <Star aria-hidden="true" className="w-4 h-4" />
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
                                        <Check aria-hidden="true" className="w-4 h-4" />
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
                            <div role="status" className="text-center py-12">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Check aria-hidden="true" className="w-8 h-8" />
                                </div>
                                <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">Umsókn móttekin!</h2>
                                <p className="text-grey-mid mb-8 max-w-md mx-auto">
                                    Takk fyrir að skrá þig. Við förum yfir umsóknina og þú birtist á Torginu
                                    um leið og hún hefur verið samþykkt.
                                </p>
                                <Link
                                    to="/torgid"
                                    className="btn btn-primary"
                                >
                                    Skoða Torgið
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="text-center mb-10">
                                    <h2 className="text-3xl font-serif font-bold text-charcoal mb-4">Skráðu þjónustu þína</h2>
                                    <p className="text-grey-mid">Fylltu út formið hér að neðan. Það tekur innan við 2 mínútur.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6" aria-busy={loading}>
                                    <p className="text-sm text-grey-mid">Reitir merktir með <span aria-hidden="true">*</span><span className="sr-only">stjörnu</span> eru nauðsynlegir.</p>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label htmlFor={fieldId('name')} className="text-sm font-medium text-charcoal">Nafn fyrirtækis / Verktaka <span aria-hidden="true">*</span></label>
                                            <input
                                                id={fieldId('name')}
                                                type="text"
                                                autoComplete="organization"
                                                required
                                                className="input w-full"
                                                placeholder="t.d. Snjómokstur Suðurlands"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor={fieldId('category')} className="text-sm font-medium text-charcoal">Flokkur</label>
                                            <select
                                                id={fieldId('category')}
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
                                        <label htmlFor={fieldId('areas')} className="text-sm font-medium text-charcoal">Þjónustusvæði (aðskildu með kommu) <span aria-hidden="true">*</span></label>
                                        <input
                                            id={fieldId('areas')}
                                            aria-describedby={fieldId('areas-hint')}
                                            type="text"
                                            required
                                            className="input w-full"
                                            placeholder="t.d. Grímsnes, Bláskógabyggð, Skorradalur"
                                            value={formData.service_areas}
                                            onChange={e => setFormData({ ...formData, service_areas: e.target.value })}
                                        />
                                        <p id={fieldId('areas-hint')} className="text-xs text-grey-mid">Þetta hjálpar eigendum að finna þig eftir staðsetningu.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor={fieldId('description')} className="text-sm font-medium text-charcoal">Lýsing á þjónustu <span aria-hidden="true">*</span></label>
                                        <textarea
                                            id={fieldId('description')}
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
                                            <label htmlFor={fieldId('email')} className="text-sm font-medium text-charcoal">Netfang <span aria-hidden="true">*</span></label>
                                            <input
                                                id={fieldId('email')}
                                                type="email"
                                                autoComplete="email"
                                                inputMode="email"
                                                required
                                                className="input w-full"
                                                value={formData.contact_email}
                                                onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor={fieldId('phone')} className="text-sm font-medium text-charcoal">Símanúmer <span aria-hidden="true">*</span></label>
                                            <input
                                                id={fieldId('phone')}
                                                type="tel"
                                                autoComplete="tel"
                                                inputMode="tel"
                                                required
                                                className="input w-full"
                                                value={formData.contact_phone}
                                                onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor={fieldId('website')} className="text-sm font-medium text-charcoal">Vefsíða (valfrjálst)</label>
                                        <input
                                            id={fieldId('website')}
                                            type="url"
                                            autoComplete="url"
                                            inputMode="url"
                                            className="input w-full"
                                            placeholder="https://..."
                                            value={formData.website}
                                            onChange={e => setFormData({ ...formData, website: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor={fieldId('address')} className="text-sm font-medium text-charcoal">Heimilisfang / Aðsetur <span aria-hidden="true">*</span></label>
                                        <input
                                            id={fieldId('address')}
                                            type="text"
                                            autoComplete="street-address"
                                            required
                                            className="input w-full"
                                            placeholder="t.d. Smiðjuvegur 1, Kópavogur"
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <div role="alert">
                                            {formError && <p className="text-sm text-red-700 mb-4 text-center">{formError}</p>}
                                        </div>
                                        <button
                                            type="submit"
                                            aria-busy={loading}
                                            className="btn btn-primary w-full py-4 text-lg shadow-lg motion-safe:hover:translate-y-[-2px] transition-all"
                                        >
                                            {loading ? (
                                                <span role="status">
                                                    <Loader2 aria-hidden="true" className="w-6 h-6 animate-spin mx-auto" />
                                                    <span className="sr-only">Hleð…</span>
                                                </span>
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
