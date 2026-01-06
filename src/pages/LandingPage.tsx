import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Calendar, TrendingUp, CheckCircle, ArrowRight, Users } from 'lucide-react';
import MarketingLayout from '@/components/MarketingLayout';
import { useAppStore } from '@/store/appStore';
import NewsletterSignup from '@/components/NewsletterSignup';

export default function LandingPage() {
    const navigate = useNavigate();

    // Redirect if already logged in and has a house
    const { isAuthenticated, currentUser, isLoading } = useAppStore();
    useEffect(() => {
        if (!isLoading && isAuthenticated && (currentUser?.house_ids?.length ?? 0) > 0) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, currentUser, isLoading, navigate]);

    // JSON-LD Structured Data
    const softwareAppSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Bústaðurinn.is",
        "applicationCategory": "LifestyleApplication",
        "operatingSystem": "Web",
        "offers": {
            "@type": "Offer",
            "price": "4990",
            "priceCurrency": "ISK"
        },
        "description": "Bókunarkerfi og app fyrir sameiginleg sumarhús."
    };

    const features = [
        {
            icon: Calendar,
            title: "Sanngjörn Bókun",
            description: "Innbyggð sanngirnisregla tryggir jafna skiptingu á vinsælum helgum. Friður í fjölskyldunni."
        },
        {
            icon: TrendingUp,
            title: "Gagnsær Hússjóður",
            description: "Haldið utan um kostnað og greiðslur. Sjáið svart á hvítu hvort hússjóðurinn standi undir rekstrinum."
        },
        {
            icon: Users,
            title: "Gestaaðgangur",
            description: "Sendu sjálfvirka \"Töfrahlekki\" á gesti sem opna upplýsingar um bústaðinn, veður og reglur. Virkar eins og stafræn gestabók og leiðarvísir í einu."
        },
        {
            icon: TrendingUp, // Replacing with a more appropriate icon if needed, but keeping for now
            title: "Öryggi í forgangi",
            description: "Rauntíma vöktun á veðri og færð á vegum beint að þínu sumarhúsi. Við látum þig vita ef það stefnir í ófærð eða vonskuveður."
        }
    ];

    return (
        <MarketingLayout
            title="Betra skipulag fyrir sumarhúsið"
            description="Við færum utanumhald sameignarinnar úr flóknum Excel skjölum og Facebook hópum yfir í fágað viðmót sem hæfir nútíma sumarhúsum."
            structuredData={softwareAppSchema}
        >

            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=1920&q=80&fit=crop"
                        alt="Beautiful Icelandic summer house"
                        className="w-full h-full object-cover"
                    />
                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/90 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent"></div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-6 py-20 md:py-32 relative z-10">
                    <div className="max-w-3xl">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 bg-amber/20 text-amber border border-amber/30 px-4 py-2 rounded-full text-sm font-medium mb-8 backdrop-blur-sm">
                            <span className="w-2 h-2 bg-amber rounded-full animate-pulse"></span>
                            Frítt í 30 daga • Engin kreditkort
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl md:text-7xl font-serif font-bold leading-tight mb-6 text-bone animate-fade-in">
                            Betra skipulag fyrir{' '}
                            <span className="text-amber">sumarhúsið</span>
                        </h1>

                        {/* Tagline */}
                        <p className="text-xl md:text-2xl mb-8 text-bone/90 leading-relaxed font-light">
                            Við færum utanumhald sumarhússins úr Excel skjölum og Facebook spjalli yfir í fágað viðmót sem hæfir nútíma sumarhúsum.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-12">
                            <button
                                onClick={() => navigate('/prufa')}
                                className="btn btn-primary bg-amber text-charcoal hover:bg-amber-dark text-lg px-10 py-4 shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:shadow-[0_0_40px_rgba(251,191,36,0.4)] transform hover:scale-105 transition-all flex items-center justify-center gap-2 group"
                            >
                                <span className="relative flex h-3 w-3 mr-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-charcoal opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-charcoal"></span>
                                </span>
                                Prófaðu Sumarbústaðinn
                            </button>
                            <button
                                onClick={() => navigate('/signup')}
                                className="btn btn-secondary border-2 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm text-lg px-10 py-4 hover:border-white/40 transition-all"
                            >
                                Stofna Aðgang
                            </button>
                        </div>

                        {/* Social Proof */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 text-sm text-stone-400">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <span>30 daga prufa</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <span>Engin bindandi samningar</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <span>4.990 kr/ári</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
                    <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
                        <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
                    </div>
                </div>
            </section>

            {/* Features Preview */}
            <section className="py-24 bg-bone">
                <div className="container max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-serif mb-4">Allt sem þú þarft</h2>
                        <p className="text-xl text-grey-dark max-w-2xl mx-auto">
                            Eitt kerfi fyrir bókanir, fjármál og samskipti
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <feature.icon className="w-10 h-10 text-amber mb-6" />
                                <h3 className="text-xl font-serif mb-3">{feature.title}</h3>
                                <p className="text-grey-dark leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center">
                        <button
                            onClick={() => navigate('/eiginleikar')}
                            className="inline-flex items-center gap-2 text-charcoal font-semibold hover:text-amber transition-colors text-lg group"
                        >
                            Sjá alla eiginleika og skjámyndir
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Mobile App Section */}
            <section className="py-24 bg-stone-100 overflow-hidden border-y border-stone-200">
                <div className="container max-w-6xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        {/* Mockup */}
                        <div className="w-full lg:w-1/2 relative">
                            {/* Decorative Blobs */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 md:w-96 md:h-96 bg-amber/20 rounded-full blur-3xl z-0"></div>

                            {/* Phone Mockup Frame (CSS) */}
                            <div className="relative z-10 mx-auto w-[280px] md:w-[320px] aspect-[9/19.5] bg-charcoal rounded-[3rem] p-3 shadow-2xl ring-8 ring-charcoal/10 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                                {/* Speaker/Sensors */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-charcoal rounded-b-2xl z-20"></div>

                                {/* Inner Screen */}
                                <div className="w-full h-full bg-bone rounded-[2.5rem] overflow-hidden relative shadow-inner">
                                    <img
                                        src="/mobile-app-screenshot.jpg"
                                        alt="Bústaðurinn App Screenshot"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="w-full lg:w-1/2 space-y-8">
                            <div>
                                <h2 className="text-4xl md:text-5xl font-serif mb-6 leading-tight">Sumarhúsið í vasanum</h2>
                                <p className="text-xl text-stone-600 leading-relaxed font-light">
                                    Við höfum hannað Bústaðinn til að vera alltaf við höndina. Ekki bara vefsíða, heldur öflugt tól sem einfaldar lífið í hvert sinn sem þú hugsar um sumarhúsið.
                                </p>
                            </div>

                            <ul className="space-y-6">
                                <li className="flex items-start gap-4 group">
                                    <div className="mt-1 w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center shrink-0 group-hover:bg-amber group-hover:text-charcoal transition-colors">
                                        <CheckCircle className="w-5 h-5 text-amber group-hover:text-inherit" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold mb-1">Settu sumarhúsið á símann þinn</h4>
                                        <p className="text-stone-500">Bættu Bústaðnum á heimaskjáinn þinn á augabragði. Engin þörf á App Store – virkar eins og app, beint í gegnum vafrann.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4 group">
                                    <div className="mt-1 w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center shrink-0 group-hover:bg-amber group-hover:text-charcoal transition-colors">
                                        <CheckCircle className="w-5 h-5 text-amber group-hover:text-inherit" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold mb-1">Rauntíma tilkynningar</h4>
                                        <p className="text-stone-500">Fáðu tilkynningu um leið og einhver bókar næstu helgi, bætir við á innkaupalistann eða þegar nýtt verkefni er stofnað.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4 group">
                                    <div className="mt-1 w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center shrink-0 group-hover:bg-amber group-hover:text-charcoal transition-colors">
                                        <CheckCircle className="w-5 h-5 text-amber group-hover:text-inherit" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold mb-1">Allt á hreinu á staðnum</h4>
                                        <p className="text-stone-500">Skráðu komu, athugaðu veðurspána eða finndu WiFi lykilorðið með einum smelli þegar þú mætir í bústaðinn.</p>
                                    </div>
                                </li>
                            </ul>

                            <div className="pt-4">
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="btn btn-primary text-lg px-8 py-4 flex items-center gap-2 group"
                                >
                                    Byrjaðu að nota kerfið
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-24 bg-white">
                <div className="container max-w-5xl mx-auto px-6">
                    <h2 className="text-center text-4xl font-serif mb-4">Einföld verðskrá</h2>
                    <p className="text-center text-grey-mid mb-16">Engin falin gjöld. Greitt fyrir hvert hús, óháð fjölda eigenda.</p>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Free Trial Card */}
                        <div className="card relative transition-transform hover:-translate-y-1 border-2 border-transparent hover:border-amber/20">
                            <div className="text-center mb-8 pt-4">
                                <h3 className="text-2xl font-serif mb-2 text-stone-600">Prufuáskrift</h3>
                                <div className="text-4xl font-bold font-serif mb-2">0 kr <span className="text-base font-normal text-grey-mid">/ 30 daga</span></div>
                                <p className="text-sm text-green-600 font-medium bg-green-50 inline-block px-3 py-1 rounded-full">
                                    Engin kortaupplýsingar
                                </p>
                            </div>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span>30 dagar frítt</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span>Allir eiginleikar innifaldir</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span>Engin skuldbinding</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span>Skoðaðu í rólegheitum</span>
                                </li>
                            </ul>

                            <button onClick={() => navigate('/signup')} className="btn btn-secondary w-full py-4 text-lg border-stone-200">
                                Prófa frítt
                            </button>
                        </div>

                        {/* Annual Plan Card */}
                        <div className="card relative ring-4 ring-amber transform hover:-translate-y-1 transition-transform bg-white">
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                <span className="bg-amber text-charcoal px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">Mælt með</span>
                            </div>
                            <div className="text-center mb-8 pt-4">
                                <h3 className="text-2xl font-serif mb-2">Ársáskrift</h3>
                                <div className="text-4xl font-bold font-serif mb-2">4.990 kr <span className="text-base font-normal text-grey-mid">/ ári</span></div>
                                <p className="text-sm text-charcoal/80 bg-amber/10 inline-block px-3 py-1 rounded">
                                    Aðeins 416 kr á mánuði
                                </p>
                            </div>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-amber flex-shrink-0" />
                                    <span>Allir eiginleikar innifaldir</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-amber flex-shrink-0" />
                                    <span>Ótakmarkaður fjöldi notenda</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-amber flex-shrink-0" />
                                    <span>Greitt eftir prufutíma</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-amber flex-shrink-0" />
                                    <span>Ótakmarkaðir gestir</span>
                                </li>
                            </ul>

                            <button onClick={() => navigate('/signup')} className="btn btn-primary bg-amber w-full py-4 text-lg shadow-lg shadow-amber/20">
                                Velja Ársáskrift
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Newsletter Section */}
            <section className="py-24 bg-bone relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent"></div>
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-serif mb-4">Langar þig að byrja strax?</h2>
                        <p className="text-stone-500 max-w-xl mx-auto mb-8">
                            Þú getur stofnað aðgang á tveimur mínútum og byrjað að skipuleggja sumarhúsið í dag.
                        </p>
                        <button
                            onClick={() => navigate('/signup')}
                            className="btn btn-primary mb-12 px-10 py-4 text-lg"
                        >
                            Stofna Aðgang Núna
                        </button>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-stone-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-bone text-stone-400 uppercase tracking-widest font-bold">Eða fylgstu með nýjungum</span>
                            </div>
                        </div>
                    </div>
                    <NewsletterSignup />
                </div>
            </section>

            {/* Q&A Section */}
            <section className="py-24 bg-white border-t border-stone-100">
                <div className="container max-w-4xl mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-serif text-center mb-16">Algengar spurningar</h2>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-bold mb-3">Hvernig virka veðurviðvaranirnar?</h3>
                            <p className="text-stone-600 leading-relaxed font-light">
                                Við tengjumst beint við kerfi Veðurstofunnar og Vegagerðarinnar. Kerfið vakta sjálfkrafa GPS hnitin sem þú skráir á bústaðinn þinn og lætur þig vita með fyrirvara ef spáin sýnir óveður, mikinn kulda eða ófærð á nærliggjandi þjóðvegum.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold mb-3">Er erfitt að flytja gögn úr Excel?</h3>
                            <p className="text-stone-600 leading-relaxed font-light">
                                Alls ekki. Þú byrjar á því að hlaða inn grunnupplýsingum og bjóða meðeigendum þínum. Það tekur innan við 5 mínútur að setja upp nýtt hús og flestar fjölskyldur eru komnar á fullt skrið strax fyrsta daginn.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold mb-3">Hvað ef ég hætti að nota kerfið?</h3>
                            <p className="text-stone-600 leading-relaxed font-light">
                                Þú átt þín gögn. Ef þú ákveður að hætta getur þú hvenær sem er flutt út allar bókanir og söguleg gögn. Við trúum því að þú verðir áfram vegna gæðanna, ekki vegna þess að þú sért læst(ur) inni.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold mb-3">Þurfa allir eigendur að borga?</h3>
                            <p className="text-stone-600 leading-relaxed font-light">
                                Nei, áskriftin er greidd fyrir hvert hús, ekki hvern notanda. Þú getur boðið ótakmörkuðum fjölda meðeigenda og fjölskyldumeðlima í kerfið án aukakostnaðar.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 bg-charcoal text-bone text-center">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-serif mb-6">Tilbúinn að prófa?</h2>
                    <p className="text-xl text-grey-warm mb-8 max-w-2xl mx-auto">
                        Engin greiðslukortaupplýsingar nauðsynlegar. Prófaðu í heilan mánuð án skuldbindinga.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/prufa')}
                            className="btn btn-primary bg-amber text-charcoal hover:bg-amber-dark text-lg px-8 py-4 shadow-xl shadow-amber/20"
                        >
                            Prófaðu Sumarbústaðinn
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="btn btn-ghost border-2 border-white/20 text-bone hover:bg-white/10 text-lg px-8 py-4"
                        >
                            Stofna aðgang núna
                        </button>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
