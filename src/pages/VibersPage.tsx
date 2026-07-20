/**
 * /vibers — hidden, no-index landing page.
 *
 * A personal letter from Claude (the AI that worked on the system) to Árni
 * and Villi, explaining in plain language what was added. Deliberately:
 * - NOT linked from any navigation
 * - NOT in scripts/generate-sitemap.js
 * - noindex/nofollow via Helmet
 */

import { Helmet } from 'react-helmet-async';
import { Coffee, CalendarCheck, CloudSnow, ListChecks, ShoppingCart, BookOpen, Wallet, WifiOff, Bell } from 'lucide-react';

const sections = [
    {
        icon: CalendarCheck,
        title: 'Hver fær páskana?',
        text: 'Stærsta málið: kerfið man núna hver fékk páskana, verslunarmannahelgina, jólin og áramótin — og hver á næst. Ef þín fjölskylda var með bústaðinn um páskana í fyrra þá eiga hinir forgang næst. Á dagatalinu er nýtt yfirlit sem sýnir svart á hvítu hver á hvaða stórhelgi, svo enginn þarf að rífast um það í fermingarveislu framar.',
    },
    {
        icon: ListChecks,
        title: 'Gátlistar fyrir allt',
        text: 'Þegar þú ferð úr bústaðnum spyr kerfið: læstirðu, lokaðirðu gluggum, tókstu ruslið, skrúfaðirðu fyrir vatnið? Sá sem kemur næst sér hvað var staðfest — og hvað ekki. Það er líka kominn komugátlisti (kveikja á vatni, kynda) og árlegir listar fyrir vor-opnun og vetrarfrágang sem minna á sig sjálfir í apríl og október.',
    },
    {
        icon: ShoppingCart,
        title: 'Aldrei aftur klósettpappírslaus bústaður',
        text: 'Við brottför merkirðu við hvort kaffi, klósettpappír og eldiviður sé til eða á þrotum. Það sem vantar fer sjálfkrafa á sameiginlega innkaupalistann — svo næsta fjölskylda veit hvað á að taka með áður en lagt er af stað.',
    },
    {
        icon: CloudSnow,
        title: 'Veðrið lætur vita af sér',
        text: 'Ef þú átt bókaða helgi og það stefnir í óveður, stórhríð eða frost færðu tilkynningu í símann nokkrum dögum fyrir brottför. Veðurspá fyrir næstu dvöl birtist líka á forsíðunni.',
    },
    {
        icon: CalendarCheck,
        title: 'Bókanir rekast ekki lengur á í blindni',
        text: 'Ef tveir reyna að bóka sömu helgi segir kerfið frá því — hver er skráður og hvenær — og býður samt upp á að bóka ef fjölskyldurnar vilja vera saman í húsinu. Ekkert stopp, bara upplýst ákvörðun.',
    },
    {
        icon: WifiOff,
        title: 'Virkar þó netið sé lélegt í sveitinni',
        text: 'Appið man dagatalið, verkefnin og innkaupalistann þó það náist ekkert samband í bústaðnum. Það sem þú skráir án nets fer sjálfkrafa upp þegar síminn nær sambandi aftur.',
    },
    {
        icon: Wallet,
        title: 'Fjármálin á hreinu',
        text: 'Hægt að skrá eignarhlutföll (hver á hvað stóran hlut), fá áminningu þegar rafmagnsreikningurinn er væntanlegur, og í lok árs verður til ársyfirlit sem sýnir hvað reksturinn kostaði og hvernig hann skiptist.',
    },
    {
        icon: BookOpen,
        title: 'Árbók bústaðarins',
        text: 'Uppáhaldið mitt: kerfið býr sjálfkrafa til árbók fyrir hvert ár — hversu margar nætur var húsið í notkun, hver var duglegastur að mæta, lengsta dvölin, hver fékk stórhelgarnar, og fallegustu færslurnar úr gestabókinni. Hægt að prenta og hengja upp í bústaðnum.',
    },
    {
        icon: Bell,
        title: 'Og allt hitt',
        text: 'Tilkynningar í símann þegar einhver bókar, fær úthlutað verkefni eða bætir á innkaupalistann. Plús slatti af lagfæringum á hlutum sem virkuðu ekki alveg — til dæmis sáu stjórnendur aldrei beiðnir um aðgang að húsinu sínu. Núna gera þeir það.',
    },
];

export default function VibersPage() {
    return (
        <div className="min-h-screen bg-[#fdfcf8] text-[#1a1a1a] font-sans">
            <Helmet>
                <title>Fyrir Árna og Villa</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <div className="max-w-2xl mx-auto px-6 py-16 md:py-24">
                {/* Header */}
                <p className="text-amber font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-8 h-0.5 bg-amber inline-block"></span>
                    Leynisíða — bara fyrir ykkur
                </p>
                <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">
                    Sælir Árni og Villi 👋
                </h1>
                <div className="text-stone-600 leading-relaxed space-y-4 mb-12">
                    <p>
                        Ég heiti Claude og er gervigreindin sem Þórarinn setti í vinnu við
                        Bústaðinn. Hann bað mig að segja ykkur — á mannamáli — frá öllu því
                        sem bættist við kerfið. Þetta var góður dagur, svo hellið upp á
                        könnuna og lesið áfram.
                    </p>
                </div>

                {/* Sections */}
                <div className="space-y-10">
                    {sections.map(({ icon: Icon, title, text }) => (
                        <div key={title} className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center flex-shrink-0 text-amber mt-1">
                                <Icon size={18} />
                            </div>
                            <div>
                                <h2 className="font-serif font-bold text-xl mb-2">{title}</h2>
                                <p className="text-stone-600 leading-relaxed text-[15px]">{text}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-16 pt-8 border-t border-stone-200 text-stone-500 text-sm leading-relaxed space-y-3">
                    <p>
                        Allt þetta er þegar komið í loftið á{' '}
                        <a href="https://bustadurinn.is" className="text-amber font-bold hover:underline">bustadurinn.is</a>
                        {' '}— og kerfið er og verður ókeypis.
                    </p>
                    <p className="flex items-center gap-2">
                        <Coffee size={16} className="text-amber" />
                        <span>Kær kveðja, Claude — gervigreind með veikan blett fyrir íslenskum sumarbústöðum.</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
