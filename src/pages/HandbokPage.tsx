import MarketingLayout from '@/components/MarketingLayout';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, TrendingUp, CheckSquare, Home, ArrowRight, ChevronRight } from 'lucide-react';

// Tailwind's JIT compiler only picks up class names it can find literally in
// source — `bg-${section.color}/10` is invisible to it and gets purged from
// the production build, silently dropping the icon background/text colors.
// A static map keeps every class name spelled out so it survives the build.
const SECTION_COLOR_CLASSES: Record<string, { bg: string; text: string }> = {
    amber: { bg: 'bg-amber/10', text: 'text-amber' },
    emerald: { bg: 'bg-emerald-600/10', text: 'text-emerald-600' },
    blue: { bg: 'bg-blue-600/10', text: 'text-blue-600' },
    purple: { bg: 'bg-purple-600/10', text: 'text-purple-600' },
};

export default function HandbokPage() {
    const navigate = useNavigate();

    const sections = [
        {
            id: 'bokunarkerfi',
            icon: Calendar,
            title: 'Bókunarkerfi fyrir sameignarhús',
            color: 'amber',
            description: 'Lærðu hvernig þú getur skipulagt bókanir sanngjarnt og fengið viðvörun ef bókanir skarast. Við förum yfir sanngirnisreglur og góðar venjur.',
            path: '/handbok/bokunarkerfi'
        },
        {
            id: 'fjarmal',
            icon: TrendingUp,
            title: 'Fjárhaldslausnir',
            color: 'emerald',
            description: 'Hvað er hússjóður? Hvernig á að skipta kostnaði? Allt sem þú þarft að vita um fjármálastjórnun í sameignarhúsum.',
            path: '/handbok/fjarmal'
        },
        {
            id: 'vidhald',
            icon: CheckSquare,
            title: 'Viðhald og verkefnastjórnun',
            color: 'blue',
            description: 'Haltu utan um viðhald yfir árið. Verkefnalisti, árstíðabundinn gátlisti og góð ráð fyrir eigendur.',
            path: '/handbok/vidhald'
        },
        {
            id: 'uppsetning',
            icon: BookOpen,
            title: 'Hvernig á að setja upp kerfið',
            color: 'purple',
            description: 'Skref-fyrir-skref leiðarvísir um hvernig þú setur upp Bústaðinn.is á innan við 5 mínútum.',
            path: '/handbok/uppsetning'
        }
    ];

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": sections.map((section, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "HowTo",
                "name": section.title,
                "description": section.description,
                "url": `https://www.bustadurinn.is${section.path}`
            }
        }))
    };

    return (
        <MarketingLayout
            title="Handbók fyrir sameignarhús - Bústaðurinn.is"
            description="Ítarleg handbók um hvernig á að stjórna sameignarhúsi. Lærðu um bókunarkerfi, fjárhaldslausnir, viðhald og skipulag."
            keywords="sameignarhús handbók, sumarhús handbók, bókunarkerfi, fjárhaldslausnir, viðhald sumarhús"
            structuredData={structuredData}
            canonical="https://www.bustadurinn.is/handbok"
        >
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-amber/5 via-white to-stone-50 py-24 border-b border-stone-100">
                <div className="container max-w-5xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-amber/20 text-amber-900 px-4 py-2 rounded-full text-sm font-bold mb-6">
                            <BookOpen className="w-4 h-4" />
                            <span>Handbók fyrir eigendur</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 leading-tight">
                            Allt sem þú þarft að vita um <span className="text-amber">sameignarhús</span>
                        </h1>
                        <p className="text-xl text-grey-dark max-w-3xl mx-auto leading-relaxed">
                            Ítarleg handbók um hvernig á að skipuleggja, stjórna og njóta sameignarhúss.
                            Frá bókunarkerfum til fjárhalds — við förum yfir allt.
                        </p>
                    </div>
                </div>
            </section>

            {/* Table of Contents */}
            <section className="py-20 bg-white">
                <div className="container max-w-4xl mx-auto px-6">
                    <h2 className="text-3xl font-serif font-bold mb-12 text-center">Efnisyfirlit</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {sections.map((section) => {
                            const Icon = section.icon;
                            const colorClasses = SECTION_COLOR_CLASSES[section.color] ?? SECTION_COLOR_CLASSES.amber;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => navigate(section.path)}
                                    className="group bg-white border-2 border-stone-200 hover:border-amber hover:shadow-lg rounded-xl p-8 text-left transition-all duration-300"
                                >
                                    <div className={`w-14 h-14 rounded-full ${colorClasses.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <Icon className={`w-7 h-7 ${colorClasses.text}`} />
                                    </div>
                                    <h3 className="text-xl font-serif font-bold mb-3 group-hover:text-amber transition-colors">
                                        {section.title}
                                    </h3>
                                    <p className="text-grey-dark leading-relaxed mb-4">
                                        {section.description}
                                    </p>
                                    <div className="flex items-center gap-2 text-amber font-medium">
                                        <span>Lesa meira</span>
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Why Guide Section */}
            <section className="py-20 bg-stone-50">
                <div className="container max-w-4xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-serif font-bold mb-4">Af hverju þarftu handbók?</h2>
                        <p className="text-xl text-grey-dark max-w-2xl mx-auto leading-relaxed">
                            Að eiga sumarhús saman með fjölskyldu eða vinum getur verið stórkostlegt —
                            ef skipulagið er rétt.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <svg className="w-12 h-12 text-amber mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="font-bold text-lg mb-2">Skýrt skipulag</h3>
                            <p className="text-sm text-grey-dark">
                                Forðastu misskilning og ágreining með skýrum reglum og kerfum.
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <svg className="w-12 h-12 text-emerald-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <h3 className="font-bold text-lg mb-2">Gagnsæi</h3>
                            <p className="text-sm text-grey-dark">
                                Allir sjá sömu upplýsingar um fjármál, bókanir og verkefni.
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <svg className="w-12 h-12 text-blue-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="font-bold text-lg mb-2">Tímasparnaður</h3>
                            <p className="text-sm text-grey-dark">
                                Sjálfvirkt kerfi í stað handvirkrar vinnu í Excel og WhatsApp.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Common Mistakes Section - SEO */}
            <section className="py-20 bg-white border-t border-stone-100">
                <div className="container max-w-4xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-serif font-bold mb-4">Algeng mistök í sameignarhúsum</h2>
                        <p className="text-xl text-grey-dark max-w-2xl mx-auto">
                            Lærðu af reynslu annarra og forðastu þessi algengu mistök
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl">
                            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Engar skýrar reglur frá byrjun
                            </h3>
                            <p className="text-grey-dark leading-relaxed">
                                Margir byrja án þess að setja niður skýrar reglur um bókanir, fjármál og ábyrgð. Þetta leiðir oft til misskilnings og deilna.
                                <strong className="text-charcoal"> Lausn:</strong> Notaðu <button onClick={() => navigate('/handbok/uppsetning')} className="text-amber hover:underline">uppsetningarleiðbeiningar</button> til að byrja rétt.
                            </p>
                        </div>

                        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl">
                            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Ekki halda utan um reikninga og kvittanir
                            </h3>
                            <p className="text-grey-dark leading-relaxed">
                                Excel töflur týnast, kvittanir gleymast og enginn veit hvað hefur raunverulega verið keypt.
                                <strong className="text-charcoal"> Lausn:</strong> Notaðu <button onClick={() => navigate('/handbok/fjarmal')} className="text-amber hover:underline">hússjóð með sjálfvirku bókhaldi</button>.
                            </p>
                        </div>

                        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl">
                            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Ekki skipuleggja viðhald
                            </h3>
                            <p className="text-grey-dark leading-relaxed">
                                Húsið fer að eyðileggjast þegar enginn tekur ábyrgð á viðhaldi. Grasflöt vex yfir, málning flagnast og smáviðgerðir verða að stórum kostnaði.
                                <strong className="text-charcoal"> Lausn:</strong> Settu upp <button onClick={() => navigate('/handbok/vidhald')} className="text-amber hover:underline">verkefnalista með árstíðabundnum gátlista</button>.
                            </p>
                        </div>

                        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl">
                            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Óréttlát skipting helgidaga
                            </h3>
                            <p className="text-grey-dark leading-relaxed">
                                Sami eigandi fær alltaf jólin, páskan og verslunarmannahelgina. Aðrir eigendur verða óánægðir.
                                <strong className="text-charcoal"> Lausn:</strong> Notaðu <button onClick={() => navigate('/handbok/bokunarkerfi')} className="text-amber hover:underline">sanngirnisreglu</button> sem tryggir sanngjarnt jafnræði.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Best Practices Section - SEO */}
            <section className="py-20 bg-gradient-to-br from-green-50 to-white border-t border-stone-100">
                <div className="container max-w-4xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-serif font-bold mb-4">Góðar venjur fyrir sameignarhús</h2>
                        <p className="text-xl text-grey-dark max-w-2xl mx-auto">
                            Prófaðar leiðir til að tryggja ánægjulega samveru
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl border-2 border-green-200 shadow-sm">
                            <svg className="w-10 h-10 text-green-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="font-bold text-lg mb-2">Búðu til húsreglur strax</h3>
                            <p className="text-sm text-grey-dark leading-relaxed">
                                Settu niður skýrar reglur um bókanir, þrif, reykingar og gæludýr. Láttu alla lesa og samþykkja.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl border-2 border-green-200 shadow-sm">
                            <svg className="w-10 h-10 text-green-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h3 className="font-bold text-lg mb-2">Haldið reglulega fundi</h3>
                            <p className="text-sm text-grey-dark leading-relaxed">
                                Mættu 1-2x á ári (t.d. byrjun sumars og haustsins) til að fara yfir fjárhag, verkefni og breyta reglum ef þörf er.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl border-2 border-green-200 shadow-sm">
                            <svg className="w-10 h-10 text-green-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <h3 className="font-bold text-lg mb-2">Gerðu fjárhagsáætlun</h3>
                            <p className="text-sm text-grey-dark leading-relaxed">
                                Gerið rekstraráætlun í byrjun árs og áætlið útgjöld. Þannig veit allir hvað þeir þurfa að borga.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl border-2 border-green-200 shadow-sm">
                            <svg className="w-10 h-10 text-green-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <h3 className="font-bold text-lg mb-2">Skýr ábyrgðarskipting</h3>
                            <p className="text-sm text-grey-dark leading-relaxed">
                                Veljið einn sem er ábyrgur fyrir fjármálum, annar fyrir viðhaldi osfrv. Snúningskerfi virkar vel.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl border-2 border-green-200 shadow-sm">
                            <svg className="w-10 h-10 text-green-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            <h3 className="font-bold text-lg mb-2">Góð samskipti</h3>
                            <p className="text-sm text-grey-dark leading-relaxed">
                                Notið sameiginlegt kerfi til samskipta í stað WhatsApp keðja sem týnast. Allar upplýsingar á einum stað.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl border-2 border-green-200 shadow-sm">
                            <svg className="w-10 h-10 text-green-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="font-bold text-lg mb-2">Samningur í upphafi</h3>
                            <p className="text-sm text-grey-dark leading-relaxed">
                                Gerið skriflegan samning um eignarhlutfall, réttindi, skyldur og hvað gerist ef einhver vill selja.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Cross-link to FAQ */}
            <section className="py-16 bg-white border-t border-stone-200">
                <div className="container max-w-5xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-serif font-bold mb-4">Hefurðu fleiri spurningar?</h2>
                    <p className="text-xl text-grey-dark mb-8 max-w-2xl mx-auto">
                        Skoðaðu algengar spurningar og svör um Bústaðinn.is
                    </p>
                    <button
                        onClick={() => navigate('/spurt-og-svarad')}
                        className="inline-flex items-center gap-2 text-amber hover:text-amber-600 font-bold text-lg transition-colors"
                    >
                        Spurt og svarað
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-charcoal text-white py-20"
            >
                <div className="container max-w-4xl mx-auto px-6 text-center">
                    <Home className="w-16 h-16 text-amber mx-auto mb-6" />
                    <h2 className="text-4xl font-serif font-bold mb-6">Tilbúinn að prófa?</h2>
                    <p className="text-xl text-stone-300 mb-8 max-w-2xl mx-auto">
                        Settu upp húsið þitt á 5 mínútum. Ókeypis og opið öllum.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/signup')}
                            className="btn btn-primary bg-amber text-charcoal hover:bg-amber/90 px-8 py-4 text-lg flex items-center justify-center gap-2"
                        >
                            Byrja núna
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => navigate('/eiginleikar')}
                            className="btn btn-ghost border-2 border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg"
                        >
                            Skoða eiginleika
                        </button>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
