/**
 * Organization Inquiry Page
 * Companies, unions, and municipalities get in touch about using the platform
 */

import { useId, useState } from 'react';
import { Building2, Mail, Phone, Users, CheckCircle, Send } from 'lucide-react';
import MarketingLayout from '@/components/MarketingLayout';
import SEO from '@/components/SEO';
import { analytics } from '@/utils/analytics';
import { logger } from '@/utils/logger';

export default function OrganizationSignupPage() {
    const uid = useId();
    const fieldId = (name: string) => `${uid}-${name}`;
    const [formData, setFormData] = useState({
        org_name: '',
        contact_name: '',
        email: '',
        phone: '',
        employee_count: '',
        message: '',
        org_type: 'company'
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (status === 'loading') return;
        setStatus('loading');

        try {
            const message = `FYRIRTÆKI/FÉLAG FYRIRSPURN\n\nFélag: ${formData.org_name}\nTegund: ${formData.org_type === 'company' ? 'Fyrirtæki' : formData.org_type === 'union' ? 'Stéttarfélag' : 'Sveitarfélag'}\nTengiliður: ${formData.contact_name}\nNetfang: ${formData.email}\nSími: ${formData.phone || 'Ekki gefið upp'}\nFjöldi starfsmanna: ${formData.employee_count || 'Ekki gefinn upp'}\n\nSkilaboð:\n${formData.message}`;

            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.contact_name,
                    email: formData.email,
                    message
                })
            });

            if (!response.ok) throw new Error('Villa');

            setStatus('success');
            analytics.contactFormSubmitted('organization_inquiry');
        } catch (error) {
            logger.error('Organization inquiry error:', error);
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <MarketingLayout
                title="Takk fyrir fyrirspurnina"
                description="Við höfum samband við þig fljótlega"
            >
                <SEO
                    title="Takk fyrir - Starfsmannafélag"
                    description="Við höfum samband við þig fljótlega"
                />
                <div className="min-h-[60vh] flex items-center justify-center px-6">
                    <div role="status" className="text-center max-w-md">
                        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle aria-hidden="true" className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-serif mb-4">Takk fyrir!</h1>
                        <p className="text-grey-dark text-lg leading-relaxed">
                            Við höfum tekið við fyrirspurninni og munum hafa samband við þig fljótlega varðandi <strong>{formData.org_name}</strong>.
                        </p>
                        <p className="text-grey-mid mt-4 text-sm">
                            Við svörum venjulega innan 1-2 virkra daga.
                        </p>
                    </div>
                </div>
            </MarketingLayout>
        );
    }

    return (
        <MarketingLayout
            title="Starfsmannafélag - Bústaðurinn.is"
            description="Bjóddu starfsmönnum þínum upp á sumarhús. Bústaðurinn.is er alveg ókeypis. Sendu okkur fyrirspurn."
        >
            <SEO
                title="Starfsmannafélag"
                description="Skráðu félag þitt og bjóddu starfsmönnum upp á sumarhús í gegnum Bústaðurinn.is"
                keywords="starfsmannafélag, sumarbústaðir, bókunarkerfi starfsmenn, stéttarfélag sumarhús, fyrirtæki sumarbústaðir ísland"
                structuredData={{
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    "name": "Starfsmannafélag | Bústaðurinn.is",
                    "description": "Bjóddu starfsmönnum þínum upp á sumarhús í gegnum Bústaðurinn.is. Bústaðurinn.is er ókeypis.",
                    "url": "https://www.bustadurinn.is/organizations/signup",
                    "mainEntity": {
                        "@type": "ContactPage",
                        "name": "Fyrirspurn um starfsmannafélag",
                        "description": "Sendu fyrirspurn fyrir starfsmannafélag eða stéttarfélag"
                    },
                    "breadcrumb": {
                        "@type": "BreadcrumbList",
                        "itemListElement": [
                            { "@type": "ListItem", "position": 1, "name": "Forsíða", "item": "https://www.bustadurinn.is" },
                            { "@type": "ListItem", "position": 2, "name": "Starfsmannafélag", "item": "https://www.bustadurinn.is/organizations/signup" }
                        ]
                    }
                }}
            />

            {/* Hero */}
            <div className="bg-charcoal text-bone py-20 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <Building2 aria-hidden="true" className="w-14 h-14 mx-auto mb-6 text-amber opacity-90" />
                    <h1 className="text-4xl md:text-5xl font-serif mb-6 leading-tight">
                        Starfsmannafélag?<br />
                        <span className="text-amber">Við höfum lausnina.</span>
                    </h1>
                    <p className="text-lg text-stone-300 max-w-xl mx-auto leading-relaxed">
                        Gefðu starfsmönnum þínum aðgang að sumarhúsum í gegnum einfalt og öruggt kerfi. Kerfið er ókeypis og við aðstoðum þig við að koma félaginu af stað.
                    </p>
                </div>
            </div>

            {/* Benefits */}
            <div className="bg-bone py-16 px-6">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {[
                        { icon: Users, title: 'Stjórnun', desc: 'Þú stjórnar hverjir fá aðgang og á hvaða kjörum' },
                        { icon: Building2, title: 'Sérprentun', desc: 'Merktin upplifun með logo og litum félagsins' },
                        { icon: CheckCircle, title: 'Samþykki', desc: 'Þú samþykkir bókanir og setur mörk á náttúr og tímabil' },
                    ].map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="text-center">
                            <div className="w-12 h-12 rounded-full bg-charcoal/10 flex items-center justify-center mx-auto mb-4">
                                <Icon aria-hidden="true" className="w-6 h-6 text-charcoal" />
                            </div>
                            <h2 className="text-3xl font-bold text-charcoal mb-2">{title}</h2>
                            <p className="text-grey-dark text-sm leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>

                {/* Form */}
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 md:p-10">
                        <h2 className="text-2xl font-serif mb-2">Hafðu samband</h2>
                        <p className="text-grey-dark mb-8">Fylltu út og við höfum samband innan 1-2 virkra daga.</p>

                        <div role="alert">
                            {status === 'error' && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">
                                    Eitthvað fór úrskeiðis. Vinsamlegast reyndu aftur eða sendu okkur tölvupóst.
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5" aria-busy={status === 'loading'}>
                            <p className="text-sm text-grey-dark">
                                Reitir merktir með <span aria-hidden="true">*</span><span className="sr-only">stjörnu</span> eru nauðsynlegir.
                            </p>
                            {/* Org Type */}
                            <div>
                                <label htmlFor={fieldId('type')} className="block text-sm font-medium text-charcoal mb-2">Tegund</label>
                                <select
                                    id={fieldId('type')}
                                    value={formData.org_type}
                                    onChange={(e) => setFormData({ ...formData, org_type: e.target.value })}
                                    className="input w-full"
                                >
                                    <option value="company">Fyrirtæki / Starfsmannafélag</option>
                                    <option value="union">Stéttarfélag</option>
                                    <option value="municipality">Sveitarfélag</option>
                                </select>
                            </div>

                            {/* Org Name */}
                            <div>
                                <label htmlFor={fieldId('org')} className="block text-sm font-medium text-charcoal mb-2">
                                    Nafn félags eða fyrirtækis <span aria-hidden="true" className="text-red-700">*</span>
                                </label>
                                <div className="relative">
                                    <Building2 aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grey-mid" />
                                    <input
                                        id={fieldId('org')}
                                        type="text"
                                        autoComplete="organization"
                                        value={formData.org_name}
                                        onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
                                        className="input w-full pl-10"
                                        placeholder="t.d. Íslandsbanki"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Contact Name */}
                                <div>
                                    <label htmlFor={fieldId('contact')} className="block text-sm font-medium text-charcoal mb-2">
                                        Tengiliður <span aria-hidden="true" className="text-red-700">*</span>
                                    </label>
                                    <input
                                        id={fieldId('contact')}
                                        type="text"
                                        autoComplete="name"
                                        value={formData.contact_name}
                                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                        className="input w-full"
                                        placeholder="Nafn þitt"
                                        required
                                    />
                                </div>

                                {/* Employee Count */}
                                <div>
                                    <label htmlFor={fieldId('count')} className="block text-sm font-medium text-charcoal mb-2">
                                        Fjöldi starfsmanna
                                    </label>
                                    <div className="relative">
                                        <Users aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grey-mid" />
                                        <input
                                            id={fieldId('count')}
                                            type="text"
                                            inputMode="numeric"
                                            value={formData.employee_count}
                                            onChange={(e) => setFormData({ ...formData, employee_count: e.target.value })}
                                            className="input w-full pl-10"
                                            placeholder="t.d. 150"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Email */}
                                <div>
                                    <label htmlFor={fieldId('email')} className="block text-sm font-medium text-charcoal mb-2">
                                        Netfang <span aria-hidden="true" className="text-red-700">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grey-mid" />
                                        <input
                                            id={fieldId('email')}
                                            type="email"
                                            autoComplete="email"
                                            inputMode="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="input w-full pl-10"
                                            placeholder="netfang@felag.is"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label htmlFor={fieldId('phone')} className="block text-sm font-medium text-charcoal mb-2">Símanúmer</label>
                                    <div className="relative">
                                        <Phone aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grey-mid" />
                                        <input
                                            id={fieldId('phone')}
                                            type="tel"
                                            autoComplete="tel"
                                            inputMode="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="input w-full pl-10"
                                            placeholder="555-1234"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Message */}
                            <div>
                                <label htmlFor={fieldId('message')} className="block text-sm font-medium text-charcoal mb-2">
                                    Hvað er á huganum? <span className="text-grey-mid font-normal">(valfrjálst)</span>
                                </label>
                                <textarea
                                    id={fieldId('message')}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="input w-full resize-none"
                                    rows={4}
                                    placeholder="T.d. fjöldi sumarbústaða sem þið eigið, hvernig bókunarkerfi þið notið núna..."
                                />
                            </div>

                            <button
                                type="submit"
                                aria-busy={status === 'loading'}
                                className="btn btn-primary w-full flex items-center justify-center gap-2 py-3"
                            >
                                {status === 'loading' ? (
                                    <>
                                        <span role="status">
                                            <span aria-hidden="true" className="block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                            <span className="sr-only">Hleð…</span>
                                        </span>
                                        Sendi...
                                    </>
                                ) : (
                                    <>
                                        <Send aria-hidden="true" className="w-4 h-4" />
                                        Senda fyrirspurn
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-grey-mid text-center">
                                Við svörum alltaf innan 1-2 virkra daga. Kerfið er ókeypis.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </MarketingLayout>
    );
}
