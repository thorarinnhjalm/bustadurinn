import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#FDFCF8]">
            {/* Header */}
            <header className="bg-white border-b border-stone-100 py-4 px-6 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    <Link to="/" className="text-stone-500 hover:text-charcoal transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex items-center gap-2">
                        <FileText className="text-amber" size={20} />
                        <h1 className="font-serif font-bold text-lg">Notkunarskilmálar</h1>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-6 py-12">
                <div className="prose prose-stone max-w-none">
                    <p className="text-stone-500 mb-8">
                        Síðast uppfært: {new Date().toLocaleDateString('is-IS')}
                    </p>

                    <h2>1. Samþykki skilmála</h2>
                    <p>
                        Með því að nota bustadurinn.is ("Þjónustuna") samþykkir þú þessa notkunarskilmála.
                        Ef þú samþykkir ekki skilmálana, vinsamlegast notaðu ekki Þjónustuna.
                    </p>

                    <h2>2. Lýsing á þjónustu</h2>
                    <p>
                        Bústaðurinn er vettvangur fyrir fjölskyldur og eigendahópa til að stjórna
                        sameiginlegum sumarhúsum. Þjónustan býður upp á:
                    </p>
                    <ul>
                        <li>Dagatalsstjórnun og bókanir</li>
                        <li>Verkefnastjórnun og innkaupalista</li>
                        <li>Fjármálayfirliti og kostnaðardeiling</li>
                        <li>Gestasíður með upplýsingum fyrir gesti</li>
                    </ul>

                    <h2>3. Notendareikningar</h2>
                    <p>
                        Þú berð ábyrgð á að vernda innskráningarupplýsingar þínar og allar aðgerðir
                        sem gerðar eru undir reikningnum þínum.
                    </p>

                    <h2>4. Notkunarreglur</h2>
                    <p>Þú samþykkir að:</p>
                    <ul>
                        <li>Nota Þjónustuna aðeins í löglegum tilgangi</li>
                        <li>Gefa ekki óleyfilega aðgang að reikningnum þínum</li>
                        <li>Setja ekki inn ólöglegt eða skaðlegt efni</li>
                        <li>Reyna ekki að skaða eða trufla Þjónustuna</li>
                    </ul>

                    <h2>5. Hugverkaréttur</h2>
                    <p>
                        Allt efni, hönnun og hugbúnaður Þjónustunnar er eign Neðri Hóll Hugmyndahús ehf.
                        (kt. 470126-2480) og vernduð af lögum um hugverkarétt.
                    </p>

                    <h2>6. Ábyrgðartakmarkanir</h2>
                    <p>
                        Þjónustan er veitt "eins og hún er" án nokkurra ábyrgða. Við berum ekki
                        ábyrgð á tjóni sem hlýst af notkun Þjónustunnar, þar á meðal gagnatapi
                        eða rekstrartruflunum.
                    </p>

                    <h2>7. Uppsögn</h2>
                    <p>
                        Þú getur hætt að nota Þjónustuna hvenær sem er. Við áskildum okkur rétt til
                        að loka reikningum sem brjóta í bága við þessa skilmála.
                    </p>

                    <h2>8. Breytingar á skilmálum</h2>
                    <p>
                        Við getum breytt þessum skilmálum hvenær sem er. Breytingar taka gildi þegar
                        þær eru birtar á vefsíðunni.
                    </p>

                    <h2>9. Lögsaga</h2>
                    <p>
                        Þessir skilmálar lúta íslenskum lögum. Ágreiningur skal lagður fyrir
                        Héraðsdóm Reykjavíkur.
                    </p>

                    <h2>10. Hafa samband</h2>
                    <p>
                        Ef þú hefur spurningar um þessa skilmála, hafðu samband við okkur á{' '}
                        <a href="mailto:hallo@bustadurinn.is" className="text-amber hover:underline">
                            hallo@bustadurinn.is
                        </a>
                    </p>
                </div>
            </main>
        </div>
    );
}
