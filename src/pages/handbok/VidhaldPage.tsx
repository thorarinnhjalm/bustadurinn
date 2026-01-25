import MarketingLayout from '@/components/MarketingLayout';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, ChevronLeft, ArrowRight } from 'lucide-react';

export default function VidhaldPage() {
    const navigate = useNavigate();

    return (
        <MarketingLayout
            title="Viðhald og verkefnastjórnun - Bústaðurinn.is"
            description="Hvernig á að halda utan um viðhald og verkefni í sumarhúsi. Verkefnalisti, seasonal checklist og skipulag fyrir eigendur."
            keywords="viðhald sumarhús, verkefnastjórnun, task management, seasonal checklist, sumarhús skipulag"
            canonical="https://www.bustadurinn.is/handbok/vidhald"
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
                                        <strong>Merkja sem lokið:</strong> Þegar verkefni er klárað, merkir þú það og það fer í "completed"
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                    <div>
                                        <strong>Sjá stöðu:</strong> List view eða Board view til að sjá öll verkefni í einu
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Seasonal Checklist */}
                    <div>
                        <h2 className="text-3xl font-serif font-bold mb-6">Tímasettar verkefni eftir árstíma</h2>
                        <p className="text-lg text-grey-dark leading-relaxed mb-8">
                            Sumarhús þarf mismunandi viðhald eftir árstíma. Hér er checklist sem þú getur notað sem innblástur:
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Vor */}
                            <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-xl p-6">
                                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <span className="text-3xl">🌱</span>
                                    Vor (mars-maí)
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

                            {/* Sumar */}
                            <div className="bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-200 rounded-xl p-6">
                                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <span className="text-3xl">☀️</span>
                                    Sumar (júní-ágúst)
                                </h3>
                                <ul className="space-y-2 text-grey-dark">
                                    <li className="flex items-start gap-2">
                                        <span className="text-yellow-600 mt-1">•</span>
                                        Viðhalda grasflötum reglulega
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-yellow-600 mt-1">•</span>
                                        Hreinsa heitan pott
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-yellow-600 mt-1">•</span>
                                        Þrífa grill eftir notkun
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-yellow-600 mt-1">•</span>
                                        Athuga glugga og hurðir
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-yellow-600 mt-1">•</span>
                                        Skoða þakviðgerðir ef þörf
                                    </li>
                                </ul>
                            </div>

                            {/* Haust */}
                            <div className="bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200 rounded-xl p-6">
                                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <span className="text-3xl">🍂</span>
                                    Haust (september-nóvember)
                                </h3>
                                <ul className="space-y-2 text-grey-dark">
                                    <li className="flex items-start gap-2">
                                        <span className="text-orange-600 mt-1">•</span>
                                        Taka inn garðhúsgögn
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-orange-600 mt-1">•</span>
                                        Loka vatni fyrir veturinn
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-orange-600 mt-1">•</span>
                                        Hreinsa niðurföll og þakrenni
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-orange-600 mt-1">•</span>
                                        Athuga einangrun og glugga
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-orange-600 mt-1">•</span>
                                        Taka inn/geyma grill og útibúnað
                                    </li>
                                </ul>
                            </div>

                            {/* Vetur */}
                            <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl p-6">
                                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <span className="text-3xl">❄️</span>
                                    Vetur (desember-febrúar)
                                </h3>
                                <ul className="space-y-2 text-grey-dark">
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-1">•</span>
                                        Snjómokstur ef þörf
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-1">•</span>
                                        Athuga að hitakerfið virki
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-1">•</span>
                                        Kíkja reglulega eftir húsinu
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-1">•</span>
                                        Athuga þakálag eftir rok
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 mt-1">•</span>
                                        Fylla á olíu/eldsneyti ef þörf
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Svið verkefnis */}
                    <div>
                        <h2 className="text-3xl font-serif font-bold mb-6">Stöður verkefna</h2>
                        <div className="bg-white rounded-xl p-8 shadow-sm">
                            <p className="text-lg text-grey-dark leading-relaxed mb-6">
                                Í Bústaðnum eru verkefni með þrjár stöður sem hjálpa ykkur að halda utan um hvað er á döfinni:
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-5 bg-stone-50 rounded-lg">
                                    <div className="w-3 h-3 rounded-full bg-grey-mid mt-2"></div>
                                    <div>
                                        <h4 className="font-bold mb-1">Pending (Í bið)</h4>
                                        <p className="text-sm text-grey-dark">Verkefni sem bíða eftir að einhver taki þau að sér</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-5 bg-blue-50 rounded-lg">
                                    <div className="w-3 h-3 rounded-full bg-blue-500 mt-2"></div>
                                    <div>
                                        <h4 className="font-bold mb-1">In Progress (Í vinnslu)</h4>
                                        <p className="text-sm text-grey-dark">Verkefni sem einhver er að vinna að núna</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-5 bg-green-50 rounded-lg">
                                    <div className="w-3 h-3 rounded-full bg-green-500 mt-2"></div>
                                    <div>
                                        <h4 className="font-bold mb-1">Completed (Lokið)</h4>
                                        <p className="text-sm text-grey-dark">Verkefni sem eru kláruð og þarfnast ekki frekari athygli</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pro tips */}
                    <div className="bg-blue-50 rounded-xl p-8 border-2 border-blue-200">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="text-2xl">💡</span>
                            Pro tips fyrir verkefnastjórnun
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
                                <span>Settu deadline á verkefni ef mikilvægt er að það klárist fyrir ákveðinn tíma</span>
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
