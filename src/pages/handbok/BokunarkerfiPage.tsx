import MarketingLayout from '@/components/MarketingLayout';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, Shield, AlertCircle, ArrowRight, CheckSquare } from 'lucide-react';

export default function BokunarkerfiPage() {
    const navigate = useNavigate();

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "Bókunarkerfi fyrir sameignarhús",
        "description": "Lærðu hvernig bókunarkerfi virkar fyrir sameignarhús og sumarhús, með sanngirnisreglu og árekstrarvörn.",
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
                "text": "Kerfið athugar sjálfkrafa hvort dagsetningar eru lausar og sendir tilkynningar á alla"
            }
        ]
    };

    return (
        <MarketingLayout
            title="Bókunarkerfi fyrir sameignarhús - Bústaðurinn.is"
            description="Hvernig bókunarkerfi fyrir sameignarhús virkar. Sanngirnisregla, árekstrarvörn og sjálfvirkar tilkynningar. Aldrei tvöfaldar bókanir aftur."
            keywords="bókunarkerfi sameignarhús, bókun sumarhús, sanngirnisregla, dagatal sameign, árekstrarvörn"
            structuredData={structuredData}
            canonical="https://www.bustadurinn.is/handbok/bokunarkerfi"
        >
            {/* Breadcrumbs */}
            <section className="bg-stone-50 border-b border-stone-200 py-4">
                <div className="container max-w-4xl mx-auto px-6">
                    <button
                        onClick={() => navigate('/handbok')}
                        className="flex items-center text-grey-mid hover:text-amber transition-colors text-sm"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Til baka í handbók</span>
                    </button>
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
                        Bústaðurinn.is kemur með innbyggt bókunarkerfi sem fyrirbyggir árekstra og tryggir sanngjarna skiptingu.
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
                                Allir sjá strax hvenær aðrir hafa bókað og kerfið kemur í veg fyrir tvöfaldar bókanir sjálfkrafa.
                            </p>

                            <h3 className="text-xl font-bold mb-4">Helstu eiginleikar:</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                    <span><strong>Rauntíma uppfærslur:</strong> Þegar einhver bókar, sjá allir það strax</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                    <span><strong>Árekstrarvörn:</strong> Kerfið kemur sjálfkrafa í veg fyrir tvöfaldar bókanir</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                    <span><strong>Sjálfvirkar tilkynningar:</strong> Email, tilkynningar (push) og í kerfinu þegar nýjar bókanir fara fram</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                    <span><strong>Mismunandi bókunartegundir:</strong> Einkanot, Útleiga, Viðhald eða Gestir</span>
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
                                Ein stærsta nýjung Bústaðarins er innbyggða sanngirnisreglan sem tryggir að enginn sitji einn að vinsælustu helgunum.
                            </p>

                            <h3 className="text-xl font-bold mb-3">Hvernig það virkar:</h3>
                            <div className="space-y-4 mb-6">
                                <div className="bg-white rounded-lg p-5">
                                    <div className="font-bold text-amber mb-2">1. Kveiktu á sanngirnisreglu</div>
                                    <p className="text-sm text-grey-dark">Í stillingum húss getur þú valið "Sanngirnisregla" í stað "Hver kemur fyrst"</p>
                                </div>

                                <div className="bg-white rounded-lg p-5">
                                    <div className="font-bold text-amber mb-2">2. Kerfið fylgist með</div>
                                    <p className="text-sm text-grey-dark">
                                        Þegar einhver bókar helstu hátíðisdaga (jól, páska, verslunarmannahelgi), þá skráir kerfið það
                                    </p>
                                </div>

                                <div className="bg-white rounded-lg p-5">
                                    <div className="font-bold text-amber mb-2">3. Forgangur næsta ár</div>
                                    <p className="text-sm text-grey-dark">
                                        Ef þú varst með jól síðasta ár, þá kemur kerfið í veg fyrir að þú bókir jól á ný næsta ár.
                                        Aðrir eigendur fá þá tækifæri.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-amber/10 border-l-4 border-amber p-5 rounded-r-lg">
                                <p className="text-sm text-charcoal">
                                    <strong>Dæmi:</strong> Ef Anna var með jól 2024, þá getur hún <strong>ekki</strong> bókað jól 2025.
                                    Þess í stað fá Jón, Sigrún eða aðrir eigendur sem voru ekki með jól 2024 forgang.
                                </p>
                            </div>
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
                                        Veldu tegund bókunar (persónuleg, útleiga, viðhald), skráðu hverjir koma og bættu við athugasemdum ef þú vilt.
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
                                            <span>Athugar kerfið hvort dagsetningar eru lausar</span>
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
