import MarketingLayout from '@/components/MarketingLayout';
import { useNavigate, Link } from 'react-router-dom';
import { CheckSquare, ChevronLeft, ArrowRight } from 'lucide-react';

export default function VidhaldPage() {
    const navigate = useNavigate();

    // Explanatory content about task/maintenance features (task lifecycle,
    // seasonal checklists) — not literal Q&A and not a single procedure the
    // reader performs step-by-step, so marked up as WebPage.
    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebPage",
                "name": "Viðhald og verkefnastjórnun",
                "description": "Hvernig á að halda utan um viðhald og verkefni í sumarhúsi. Verkefnalisti, árstíðabundinn gátlisti og skipulag fyrir eigendur.",
                "url": "https://www.bustadurinn.is/handbok/vidhald"
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Heim", "item": "https://www.bustadurinn.is/" },
                    { "@type": "ListItem", "position": 2, "name": "Handbók", "item": "https://www.bustadurinn.is/handbok" },
                    { "@type": "ListItem", "position": 3, "name": "Viðhald og verkefnastjórnun", "item": "https://www.bustadurinn.is/handbok/vidhald" }
                ]
            }
        ]
    };

    return (
        <MarketingLayout
            title="Viðhald og verkefnastjórnun - Bústaðurinn.is"
            description="Hvernig á að halda utan um viðhald og verkefni í sumarhúsi. Verkefnalisti, árstíðabundinn gátlisti og skipulag fyrir eigendur."
            keywords="viðhald sumarhús, verkefnastjórnun, task management, seasonal checklist, sumarhús skipulag"
            structuredData={structuredData}
            canonical="https://www.bustadurinn.is/handbok/vidhald"
        >
            {/* Breadcrumbs */}
            <section className="bg-stone-50 border-b border-stone-200 py-4">
                <div className="container max-w-4xl mx-auto px-6">
                    <Link
                        to="/handbok"
                        className="flex items-center text-grey-mid hover:text-amber transition-colors text-sm"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Til baka í handbók</span>
                    </Link>
                </div>
            </section>

            {/* Hero */}
            <section className="py-16 bg-white">
                <div className="container max-w-4xl mx-auto px-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-14 h-14 rounded-full bg-blue-600/10 flex items-center justify-center">
                            <CheckSquare className="w-7 h-7 text-blue-600" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif font-bold">
                            Viðhald og verkefnastjórnun
                        </h1>
                    </div>
                    <p className="text-xl text-grey-dark leading-relaxed">
                        Sumarhús þarf viðhald. Grasið þarf að klippa, potturinn þarf að hreinsa, og eitthvað þarf alltaf að laga.
                        Hvernig heldur maður utan um þetta þegar margir eiga húsið?
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-16 bg-bone">
                <div className="container max-w-4xl mx-auto px-6 space-y-16">

                    {/* Verkefnalisti */}
                    <div>
                        <h2 className="text-3xl font-serif font-bold mb-6">Verkefnalisti fyrir alla</h2>
                        <div className="bg-white rounded-xl p-8 shadow-sm">
                            <p className="text-lg text-grey-dark leading-relaxed mb-6">
                                Í Bústaðnum geta allir eigendur séð og unnið með sama verkefnalistann. Þetta tryggir að enginn gleymi
                                mikilvægum verkefnum og allir vita hvað á að gera.
                            </p>

                            <h3 className="text-xl font-bold mb-4">Hvað er hægt að gera:</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                    <div>
                                        <strong>Búa til verkefni:</strong> Hver sem er getur bætt við verkefni sem þarf að klára
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                    <div>
                                        <strong>Úthluta verkefnum:</strong> Getur úthlutað verkefni til ákveðinna eigenda
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                    <div>
                                        <strong>Fylgjast með stöðu:</strong> Hvert verkefni fer í gegnum stöðurnar í bið, í vinnslu og lokið — og hægt er að merkja verkefni sem hætt við
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                    <div>
                                        <strong>Kostnaðarskráning:</strong> Hægt er að skrá kostnað við verkefni og bæta honum sjálfkrafa við hússjóðsbókhaldið
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Seasonal Checklist */}
                    <div>
                        <h2 className="text-3xl font-serif font-bold mb-6">Árstíðalistar: vor-opnun og vetrarfrágangur</h2>
                        <p className="text-lg text-grey-dark leading-relaxed mb-4">
                            Fyrir utan almenna verkefnalistann er í Bústaðnum sérstakur eiginleiki fyrir árstíðabundin verk: í
                            <strong> Stillingar → Gátlistar → Árstíðalistar</strong> getur stjórnandi hússins búið til tvo lista —
                            einn fyrir <strong>vor-opnun</strong> og annan fyrir <strong>vetrarfrágang</strong> — og valið úr tilbúnum,
                            íslenskum sjálfgefnum atriðum með einum smelli í stað þess að skrifa allt frá grunni.
                        </p>
                        <p className="text-lg text-grey-dark leading-relaxed mb-8">
                            Þegar listi er stilltur birtist hann sjálfkrafa sem áminningarspjald á yfirlitstöflunni á réttum tíma árs —
                            vor-opnunin í apríl og maí, vetrarfrágangurinn í september og október — og er sýnilegt þar til einhver hakar
                            í hann. Hér eru hugmyndir að atriðum fyrir hvorn lista:
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Vor-opnun */}
                            <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-xl p-6">
                                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    Vor-opnun (apríl-maí)
                                </h3>
                                <ul className="space-y-2 text-grey-dark">
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 mt-1">•</span>
                                        Opna vatn og athuga lagnir
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 mt-1">•</span>
                                        Klippa gras í fyrsta skipti
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 mt-1">•</span>
                                        Mála pallinn og skoða viðhald
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 mt-1">•</span>
                                        Taka út garðhúsgögn
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 mt-1">•</span>
                                        Opna sumarhúsið eftir vetur
                                    </li>
                                </ul>
                            </div>

                            {/* Vetrarfrágangur */}
                            <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl p-6">
                                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
                                    </svg>
                                    Vetrarfrágangur (september-október)
                                </h3>
                                <ul className="space-y-2 text-grey-dark">
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-1">•</span>
                                        Taka inn garðhúsgögn
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-1">•</span>
                                        Loka vatni fyrir veturinn
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-1">•</span>
                                        Hreinsa niðurföll og þakrenni
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-1">•</span>
                                        Athuga einangrun og glugga
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-1">•</span>
                                        Taka inn/geyma grill og útibúnað
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Komu- og brottfarargátlistar */}
                    <div>
                        <h2 className="text-3xl font-serif font-bold mb-6">Komu- og brottfarargátlistar</h2>
                        <div className="bg-white rounded-xl p-8 shadow-sm space-y-4">
                            <p className="text-lg text-grey-dark leading-relaxed">
                                Fyrir utan árstíðalistana er líka hægt að stilla venjulegan <strong>komugátlista</strong> (birtist þegar
                                einhver skráir sig inn í húsið) og <strong>brottfarargátlista</strong> (birtist við skráningu brottfarar) —
                                líka undir Stillingar → Gátlistar, með tilbúnum sjálfgefnum atriðum sem má breyta að vild.
                            </p>
                            <p className="text-grey-dark leading-relaxed">
                                Við brottför er líka hægt að merkja <strong>birgðastöðu</strong> — hvort hver hlutur á lista (klósettpappír,
                                uppþvottalögur, kveikjarar o.s.frv.) er „Til" eða „Á þrotum". Allt sem er merkt á þrotum fer sjálfkrafa á
                                sameiginlega innkaupalistann, án þess að tvítaka atriði sem eru þegar þar. Á yfirlitstöflunni sér næsti
                                gestur líka stöðu síðustu brottfarar — hvað var hakað við þegar seinasti hópur fór.
                            </p>
                        </div>
                    </div>

                    {/* Svið verkefnis */}
                    <div>
                        <h2 className="text-3xl font-serif font-bold mb-6">Stöður verkefna</h2>
                        <div className="bg-white rounded-xl p-8 shadow-sm">
                            <p className="text-lg text-grey-dark leading-relaxed mb-6">
                                Í Bústaðnum eru verkefni með fjórar stöður sem hjálpa ykkur að halda utan um hvað er á döfinni:
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-5 bg-stone-50 rounded-lg">
                                    <div className="w-3 h-3 rounded-full bg-grey-mid mt-2"></div>
                                    <div>
                                        <h4 className="font-bold mb-1">Í bið (Pending)</h4>
                                        <p className="text-sm text-grey-dark">Verkefni sem bíða eftir að einhver taki þau að sér</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-5 bg-blue-50 rounded-lg">
                                    <div className="w-3 h-3 rounded-full bg-blue-500 mt-2"></div>
                                    <div>
                                        <h4 className="font-bold mb-1">Í vinnslu (In Progress)</h4>
                                        <p className="text-sm text-grey-dark">Verkefni sem einhver er að vinna að núna</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-5 bg-green-50 rounded-lg">
                                    <div className="w-3 h-3 rounded-full bg-green-500 mt-2"></div>
                                    <div>
                                        <h4 className="font-bold mb-1">Lokið (Completed)</h4>
                                        <p className="text-sm text-grey-dark">Verkefni sem eru kláruð og þarfnast ekki frekari athygli</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-5 bg-stone-100 rounded-lg">
                                    <div className="w-3 h-3 rounded-full bg-stone-400 mt-2"></div>
                                    <div>
                                        <h4 className="font-bold mb-1">Hætt við (Cancelled)</h4>
                                        <p className="text-sm text-grey-dark">Verkefni sem hætt var við og þarf ekki að klára</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pro tips */}
                    <div className="bg-blue-50 rounded-xl p-8 border-2 border-blue-200">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Góð ráð fyrir verkefnastjórnun
                        </h3>
                        <ul className="space-y-3 text-grey-dark">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 font-bold">•</span>
                                <span>Búðu til verkefni strax þegar þú tekur eftir einhverju sem þarf að laga</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 font-bold">•</span>
                                <span>Úthlutaðu verkefnum til þess sem er bestur í því (t.d. garðyrkju, rafmagn, málun)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 font-bold">•</span>
                                <span>Settu lokatíma (deadline) á verkefni ef mikilvægt er að það klárist fyrir ákveðinn tíma</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 font-bold">•</span>
                                <span>Notaðu athugasemdareitung til að bæta við myndum eða nánari lýsingum</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 font-bold">•</span>
                                <span>Skoðaðu verkefnalistann áður en þú ferð í sumarhúsið til að sjá hvað þarf að gera</span>
                            </li>
                        </ul>
                    </div>

                </div>
            </section>

            {/* Sjá einnig */}
            <section className="py-16 bg-white border-t border-stone-200">
                <div className="container max-w-4xl mx-auto px-6">
                    <h2 className="text-2xl font-serif font-bold mb-6">Sjá einnig</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <Link to="/handbok/bokunarkerfi" className="block bg-stone-50 hover:bg-amber/10 rounded-lg p-5 transition-colors">
                            <h3 className="font-bold text-charcoal mb-1">Bókunarkerfi fyrir sameignarhús</h3>
                            <p className="text-sm text-grey-dark">Sanngirnisregla og árekstraviðvörun fyrir bókanir.</p>
                        </Link>
                        <Link to="/handbok/fjarmal" className="block bg-stone-50 hover:bg-amber/10 rounded-lg p-5 transition-colors">
                            <h3 className="font-bold text-charcoal mb-1">Fjárhaldslausnir</h3>
                            <p className="text-sm text-grey-dark">Hússjóður og kostnaðarskipting milli eigenda.</p>
                        </Link>
                        <Link to="/handbok/uppsetning" className="block bg-stone-50 hover:bg-amber/10 rounded-lg p-5 transition-colors">
                            <h3 className="font-bold text-charcoal mb-1">Hvernig á að setja upp kerfið</h3>
                            <p className="text-sm text-grey-dark">Skref-fyrir-skref leiðarvísir til að byrja.</p>
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-charcoal text-white py-20">
                <div className="container max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-serif font-bold mb-4">Tilbúinn að skipuleggja viðhald?</h2>
                    <p className="text-xl text-stone-300 mb-8">
                        Byrjaðu að nota verkefnalistann í Bústaðnum.
                    </p>
                    <button
                        onClick={() => navigate('/signup')}
                        className="btn btn-primary bg-amber text-charcoal hover:bg-amber/90 px-8 py-4 text-lg inline-flex items-center gap-2"
                    >
                        Byrja núna
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </section>
        </MarketingLayout>
    );
}
