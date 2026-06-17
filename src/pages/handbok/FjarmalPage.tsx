import MarketingLayout from '@/components/MarketingLayout';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ChevronLeft, ArrowRight, CheckSquare, PiggyBank } from 'lucide-react';

export default function FjarmalPage() {
    const navigate = useNavigate();

    return (
        <MarketingLayout
            title="Fjárhaldslausnir fyrir sameignarhús - Bústaðurinn.is"
            description="Hvernig á að halda utan um hússjóð, kostnaðarskiptingu og bókhald í sameignarhúsi. Gagnsæi og traust fyrir alla eigendur."
            keywords="hússjóður, kostnaðarskipting sameignarhús, bókhald sumarhús, rekstraráætlun, fjármál sameign"
            canonical="https://www.bustadurinn.is/handbok/fjarmal"
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
                        <div className="w-14 h-14 rounded-full bg-emerald-600/10 flex items-center justify-center">
                            <TrendingUp className="w-7 h-7 text-emerald-600" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif font-bold">
                            Fjárhaldslausnir
                        </h1>
                    </div>
                    <p className="text-xl text-grey-dark leading-relaxed">
                        Ein stærsta áskorunin í sameignarhúsum er að halda utan um kostnað á sanngjarnan hátt.
                        Hver á að borga fyrir hvað? Hvernig skiptum við rafmagnsreikningum? Hver greiðir fyrir viðhald?
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-16 bg-bone">
                <div className="container max-w-4xl mx-auto px-6 space-y-16">

                    {/* Hvað er hússjóður */}
                    <div>
                        <h2 className="text-3xl font-serif font-bold mb-6">Hvað er hússjóður?</h2>
                        <div className="bg-white rounded-xl p-8 shadow-sm">
                            <p className="text-lg text-grey-dark leading-relaxed mb-6">
                                Hússjóður er sameiginlegur reikningur sem allir eigendur leggja í til að standa straum af sameiginlegum kostnaði.
                                Þetta tryggir að peningar séu alltaf til staðar fyrir nauðsynlegan rekstur og viðhald.
                            </p>

                            <h3 className="text-xl font-bold mb-4">Tegundir framlaga:</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                    <div>
                                        <strong>Föst mánaðarleg innborgun:</strong> Hver eigandi greiðir sömu upphæð í hverjum mánuði
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                    <div>
                                        <strong>Árleg innborgun:</strong> Öll innborgun fer fram einu sinni á ári
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                    <div>
                                        <strong>Innborganir eftir þörfum:</strong> Þegar stór verkefni koma upp biðja eigendur um innborgun
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Rekstraráætlun */}
                    <div>
                        <h2 className="text-3xl font-serif font-bold mb-6">Rekstraráætlun</h2>
                        <div className="bg-white rounded-xl p-8 shadow-sm mb-6">
                            <p className="text-lg text-grey-dark leading-relaxed mb-6">
                                Í Bústaðnum getur þú búið til rekstraráætlun fyrir árið. Þetta hjálpar ykkur að áætla hversu mikið þið þurfið
                                að leggja saman til að standa undir kostnaði.
                            </p>

                            <h3 className="text-xl font-bold mb-4">Hvað er hægt að áætla:</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="border border-stone-200 rounded-lg p-4">
                                    <h4 className="font-bold text-green-700 mb-2 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                        Tekjur
                                    </h4>
                                    <ul className="text-sm space-y-1 text-grey-dark">
                                        <li>• Útleigutekjur</li>
                                        <li>• Innborganir eigenda</li>
                                        <li>• Aðrar tekjur</li>
                                    </ul>
                                </div>
                                <div className="border border-stone-200 rounded-lg p-4">
                                    <h4 className="font-bold text-red-700 mb-2 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                        </svg>
                                        Gjöld
                                    </h4>
                                    <ul className="text-sm space-y-1 text-grey-dark">
                                        <li>• Fasteignaskattur</li>
                                        <li>• Rafmagn og hiti</li>
                                        <li>• Tryggingar</li>
                                        <li>• Viðhald og þrif</li>
                                        <li>• Sorp og vatnsgjöld</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-50 rounded-xl p-6 border-2 border-emerald-200">
                            <h4 className="font-bold text-lg mb-3">Dæmi um rekstraráætlun:</h4>
                            <div className="bg-white rounded-lg p-5 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-grey-dark">Fasteignaskattur (árleg):</span>
                                    <span className="font-bold">120.000 kr</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-grey-dark">Rafmagn og hiti (mánaðarlega x12):</span>
                                    <span className="font-bold">180.000 kr</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-grey-dark">Tryggingar (árleg):</span>
                                    <span className="font-bold">80.000 kr</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-grey-dark">Viðhald og þrif:</span>
                                    <span className="font-bold">120.000 kr</span>
                                </div>
                                <div className="border-t-2 border-stone-300 pt-3 flex justify-between font-bold">
                                    <span>Heildarkostnaður á ári:</span>
                                    <span className="text-red-700">500.000 kr</span>
                                </div>
                                <div className="bg-amber/10 rounded p-3 mt-2">
                                    <div className="flex justify-between font-bold text-amber-900">
                                        <span>Framlag á eiganda (4 eigendur):</span>
                                        <span>125.000 kr/ári</span>
                                    </div>
                                    <div className="text-xs text-grey-dark mt-1">
                                        = ca. 10.400 kr/mánuður
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bókhald */}
                    <div>
                        <h2 className="text-3xl font-serif font-bold mb-6">Bókhald</h2>
                        <div className="bg-white rounded-xl p-8 shadow-sm">
                            <p className="text-lg text-grey-dark leading-relaxed mb-6">
                                Eftir að þið hafið sett upp rekstraráætlun, þá er mikilvægt að halda utan um raunverulegan kostnað.
                                Í bókhaldshlutanum skráið þið allar tekjur og gjöld.
                            </p>

                            <h3 className="text-xl font-bold mb-4">Hvað er hægt að skrá:</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                    <div>
                                        <strong>Útgjöld með kvittunum:</strong> Hlaða upp mynd af kvittun og flokka eftir tegund
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                    <div>
                                        <strong>Tekjur:</strong> Innborganir frá eigendum eða útleigutekjur
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                    <div>
                                        <strong>Skipta kostnaði:</strong> Ef margir eigendur greiða saman fyrir eitthvað
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Sameiginlegur reikningur */}
                    <div>
                        <h2 className="text-3xl font-serif font-bold mb-6">Sameiginlegur bankareikningur eða hússjóður?</h2>
                        <div className="bg-white rounded-xl p-8 shadow-sm space-y-4">
                            <p className="text-lg text-grey-dark leading-relaxed">
                                Þegar mörg húsfélög eða meðeigendur sumarhúsa ákveða að halda utan um fjármálin, er fyrsta skrefið oft að stofna <strong>sameiginlegan bankareikning</strong>. 
                                Þessi reikningur er notaður til að greiða fyrir rekstur, rafmagn, hita og viðhald.
                            </p>
                            <p className="text-lg text-grey-dark leading-relaxed">
                                Hins vegar getur verið flókið að fylgjast með hver greiddi hvað inn á reikninginn og hver á eftir að borga. 
                                Þar kemur <strong>hússjóðskerfi Bústaðarins</strong> til sögunnar. Í stað þess að einn aðili þurfi að vera með Excel-skjal og fara yfir heimabankann mánaðarlega:
                            </p>
                            <ul className="space-y-3 pt-2">
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                                    <span><strong>Sjálfvirk skráning:</strong> Eigendur skrá innborganir og útgjöld beint í kerfið.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                                    <span><strong>Myndir af kvittunum:</strong> Engar týndar pappírskvittanir. Hlaðið upp mynd af reikningnum strax.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                                    <span><strong>Rauntíma yfirlit:</strong> Allir meðeigendur sjá nákvæmlega hver staða sameiginlega reikningsins er.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Hár rafmagnsreikningur */}
                    <div>
                        <h2 className="text-3xl font-serif font-bold mb-6">Hár rafmagnsreikningur í sumarhúsi — Hvað er meðalkostnaðurinn?</h2>
                        <div className="bg-white rounded-xl p-8 shadow-sm space-y-4">
                            <p className="text-lg text-grey-dark leading-relaxed">
                                Margir rekast á það að <strong>rafmagnsreikningurinn í bústaðnum er óvenju hár</strong>, sérstaklega yfir vetrarmánuðina. 
                                Sumarhús á Íslandi eru oft kynt með rafmagni (ýmist með ofnum eða gólfhita) og ef heitur pottur er kyntur allan ársins hring getur það kostað sitt.
                            </p>
                            <div className="bg-stone-50 border border-stone-200 rounded-lg p-5 my-4">
                                <h4 className="font-bold text-charcoal mb-2">Hvað er meðal rafmagnsreikningur í sumarhúsi?</h4>
                                <ul className="space-y-2 text-sm text-grey-dark">
                                    <li>• <strong>Sumar:</strong> 4.000 – 8.000 kr. á mánuði (lágmarks kynding, enginn heitur pottur).</li>
                                    <li>• <strong>Vetur (meðal kynding):</strong> 12.000 – 20.000 kr. á mánuði.</li>
                                    <li>• <strong>Vetur (mikil kynding + heitur pottur):</strong> 25.000 – 45.000+ kr. á mánuði.</li>
                                </ul>
                            </div>
                            <p className="text-lg text-grey-dark leading-relaxed">
                                <strong>Hvernig er best að skipta rafmagnsreikningi í sameign?</strong>
                            </p>
                            <p className="text-grey-dark leading-relaxed">
                                Ein algengasta deilan í sameign er þegar einn aðili notar bústaðinn mikið yfir kaldasta tímabilið en annar notar hann aðeins yfir sumarið, en báðir borga sama hlutfall í rafmagn. 
                                Með Bústaðnum getið þið:
                            </p>
                            <ul className="space-y-3 pt-2">
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                                    <span><strong>Greiða eftir notkun:</strong> Skipta mánaðarlegum rafmagnsreikningi hlutfallslega miðað við næturfjölda sem hver dvaldi í mánuðinum.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                                    <span><strong>Sjóðskipting:</strong> Halda úti hússjóði þar sem föst mánaðarleg upphæð dugar fyrir meðaltali ársins.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Gagnsæi og traust */}
                    <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-8 border-2 border-blue-200">
                        <div className="flex items-center gap-3 mb-6">
                            <PiggyBank className="w-8 h-8 text-blue-600" />
                            <h2 className="text-3xl font-serif font-bold">Gagnsæi og traust</h2>
                        </div>

                        <p className="text-lg text-grey-dark leading-relaxed mb-6">
                            Bústaðurinn.is heldur sjálfkrafa utan um allar tekjur og gjöld. Þetta skapar gagnsæi og traust milli eigenda.
                        </p>

                        <h3 className="text-xl font-bold mb-4">Allir eigendur geta séð:</h3>
                        <div className="space-y-3">
                            <div className="bg-white rounded-lg p-4 flex items-start gap-3">
                                <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                                <span>Hversu mikið er í hússjóði núna (rauntíma staða)</span>
                            </div>
                            <div className="bg-white rounded-lg p-4 flex items-start gap-3">
                                <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                                <span>Öll útgjöld með kvittunum og skýringum</span>
                            </div>
                            <div className="bg-white rounded-lg p-4 flex items-start gap-3">
                                <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                                <span>Hver hefur greitt og hverjir eiga eftir að greiða</span>
                            </div>
                            <div className="bg-white rounded-lg p-4 flex items-start gap-3">
                                <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                                <span>Samanburð: Áætlaður vs raunverulegur kostnaður</span>
                            </div>
                        </div>
                    </div>

                    {/* Privacy settings */}
                    <div className="bg-amber/10 rounded-xl p-6 border-l-4 border-amber">
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5 text-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Athugið:
                        </h3>
                        <p className="text-grey-dark">
                            Stjórnandi húss getur valið að loka aðgangi að fjármálum fyrir almenna meðeigendur ef það hentar ykkur betur.
                            Þá sjá aðeins stjórnendur og þeir sem fá sérstaklega heimild fjármálaupplýsingar.
                        </p>
                    </div>

                </div>
            </section>

            {/* CTA */}
            <section className="bg-charcoal text-white py-20">
                <div className="container max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-serif font-bold mb-4">Tilbúinn að halda utan um fjármálin?</h2>
                    <p className="text-xl text-stone-300 mb-8">
                        Byrjaðu að nota hússjóð og bókhald í Bústaðnum.
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
