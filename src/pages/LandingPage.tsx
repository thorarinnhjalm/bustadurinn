/**
 * Landing Page - Bústaðurinn.is
 * Scandi-Minimalist Design with Updated Icelandic Copy & SEO
 */

import { useNavigate } from 'react-router-dom';
import { Calendar, TrendingUp, Key, CheckCircle, HelpCircle } from 'lucide-react';
import SEO from '@/components/SEO';
import Logo from '@/components/Logo';

export default function LandingPage() {
    const navigate = useNavigate();

    // JSON-LD Structured Data for SEO
    const softwareAppSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Bústaðurinn.is",
        "applicationCategory": "LifestyleApplication",
        "operatingSystem": "Web",
        "offers": {
            "@type": "Offer",
            "price": "1990",
            "priceCurrency": "ISK"
        },
        "description": "Bókunarkerfi og app fyrir sameiginleg sumarhús."
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "Hvað ef við erum 10 í hópnum?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Það skiptir engu máli. Verðið er það sama, 14.900 kr. á ári fyrir húsið, hvort sem eigendur eru tveir eða tuttugu."
                }
            },
            {
                "@type": "Question",
                "name": "Get ég notað þetta fyrir útleigu?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Já, þú getur merkt bókanir sem \\\"Útleigu\\\" og skráð tekjurnar beint inn í yfirlit hússjóðsins."
                }
            },
            {
                "@type": "Question",
                "name": "Er appið í App Store?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Bústaðurinn.is er vefapp (Progressive Web App). Þú getur sett táknmynd á heimaskjáinn í símanum þínum og það virkar eins og hefðbundið app, án þess að þú þurfir að sækja uppfærslur."
                }
            }
        ]
    };

    const features = [
        {
            icon: Calendar,
            title: "Sanngjörn Bókun",
            subtitle: "Friður í fjölskyldunni.",
            description: "Kerfið heldur utan um úthlutun helga. Með innbyggðri sanngirnisreglu man kerfið hver fékk jólin eða páskana í fyrra og stingur upp á forgangsröðun. Engin rifrildi, bara skýrar leikreglur."
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
            description: "Sendu gestum tímabundinn aðgang með einum smelli. Þeir fá sendar leiðbeiningar, húsreglur og Wi-Fi lykil 48 tímum fyrir komu. Aðgangurinn lokast svo sjálfkrafa að dvöl lokinni."
        }
    ];

    const faqs = [
        {
            question: "Hvað ef við erum 10 í hópnum?",
            answer: "Það skiptir engu máli. Verðið er það sama, 14.900 kr. á ári fyrir húsið, hvort sem eigendur eru tveir eða tuttugu."
        },
        {
            question: "Get ég notað þetta fyrir útleigu?",
            answer: "Já, þú getur merkt bókanir sem \\\"Útleigu\\\" og skráð tekjurnar beint inn í yfirlit hússjóðsins."
        },
        {
            question: "Er appið í App Store?",
            answer: "Bústaðurinn.is er vefapp (Progressive Web App). Þú getur sett táknmynd á heimaskjáinn í símanum þínum og það virkar eins og hefðbundið app, án þess að þú þurfir að sækja uppfærslur."
        }
    ];

    // Combine both schemas
    const combinedSchema = [softwareAppSchema, faqSchema];

    return (
        <div className="min-h-screen bg-bone">
            {/* SEO Meta Tags and JSON-LD */}
            <SEO
                title="Bústaðurinn.is - Bókunarkerfi fyrir sumarhús"
                description="Betra skipulag fyrir sameignarhúsið. Bókunardagatal, gagnsær fjármál og stafræn lyklakippa fyrir orlofshúsið."
                keywords="sumarhús, bókunarkerfi, sameignarhús, orlofshús, íslenskt app, fjölskylduhús, veðurspá, bókunardagatal, hússjóður"
                structuredData={combinedSchema}
            />

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 bg-bone/95 backdrop-blur-sm z-50 border-b border-grey-warm">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Logo size={32} className="text-charcoal" />
                        <h1 className="text-2xl font-serif font-bold">Bústaðurinn.is</h1>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="btn btn-ghost"
                        >
                            Innskrá
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="btn btn-primary"
                        >
                            Byrja núna
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Split Screen */}
            <section className="split-screen pt-20">
                {/* Left Side - Copy */}
                <div className="flex items-center justify-center bg-charcoal text-bone p-12">
                    <div className="max-w-xl animate-fade-in">
                        <div className="badge mb-6">Frítt í 14 daga</div>
                        <h1 className="text-bone mb-6">
                            Betra skipulag fyrir sumarhúsið.
                        </h1>
                        <p className="text-xl mb-8 text-grey-warm leading-relaxed">
                            Við færum utanumhald sameignarinnar úr flóknum Excel skjölum og Facebook hópum
                            yfir í fágað viðmót sem hæfir nútíma sumarhúsum.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => navigate('/signup')}
                                className="btn btn-primary bg-amber text-charcoal hover:bg-amber-dark"
                            >
                                Byrja núna - Frítt í 14 daga
                            </button>
                            <button className="btn btn-secondary border-bone text-bone hover:bg-bone hover:text-charcoal">
                                Sjá kynningu
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Side - Inspiration Image */}
                <div
                    className="min-h-[600px] bg-cover bg-center relative overflow-hidden"
                    style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=1200&q=80')`,
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-charcoal/20 to-transparent"></div>
                </div>
            </section>

            {/* Problem/Solution Section */}
            <section className="section bg-white">
                <div className="container max-w-4xl mx-auto text-center">
                    <div className="mb-16 animate-fade-in">
                        <h2 className="mb-4">Vandamálið</h2>
                        <p className="text-xl text-grey-dark max-w-2xl mx-auto">
                            „Er laust um helgina?" „Hver átti að mála pallinn?" „Hvar er lykillinn að geymslunni?"
                            Sameiginlegu sumarhúsi fylgja oft samskiptaerfiðleikar, tvíbókanir og óljós fjármál sem
                            geta skapað núning í fjölskyldum og vinahópum.
                        </p>
                    </div>

                    <div className="border-t-2 border-amber w-24 mx-auto my-12"></div>

                    <div className="animate-fade-in">
                        <h2 className="mb-4">Lausnin</h2>
                        <p className="text-xl text-grey-dark max-w-2xl mx-auto">
                            Eitt app fyrir allt sem viðkemur rekstri og nýtingu. Einfaldaðu samskiptin og komdu
                            skipulagi á orlofshúsið.
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="section bg-bone">
                <div className="container max-w-6xl mx-auto">
                    <h2 className="text-center mb-16">Eiginleikar</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="card text-center animate-fade-in hover:scale-105"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <feature.icon className="w-12 h-12 mx-auto mb-4 text-amber" />
                                <h3 className="text-2xl mb-2">{feature.title}</h3>
                                <p className="text-base font-medium text-charcoal mb-3">{feature.subtitle}</p>
                                <p className="text-grey-dark">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="section bg-white">
                <div className="container max-w-5xl mx-auto">
                    <h2 className="text-center mb-4">Verðlagning</h2>
                    <p className="text-center text-xl text-grey-dark mb-2 max-w-2xl mx-auto">
                        Einfalt verð. Engin falin gjöld.
                    </p>
                    <p className="text-center text-base text-grey-mid mb-16 max-w-2xl mx-auto">
                        Greitt fyrir hvert hús, óháð fjölda eigenda.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Annual Plan */}
                        <div className="card relative ring-4 ring-amber scale-105">
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                <span className="badge">Mælt með</span>
                            </div>
                            <div className="text-center mb-6">
                                <h3 className="text-2xl mb-2">Leið A (Árlega)</h3>
                                <div className="flex items-end justify-center gap-2">
                                    <span className="text-4xl font-serif font-bold">14.900 kr.</span>
                                    <span className="text-grey-mid mb-2">/ ári</span>
                                </div>
                                <p className="text-sm text-grey-mid mt-2">
                                    Jafngildir 1.241 kr. á mánuði. Gjaldfært einu sinni á ári.
                                </p>
                            </div>

                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-amber flex-shrink-0" />
                                    <span>Ótakmarkaður fjöldi notenda (eigenda)</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-amber flex-shrink-0" />
                                    <span>Ótakmarkaðir gestir</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-amber flex-shrink-0" />
                                    <span>Gestabók og myndir</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-amber flex-shrink-0" />
                                    <span>iOS og Android vefapp (PWA)</span>
                                </li>
                            </ul>

                            <button
                                onClick={() => navigate('/signup')}
                                className="btn btn-primary bg-charcoal w-full"
                            >
                                Velja Leið A
                            </button>
                        </div>

                        {/* Monthly Plan */}
                        <div className="card relative">
                            <div className="text-center mb-6">
                                <h3 className="text-2xl mb-2">Leið B (Mánaðarlega)</h3>
                                <div className="flex items-end justify-center gap-2">
                                    <span className="text-4xl font-serif font-bold">1.990 kr.</span>
                                    <span className="text-grey-mid mb-2">/ mánuði</span>
                                </div>
                                <p className="text-sm text-grey-mid mt-2">
                                    Uppsögn hvenær sem er.
                                </p>
                            </div>

                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-amber flex-shrink-0" />
                                    <span>Ótakmarkaður fjöldi notenda (eigenda)</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-amber flex-shrink-0" />
                                    <span>Ótakmarkaðir gestir</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-amber flex-shrink-0" />
                                    <span>Gestabók og myndir</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-amber flex-shrink-0" />
                                    <span>iOS og Android vefapp (PWA)</span>
                                </li>
                            </ul>

                            <button
                                onClick={() => navigate('/signup')}
                                className="btn btn-secondary w-full"
                            >
                                Velja Leið B
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section (NEW) */}
            <section className="section bg-bone">
                <div className="container max-w-4xl mx-auto">
                    <h2 className="text-center mb-12">Algengar Spurningar</h2>
                    <div className="space-y-6">
                        {faqs.map((faq, index) => (
                            <div key={index} className="card">
                                <div className="flex gap-4">
                                    <HelpCircle className="w-6 h-6 text-amber flex-shrink-0 mt-1" />
                                    <div>
                                        <h4 className="text-xl font-serif mb-2">{faq.question}</h4>
                                        <p className="text-grey-dark">{faq.answer}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section bg-gradient-charcoal text-bone">
                <div className="container max-w-3xl mx-auto text-center">
                    <h2 className="text-bone mb-6">Tilbúið að byrja?</h2>
                    <p className="text-xl text-grey-warm mb-8">
                        Fáðu 14 daga ókeypis prufutíma. Engin kreditkorta krafist.
                    </p>
                    <button
                        onClick={() => navigate('/signup')}
                        className="btn btn-primary bg-amber text-charcoal hover:bg-amber-dark text-lg px-8 py-4"
                    >
                        Byrja núna - Frítt í 14 daga
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-charcoal text-bone py-12">
                <div className="container mx-auto text-center">
                    <h3 className="text-2xl font-serif mb-4 text-bone">Bústaðurinn.is</h3>
                    <p className="text-grey-warm mb-6">Betra skipulag fyrir sumarhúsið.</p>
                    <p className="text-sm text-grey-mid">
                        © 2025 Bústaðurinn.is. Allur réttur áskilinn.
                    </p>
                </div>
            </footer>
        </div>
    );
}
