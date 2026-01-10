import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#FDFCF8]">
            {/* Header */}
            <header className="bg-white border-b border-stone-100 py-4 px-6 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    <Link to="/" className="text-stone-500 hover:text-charcoal transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex items-center gap-2">
                        <Shield className="text-amber" size={20} />
                        <h1 className="font-serif font-bold text-lg">Persónuverndarstefna</h1>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-6 py-12">
                <div className="prose prose-stone max-w-none">
                    <p className="text-stone-500 mb-8">
                        Síðast uppfært: {new Date().toLocaleDateString('is-IS')}
                    </p>

                    <h2>1. Almennt</h2>
                    <p>
                        Neðri Hóll Hugmyndahús ehf. (kt. 470126-2480) rekur vefsíðuna bustadurinn.is og tengda
                        þjónustu (saman "Þjónustan"). Þessi persónuverndarstefna útskýrir hvernig við
                        söfnum, notum og verndum persónuupplýsingar þínar.
                    </p>

                    <h2>2. Upplýsingasöfnun</h2>
                    <p>Við söfnum eftirfarandi upplýsingum:</p>
                    <ul>
                        <li><strong>Reikningsupplýsingar:</strong> Nafn, netfang og mynd (ef þú skráir þig inn með Google)</li>
                        <li><strong>Notkunarupplýsingar:</strong> Bókanir, verkefni og önnur gögn sem þú skráir í kerfið</li>
                        <li><strong>Tækniupplýsingar:</strong> IP-tala, vafraupplýsingar og kökur (cookies)</li>
                    </ul>

                    <h2>3. Notkun upplýsinga</h2>
                    <p>Við notum upplýsingarnar til að:</p>
                    <ul>
                        <li>Veita þér aðgang að Þjónustunni</li>
                        <li>Senda þér mikilvægar tilkynningar um reikninginn þinn</li>
                        <li>Bæta Þjónustuna og notendaupplifunina</li>
                        <li>Svara fyrirspurnum þínum</li>
                    </ul>

                    <h2>4. Deiling upplýsinga</h2>
                    <p>
                        Við deilum ekki persónuupplýsingum þínum með þriðja aðila nema:
                    </p>
                    <ul>
                        <li>Með samþykki þínu</li>
                        <li>Til að uppfylla lagalegar kröfur</li>
                        <li>Með þjónustuaðilum sem vinna gögn fyrir okkur (t.d. Firebase/Google Cloud)</li>
                    </ul>

                    <h2>5. Gagnaöryggi</h2>
                    <p>
                        Við notum Firebase/Google Cloud til að geyma gögn á öruggum netþjónum.
                        Öll samskipti eru dulkóðuð með SSL/TLS.
                    </p>

                    <h2>6. Þín réttindi</h2>
                    <p>Þú hefur rétt til að:</p>
                    <ul>
                        <li>Fá aðgang að gögnunum þínum</li>
                        <li>Leiðrétta rangar upplýsingar</li>
                        <li>Eyða reikningnum þínum og tengdum gögnum</li>
                        <li>Fá afrit af gögnunum þínum</li>
                    </ul>

                    <h2>7. Kökur (Cookies)</h2>
                    <p>
                        Við notum nauðsynlegar kökur til að Þjónustan virki rétt, og greiningarkökur
                        (analytics) til að skilja hvernig Þjónustan er notuð.
                    </p>

                    <h2>8. Breytingar</h2>
                    <p>
                        Við kunnum að uppfæra þessa stefnu. Verulegar breytingar verða tilkynntar
                        á vefsíðunni eða með tölvupósti.
                    </p>

                    <h2>9. Hafa samband</h2>
                    <p>
                        Ef þú hefur spurningar um þessa persónuverndarstefnu, hafðu samband við okkur á{' '}
                        <a href="mailto:hallo@bustadurinn.is" className="text-amber hover:underline">
                            hallo@bustadurinn.is
                        </a>
                    </p>
                </div>
            </main>
        </div>
    );
}
