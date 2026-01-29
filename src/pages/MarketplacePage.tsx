import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import MarketingLayout from '@/components/MarketingLayout';
import DashboardLayout from '@/components/DashboardLayout';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { ServiceProvider } from '@/types/models';
import { Search, MapPin, Star, Hammer, Shovel, Droplets, Zap, Home, ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import ReviewModal from '@/components/marketplace/ReviewModal';
import { useAppStore } from '@/store/appStore';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';

const CATEGORIES = [
    { id: 'all', label: 'Allt', icon: Home },
    { id: 'snow_removal', label: 'Snjómokstur', icon: Shovel },
    { id: 'cleaning', label: 'Þrif & Umsjón', icon: Droplets },
    { id: 'maintenance', label: 'Viðhald & Smíðar', icon: Hammer },
    { id: 'plumbing', label: 'Pípulagnir', icon: Droplets },
    { id: 'electrician', label: 'Rafvirki', icon: Zap },
    { id: 'hot_tub', label: 'Heitapottar', icon: Droplets },
];

export default function MarketplacePage() {
    const navigate = useNavigate();
    const { isAuthenticated, currentHouse } = useAppStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const [providers, setProviders] = useState<ServiceProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
    const [searchArea, setSearchArea] = useState(searchParams.get('area') || '');
    const [reviewingProvider, setReviewingProvider] = useState<ServiceProvider | null>(null);

    useEffect(() => {
        const fetchProviders = async () => {
            setLoading(true);
            try {
                // Base query: only active providers
                const q = query(
                    collection(db, 'service_providers'),
                    where('status', '==', 'active'),
                    orderBy('rating_avg', 'desc') // Show highest rated first
                );

                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ServiceProvider[];
                setProviders(data);
            } catch (error) {
                console.error('Error fetching providers:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProviders();
    }, []);

    // Auto-fill area from currentHouse
    useEffect(() => {
        if (!searchArea && currentHouse?.address && !searchParams.get('area')) {
            // Try to extract city/area from address (e.g. "Street 1, Selfoss" -> "Selfoss")
            const parts = currentHouse.address.split(',');
            let area = parts.length > 1 ? parts[parts.length - 1].trim() : currentHouse.address;

            // Remove zip code if present (e.g. "801 Selfoss" -> "Selfoss")
            area = area.replace(/^\d{3}\s+/, '');

            if (area) setSearchArea(area);
        }
    }, [currentHouse, searchArea, searchParams]);

    // Update URL when filters change
    useEffect(() => {
        const params: any = {};
        if (selectedCategory !== 'all') params.category = selectedCategory;
        if (searchArea) params.area = searchArea;
        setSearchParams(params);
    }, [selectedCategory, searchArea, setSearchParams]);

    // Client-side filtering
    const filteredProviders = providers.filter(provider => {
        const matchCategory = selectedCategory === 'all' || provider.category === selectedCategory;
        const matchArea = !searchArea || provider.service_areas.some(area =>
            area.toLowerCase().includes(searchArea.toLowerCase())
        );
        return matchCategory && matchArea;
    });

    // SEO Data (JSON-LD)
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": filteredProviders.map((provider, index) => ({
            "@type": "LocalBusiness",
            "position": index + 1,
            "name": provider.name,
            "description": provider.description,
            "telephone": provider.contact_phone,
            "email": provider.contact_email,
            "areaServed": provider.service_areas.map(area => ({
                "@type": "Place",
                "name": area
            })),
            "aggregateRating": provider.rating_count > 0 ? {
                "@type": "AggregateRating",
                "ratingValue": provider.rating_avg,
                "reviewCount": provider.rating_count
            } : undefined
        }))
    };

    const content = (
        <>
            <Helmet>
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            </Helmet>

            {/* Header / Filter Section */}
            <div className="bg-charcoal text-white py-12 px-6">
                <div className="max-w-6xl mx-auto">
                    {isAuthenticated && (
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors mb-6 text-sm font-bold"
                        >
                            <ArrowLeft size={16} />
                            Til baka á yfirlit
                        </button>
                    )}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <h1 className="text-3xl md:text-4xl font-serif font-bold">Torgið – Þjónusta í nágrenninu</h1>
                        <Link
                            to="/verktakar"
                            className="btn btn-outline border-white/30 text-white hover:bg-white/10 hover:border-white text-sm px-4 py-2"
                        >
                            Ertu verktaki?
                        </Link>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                        <div className="flex-1 relative">
                            <MapPin className="absolute left-3 top-3 text-stone-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Hvar er bústaðurinn? (t.d. Grímsnes)"
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-black/20 border border-white/20 text-white placeholder-stone-400 focus:outline-none focus:border-amber/50 focus:bg-black/40 transition-all"
                                value={searchArea}
                                onChange={e => setSearchArea(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all border ${selectedCategory === cat.id
                                        ? 'bg-amber text-charcoal border-amber font-bold shadow-lg shadow-amber/20'
                                        : 'bg-black/20 text-stone-300 border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <cat.icon className="w-4 h-4" />
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div className="bg-bone min-h-[600px] py-12 px-6">
                <div className="max-w-6xl mx-auto">
                    {loading ? (
                        <div className="text-center py-20 text-grey-mid">Hleð þjónustuaðilum...</div>
                    ) : filteredProviders.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-charcoal mb-2">Engir aðilar fundust</h3>
                            <p className="text-grey-mid">Prófaðu að víkka leitina eða velja annan flokk.</p>
                            <button
                                onClick={() => { setSearchArea(''); setSelectedCategory('all'); }}
                                className="mt-6 text-amber hover:underline font-medium"
                            >
                                Hreinsa síu
                            </button>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProviders.map(provider => (
                                <div key={provider.id} className="card hover:shadow-xl transition-all duration-300 group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-charcoal group-hover:text-amber-700 transition-colors">
                                                {provider.name}
                                            </h3>
                                            <div className="flex items-center gap-1 text-sm text-amber mt-1">
                                                <Star className="w-4 h-4 fill-current" />
                                                <span className="font-bold">{provider.rating_avg.toFixed(1)}</span>
                                                <span className="text-grey-mid font-normal">({provider.rating_count} umsagnir)</span>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-stone-100 rounded-lg text-stone-500">
                                            {CATEGORIES.find(c => c.id === provider.category)?.icon &&
                                                React.createElement(CATEGORIES.find(c => c.id === provider.category)!.icon, { size: 20 })
                                            }
                                        </div>
                                    </div>

                                    <p className="text-grey-dark text-sm mb-4 line-clamp-3">
                                        {provider.description}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {provider.service_areas.slice(0, 3).map((area, i) => (
                                            <span key={i} className="text-xs bg-bg-bone px-2 py-1 rounded text-stone-600 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {area}
                                            </span>
                                        ))}
                                        {provider.service_areas.length > 3 && (
                                            <span className="text-xs text-grey-mid px-1 py-1">+{provider.service_areas.length - 3}</span>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-grey-warm">
                                        {isAuthenticated ? (
                                            <div className="flex gap-3">
                                                <a
                                                    href={`tel:${provider.contact_phone}`}
                                                    className="flex-1 btn btn-secondary text-center py-2 text-sm justify-center"
                                                >
                                                    Hringja
                                                </a>
                                                <a
                                                    href={`mailto:${provider.contact_email}?subject=Fyrirspurn af Bústaðurinn.is`}
                                                    className="flex-1 btn btn-primary text-center py-2 text-sm justify-center"
                                                >
                                                    Senda póst
                                                </a>
                                                <button
                                                    onClick={() => setReviewingProvider(provider)}
                                                    className="px-3 py-2 text-sm font-medium text-amber hover:bg-amber/10 rounded-lg transition-colors"
                                                >
                                                    Gefðu einkunn
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <p className="text-sm text-grey-mid mb-2">Skráðu þig inn til að sjá upplýsingar</p>
                                                <button
                                                    onClick={() => navigate('/login')}
                                                    className="btn btn-outline w-full py-2 text-sm"
                                                >
                                                    Innskrá
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {reviewingProvider && (
                <ErrorBoundary fallback={
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setReviewingProvider(null)} />
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <div className="text-center">
                                <div className="text-4xl mb-4">⚠️</div>
                                <h3 className="font-serif font-bold text-xl mb-2">Villa kom upp</h3>
                                <p className="text-stone-600 mb-4">Ekki tókst að hlaða umsagnarglugga</p>
                                <button
                                    onClick={() => setReviewingProvider(null)}
                                    className="btn btn-primary"
                                >
                                    Loka
                                </button>
                            </div>
                        </div>
                    </div>
                }>
                    <ReviewModal
                        provider={reviewingProvider}
                        onClose={() => setReviewingProvider(null)}
                        onReviewSubmitted={() => {
                            setReviewingProvider(null);
                            window.location.reload();
                        }}
                    />
                </ErrorBoundary>
            )}
        </>
    );

    if (isAuthenticated) {
        return (
            <DashboardLayout>
                {content}
            </DashboardLayout>
        );
    }

    const canonicalUrl = `https://www.bustadurinn.is/torgid${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`;

    return (
        <MarketingLayout
            title="Torgið - Þjónusta fyrir sumarbústaði | Snjómokstur, Viðhald o.fl."
            description="Finndu iðnaðarmenn, snjómokstur og þjónustuaðila fyrir sumarbústaðinn þinn. Tengjum saman eigendur og verktaka."
            canonical={canonicalUrl}
        >
            {content}
        </MarketingLayout>
    );
}
