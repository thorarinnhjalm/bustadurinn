import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import SEO from '@/components/SEO';

export default function DataDeletionPage() {
    return (
        <div className="min-h-screen bg-[#FDFCF8]">
            <SEO
                title="Eyðing gagna - Bústaðurinn.is"
                description="Leiðbeiningar um hvernig á að eyða aðgangi og gögnum á Bústaðurinn.is"
                canonical="https://www.bustadurinn.is/data-deletion"
            />

            {/* Header */}
            <header className="bg-white border-b border-stone-100 py-4 px-6 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    <Link to="/" className="text-stone-500 hover:text-charcoal transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex items-center gap-2">
                        <Trash2 className="text-amber" size={20} />
                        <h1 className="font-serif font-bold text-lg">Eyðing gagna</h1>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-6 py-12">
                <div className="prose prose-stone max-w-none">
                    <p className="text-stone-500 mb-8">
                        Síðast uppfært: {new Date().toLocaleDateString('is-IS')}
                    </p>

                    <h2>Eyðing aðgangs og gagna</h2>
                    <p>
                        Ef þú vilt eyða aðgangi þínum og öllum tengdum gögnum á Bústaðurinn.is,
                        geturðu gert það með eftirfarandi hætti:
                    </p>

                    <h3>Aðferð 1: Eyða í gegnum stillingarnar (ef þú ert innskráð/ur)</h3>
                    <ol>
                        <li>Skráðu þig inn á <a href="/login">Bústaðurinn.is</a></li>
                        <li>Farðu í <strong>Stillingar</strong> í valmyndinni</li>
                        <li>Skrunaðu niður að "Hættusvæði" (Danger Zone)</li>
                        <li>Smelltu á <strong>"Eyða aðgangi"</strong> takkann</li>
                        <li>Staðfestu eyðinguna</li>
                    </ol>

                    <h3>Aðferð 2: Hafa samband við okkur</h3>
                    <p>
                        Ef þú getur ekki skráð þig inn eða vilt aðstoð við að eyða gögnunum þínum,
                        hafðu samband við okkur með tölvupósti og við eyðum aðganginum fyrir þig innan 30 daga:
                    </p>
                    <p>
                        <strong>Netfang:</strong>{' '}
                        <a href="mailto:hallo@bustadurinn.is" className="text-amber hover:underline">
                            hallo@bustadurinn.is
                        </a>
                    </p>
                    <p>
                        Í tölvupóstinum þarftu að tilgreina:
                    </p>
                    <ul>
                        <li>Netfangið sem þú notaðir til að skrá þig</li>
                        <li>Nafnið þitt sem það birtist á aðganginum</li>
                        <li>Staðfesting að þú viljir eyða öllum gögnum</li>
                    </ul>

                    <h3>Hvað verður eytt?</h3>
                    <p>
                        Þegar þú eyðir aðgangi þínum verður eftirfarandi gögnum eytt varanlega:
                    </p>
                    <ul>
                        <li>Aðgangur þinn (nafn, netfang, mynd)</li>
                        <li>Öll þín persónuupplýsingar í kerfinu</li>
                        <li>Verkefni og bókanir sem þú hefur búið til</li>
                        <li>Myndir sem þú hefur hlaðið upp</li>
                        <li>Tilkynningar og skilaboð</li>
                    </ul>

                    <div className="bg-amber/10 border border-amber/20 rounded-lg p-4 my-6">
                        <p className="text-sm text-charcoal m-0">
                            <strong>Athugið:</strong> Þessi aðgerð er óafturkræf. Þegar gögnum hefur verið eytt
                            er ekki hægt að endurheimta þau.
                        </p>
                    </div>

                    <h3>Facebook notendur</h3>
                    <p>
                        Ef þú skráðir þig með Facebook aðgangi þínum, mun Bústaðurinn.is eyða öllum
                        gögnum sem við söfnuðum frá Facebook (nafn, netfang, prófílmynd) ásamt öllum
                        öðrum gögnum sem þú bjóst til í kerfinu okkar.
                    </p>

                    <h3>Spurningar?</h3>
                    <p>
                        Ef þú hefur spurningar um eyðingu gagna eða persónuverndarstefnu okkar,
                        hafðu samband við okkur á{' '}
                        <a href="mailto:hallo@bustadurinn.is" className="text-amber hover:underline">
                            hallo@bustadurinn.is
                        </a>
                    </p>

                    <p className="text-sm text-stone-500 mt-8">
                        Sjá einnig:{' '}
                        <Link to="/privacy" className="text-amber hover:underline">
                            Persónuverndarstefna
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
