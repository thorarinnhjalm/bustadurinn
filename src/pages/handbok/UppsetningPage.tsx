import MarketingLayout from '@/components/MarketingLayout';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, ChevronLeft, ArrowRight, CheckCircle, Home as HomeIcon, Settings } from 'lucide-react';

export default function UppsetningPage() {
    const navigate = useNavigate();

    // Steps mirror the four numbered steps actually rendered on this page
    // below (Step 1-4). The page states the whole process takes "innan við
    // 5 mínútur" (under 5 minutes), hence totalTime PT5M.
    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "HowTo",
                "name": "Hvernig á að setja upp Bústaðinn.is",
                "description": "Skref-fyrir-skref leiðarvísir um hvernig þú setur upp sumarhúsið þitt í Bústaðnum á innan við 5 mínútum.",
                "totalTime": "PT5M",
                "step": [
                    {
                        "@type": "HowToStep",
                        "name": "Stofnaðu aðgang",
                        "text": "Farðu á bustadurinn.is/signup og stofnaðu aðgang með netfanginu þínu, lykilorði og nafni."
                    },
                    {
                        "@type": "HowToStep",
                        "name": "Skráðu húsið",
                        "text": "Eftir að þú skráir þig inn býrðu til fyrsta húsið þitt, gefur því nafn og bætir við grunnupplýsingum eins og heimilisfangi og mynd (valfrjálst)."
                    },
                    {
                        "@type": "HowToStep",
                        "name": "Bjóddu meðeigendum",
                        "text": "Farðu í stillingarvalmyndina, veldu \"Bjóða meðeigendum\" og deildu boðshlekknum með öðrum eigendum svo þeir geti stofnað eigin aðgang og gengið til liðs."
                    },
                    {
                        "@type": "HowToStep",
                        "name": "Stilltu sanngirnisreglur (valfrjálst)",
                        "text": "Veldu í stillingum hvort þið viljið nota \"Hver kemur fyrst\" eða \"Sanngirnisreglu\" fyrir stórhelgarnar."
                    }
                ]
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Heim", "item": "https://www.bustadurinn.is/" },
                    { "@type": "ListItem", "position": 2, "name": "Handbók", "item": "https://www.bustadurinn.is/handbok" },
                    { "@type": "ListItem", "position": 3, "name": "Hvernig á að setja upp kerfið", "item": "https://www.bustadurinn.is/handbok/uppsetning" }
                ]
            }
        ]
    };

    return (
        <MarketingLayout
            title="Hvernig á að setja upp Bústaðinn.is - Uppsetningarleiðbeiningar"
            description="Skref-fyrir-skref leiðarvísir um hvernig þú setur upp sumarhúsið þitt í Bústaðnum á innan við 5 mínútum. Stofna aðgang, bjóða meðeigendum og byrja að nota."
            keywords="bústaðurinn setup, setja upp sumarhús, stofna aðgang, bjóða meðeigendum, onboarding"
            structuredData={structuredData}
            canonical="https://www.bustadurinn.is/handbok/uppsetning"
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
                        <div className="w-14 h-14 rounded-full bg-purple-600/10 flex items-center justify-center">
                            <BookOpen className="w-7 h-7 text-purple-600" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif font-bold">
                            Hvernig á að setja upp kerfið
                        </h1>
                    </div>
                    <p className="text-xl text-grey-dark leading-relaxed">
                        Það tekur innan við 5 mínútur að setja upp húsið þitt í Bústaðnum.
                        Hér er skref-fyrir-skref leiðarvísir sem leiðir þig í gegnum allt ferlið.
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-16 bg-bone">
                <div className="container max-w-4xl mx-auto px-6 space-y-12">

                    {/* Step 1 */}
                    <div className="bg-white rounded-xl p-8 shadow-sm border-l-4 border-amber">
                        <div className="flex items-start gap-6 mb-6">
                            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-amber text-charcoal font-bold text-2xl flex items-center justify-center">
                                1
                            </div>
                            <div className="flex-1">
                                <h2 className="text-3xl font-serif font-bold mb-3">Stofnaðu aðgang</h2>
                                <p className="text-lg text-grey-dark leading-relaxed">
                                    Farðu á <a href="/signup" className="text-amber underline font-medium">bústaðurinn.is/signup</a> og
                                    stofnaðu aðgang með netfanginu þínu.
                                </p>
                            </div>
                        </div>

                        <div className="pl-22 space-y-4">
                            <div className="bg-stone-50 rounded-lg p-5">
                                <h4 className="font-bold mb-2">Hvað þarftu:</h4>
                                <ul className="space-y-2 text-grey-dark">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        <span>Netfang</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        <span>Lykilorð (að minnsta kosti 6 stafir)</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        <span>Nafn þitt</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-amber/10 rounded-lg p-5 border-l-4 border-amber">
                                <p className="text-sm text-charcoal">
                                    <strong className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-amber inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        Ábending:
                                    </strong> Kerfið er algjörlega ókeypis. Enginn falinn kostnaður, engin áskrift.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-white rounded-xl p-8 shadow-sm border-l-4 border-amber">
                        <div className="flex items-start gap-6 mb-6">
                            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-amber text-charcoal font-bold text-2xl flex items-center justify-center">
                                2
                            </div>
                            <div className="flex-1">
                                <h2 className="text-3xl font-serif font-bold mb-3">Skráðu húsið</h2>
                                <p className="text-lg text-grey-dark leading-relaxed">
                                    Eftir að þú skráir þig inn, þá færð þú að búa til fyrsta húsið þitt.
                                    Gefðu því nafn og bættu við grunnupplýsingum.
                                </p>
                            </div>
                        </div>

                        <div className="pl-22 space-y-4">
                            <div className="bg-stone-50 rounded-lg p-5">
                                <h4 className="font-bold mb-2">Upplýsingar um húsið:</h4>
                                <ul className="space-y-2 text-grey-dark">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                                        <span><strong>Nafn:</strong> T.d. "Sumarbústaður Jóns" eða "Hús okkar í Hvalfirði"</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                                        <span><strong>Heimilisfang</strong> (valfrjálst): Gott til að hafa skráð</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                                        <span><strong>Mynd</strong> (valfrjálst): Hlaða upp mynd af húsinu</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-white rounded-xl p-8 shadow-sm border-l-4 border-amber">
                        <div className="flex items-start gap-6 mb-6">
                            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-amber text-charcoal font-bold text-2xl flex items-center justify-center">
                                3
                            </div>
                            <div className="flex-1">
                                <h2 className="text-3xl font-serif font-bold mb-3">Bjóddu meðeigendum</h2>
                                <p className="text-lg text-grey-dark leading-relaxed">
                                    Þegar húsið er stofnað, þá getur þú boðið öðrum eigendum að taka þátt.
                                    Farðu í stillingarvalmyndina og veldu "Bjóða meðeigendum".
                                </p>
                            </div>
                        </div>

                        <div className="pl-22 space-y-4">
                            <div className="bg-stone-50 rounded-lg p-5">
                                <h4 className="font-bold mb-2">Hvernig virkar boðið:</h4>
                                <ol className="space-y-3 text-grey-dark">
                                    <li className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber/20 text-charcoal font-bold text-sm flex items-center justify-center">1</span>
                                        <span>Þú færð boðshlekk sem þú getur deilt með öðrum</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber/20 text-charcoal font-bold text-sm flex items-center justify-center">2</span>
                                        <span>Sendu hlekkinn á aðra eigendur (email, WhatsApp, eða annað)</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber/20 text-charcoal font-bold text-sm flex items-center justify-center">3</span>
                                        <span>Þeir smella á hlekkinn, stofna eigin aðgang, og eru strax komnir inn</span>
                                    </li>
                                </ol>
                            </div>

                            <div className="bg-blue-50 rounded-lg p-5 border-l-4 border-blue-500">
                                <p className="text-sm text-charcoal">
                                    <strong className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-blue-600 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Öryggi:
                                    </strong> Boðshlekkurinn er einkvæmur fyrir þitt hús.
                                    Aðeins þeir sem fá hlekkinn geta gengið til liðs.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="bg-white rounded-xl p-8 shadow-sm border-l-4 border-amber">
                        <div className="flex items-start gap-6 mb-6">
                            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-amber text-charcoal font-bold text-2xl flex items-center justify-center">
                                4
                            </div>
                            <div className="flex-1">
                                <h2 className="text-3xl font-serif font-bold mb-3">Stilltu sanngirnisreglur (valfrjálst)</h2>
                                <p className="text-lg text-grey-dark leading-relaxed">
                                    Ef þið viljið nota sanngirniskerfið fyrir helstu helgarnar, þá stillið það í stillingum.
                                    Þar veljið þið hvort þið viljið nota "Hver kemur fyrst" eða "Sanngirnisreglu".
                                </p>
                            </div>
                        </div>

                        <div className="pl-22 space-y-4">
                            <div className="bg-stone-50 rounded-lg p-5">
                                <h4 className="font-bold mb-2">Tvær útgáfur:</h4>
                                <div className="space-y-3 mt-3">
                                    <div className="border-l-4 border-stone-300 pl-4">
                                        <h5 className="font-bold text-grey-dark">Hver kemur fyrst</h5>
                                        <p className="text-sm text-grey-mid mt-1">Hverjum sem bókar fyrst er úthlutað fyrst. Engin sanngirni.</p>
                                    </div>
                                    <div className="border-l-4 border-amber pl-4">
                                        <h5 className="font-bold text-amber-900">Sanngirnisregla</h5>
                                        <p className="text-sm text-grey-dark mt-1">
                                            Fyrir hverja af fjórum stórhelgum (páska, verslunarmannahelgina, jólin, áramótin) reiknar kerfið
                                            forgangsröð: sá sem aldrei hefur haldið helgina — eða hélt hana lengst síðan — fær forgang. Forgangurinn
                                            fellur sjálfkrafa niður 3 mánuðum fyrir helgina, og eftir það getur hver sem er bókað hana. Á
                                            dagatalinu er „Stórhelgar" spjald sem sýnir röðina og söguna fyrir hverja helgi.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 5 - Done */}
                    <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-8 shadow-sm border-2 border-green-200">
                        <div className="flex items-start gap-6">
                            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-green-600 text-white font-bold text-2xl flex items-center justify-center">
                                ✓
                            </div>
                            <div className="flex-1">
                                <h2 className="text-3xl font-serif font-bold mb-3 text-green-900">Klár!</h2>
                                <p className="text-lg text-grey-dark leading-relaxed mb-6">
                                    Núna getið þið byrjað að bóka, halda utan um fjármál og verkefni.
                                    Allt á einum stað, aðgengilegt í síma og tölvu.
                                </p>

                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="bg-white rounded-lg p-4 text-center">
                                        <HomeIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                        <h4 className="font-bold text-sm">Bókun</h4>
                                        <p className="text-xs text-grey-mid mt-1">Skipulagðu dvöl</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 text-center">
                                        <Settings className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                        <h4 className="font-bold text-sm">Hússjóður</h4>
                                        <p className="text-xs text-grey-mid mt-1">Haltu utan um kostnað</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 text-center">
                                        <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                        <h4 className="font-bold text-sm">Verkefni</h4>
                                        <p className="text-xs text-grey-mid mt-1">Skipulagðu viðhald</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FAQ */}
                    <div className="bg-white rounded-xl p-8">
                        <h3 className="text-2xl font-serif font-bold mb-6">Algengar spurningar</h3>
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-bold mb-2 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-grey-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                    Kostar þetta eitthvað?
                                </h4>
                                <p className="text-grey-dark">
                                    Nei! Bústaðurinn.is er algjörlega ókeypis. Enginn falinn kostnaður og engin greiðslukort þarf.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold mb-2 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-grey-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Hversu margir eigendur geta verið í sama húsi?
                                </h4>
                                <p className="text-grey-dark">
                                    Engin takmörk! Þú getur bætt við eins mörgum eigendum og þú vilt.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold mb-2 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-grey-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    Virkar þetta í símanum?
                                </h4>
                                <p className="text-grey-dark">
                                    Já! Bústaðurinn.is virkar í öllum tækjum og virkar vel í símanum, spjaldtölvu og tölvu.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold mb-2 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-grey-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    Get ég verið með mörg hús?
                                </h4>
                                <p className="text-grey-dark">
                                    Já! Þú getur verið með ótakmarkaðan fjölda húsa í sama aðgangnum.
                                </p>
                            </div>
                        </div>
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
                        <Link to="/handbok/vidhald" className="block bg-stone-50 hover:bg-amber/10 rounded-lg p-5 transition-colors">
                            <h3 className="font-bold text-charcoal mb-1">Viðhald og verkefnastjórnun</h3>
                            <p className="text-sm text-grey-dark">Verkefnalisti og árstíðabundnir gátlistar.</p>
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-charcoal text-white py-20">
                <div className="container max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-serif font-bold mb-4">Tilbúinn að byrja?</h2>
                    <p className="text-xl text-stone-300 mb-8">
                        Stofnaðu aðgang og settu upp húsið þitt á 5 mínútum.
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
