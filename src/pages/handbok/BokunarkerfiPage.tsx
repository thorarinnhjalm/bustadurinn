import MarketingLayout from '@/components/MarketingLayout';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, ChevronLeft, Shield, AlertCircle, ArrowRight, CheckSquare } from 'lucide-react';

export default function BokunarkerfiPage() {
    const navigate = useNavigate();

    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "HowTo",
                "name": "Bókunarkerfi fyrir sameignarhús",
                "description": "Lærðu hvernig bókunarkerfi virkar fyrir sameignarhús og sumarhús, með sanngirnisröðun stórhelga og árekstraviðvörun.",
                "step": [
                    {
                        "@type": "HowToStep",
                        "name": "Veldu dagsetningar",
                        "text": "Smelltu á dagatalið og veldu hvaða daga þú vilt bóka"
                    },
                    {
                        "@type": "HowToStep",
                        "name": "Bættu við upplýsingum",
                        "text": "Skráðu hverjir koma og ef það eru athugasemdir"
                    },
                    {
                        "@type": "HowToStep",
                        "name": "Staðfestu bókun",
                        "text": "Kerfið varar við ef dagsetningar skarast við aðra bókun og sendir tilkynningar á alla þegar bókun er staðfest"
                    }
                ]
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Heim", "item": "https://www.bustadurinn.is/" },
                    { "@type": "ListItem", "position": 2, "name": "Handbók", "item": "https://www.bustadurinn.is/handbok" },
                    { "@type": "ListItem", "position": 3, "name": "Bókunarkerfi fyrir sameignarhús", "item": "https://www.bustadurinn.is/handbok/bokunarkerfi" }
                ]
            }
        ]
    };

    return (
        <MarketingLayout
            // "bókunarkerfi" is the biggest non-brand query by impressions
            // (33) but sits at pos 29.7 — page 3. Lead with the exact term.
            title="Bókunarkerfi fyrir sumarhús í sameign"
            description="Bókunardagatal fyrir sumarhús í sameign: viðvörun ef bókanir skarast og sanngirnisregla sem skiptir stórhelgum milli fjölskyldna. Ókeypis, engin áskrift."
            keywords="bókunarkerfi sameignarhús, bókun sumarhús, sanngirnisregla, dagatal sameign, árekstraviðvörun"
            structuredData={structuredData}
            canonical="https://www.bustadurinn.is/handbok/bokunarkerfi"
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
                        <div className="w-14 h-14 rounded-full bg-amber/10 flex items-center justify-center">
                            <Calendar className="w-7 h-7 text-amber" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif font-bold">
                            Bókunarkerfi fyrir sameignarhús
                        </h1>
                    </div>
                    <p className="text-xl text-grey-dark leading-relaxed">
                        Þegar margar fjölskyldur eiga sumarhús saman er mikilvægt að hafa skýrt kerfi fyrir bókanir.
                        Bústaðurinn.is kemur með innbyggt bókunarkerfi sem varar við árekstrum og tryggir sanngjarna skiptingu stórhelga.
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-16 bg-bone">
                <div className="container max-w-4xl mx-auto px-6 space-y-16">

                    {/* Section 1: Algengar áskoranir */}
                    <div>
                        <h2 className="text-3xl font-serif font-bold mb-6">Algengar áskoranir án kerfis</h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-6 bg-white rounded-xl border-l-4 border-red-400">
                                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-lg mb-2">Tvöfaldar bókanir</h3>
                                    <p className="text-grey-dark leading-relaxed">
                                        Tveir eigendur bóka sömu helgina án þess að vita af hvor öðrum. Excel skjöl uppfærast ekki í rauntíma
                                        og til verða óþægindi þegar báðir mæta í sama húsið.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-6 bg-white rounded-xl border-l-4 border-red-400">
                                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-lg mb-2">Ósanngjörn skipting</h3>
                                    <p className="text-grey-dark leading-relaxed">
                                        Sumir eigendur fá alltaf helstu helgarnar (jól, páska, miðsumar) á meðan aðrir verða að sætta sig við
                                        minna eftirsóttar vikur.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-6 bg-white rounded-xl border-l-4 border-red-400">
                                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-lg mb-2">Illskyljanleg samskipti</h3>
                                    <p className="text-grey-dark leading-relaxed">
                                        Erfitt er að vita hver hefur bókað hvað. WhatsApp skilaboð týnast, email keðjur verða of langar,
                                        og enginn veit hvað er raunverulega staðfest.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Lausnin */}
                    <div>
                        <h2 className="text-3xl font-serif font-bold mb-6">Lausnin: Stafrænt bókunardagatal</h2>
                        <div className="bg-white rounded-xl p-8 shadow-sm">
                            <p className="text-lg text-grey-dark leading-relaxed mb-6">
                                Bústaðurinn.is býður upp á bókunardagatal sem er aðgengilegt öllum eigendum í síma og tölvu.
                                Allir sjá strax hvenær aðrir hafa bókað, og ef þú reynir að bóka ofan í aðra bókun varar kerfið þig við —
                                sýnir hver er þegar með húsið og hvenær — og þú getur valið „Bóka samt" ef um vísvitandi samveru er að ræða.
                            </p>

                            <h3 className="text-xl font-bold mb-4">Helstu eiginleikar:</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                    <span><strong>Rauntíma uppfærslur:</strong> Þegar einhver bókar, sjá allir það strax</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                    <span><strong>Árekstraviðvörun:</strong> Kerfið varar þig við ef bókunin skarast við aðra og sýnir hver á hana — kerfið hindrar ekki sjálfvirkt, heldur lætur þig taka upplýsta ákvörðun</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                    <span><strong>Sjálfvirkar tilkynningar:</strong> Email, tilkynningar (push) og í kerfinu þegar nýjar bókanir fara fram</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                    <span><strong>Mismunandi bókunartegundir:</strong> Persónuleg, Gestur, Útleiga eða Viðhald</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                    <span><strong>Íslenskir hátíðisdagar:</strong> Sjálfkrafa auðkenndir í dagatalinu</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Section 3: Sanngirnisreglan */}
                    <div>
                        <div className="bg-gradient-to-br from-amber/10 via-amber/5 to-white rounded-xl p-8 border-2 border-amber/20">
                            <div className="flex items-center gap-3 mb-6">
                                <Shield className="w-8 h-8 text-amber" />
                                <h2 className="text-3xl font-serif font-bold">Sanngirnisreglan</h2>
                            </div>

                            <p className="text-lg text-grey-dark leading-relaxed mb-6">
                                Ein stærsta nýjung Bústaðarins er innbyggða sanngirnisreglan: sjálfvirk skiptiröð (rotation) sem tryggir að
                                stórhelgarnar — <strong>páskar, verslunarmannahelgin, jólin og áramótin</strong> — dreifist á milli eigenda yfir árin,
                                í stað þess að sami eigandi sitji alltaf að þeim.
                            </p>

                            <h3 className="text-xl font-bold mb-3">Hvernig það virkar:</h3>
                            <div className="space-y-4 mb-6">
                                <div className="bg-white rounded-lg p-5">
                                    <div className="font-bold text-amber mb-2">1. Kveiktu á sanngirnisreglu</div>
                                    <p className="text-sm text-grey-dark">Í stillingum húss getur þú valið "Sanngirnisregla" í stað "Hver kemur fyrst"</p>
                                </div>

                                <div className="bg-white rounded-lg p-5">
                                    <div className="font-bold text-amber mb-2">2. Kerfið reiknar forgangsröð</div>
                                    <p className="text-sm text-grey-dark">
                                        Fyrir hverja stórhelgi reiknar kerfið hver á forgang: sá sem aldrei hefur haldið helgina fær forgang fram yfir
                                        þá sem hafa haldið hana, og af þeim sem hafa haldið hana fær sá forgang sem lengst er síðan hélt hana.
                                    </p>
                                </div>

                                <div className="bg-white rounded-lg p-5">
                                    <div className="font-bold text-amber mb-2">3. Forgangur, ekki bann</div>
                                    <p className="text-sm text-grey-dark">
                                        Ef þú reynir að bóka stórhelgi sem einhver annar á forgang á, útskýrir kerfið hver á röðina og hvenær helgin
                                        opnast öllum. Forgangurinn fellur sjálfkrafa niður <strong>3 mánuðum fyrir</strong> helgina — eftir það getur
                                        hver sem er bókað hana, óháð röðinni.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-amber/10 border-l-4 border-amber p-5 rounded-r-lg mb-6">
                                <p className="text-sm text-charcoal">
                                    <strong>Dæmi:</strong> Ef Anna hélt jólin 2024 og Jón og Sigrún gerðu það ekki, fá Jón og Sigrún forgang á jólin 2025.
                                    Ef enginn þeirra hefur bókað þegar 3 mánuðir eru til jóla, opnast helgin öllum eigendum — líka Önnu.
                                </p>
                            </div>

                            <h3 className="text-xl font-bold mb-3">Stórhelgar-spjaldið</h3>
                            <p className="text-sm text-grey-dark leading-relaxed">
                                Á dagatalssíðunni er sérstakt „Stórhelgar" spjald sem sýnir allar fjórar stórhelgarnar fram í tímann — hver á
                                forgang á hverja þeirra núna, sögu um hver hélt hana undanfarin ár, og hvenær forgangurinn opnast öllum. Þar getur
                                sá sem á forgang smellt beint á „Bóka þessa helgi" til að nýta hann.
                            </p>
                        </div>
                    </div>

                    {/* Section 4: Hvernig á að bóka */}
                    <div>
                        <h2 className="text-3xl font-serif font-bold mb-6">Hvernig virkar bókunarferlið?</h2>
                        <div className="space-y-6">
                            <div className="flex items-start gap-6 bg-white p-6 rounded-xl">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber text-charcoal font-bold text-xl flex items-center justify-center">
                                    1
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-2">Veldu dagsetningu</h3>
                                    <p className="text-grey-dark leading-relaxed">
                                        Smelltu á dagatalið og veldu hvaða daga þú vilt bóka. Þú getur valið staka daga, helgar eða lengri tímabil.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-6 bg-white p-6 rounded-xl">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber text-charcoal font-bold text-xl flex items-center justify-center">
                                    2
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-2">Bættu við upplýsingum</h3>
                                    <p className="text-grey-dark leading-relaxed">
                                        Veldu tegund bókunar (persónuleg, gestur, útleiga eða viðhald), skráðu hverjir koma og bættu við athugasemdum ef þú vilt.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-6 bg-white p-6  rounded-xl">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber text-charcoal font-bold text-xl flex items-center justify-center">
                                    3
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-2">Staðfestu bókun</h3>
                                    <p className="text-grey-dark leading-relaxed mb-3">
                                        Þegar þú smellir á "Bóka", þá:
                                    </p>
                                    <ul className="space-y-2 text-sm text-grey-dark">
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 mt-0.5">✓</span>
                                            <span>Varar við ef dagsetningar skarast við aðra bókun (þú getur samt bókað ef það er vísvitandi)</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 mt-0.5">✓</span>
                                            <span>Athugar sanngirnisreglu (ef hún er virk)</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 mt-0.5">✓</span>
                                            <span>Vistar bókun í rauntíma</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-600 mt-0.5">✓</span>
                                            <span>Sendir tilkynningar á alla eigendur (email + tilkynningar)</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Utanumhald bókana */}
                    <div>
                        <h2 className="text-3xl font-serif font-bold mb-6">Hvernig á að halda utan um bókanir í bústað í sameign?</h2>
                        <div className="bg-white rounded-xl p-8 shadow-sm space-y-4">
                            <p className="text-lg text-grey-dark leading-relaxed">
                                Að skipta helgum og sumarvikum í sameiginlegum bústað getur fljótt orðið flókið. Margir nota útdrátt eða skiptast á að velja árlega, sem krefst funda og oft ágreinings. 
                                Stafrænt <strong>bókunarkerfi fyrir sumarhús</strong> eins og Bústaðurinn.is einfaldar þetta ferli til muna.
                            </p>
                            <p className="text-grey-dark leading-relaxed">
                                Besta leiðin til að halda utan um bókanir án árekstra er að setja skýrar húsreglur og skrá þær í <strong>handbók hússins</strong> í kerfinu:
                            </p>
                            <ul className="space-y-3 pt-2">
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                                    <span><strong>Sameiginlegar reglur:</strong> Skráið reglur um lágmarksdvöl (t.d. að minnsta kosti 2 nætur yfir helgi).</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                                    <span><strong>Sanngjörn skipting:</strong> Notaðu forgangs- og sanngirnisreglurnar okkar fyrir stórhátíðir til að sjá til þess að allir fái réttláta úthlutun.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                                    <span><strong>Sveigjanleiki:</strong> Ef einhver þarf að afbóka er það gert með einum smelli og allir meðeigendur fá strax tilkynningu um að helgin sé laus.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Section 5: Tips */}
                    <div className="bg-blue-50 rounded-xl p-8 border-2 border-blue-200">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Góð ráð
                        </h3>
                        <ul className="space-y-3 text-grey-dark">
                            <li>• Bókaðu snemma fyrir helstu helgarnar til að tryggja þinn tíma</li>
                            <li>• Notaðu athugasemdareitung til að láta aðra vita um sérstakar aðstæður</li>
                            <li>• Athugaðu hátíðisdaga - þeir eru auðkenndir í dagatalinu</li>
                            <li>• Ef þú þarft að afbóka, geturðu eytt bókun (aðeins þú eða stjórnandi)</li>
                        </ul>
                    </div>

                </div>
            </section>

            {/* Sjá einnig */}
            <section className="py-16 bg-white border-t border-stone-200">
                <div className="container max-w-4xl mx-auto px-6">
                    <h2 className="text-2xl font-serif font-bold mb-6">Sjá einnig</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <Link to="/handbok/fjarmal" className="block bg-stone-50 hover:bg-amber/10 rounded-lg p-5 transition-colors">
                            <h3 className="font-bold text-charcoal mb-1">Fjárhaldslausnir</h3>
                            <p className="text-sm text-grey-dark">Hússjóður og kostnaðarskipting milli eigenda.</p>
                        </Link>
                        <Link to="/handbok/vidhald" className="block bg-stone-50 hover:bg-amber/10 rounded-lg p-5 transition-colors">
                            <h3 className="font-bold text-charcoal mb-1">Viðhald og verkefnastjórnun</h3>
                            <p className="text-sm text-grey-dark">Verkefnalisti og árstíðabundnir gátlistar.</p>
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
                    <h2 className="text-3xl font-serif font-bold mb-4">Tilbúinn að prófa bókunarkerfið?</h2>
                    <p className="text-xl text-stone-300 mb-8">
                        Settu upp húsið þitt og byrjaðu að skipuleggja bókanir á 5 mínútum.
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
