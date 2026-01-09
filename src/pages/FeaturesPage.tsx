import MarketingLayout from '@/components/MarketingLayout';
import { Calendar, User, Wallet, Wifi, Bell, Shield, CheckCircle2, ArrowRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

import { CalendarMockup, FairnessMockup, FinanceMockup, RolesMockup, GuestLinkMockup, NotificationsMockup, MultiHouseMockup } from '@/components/FeatureMockups';

export default function FeaturesPage() {
    const features = [
        {
            icon: Calendar,
            title: "Bókunardagatal",
            shortDesc: "Einfalt og skýrt dagatal sem sýnir hver á hvaða helgi.",
            description: "Bókunardagatalið okkar er hannað til að gera stjórnun sumarhússins einfalda og skjóta. Sjáðu við fyrstu sýn hver hefur bókað og hvenær. Dagatalið sýnir alla meðeigendur með mismunandi litum, svo að allir sjá strax hverjir eru búnir að taka hvaða helgar. Kerfið leyfir bókanir allt að 12 mánuði fram í tímann, sem er tilvalið fyrir langtímaáætlanir og hátíðarhelgar eins og jól og páska.",
            benefits: [
                "Sjáðu allar bókanir í einu yfirliti",
                "Litakóðaðar bókanir eftir meðeiganda",
                "Bókaðu allt að 12 mánuði fram í tímann",
                "Tilkynningar þegar bókun er gerð"
            ],
            useCases: [
                "Skipuleggðu fjölskylduverur fram í tímann",
                "Forðastu árekstra við bókanir annarra",
                "Sjáðu nýtingarhlutfall hússins yfir árið"
            ],
            imageUrl: "/screenshots/calendar.png",
            MockupComponent: CalendarMockup
        },
        {
            icon: Shield,
            title: "Sanngirnisregla",
            shortDesc: "Tryggir að allir fái sanngjarnan aðgang að vinsælum helgum.",
            description: "Sanngirnisreglan er einstök lausn sem tryggir að enginn meðeigandi njóti forskots á aðra. Kerfið reiknar sjálfkrafa út forgang byggt á því hversu oft hver hefur bókað áður, hversu marga daga, og hvaða tíma árs. Þetta þýðir að ef einn meðeigandi bókar mörg sumarkvöld, þá fær annar meðeigandi hærri forgang næst. Formúlan er gagnsæ og allir sjá niðurstöðuna, sem útilokar ágreining og tryggir frið í viðskiptum.",
            benefits: [
                "Enginn njóti forskots á aðra",
                "Sjálfvirk útreikningur á forgangi",
                "Gagnsæ formúla sem allir sjá",
                "Dregur úr átökum í meðeigendahópnum"
            ],
            useCases: [
                "Koma í veg fyrir að einn taki allar góðu helgarnar",
                "Tryggja sanngjarna skiptingu yfir árið",
                "Sýna fram á gagnsæi í meðeigendahópi"
            ],
            imageUrl: "/screenshots/calendar.png",
            MockupComponent: FairnessMockup
        },
        {
            icon: Wallet,
            title: "Fjárhagsyfirlit",
            shortDesc: "Halddu utan um hússjóðinn og sjáðu strax stöðuna.",
            description: "Fjárhagskerfið gerir þér kleift að halda fullkomnu bókhaldi yfir allt sem varðar sumarhúsið. Skráðu innborganir, útgjöld, viðhaldsvinnu og leigu. Kerfið flokkkar sjálfkrafa eftir tegund (rafmagn, viðhald, tryggingar, o.fl.) og sýnir þér strax hvort hússjóðurinn sé í plús eða mínus. Þú getur líka úthlutað kostnaði á mismunandi meðeigendur ef þörf krefur. Öll gögn eru auðlæsileg og tilbúin til að deila með bókhaldara eða endurskoðanda.",
            benefits: [
                "Sjáðu stöðu hússjóðs í rauntíma",
                "Flokka útgjöld eftir tegund",
                "Úthlutaðu kostnaði á einstaka eigendur",
                "Útflutningur í Excel fyrir bókhald"
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
            shortDesc: "Fáðu tölvupóst þegar eitthvað mikilvægt gerist.",
            description: "Kerfið sendir sjálfkrafa tölvupóst þegar mikilvægir atburðir gerast: nýjar bókanir, breyting á fyrirliggjandi bókun, eða þegar verkefni á gjalddaga nálgast. Þú getur stillt hvaða tilkynningar þú vilt fá, svo þú gleymir aldrei að mæta á réttum tíma eða að greiða fasteignagjöld á réttum tíma. Allar tilkynningar eru sendar á netfang þitt og þú getur líka séð þær inni í kerfinu.",
            benefits: [
                "Fáðu póst þegar ný bókun er gerð",
                "Áminningar um verkefni á gjalddaga",
                "Tilkynningar um breytingar á bókunum",
                "Stillanleg tíðni og tegund tilkynninga"
            ],
            useCases: [
                "Fáðu áminningar um komandi ferð í sumarhúsið",
                "Vertu upplýstur um nýjar bókanir annarra",
                "Fáðu áminningu þegar gjalddagi nálgast"
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
        }
    ];

    const faqs = [
        {
            question: "Hvernig virkar sanngirnisreglan nákvæmlega?",
            answer: "Sanngirnisreglan reiknar út forgang fyrir hvern meðeiganda byggt á fjölda bókana, fjölda daga og tíma árs. Ef þú bókar mörg sumarkvöld eða helgar, þá lækkar forgangur þinn og aðrir fá hærri forgang. Formúlan er gagnsæ og allir sjá niðurstöðuna."
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
                title="Eiginleikar - Bústaðurinn.is | Bókunarkerfi, Fjármál og Verkefni fyrir Sumarhús"
                description="Yfirlit yfir alla eiginleika Bústaðurinn.is: Bókunardagatal með sanngirnisreglu, fjárhagsyfirlit, hlutverkastýring, gestaaðgangur, tilkynningar og fleira. Hannað fyrir íslensk sumarhús í sameign."
                keywords="sumarhús eiginleikar, bókunarkerfi, fjárhagskerfi, verkefnastjórnun, gestaaðgangur, sanngirnisregla, íslensk sumarhús"
                canonical="https://bustadurinn.is/eiginleikar"
                structuredData={{
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    "name": "Bústaðurinn.is",
                    "applicationCategory": "BusinessApplication",
                    "operatingSystem": "Web",
                    "offers": {
                        "@type": "Offer",
                        "price": "4990",
                        "priceCurrency": "ISK"
                    },
                    "featureList": [
                        "Bókunardagatal með sanngirnisreglu",
                        "Fjárhagsyfirlit fyrir hússjóð",
                        "Verkefnastjórnun",
                        "Hlutverkastýring fyrir meðeigendur",
                        "Stafrænn gestaaðgangur",
                        "Tilkynningar og áminningar"
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
                                    Byrja frítt</Link>
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

                        {/* CTA Section */}
                        <div className="mt-24 bg-gradient-to-br from-amber/10 to-amber/5 rounded-2xl p-12 text-center">
                            <h2 className="text-3xl font-serif mb-4">Tilbúinn að prófa?</h2>
                            <p className="text-xl text-grey-dark mb-8 max-w-2xl mx-auto">
                                Sjáðu kerfið í vinnslu eða búðu til aðgang strax. Engin skuldbinding í prufutímanum.
                            </p>
                            <div className="flex gap-4 justify-center flex-wrap">
                                <Link to="/prufa" className="btn btn-secondary">
                                    Skoða dæmi
                                </Link>
                                <Link to="/signup" className="btn btn-primary">
                                    Byrja frítt í 30 daga
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </MarketingLayout>
        </>
    );
}
