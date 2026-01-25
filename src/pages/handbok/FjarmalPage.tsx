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
                        <h2 className="text-3xl font-serif font-bold mb-6">Rekstraráætlun (Budget)</h2>
                        <div className="bg-white rounded-xl p-8 shadow-sm mb-6">
                            <p className="text-lg text-grey-dark leading-relaxed mb-6">
                                Í Bústaðnum getur þú búið til rekstraráætlun fyrir árið. Þetta hjálpar ykkur að áætla hversu mikið þið þurfið
                                að leggja saman til að standa undir kostnaði.
                            </p>

                            <h3 className="text-xl font-bold mb-4">Hvað er hægt að áætla:</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="border border-stone-200 rounded-lg p-4">
                                    <h4 className="font-bold text-green-700 mb-2">📈 Tekjur</h4>
                                    <ul className="text-sm space-y-1 text-grey-dark">
                                        <li>• Útleigutekjur</li>
                                        <li>• Innborganir eigenda</li>
                                        <li>• Aðrar tekjur</li>
                                    </ul>
                                </div>
                                <div className="border border-stone-200 rounded-lg p-4">
                                    <h4 className="font-bold text-red-700 mb-2">📉 Gjöld</h4>
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
                        <h2 className="text-3xl font-serif font-bold mb-6">Bókhald (Ledger)</h2>
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
                        <h3 className="font-bold text-lg mb-2">💡 Athugið:</h3>
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
