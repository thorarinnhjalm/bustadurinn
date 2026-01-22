import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
    Calendar, TrendingUp, CheckCircle, ArrowRight, Users,
    CheckSquare, Home, Plus, Settings, Shield, Bell, UserPlus, Sparkles
} from 'lucide-react';
import { CalendarMockup } from '@/components/FeatureMockups';
import MarketingLayout from '@/components/MarketingLayout';
import { useAppStore } from '@/store/appStore';
import NewsletterSignup from '@/components/NewsletterSignup';
import Testimonials from '@/components/landing/Testimonials';
import { feedbackService } from '@/services/feedbackService';
import type { Feedback } from '@/types/models';
// NewsletterPopup moved to MarketingLayout

export default function LandingPage() {
    const navigate = useNavigate();
    const [remainingSlots, setRemainingSlots] = useState<number>(12); // Default to 12 as safe fallback
    const [reviews, setReviews] = useState<Feedback[]>([]);
    const [avgRating, setAvgRating] = useState<number>(5);

    useEffect(() => {
        // Fetch remaining slots
        getDoc(doc(db, 'system', 'promotions')).then(snap => {
            if (snap.exists()) {
                const count = snap.data().launch_offer_count || 0;
                setRemainingSlots(Math.max(0, 50 - count));
            }
        }).catch(e => console.error("Failed to fetch promo count", e));

        // Fetch reviews
        feedbackService.getFeaturedFeedback().then(data => {
            setReviews(data);
            if (data.length > 0) {
                const total = data.reduce((acc, r) => acc + r.rating, 0);
                setAvgRating(Number((total / data.length).toFixed(1)));
            }
        }).catch(console.error);
    }, []);

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
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": avgRating.toString(),
            "ratingCount": Math.max(reviews.length, 1).toString()
        },
        "description": "Bókunarkerfi og bókunardagatal fyrir sameiginleg sumarhús. Einfaldar bókanir, sanngjarna skiptingu og gagnsæ fjármál fyrir íslenskar fjölskyldur."
    };

    const features = [
        {
            icon: Calendar,
            title: "Bókunardagatal",
            description: "Sjáðu strax hver er búinn að panta helgar. Einfalt og skýrt dagatal þar sem allir sjá. Engin ruglingur, bara góð samvinna."
        },
        {
            icon: Shield,
            title: "Sanngjörn skipting",
            description: "Innbyggð sanngirnisregla tryggir að allir fái sinn tíma og að enginn sitji einn að vinsælustu helgunum. Kerfið sér um að deila gæðunum."
        },
        {
            icon: Bell,
            title: "Tilkynningar",
            description: "Fáðu boð í tölvupósti þegar ný bókun dettur inn. Allir vita alltaf hvað er í gangi, án þess að þurfa að hringjast á."
        },
        {
            icon: TrendingUp,
            title: "Hússjóður (Valfrjálst)",
            description: "Ef þið viljið - gagnsæ fjármál. Kerfið heldur sjálfkrafa utan um hússjóð og gerir allt skýrt og sanngjarnt."
        }
    ];

    return (
        <MarketingLayout
            title="Bókunarkerfi fyrir sumarhús - Bústaðurinn.is"
            description="Bókunarkerfi fyrir sumarhús. Einfaldar bókanir, sanngjarna skiptingu og fjármál. Nútímalegt bókunardagatal fyrir íslenskar fjölskyldur. Prófaðu frítt í 30 daga."
            structuredData={softwareAppSchema}
        >

            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center bg-bone overflow-hidden pt-20">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-2/3 h-full bg-stone-100 rounded-l-[5rem] hidden lg:block"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        {/* Text Content */}
                        <div className="w-full lg:w-1/2">
                            {/* Badge */}
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-8">
                                {(remainingSlots > 0) && (
                                    <div className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(220,38,38,0.4)] animate-pulse">
                                        <span className="w-2 h-2 bg-white rounded-full"></span>
                                        Fyrstu 50 húsin fá 1 ár frítt! (Aðeins {remainingSlots} pláss eftir)
                                    </div>
                                )}
                                <div className="inline-flex items-center gap-2 bg-amber/20 text-charcoal border border-amber/30 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                                    Engin skuldbinding • 30 daga prufa
                                </div>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-serif font-bold leading-tight mb-8 text-charcoal">
                                Sumarbústaðurinn <br />
                                <span className="text-amber inline-block transform -rotate-2">í vasanum</span>
                            </h1>

                            <p className="text-xl md:text-2xl mb-10 text-grey-dark leading-relaxed font-light">
                                Bústaðurinn.is einfaldar yfirsýn yfir <strong>bókanir, fjármál, verkefni og innkaupalista</strong>...allt aðgengilegt beint í símann. Nútímalegt kerfi hannað fyrir íslenskar fjölskyldur.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-12">
                                <button
                                    onClick={() => navigate('/prufa')}
                                    className="btn btn-primary bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-lg px-10 py-5 shadow-[0_0_30px_rgba(37,99,235,0.2)] hover:shadow-[0_0_40px_rgba(37,99,235,0.3)] transform hover:scale-105 transition-all flex items-center justify-center gap-2 group rounded-xl"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    Prófa kerfið núna
                                    <span className="ml-1 text-sm opacity-75">• Engin skráning</span>
                                </button>
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="btn btn-secondary border-2 border-amber/50 text-charcoal hover:bg-amber/10 hover:border-amber text-lg px-10 py-5 transition-all rounded-xl flex items-center justify-center gap-2"
                                >
                                    <UserPlus className="w-5 h-5" />
                                    Eða stofna aðgang
                                </button>
                            </div>

                            <div className="flex items-center gap-8 text-sm text-grey-mid font-medium">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    <span>Virkar í síma & tölvu</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    <span>Engin öpp að sækja</span>
                                </div>
                            </div>
                        </div>

                        {/* Hero Visual - Calendar Mockup */}
                        <div className="w-full lg:w-1/2 relative perspective-1000">
                            {/* Blobs */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-amber/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>

                            <div className="relative transform rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-0 transition-all duration-700 ease-out shadow-2xl rounded-2xl overflow-hidden border border-stone-100 bg-white" style={{ minHeight: '500px', height: '500px' }}>
                                <CalendarMockup />

                                {/* Floating Badges */}
                                <div className="absolute -right-4 top-12 bg-white p-4 rounded-xl shadow-xl border border-stone-100 animate-float">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-stone-900">Bókun staðfest</p>
                                            <p className="text-[10px] text-stone-500">Jón var að bóka helgina</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute -left-4 bottom-24 bg-white p-4 rounded-xl shadow-xl border border-stone-100 animate-float-delayed">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-amber/10 text-amber flex items-center justify-center">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-stone-900">Sanngirnisregla</p>
                                            <p className="text-[10px] text-stone-500">Allir fá jafnan aðgang</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* Testimonials Section (Dynamic) */}
            <Testimonials reviews={reviews} />

            {/* Features Preview */}
            <section className="py-24 bg-bone">
                <div className="container max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-serif mb-4">Allt sem þarf fyrir ánægjulega samveru</h2>
                        <p className="text-xl text-grey-dark max-w-2xl mx-auto">
                            Einfalt kerfi sem tryggir sanngjarna skiptingu og góða yfirsýn
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

            {/* Marketplace Promo Section (NEW) */}
            <section className="py-24 bg-charcoal text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516934891124-766723223126?q=80&w=2069')] bg-cover bg-center opacity-10" style={{ contentVisibility: 'auto' }}></div>
                <div className="container max-w-6xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="w-full md:w-1/2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber text-charcoal text-sm font-bold mb-6">
                                <Sparkles className="w-4 h-4" />
                                <span>Nýtt á Bústaðurinn.is</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight">
                                Torgið: <span className="text-amber">Þjónusta</span> við dyrnar
                            </h2>
                            <p className="text-xl text-stone-300 mb-8 leading-relaxed font-light">
                                Vantar þig snjómokstur, pípulagningamann eða einhvern til að þrífa?
                                Á Torginu finnur þú þjónustuaðila í nágrenninu við bústaðinn þinn.
                            </p>

                            <ul className="space-y-4 mb-10">
                                <li className="flex items-center gap-3">
                                    <div className="p-1 rounded bg-amber/20 text-amber"><CheckCircle className="w-5 h-5" /></div>
                                    <span className="text-lg">Finndu snjómokstur í þínu hverfi</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="p-1 rounded bg-amber/20 text-amber"><CheckCircle className="w-5 h-5" /></div>
                                    <span className="text-lg">Skoðaðu einkunnir og umsagnir</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="p-1 rounded bg-amber/20 text-amber"><CheckCircle className="w-5 h-5" /></div>
                                    <span className="text-lg">Hafðu beint samband við verktaka</span>
                                </li>
                            </ul>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => navigate('/torgid')}
                                    className="btn btn-primary bg-amber text-charcoal hover:bg-white hover:text-charcoal px-8 py-4 text-lg"
                                >
                                    Skoða Torgið
                                </button>
                                <button
                                    onClick={() => navigate('/verktakar')}
                                    className="btn btn-ghost border border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg"
                                >
                                    Ertu verktaki?
                                </button>
                            </div>
                        </div>

                        {/* Visual for Marketplace */}
                        <div className="w-full md:w-1/2">
                            <div className="card bg-white text-charcoal p-6 transform rotate-2 hover:rotate-0 transition-transform duration-500 shadow-2xl">
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-stone-100">
                                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                                        <Home className="w-5 h-5 text-stone-400" />
                                    </div>
                                    <div>
                                        <div className="font-bold">Hverfið mitt</div>
                                        <div className="text-xs text-stone-400">Grímsnes og Grafningur</div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { name: 'Gunnar Snjómokstur', stars: '5.0', job: 'Snjómokstur' },
                                        { name: 'Bústaðaþrif ehf.', stars: '4.8', job: 'Þrif & Umsjón' },
                                        { name: 'Rafvirkni Suðurlands', stars: '4.9', job: 'Rafvirki' }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-amber/5 transition-colors border border-transparent hover:border-amber/20 cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-charcoal text-white flex items-center justify-center font-bold text-sm">
                                                    {item.name[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm">{item.name}</div>
                                                    <div className="text-xs text-stone-500">{item.job}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs font-bold text-amber">
                                                <Sparkles className="w-3 h-3 fill-current" /> {item.stars}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section className="py-24 bg-white">
                <div className="container max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-serif mb-4">Einfalt að byrja</h2>
                        <p className="text-xl text-grey-dark">Það tekur styttri tíma að setja upp húsið en að hita pottinn.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0 border-t-2 border-dashed border-stone-200 -z-10"></div>

                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-amber text-charcoal rounded-full flex items-center justify-center text-2xl font-bold mx-auto shadow-lg">1</div>
                            <h3 className="text-xl font-bold">Stofnaðu aðgang</h3>
                            <p className="text-grey-dark">Þú skráir þig inn og gefur húsinu nafn. Við gefum þér 30 daga til að prófa allt.</p>
                        </div>

                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-amber text-charcoal rounded-full flex items-center justify-center text-2xl font-bold mx-auto shadow-lg">2</div>
                            <h3 className="text-xl font-bold">Bjóddu fjölskyldunni</h3>
                            <p className="text-grey-dark">Sendu hlekk á mömmu, pabba og systkinin. Þau skrá sig inn á 10 sekúndum.</p>
                        </div>

                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-amber text-charcoal rounded-full flex items-center justify-center text-2xl font-bold mx-auto shadow-lg">3</div>
                            <h3 className="text-xl font-bold">Njóttu samverustundarinnar</h3>
                            <p className="text-grey-dark">Allir sjá bókanir strax. Allt skýrt, allt sanngjarnt. Meiri tími fyrir fjölskylduna.</p>
                        </div>
                    </div>
                </div>
            </section>
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

                                <div className="w-full h-full bg-[#FDFCF8] rounded-[2.5rem] overflow-hidden relative shadow-inner flex flex-col">
                                    {/* Mockup Header */}
                                    <div className="bg-[#1a1a1a]/5 p-6 pb-4 pt-10">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-xs font-bold">ME</div>
                                            <div className="flex gap-2">
                                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-stone-400"><Users size={14} /></div>
                                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-stone-400"><Calendar size={14} /></div>
                                            </div>
                                        </div>
                                        <div className="text-amber text-xs font-bold uppercase tracking-widest mb-1">Góðan daginn</div>
                                        <div className="text-2xl font-serif font-bold text-[#1a1a1a]">Fjölskyldan</div>
                                        <div className="flex gap-2 mt-2 text-xs font-medium text-stone-500">
                                            <span className="flex items-center gap-1"><Calendar size={12} className="text-amber" /> 12°C</span>
                                            <span>•</span>
                                            <span>Heiðskírt</span>
                                        </div>
                                    </div>

                                    {/* Mockup Body */}
                                    <div className="flex-1 p-4 space-y-4 overflow-hidden relative">
                                        {/* Next Booking Card (Mock) */}
                                        <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-amber"></div>
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Eftir 3 daga</span>
                                            </div>
                                            <h4 className="font-serif font-bold text-[#1a1a1a] text-lg mb-1">Jón & Sigga</h4>
                                            <p className="text-xs text-stone-500 mb-3">15. - 17. júlí • Helgarferð</p>
                                            <div className="flex -space-x-2">
                                                <div className="w-6 h-6 rounded-full bg-stone-200 border-2 border-white"></div>
                                                <div className="w-6 h-6 rounded-full bg-stone-300 border-2 border-white"></div>
                                            </div>
                                        </div>

                                        {/* Tasks Preview */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <h5 className="font-serif font-bold text-[#1a1a1a]">Verkefni</h5>
                                                <span className="text-[10px] text-amber font-bold">Sjá öll</span>
                                            </div>
                                            <div className="bg-white rounded-xl border border-stone-100 p-1 divide-y divide-stone-50">
                                                <div className="flex items-center gap-3 p-3">
                                                    <div className="w-4 h-4 rounded border-2 border-[#e8b058] flex items-center justify-center"></div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold text-[#1a1a1a]">Klippa grasið</p>
                                                        <p className="text-[10px] text-stone-400">Jón Jónsson</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-3">
                                                    <div className="w-4 h-4 rounded border-2 border-stone-200 flex items-center justify-center">
                                                        <CheckSquare size={10} className="text-stone-300" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold text-stone-400 line-through">Mála pallinn</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mockup Nav */}
                                    <div className="bg-white border-t border-stone-100 p-3 px-6 flex justify-between items-center">
                                        <Home size={20} className="text-[#1a1a1a]" />
                                        <Calendar size={20} className="text-stone-300" />
                                        <div className="w-8 h-8 bg-[#1a1a1a] rounded-full flex items-center justify-center -mt-8 border-4 border-[#FDFCF8]">
                                            <Plus size={16} className="text-white" />
                                        </div>
                                        <CheckSquare size={20} className="text-stone-300" />
                                        <Settings size={20} className="text-stone-300" />
                                    </div>
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
                                    Engin skuldbinding
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

                        {/* Annual Plan Card - Early Bird Edition */}
                        <div className="card relative ring-4 ring-amber transform hover:-translate-y-1 transition-transform bg-white overflow-hidden">
                            <div className="absolute top-0 right-0 bg-red-600 text-white px-8 py-1 rotate-45 translate-x-8 translate-y-4 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                                TAKMARKAÐ
                            </div>
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                <span className="bg-amber text-charcoal px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">Stofn-tilboð</span>
                            </div>
                            <div className="text-center mb-8 pt-4">
                                <h3 className="text-2xl font-serif mb-2">Ársáskrift</h3>
                                <div className="flex flex-col items-center">
                                    <div className="text-stone-400 line-through text-lg">4.990 kr</div>
                                    <div className="text-5xl font-bold font-serif mb-2 text-charcoal">0 kr <span className="text-base font-normal text-grey-mid">/ fyrsta árið</span></div>
                                </div>
                                <p className="text-sm text-charcoal/80 bg-amber/10 inline-block px-3 py-1 rounded">
                                    Aðeins krónur 0 greiddar í dag
                                </p>
                            </div>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-amber flex-shrink-0" />
                                    <span className="font-bold">Innifalið í "Fyrstu 50" tilboði</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-amber flex-shrink-0" />
                                    <span>Ótakmarkaður fjöldi notenda</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-amber flex-shrink-0" />
                                    <span>Fullur aðgangur að öllu</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-amber flex-shrink-0" />
                                    <span>Frítt í 12 mánuði</span>
                                </li>
                            </ul>

                            <button onClick={() => navigate('/signup')} className="btn btn-primary bg-amber w-full py-4 text-lg shadow-lg shadow-amber/20 border-0">
                                Tryggja mér pláss (Ókeypis)
                            </button>
                            <p className="text-[10px] text-center mt-4 text-stone-400">
                                Eftir 1 ár kostar áskriftin 4.990 kr. á ári. <br />
                                Engin greiðslukortaupplýsingar krafist í dag.
                            </p>
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
                        Engin skuldbinding. Prófaðu í heilan mánuð án kostnaðar.
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
                            Skoða sýnishorn
                        </button>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
