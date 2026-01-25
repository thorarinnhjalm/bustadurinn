import MarketingLayout from '@/components/MarketingLayout';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, TrendingUp, CheckSquare, Home, ArrowRight, ChevronRight } from 'lucide-react';

export default function HandbokPage() {
    const navigate = useNavigate();

    const sections = [
        {
            id: 'bokunarkerfi',
            icon: Calendar,
            title: 'Bókunarkerfi fyrir sameignarhús',
            color: 'amber',
            description: 'Lærðu hvernig þú getur skipulagt bókanir sanngjarnt og forðast tvöfaldar bókanir. Við förum yfir sanngirnisreglur og best practices.',
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
            description: 'Haltu utan um viðhald yfir árið. Verkefnalisti, seasonal checklist og pro tips fyrir eigendur.',
            path: '/handbok/vidhald'
        },
        {
            id: 'uppsetning',
            icon: BookOpen,
            title: 'Hvernig á að setja upp kerfið',
            color: 'purple',
            description: 'Step-by-step leiðarvísir um hvernig þú setur upp Bústaðinn.is á innan við 5 mínútum.',
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
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => navigate(section.path)}
                                    className="group bg-white border-2 border-stone-200 hover:border-amber hover:shadow-lg rounded-xl p-8 text-left transition-all duration-300"
                                >
                                    <div className={`w-14 h-14 rounded-full bg-${section.color}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <Icon className={`w-7 h-7 text-${section.color}`} />
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
                            <div className="text-4xl mb-4">🎯</div>
                            <h3 className="font-bold text-lg mb-2">Skýrt skipulag</h3>
                            <p className="text-sm text-grey-dark">
                                Forðastu misskilning og ágreining með skýrum reglum og kerfum.
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <div className="text-4xl mb-4">💰</div>
                            <h3 className="font-bold text-lg mb-2">Gagnsæi</h3>
                            <p className="text-sm text-grey-dark">
                                Allir sjá sömu upplýsingar um fjármál, bókanir og verkefni.
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <div className="text-4xl mb-4">⏰</div>
                            <h3 className="font-bold text-lg mb-2">Tímasparnaður</h3>
                            <p className="text-sm text-grey-dark">
                                Sjálfvirkt kerfi í stað handvirkrar vinnu í Excel og WhatsApp.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-charcoal text-white py-20">
                <div className="container max-w-4xl mx-auto px-6 text-center">
                    <Home className="w-16 h-16 text-amber mx-auto mb-6" />
                    <h2 className="text-4xl font-serif font-bold mb-6">Tilbúinn að prófa?</h2>
                    <p className="text-xl text-stone-300 mb-8 max-w-2xl mx-auto">
                        Settu upp húsið þitt á 5 mínútum. 30 daga prufa án skuldbindinga.
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
