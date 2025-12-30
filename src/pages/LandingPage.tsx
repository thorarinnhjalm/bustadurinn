import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Calendar, TrendingUp, Key, CheckCircle, ArrowRight } from 'lucide-react';
import SEO from '@/components/SEO';
import MarketingLayout from '@/components/MarketingLayout';
import { useAppStore } from '@/store/appStore';

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
            "price": "9900",
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
            icon: Key,
            title: "Stafræn Lyklakippa",
            description: "Sendu gestum tímabundinn aðgang með leiðbeiningum, húsreglum og WiFi. Aðgangur lokast sjálfkrafa."
        }
    ];

    return (
        <MarketingLayout
            title="Betra skipulag fyrir sumarhúsið"
            description="Við færum utanumhald sameignarinnar úr flóknum Excel skjölum og Facebook hópum yfir í fágað viðmót sem hæfir nútíma sumarhúsum."
        >
            <SEO structuredData={softwareAppSchema} />

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
                                onClick={() => navigate('/signup')}
                                className="btn btn-primary bg-amber text-charcoal hover:bg-amber-dark text-lg px-10 py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                            >
                                Byrja frítt →
                            </button>
                            <button
                                onClick={() => navigate('/prufa')}
                                className="btn btn-secondary border-2 border-amber/30 text-amber hover:bg-amber/10 backdrop-blur-sm text-lg px-10 py-4"
                            >
                                Skoða dæmi
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
                                <span>1.990 kr/mánuði</span>
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

                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        {features.map((feature, index) => (
                            <div key={index} className="card hover:shadow-lg transition-shadow bg-white text-center">
                                <feature.icon className="w-12 h-12 mb-4 text-amber mx-auto" />
                                <h3 className="text-2xl font-serif mb-3">{feature.title}</h3>
                                <p className="text-grey-dark leading-relaxed">{feature.description}</p>
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

            {/* Pricing Section */}
            <section className="py-24 bg-white">
                <div className="container max-w-5xl mx-auto px-6">
                    <h2 className="text-center text-4xl font-serif mb-4">Einföld verðskrá</h2>
                    <p className="text-center text-grey-mid mb-16">Engin falin gjöld. Greitt fyrir hvert hús, óháð fjölda eigenda.</p>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Annual Plan - Recommended */}
                        <div className="card relative ring-4 ring-amber transform hover:-translate-y-1 transition-transform">
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                <span className="bg-amber text-charcoal px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Mælt með</span>
                            </div>
                            <div className="text-center mb-8 pt-4">
                                <h3 className="text-2xl font-serif mb-2">Árlega</h3>
                                <div className="text-4xl font-bold font-serif mb-2">9.900 kr <span className="text-base font-normal text-grey-mid">/ ári</span></div>
                                <p className="text-sm text-charcoal/80 bg-amber/10 inline-block px-3 py-1 rounded">
                                    Sparar 58% (13.980 kr)
                                </p>
                                <p className="text-xs text-grey-mid mt-2">Jafngildir 825 kr/mán</p>
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
                                    <span>30 daga frí prufa</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-amber flex-shrink-0" />
                                    <span>Ótakmarkaðir gestir</span>
                                </li>
                            </ul>

                            <button onClick={() => navigate('/signup')} className="btn btn-primary bg-amber w-full py-4 text-lg">
                                Velja Ársáskrift
                            </button>
                        </div>

                        {/* Monthly Plan */}
                        <div className="card relative hover:-translate-y-1 transition-transform">
                            <div className="text-center mb-8 pt-4">
                                <h3 className="text-2xl font-serif mb-2">Mánaðarlega</h3>
                                <div className="text-4xl font-bold font-serif mb-2">1.990 kr <span className="text-base font-normal text-grey-mid">/ mánuði</span></div>
                                <p className="text-sm text-grey-mid mt-2">Uppsögn hvenær sem er</p>
                            </div>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-grey-mid flex-shrink-0" />
                                    <span className="text-grey-dark">Allir eiginleikar innifaldir</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-grey-mid flex-shrink-0" />
                                    <span className="text-grey-dark">Ótakmarkaður fjöldi notenda</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-grey-mid flex-shrink-0" />
                                    <span className="text-grey-dark">30 daga frí prufa</span>
                                </li>
                            </ul>

                            <button onClick={() => navigate('/signup')} className="btn btn-secondary w-full py-4 text-lg">
                                Velja Mánaðaráskrift
                            </button>
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
                            onClick={() => navigate('/signup')}
                            className="btn btn-primary bg-amber text-charcoal hover:bg-amber-dark text-lg px-8 py-4 shadow-xl shadow-amber/20"
                        >
                            Stofna aðgang núna
                        </button>
                        <button
                            onClick={() => navigate('/prufa')}
                            className="btn btn-ghost border-2 border-white/20 text-bone hover:bg-white/10 text-lg px-8 py-4"
                        >
                            Sjá kerfið í vinnslu
                        </button>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
