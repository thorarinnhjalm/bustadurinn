import { useNavigate } from 'react-router-dom';
import { Calendar, TrendingUp, Key, CheckCircle, ArrowRight } from 'lucide-react';
import SEO from '@/components/SEO';
import MarketingLayout from '@/components/MarketingLayout';

export default function LandingPage() {
    const navigate = useNavigate();

    // JSON-LD Structured Data
    const softwareAppSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Bústaðurinn.is",
        "applicationCategory": "LifestyleApplication",
        "operatingSystem": "Web",
        "offers": {
            "@type": "Offer",
            "price": "14900",
            "priceCurrency": "ISK"
        },
        "description": "Bókunarkerfi og app fyrir sameiginleg sumarhús."
    };

    const features = [
        {
            icon: Calendar,
            title: "Sanngjörn Bókun",
            subtitle: "Friður í fjölskyldunni.",
            description: "Kerfið heldur utan um úthlutun helga. Með innbyggðri sanngirnisreglu man kerfið hver fékk jólin eða páskana í fyrra og stingur upp á forgangsröðun."
        },
        {
            icon: TrendingUp,
            title: "Gagnsær Hússjóður",
            subtitle: "Rekstraráætlun og rauntölur.",
            description: "Gerðu rekstraráætlun og berðu saman við raunkostnað. Haldið utan um mánaðarlegar greiðslur eigenda og sjáið svart á hvítu hvort hússjóðurinn standi undir rekstrinum."
        },
        {
            icon: Key,
            title: "Stafræn Lyklakippa",
            subtitle: "Gestirnir rata sjálfir.",
            description: "Sendu gestum tímabundinn aðgang með einum smelli. Þeir fá sendar leiðbeiningar, húsreglur og Wi-Fi lykil 48 tímum fyrir komu. Aðgangurinn lokast svo sjálfkrafa."
        }
    ];

    return (
        <MarketingLayout
            title="Betra skipulag fyrir sumarhúsið"
            description="Við færum utanumhald sameignarinnar úr flóknum Excel skjölum og Facebook hópum yfir í fágað viðmót sem hæfir nútíma sumarhúsum."
        >
            <SEO structuredData={softwareAppSchema} />

            {/* Hero Section - Full-bleed with Image */}
            <section className="relative min-h-screen flex items-center overflow-hidden">
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
                            Frítt í 14 daga • Engin kreditkort
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl md:text-7xl font-serif font-bold leading-tight mb-6 text-bone animate-fade-in">
                            Betra skipulag fyrir{' '}
                            <span className="text-amber">sumarhúsið</span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-xl md:text-2xl text-stone-300 leading-relaxed mb-10 max-w-2xl">
                            Við færum utanumhald sameignarinnar úr flóknum Excel skjölum og Facebook hópum
                            yfir í fágað viðmót sem hæfir nútíma sumarhúsum.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-12">
                            <button
                                onClick={() => navigate('/signup')}
                                className="btn btn-primary bg-amber text-charcoal hover:bg-amber-dark text-lg px-10 py-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                            >
                                Byrja núna →
                            </button>
                            <button
                                onClick={() => navigate('/eiginleikar')}
                                className="btn btn-ghost border-2 border-white/20 text-bone hover:bg-white/10 backdrop-blur-sm text-lg px-10 py-4"
                            >
                                Sjá eiginleika
                            </button>
                        </div>

                        {/* Social Proof */}
                        <div className="flex items-center gap-8 text-sm text-stone-400">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <span>Engin bindandi samningar</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <span>14 daga endurgreiðslu</span>
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

            {/* Problem/Solution Section */}
            <section className="py-24 bg-white">
                <div className="container max-w-4xl mx-auto text-center px-6">
                    <div className="mb-16">
                        <h2 className="text-3xl font-serif mb-4">Vandamálið</h2>
                        <p className="text-xl text-grey-dark max-w-2xl mx-auto leading-relaxed">
                            „Er laust um helgina?" „Hver átti að mála pallinn?" „Hvar er lykillinn að geymslunni?"
                            Sameiginlegu sumarhúsi fylgja oft samskiptaerfiðleikar sem
                            geta skapað núning í fjölskyldunni.
                        </p>
                    </div>

                    <div className="border-t-2 border-amber w-24 mx-auto my-12 opacity-50"></div>

                    <div>
                        <h2 className="text-3xl font-serif mb-4">Lausnin</h2>
                        <p className="text-xl text-grey-dark max-w-2xl mx-auto leading-relaxed">
                            Eitt app fyrir allt sem viðkemur rekstri og nýtingu. Einfaldaðu samskiptin og komdu
                            skipulagi á orlofshúsið.
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Preview */}
            <section className="py-24 bg-bone">
                <div className="container max-w-6xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="card hover:shadow-lg transition-shadow bg-white">
                                <feature.icon className="w-12 h-12 mb-4 text-amber" />
                                <h3 className="text-2xl font-serif mb-2">{feature.title}</h3>
                                <p className="text-sm font-bold text-charcoal mb-3 uppercase tracking-wide opacity-70">{feature.subtitle}</p>
                                <p className="text-grey-dark leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-12">
                        <button onClick={() => navigate('/eiginleikar')} className="text-charcoal font-medium hover:text-amber underline decoration-amber underline-offset-4">
                            Sjá alla eiginleika
                        </button>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-24 bg-white" id="pricing">
                <div className="container max-w-5xl mx-auto px-6">
                    <h2 className="text-center text-4xl font-serif mb-4">Einföld verðskrá</h2>
                    <p className="text-center text-grey-mid mb-16">Engin falin gjöld. Greitt fyrir hvert hús, óháð fjölda eigenda.</p>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Annual Plan */}
                        <div className="card relative ring-4 ring-amber transform hover:-translate-y-1 transition-transform">
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                <span className="bg-amber text-charcoal px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Mælt með</span>
                            </div>
                            <div className="text-center mb-8 pt-4">
                                <h3 className="text-2xl font-serif mb-2">Árlega</h3>
                                <div className="text-4xl font-bold font-serif mb-2">14.900 kr. <span className="text-base font-normal text-grey-mid">/ ári</span></div>
                                <p className="text-sm text-charcoal/80 bg-amber/10 inline-block px-3 py-1 rounded">
                                    (Jafngildir 1.241 kr/mán)
                                </p>
                                <p className="text-xs text-grey-mid mt-2">Gjaldfært einu sinni.</p>
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
                                    <span>Ótakmarkaðir gestir</span>
                                </li>
                            </ul>

                            <button onClick={() => navigate('/signup')} className="btn btn-primary bg-charcoal w-full py-4 text-lg">
                                Velja Ársáskrift
                            </button>
                        </div>

                        {/* Monthly Plan */}
                        <div className="card relative hover:-translate-y-1 transition-transform">
                            <div className="text-center mb-8 pt-4">
                                <h3 className="text-2xl font-serif mb-2">Mánaðarlega</h3>
                                <div className="text-4xl font-bold font-serif mb-2">1.990 kr. <span className="text-base font-normal text-grey-mid">/ mánuði</span></div>
                                <p className="text-sm text-grey-mid mt-2">Uppsögn hvenær sem er.</p>
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
                            </ul>

                            <button onClick={() => navigate('/signup')} className="btn btn-secondary w-full py-4 text-lg">
                                Velja Mánaðaráskrift
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 bg-charcoal text-bone text-center">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-serif mb-6">Prófaðu frítt í 14 daga</h2>
                    <p className="text-xl text-grey-warm mb-8 max-w-2xl mx-auto">
                        Engin greiðslukortaupplýsingar nauðsynlegar við skráningu.
                    </p>
                    <button
                        onClick={() => navigate('/signup')}
                        className="btn btn-primary bg-amber text-charcoal hover:bg-amber-dark text-lg px-8 py-4 shadow-xl shadow-amber/20"
                    >
                        Stofna aðgang núna
                    </button>
                </div>
            </section>
        </MarketingLayout>
    );
}
