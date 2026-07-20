import MarketingLayout from '@/components/MarketingLayout';
import { Calendar, User, Wallet, Wifi, Bell, Shield, CheckCircle2, ArrowRight, Home, ClipboardCheck, BookOpen, WifiOff, CloudRain, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

import { CalendarMockup, FairnessMockup, FinanceMockup, RolesMockup, GuestLinkMockup, NotificationsMockup, MultiHouseMockup } from '@/components/FeatureMockups';

export default function FeaturesPage() {
    const features = [
        {
            icon: Calendar,
            title: "Bókunardagatal",
            shortDesc: "Einfalt og skýrt dagatal sem sýnir hver á hvaða helgi.",
            description: "Bókunardagatalið okkar er hannað til að gera stjórnun sumarhússins einfalda og skjóta. Sjáðu við fyrstu sýn hver hefur bókað og hvenær. Dagatalið sýnir alla meðeigendur með mismunandi litum, svo að allir sjá strax hverjir eru búnir að taka hvaða helgar. Ef bókun skarast við aðra færðu viðvörun um árekstur — kerfið sýnir hver á hina bókunina og hvenær — og getur valið að bóka samt ef um sameiginlega dvöl er að ræða.",
            benefits: [
                "Sjáðu allar bókanir í einu yfirliti",
                "Litakóðaðar bókanir eftir meðeiganda",
                "Viðvörun um árekstur — þú ræður hvort þú bókar samt",
                "Tilkynningar þegar bókun er gerð"
            ],
            useCases: [
                "Skipuleggðu fjölskylduverur fram í tímann",
                "Sjáðu strax hver á skarandi bókun áður en þú staðfestir þína",
                "Deildu bústaðnum með fjölskyldunni sömu helgi ef þið viljið"
            ],
            imageUrl: "/screenshots/calendar.png",
            MockupComponent: CalendarMockup
        },
        {
            icon: Shield,
            title: "Sanngirnisregla",
            shortDesc: "Röðunarkerfi sem tryggir að allir fái sanngjarnan aðgang að stórhelgunum fjórum.",
            description: "Sanngirnisreglan er innbyggt röðunarkerfi fyrir fjórar stórhelgar: páska, verslunarmannahelgina, jólin og áramótin. Kerfið heldur utan um sögu hvers meðeiganda og raðar þeim sem sjaldnast — eða lengst síðan — hafa fengið helgina fremst í röðina. „Stórhelgar\"-spjaldið á dagatalinu sýnir hvers réttur er hverju sinni, sögu síðustu ára og býður upp á að taka helgina með einum smelli. Þremur mánuðum fyrir hverja helgi opnast bókunin öllum meðeigendum, óháð röð. Í stillingum húss velur stjórnandi á milli sanngirnisreglu og „hver kemur fyrst\".",
            benefits: [
                "Sjálfvirk röðun fyrir páska, verslunarmannahelgi, jól og áramót",
                "„Stórhelgar\"-spjaldið sýnir hvers réttur er og sögu síðustu ára",
                "Taktu helgina með einum smelli þegar röðin er komin að þér",
                "Forgangur opnast öllum 3 mánuðum fyrir hverja helgi"
            ],
            useCases: [
                "Sjáðu strax hver á rétt á næstu jólum eða páskum",
                "Leystu ágreining með gagnsærri sögu síðustu ára",
                "Veldu sanngirnisreglu eða „hver kemur fyrst\" í stillingum hússins"
            ],
            imageUrl: "/screenshots/calendar.png",
            MockupComponent: FairnessMockup
        },
        {
            icon: User,
            title: "Hlutverkastýring",
            shortDesc: "Skilgreindu bústaðastjóra og almenna meðeigendur.",
            description: "Bústaðurinn.is styður mismunandi notendahlutverk. Bústaðastjórinn (Manager) hefur fullt aðgengi og getur breytt stillingum, bætt við notendum og stjórnað fjármálum. Almennir meðeigendur geta bókað, skráð útgjöld og séð upplýsingar, en ekki breytt grunnskipan kerfisins. Þetta gefur ykkur svigrúm til að hafa einn aðalstarfsmann sem sér um uppfærslur, en allir aðrir geta samt notað kerfið að fullu. Hægt er að bjóða nýjum meðeigendum með einföldum tölvupósti.",
            benefits: [
                "Einn stjórnandi með fullt aðgengi",
                "Allir aðrir geta bókað og skráð",
                "Greiður aðgangur fyrir nýja meðeigendur",
                "Örugg og einföld umsjón"
            ],
            useCases: [
                "Bústaðastjóri sér um stillingar og viðhald",
                "Meðeigendur bóka og deila upplýsingum",
                "Bættu við nýjum meðeiganda þegar eignarhlutur skiptist"
            ],
            imageUrl: "/screenshots/tasks.png",
            MockupComponent: RolesMockup
        },
        {
            icon: Wallet,
            title: "Fjárhagsyfirlit",
            shortDesc: "Halddu utan um hússjóðinn og sjáðu strax stöðuna.",
            description: "Fjárhagskerfið gerir þér kleift að halda fullkomnu bókhaldi yfir allt sem varðar sumarhúsið. Skráðu innborganir, útgjöld, viðhaldsvinnu og leigu. Kerfið flokkkar sjálfkrafa eftir tegund og sýnir stöðu hússjóðsins. Þú hefur fulla stjórn á hverjir sjá hvað – felaðu fjármálin fyrir öðrum eða gefðu aðgang bara til maka.",
            benefits: [
                "Sjáðu stöðu hússjóðs í rauntíma",
                "Stjórnaðu hverjir sjá fjármálin",
                "Flokka útgjöld eftir tegund",
                "Rekstraráætlun (budget) fyrir hússjóðinn"
            ],
            useCases: [
                "Halda utan um rafmagnsreikninga og fasteignagjöld",
                "Skipuleggja stórar framkvæmdir (t.d. málun, þakviðgerð)",
                "Deila kostnaði sanngjarnt á alla meðeigendur"
            ],
            imageUrl: "/screenshots/finance.png",
            MockupComponent: FinanceMockup
        },
        {
            icon: Wifi,
            title: "Stafrænn Gestaaðgangur",
            shortDesc: "Deildu upplýsingum með gestum í gegnum tímabundna hlekki.",
            description: "Gestaaðgangurinn er bylting í samskiptum við gesti. Búðu til 'Töfrahlekki' (Magic Links) fyrir hverja bókun sem virkjast sjálfkrafa 24 tímum fyrir komu og renna út eftir brottför. Gestir fá upplýsingar um aðgang, WiFi, pottinn og reglur beint í símann án þess að þurfa að hlaða niður appi eða skrá sig inn. Þú getur líka verið með fastan hlekk fyrir fjölskylduna.",
            benefits: [
                "Sjálfvirkir hlekkir fyrir hverja bókun",
                "Virkjast sjálfkrafa og renna út",
                "Ekkert app, engin innskráning fyrir gesti",
                "Virkar fullkomlega í síma"
            ],
            useCases: [
                "Sendu leigjanda hlekk sem virkar bara á meðan dvöl stendur",
                "Láttu gesti sjá pin-númer og WiFi lykilorð",
                "Stafræn gestabók og veðurupplýsingar á staðnum"
            ],
            imageUrl: "/screenshots/guest-settings.png",
            MockupComponent: GuestLinkMockup
        },
        {
            icon: Bell,
            title: "Tilkynningar og Áminningar",
            shortDesc: "Ýtitilkynningar, bjalla í appinu og tölvupóstur — þú missir aldrei af neinu.",
            description: "Kerfið sendir tilkynningar á þremur leiðum: ýtitilkynningar (push) beint í símann, bjölluna inni í appinu og tölvupóst þegar bókun er gerð. Þú færð vitneskju um nýjar bókanir, úthlutuð verkefni, hluti sem bætt er á innkaupalistann, aðildarbeiðnir og veðurviðvaranir fyrir komandi ferðir. Ýtitilkynningar eru valkvæðar — þér er boðið að virkja þær á yfirlitssíðunni.",
            benefits: [
                "Ýtitilkynningar (push) beint í símann",
                "Bjalla með tilkynningum inni í appinu",
                "Tölvupóstur þegar bókun er gerð",
                "Nær yfir bókanir, verkefni, innkaupalista, aðildarbeiðnir og veður"
            ],
            useCases: [
                "Fáðu ýtitilkynningu um leið og einhver bókar næstu helgi",
                "Vertu látinn vita samstundis þegar verkefni er úthlutað á þig",
                "Fáðu viðvörun ef óveður er í kortunum fyrir næstu ferð"
            ],
            imageUrl: "/screenshots/dashboard.png",
            MockupComponent: NotificationsMockup
        },
        {
            icon: Home,
            title: "Mörg hús í einu",
            shortDesc: "Stýrðu öllum þínum sumarhúsum á einum stað.",
            description: "Ertu meðeigandi í mörgum bústöðum? Ekkert mál. Bústaðurinn.is gerir þér kleift að bæta við mörgum húsum undir sama notandaaðganginn. Þú getur auðveldlega skipt á milli húsa á stjórnborðinu án þess að skrá þig út. Hvert hús hefur sitt eigið dagatal, sína meðeigendur og sitt eigið bókhald. Þetta tryggir að enginn ruglingur verði á milli eigna.",
            benefits: [
                "Einn aðgangur - mörg hús",
                "Einfaldur valgluggi til að skipta um hús",
                "Aðskilin gögn og fjármál fyrir hvert hús",
                "Fullkomin yfirsýn yfir allar eignir"
            ],
            useCases: [
                "Skiptu hratt á milli fjölskyldubústaðarins og þíns eigin",
                "Halda utan um mörg hús í útleigu",
                "Sjáðu stöðu margra félagshúsa á einum stað"
            ],
            imageUrl: "/screenshots/dashboard.png",
            MockupComponent: MultiHouseMockup
        },
        {
            icon: ClipboardCheck,
            title: "Gátlistar og birgðastaða",
            shortDesc: "Komu- og brottfarargátlistar sem uppfæra innkaupalistann sjálfkrafa.",
            description: "Bústaðurinn.is kemur með komugátlista og brottfarargátlista með íslenskum sjálfgefnum atriðum, fullkomlega sérsniðanlegum að ykkar húsi. Þegar farið er í gegnum brottfarargátlistann er hægt að merkja hluti sem eru búnir eða á þrotum — þeir bætast sjálfkrafa á sameiginlega innkaupalistann fyrir næstu ferð. Árstíðabundnir listar fyrir vor-opnun og vetrarfrágang birtast sem áminningar á yfirlitssíðunni í apríl–maí og september–október.",
            benefits: [
                "Komugátlisti og brottfarargátlisti með íslenskum sjálfgefnum atriðum",
                "Birgðastaða við brottför bætist sjálfkrafa á innkaupalistann",
                "Árstíðabundnir listar fyrir vor-opnun og vetrarfrágang",
                "Allt fullkomlega sérsniðanlegt að ykkar húsi"
            ],
            useCases: [
                "Gleymdu aldrei að skrúfa fyrir vatn eða læsa á brottfarardegi",
                "Láttu birgðastöðuna sjálfkrafa fylla á innkaupalistann",
                "Fáðu áminningu um voropnun og vetrarfrágang á réttum tíma"
            ],
            imageUrl: "/screenshots/tasks.png"
        },
        {
            icon: BookOpen,
            title: "Árbók",
            shortDesc: "Sjálfvirk, prentanleg árbók með tölfræði og hátíðarsigurvegurum ársins.",
            description: "Í lok hvers árs útbýr kerfið sjálfkrafa árbók fyrir húsið á /arbok — fjölda nátta, tölfræði fyrir hverja fjölskyldu, lengstu dvölina, hver vann hverja stórhelgi og valdar tilvitnanir úr gestabókinni. Árbókin er prentanleg og tilvalin til að rifja upp árið á aðalfundi eða senda á alla meðeigendur.",
            benefits: [
                "Sjálfvirkt tekin saman í lok hvers árs",
                "Nætur og tölfræði fyrir hverja fjölskyldu",
                "Sýnir hver vann hverja stórhelgi",
                "Prentanleg — tilvalin fyrir aðalfundinn"
            ],
            useCases: [
                "Rifjaðu upp árið á aðalfundi meðeigenda",
                "Sjáðu lengstu dvölina og skemmtilegustu gestabókarfærslurnar",
                "Prentaðu árbókina og geymdu sem minjagrip"
            ],
            imageUrl: "/screenshots/dashboard.png"
        },
        {
            icon: WifiOff,
            title: "Virkar ótengt",
            shortDesc: "Dagatal, verkefni og innkaupalisti eru læsileg þó sambandslaust sé í bústaðnum.",
            description: "Mörg sumarhús eru með lélegt eða ekkert netsamband. Bústaðurinn.is er byggður sem PWA með ofangeymslu (offline cache) svo dagatalið, verkefnalistinn og innkaupalistinn eru læsileg jafnvel þegar ekkert samband er. Breytingar sem þú gerir ótengd(ur) samstillast sjálfkrafa um leið og síminn nær sambandi aftur.",
            benefits: [
                "Dagatal, verkefni og innkaupalisti læsileg án nettengingar",
                "Breytingar samstillast sjálfkrafa þegar samband næst á ný",
                "Ekkert app að sækja — virkar beint í vafranum sem PWA",
                "Tilvalið fyrir bústaði með lélegt netsamband"
            ],
            useCases: [
                "Skoðaðu verkefnalistann þó enginn sími-sambandsstyrkur sé í bústaðnum",
                "Merktu verkefni kláruð og láttu þau samstillast síðar",
                "Skráðu útgjöld á staðnum án þess að bíða eftir netsambandi"
            ],
            imageUrl: "/screenshots/dashboard.png"
        },
        {
            icon: CloudRain,
            title: "Veðurviðvaranir",
            shortDesc: "Sjálfvirk dagleg athugun varar við óveðri áður en þið leggjið af stað.",
            description: "Þegar bókun er innan við viku í burtu birtist veðurspákort fyrir bústaðinn á yfirlitssíðunni. Kerfið framkvæmir daglega sjálfvirka athugun og sendir ýtitilkynningu og tilkynningu í appinu ef spáð er stormi, snjókomu, frosti, mikilli úrkomu eða hvassviðri fyrir bókanir sem hefjast innan þriggja daga.",
            benefits: [
                "Veðurspákort á yfirlitssíðunni fyrir bókanir innan viku",
                "Dagleg sjálfvirk athugun á veðurspá",
                "Ýtitilkynning og tilkynning í appinu fyrir alvarleg veður",
                "Nær yfir storm, snjókomu, frost, úrkomu og hvassviðri"
            ],
            useCases: [
                "Vittu fyrirfram hvort þörf sé á að skrúfa niður hitann",
                "Fáðu viðvörun um hálku eða snjókomu áður en lagt er af stað",
                "Skipuleggðu ferðina betur með veðurspá beint á yfirlitssíðunni"
            ],
            imageUrl: "/screenshots/dashboard.png"
        },
        {
            icon: RefreshCw,
            title: "Ársyfirlit og áminningar",
            shortDesc: "Árlegt uppgjör fyrir hverja fjölskyldu og áminningar áður en reikningar gjaldfalla.",
            description: "Fjárhagskerfið heldur utan um rekstraráætlun (budget) fyrir hússjóðinn og sendir áminningar um endurtekna reikninga áður en þeir gjaldfalla — til dæmis að rafmagnsreikningur sé væntanlegur. Í lok árs fá allir aðgang að Ársyfirliti sem sýnir framlög og útgjöld hverrar fjölskyldu.",
            benefits: [
                "Rekstraráætlun (budget) fyrir hússjóðinn",
                "Áminningar um endurtekna reikninga fyrir gjalddaga",
                "Ársyfirlit í lok árs fyrir hverja fjölskyldu",
                "Allt sjálfvirkt og gagnsætt fyrir alla meðeigendur"
            ],
            useCases: [
                "Fáðu áminningu áður en rafmagnsreikningurinn gjaldfellur",
                "Berðu saman rekstraráætlun við raunveruleg útgjöld",
                "Skoðaðu Ársyfirlitið þitt í lok árs fyrir skattframtal eða uppgjör"
            ],
            imageUrl: "/screenshots/finance.png"
        }
    ];

    const faqs = [
        {
            question: "Hvernig virkar sanngirnisreglan nákvæmlega?",
            answer: "Sanngirnisreglan er röðunarkerfi fyrir fjórar stórhelgar — páska, verslunarmannahelgina, jólin og áramótin. Sá meðeigandi sem hefur sjaldnast eða lengst síðan fengið helgina er efstur í röðinni. „Stórhelgar\"-spjaldið á dagatalinu sýnir hvers réttur er og sögu síðustu ára, og hægt er að taka helgina með einum smelli. Þremur mánuðum fyrir hverja helgi opnast bókunin öllum meðeigendum, óháð röð."
        },
        {
            question: "Get ég notað kerfið fyrir fleiri en eitt sumarhús?",
            answer: "Já! Þú getur bætt við fleiri en einu húsi í sama reikningnum. Hvert hús hefur sitt eigið dagatal, fjármál og meðeigendur. Þetta er tilvalið ef þú ert meðeigandi í mörgum sumarhúsum."
        },
        {
            question: "Er hægt að úthluta kostnaði á einstaka meðeigendur?",
            answer: "Já, í fjárhagskerfinu getur þú merkt hvert útgjald við þann sem greiddi. Síðan sérðu yfirlit yfir hver hefur greitt hvað, og hver skuldar hvað. Þetta gerir uppgjör auðvelt."
        },
        {
            question: "Hvað gerist ef við viljum breyta einhverju á bókun?",
            answer: "Bústaðastjórinn getur breytt eða eytt hvaða bókun sem er. Almennir meðeigendur geta breytt eða eytt sínum eigin bókunum. Þegar bókun er breytt eða eytt fá allir tilkynningu."
        },
        {
            question: "Get ég úthlutað verkefnum á aðra meðeigendur?",
            answer: "Já! Í verkefnalistanum getur þú búið til nýtt verkefni og úthlutað því á hvern sem er. Sá sem verkefnið er úthlutað á fær tölvupóst og sér verkefnið á sínum verkefnalista."
        },
        {
            question: "Hvernig get ég prófað kerfið áður en ég skrái húsið mitt?",
            answer: "Við bjóðum þér að skoða fullt vinnandi dæmi af kerfinu á /prufa síðunni. Þar geturðu smellt á allt og prófað alla eiginleika. Engin skráning þarf."
        },
        {
            question: "Er kerfið á íslensku og er það aðlagað íslenskum sumarhúsum?",
            answer: "Já! Bústaðurinn.is er hannað frá grunni fyrir íslensk sumarhús. Allt er á íslensku, dagsetningar eru á íslenskum formum, og gjaldmiðill er ISK. Við vitum að íslensk sumarhús eru oft í meðeign, þess vegna er sanngirnisreglan svo mikilvæg."
        }
    ];

    return (
        <>
            <MarketingLayout
                title="Eiginleikar | Bústaðurinn.is — Ókeypis app og bókunarkerfi fyrir sumarhús"
                description="Allir eiginleikar Bústaðurinn.is: Bókunardagatal, sanngirnisregla, hússjóður, verkefnastjórnun og gestaaðgangur. Ókeypis sumarhúsaforrit — engin binding."
                keywords="sumarhúsaforrit eiginleikar, bókunarkerfi sumarhús, sumarhús app, hússjóður, sanngirnisregla, gestaaðgangur sumarhús, ókeypis sumarhús kerfi"
                canonical="https://www.bustadurinn.is/eiginleikar"
                structuredData={{
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    "name": "Bústaðurinn.is",
                    "applicationCategory": "BusinessApplication",
                    "operatingSystem": "Web",
                    "offers": {
                        "@type": "Offer",
                        "price": "0",
                        "priceCurrency": "ISK"
                    },
                    "featureList": [
                        "Bókunardagatal með árekstrarviðvörun",
                        "Sanngirnisregla — röðun fyrir stórhelgar",
                        "Fjárhagsyfirlit og rekstraráætlun fyrir hússjóð",
                        "Verkefnastjórnun",
                        "Hlutverkastýring fyrir meðeigendur",
                        "Stafrænn gestaaðgangur",
                        "Tilkynningar (push, í appinu og tölvupóstur)",
                        "Gátlistar og sjálfvirk birgðastaða",
                        "Árbók",
                        "Virkar ótengt (offline)",
                        "Veðurviðvaranir",
                        "Ársyfirlit og áminningar um endurtekna reikninga"
                    ],
                    "description": "Stjórnunarkerfi fyrir íslensk sumarhús í meðeign"
                }}
            >
                {/* Hero */}
                <div className="bg-bone py-24">
                    <div className="container max-w-6xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h1 className="text-4xl md:text-5xl font-serif mb-4">Allt sem þú þarft til að stjórna sumarhúsinu</h1>
                            <p className="text-xl text-grey-dark max-w-3xl mx-auto leading-relaxed">
                                Bústaðurinn.is er hannað frá grunni með þarfir íslenskra sumarhúsaeigenda í huga.
                                Hér eru allir eiginleikar í einu kerfi – bókanir, fjármál, verkefni og samskipti.
                            </p>
                            <div className="mt-8 flex gap-4 justify-center flex-wrap">
                                <Link to="/prufa" className="btn btn-primary">
                                    Skoða kerfið í vinnslu
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                                <Link to="/" className="btn btn-secondary">
                                    Byrja ókeypis</Link>
                            </div>
                        </div>

                        {/* Feature Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
                            {features.map((feature, index) => (
                                <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                    <feature.icon className="w-10 h-10 text-amber mb-6" />
                                    <h3 className="text-xl font-serif mb-3">{feature.title}</h3>
                                    <p className="text-grey-dark leading-relaxed">
                                        {feature.shortDesc}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Detailed Features */}
                        <div className="space-y-24">
                            {features.map((feature, index) => (
                                <div key={index} className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 items-center`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-14 h-14 bg-amber/10 rounded-lg flex items-center justify-center">
                                                <feature.icon className="w-8 h-8 text-amber" />
                                            </div>
                                            <h2 className="text-3xl font-serif">{feature.title}</h2>
                                        </div>
                                        <p className="text-grey-dark leading-relaxed mb-6 text-lg">
                                            {feature.description}
                                        </p>

                                        <div className="mb-6">
                                            <h4 className="font-semibold text-charcoal mb-3">Kostir:</h4>
                                            <ul className="space-y-2">
                                                {feature.benefits.map((benefit, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                        <span className="text-grey-dark">{benefit}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold text-charcoal mb-3">Dæmi um notkun:</h4>
                                            <ul className="space-y-2">
                                                {feature.useCases.map((useCase, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <span className="text-amber font-mono">→</span>
                                                        <span className="text-grey-dark">{useCase}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-stone-100 aspect-video relative group transform hover:scale-[1.02] transition-transform duration-500">
                                            {feature.MockupComponent ? (
                                                <feature.MockupComponent />
                                            ) : (
                                                <img
                                                    src={feature.imageUrl}
                                                    alt={feature.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* FAQ Section */}
                        <div className="mt-32">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl md:text-4xl font-serif mb-4">Algengar spurningar</h2>
                                <p className="text-xl text-grey-dark max-w-2xl mx-auto">
                                    Svör við spurningum sem við fáum oftast um kerfið
                                </p>
                            </div>
                            <div className="max-w-3xl mx-auto space-y-6">
                                {faqs.map((faq, index) => (
                                    <div key={index} className="bg-white p-8 rounded-xl shadow-sm">
                                        <h3 className="text-lg font-semibold text-charcoal mb-3">{faq.question}</h3>
                                        <p className="text-grey-dark leading-relaxed">{faq.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Handbook cross-links — internal linking to funnel authority to the SEO-focused handbook pages */}
                        <div className="mt-32">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl md:text-4xl font-serif mb-4">Læra meira í handbókinni</h2>
                                <p className="text-xl text-grey-dark max-w-2xl mx-auto">
                                    Ítarlegar leiðbeiningar um hvernig þú stjórnar sumarhúsi í sameign
                                </p>
                            </div>
                            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-4">
                                <Link to="/handbok/bokunarkerfi" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                                    <h3 className="text-lg font-semibold text-charcoal mb-2 group-hover:text-amber transition-colors">Bókunarkerfi fyrir sameignarhús</h3>
                                    <p className="text-grey-dark text-sm">Hvernig sanngirnisreglan og árekstrarvörnin virka fyrir sumarhús í meðeign.</p>
                                </Link>
                                <Link to="/handbok/fjarmal" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                                    <h3 className="text-lg font-semibold text-charcoal mb-2 group-hover:text-amber transition-colors">Hússjóður og fjármál</h3>
                                    <p className="text-grey-dark text-sm">Sameiginlegur reikningur, skipting kostnaðar og utanumhald á hússjóði.</p>
                                </Link>
                                <Link to="/handbok/vidhald" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                                    <h3 className="text-lg font-semibold text-charcoal mb-2 group-hover:text-amber transition-colors">Viðhald og verkefnalisti</h3>
                                    <p className="text-grey-dark text-sm">Hvernig meðeigendur halda utan um viðhald og sameiginleg verkefni.</p>
                                </Link>
                                <Link to="/handbok/uppsetning" className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                                    <h3 className="text-lg font-semibold text-charcoal mb-2 group-hover:text-amber transition-colors">Uppsetning á kerfinu</h3>
                                    <p className="text-grey-dark text-sm">Skref-fyrir-skref leiðbeiningar til að koma sumarhúsinu í kerfið.</p>
                                </Link>
                            </div>
                            <div className="text-center mt-8">
                                <Link to="/handbok" className="text-amber font-medium hover:underline">Skoða alla handbókina →</Link>
                            </div>
                        </div>

                        {/* CTA Section */}
                        <div className="mt-24 bg-gradient-to-br from-amber/10 to-amber/5 rounded-2xl p-12 text-center">
                            <h2 className="text-3xl font-serif mb-4">Tilbúinn að prófa?</h2>
                            <p className="text-xl text-grey-dark mb-8 max-w-2xl mx-auto">
                                Sjáðu kerfið í vinnslu eða búðu til aðgang strax. Ókeypis og opið öllum.
                            </p>
                            <div className="flex gap-4 justify-center flex-wrap">
                                <Link to="/prufa" className="btn btn-secondary">
                                    Skoða dæmi
                                </Link>
                                <Link to="/signup" className="btn btn-primary">
                                    Stofna ókeypis aðgang
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </MarketingLayout>
        </>
    );
}
