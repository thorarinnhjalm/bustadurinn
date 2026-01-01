import { useState, useEffect } from 'react';
import { analyticsService, type AnalyticsData } from '@/services/analyticsService';
import { BarChart2, TrendingUp, Users, MousePointer, Eye, Globe, Search, ArrowRight } from 'lucide-react';

interface SearchConsoleData {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    topQueries: {
        query: string;
        clicks: number;
        impressions: number;
    }[];
}

export default function AnalyticsDashboard() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [searchData, setSearchData] = useState<SearchConsoleData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Parallel fetch
                const [analyticsRes, searchRes] = await Promise.all([
                    analyticsService.getWebAnalytics(period),
                    fetch(`/api/search-console?period=${period}`).then(r => r.json())
                ]);
                setData(analyticsRes);
                setSearchData(searchRes);
            } catch (error) {
                console.error('Error loading analytics:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [period]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <div className="w-8 h-8 border-4 border-amber border-t-transparent rounded-full animate-spin"></div>
            <p className="text-stone-500 animate-pulse">Sæki gögn úr Google Analytics & Search Console...</p>
        </div>
    );
    if (!data) return <div className="p-12 text-center text-red-400">Gat ekki sótt gögn.</div>;

    return (
        <div className="space-y-12">
            {/* Header / Period Selector */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-serif font-bold text-charcoal flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-amber" />
                    Vefgreining (GA4)
                </h2>
                <div className="flex bg-stone-100 rounded-lg p-1">
                    {(['7d', '30d', '90d'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${period === p ? 'bg-white shadow text-charcoal' : 'text-stone-500 hover:text-stone-700'
                                }`}
                        >
                            {p === '7d' ? '7 dagar' : p === '30d' ? '30 dagar' : '90 dagar'}
                        </button>
                    ))}
                </div>
            </div>

            {/* GA4 Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    label="Notendur"
                    value={data.activeUsers.toLocaleString('is-IS')}
                    icon={<Users className="w-5 h-5 text-blue-500" />}
                />
                <MetricCard
                    label="Heimsóknir"
                    value={data.sessions.toLocaleString('is-IS')}
                    icon={<MousePointer className="w-5 h-5 text-purple-500" />}
                />
                <MetricCard
                    label="Flettingar"
                    value={data.screenPageViews.toLocaleString('is-IS')}
                    icon={<Eye className="w-5 h-5 text-green-500" />}
                />
                <MetricCard
                    label="Engagament"
                    value={`${Math.round(data.engagementRate * 100)}%`}
                    icon={<TrendingUp className="w-5 h-5 text-amber" />}
                />
            </div>

            {/* GA4 Charts */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Top Pages */}
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                    <h3 className="font-bold text-charcoal mb-4 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-stone-400" /> Vinsælustu síður
                    </h3>
                    <div className="space-y-3">
                        {data.topPages.slice(0, 6).map((page, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="font-mono text-stone-600 truncate max-w-[200px]" title={page.pagePath}>
                                    {page.pagePath}
                                </span>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-stone-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber"
                                            style={{ width: `${Math.min((page.screenPageViews / data.topPages[0].screenPageViews) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-stone-900 font-medium min-w-[30px] text-right">
                                        {page.screenPageViews}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Traffic Sources */}
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                    <h3 className="font-bold text-charcoal mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-stone-400" /> Uppruni umferðar
                    </h3>
                    <div className="space-y-3">
                        {data.trafficSources.slice(0, 6).map((source, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-stone-600 capitalize">
                                    {source.source}
                                </span>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-stone-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500"
                                            style={{ width: `${Math.min((source.users / data.trafficSources[0].users) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-stone-900 font-medium min-w-[30px] text-right">
                                        {source.users}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SEO Section (Search Console) */}
            {searchData && (
                <div className="pt-8 border-t border-stone-200">
                    <h2 className="text-xl font-serif font-bold text-charcoal flex items-center gap-2 mb-6">
                        <Search className="w-5 h-5 text-blue-600" />
                        Google Search (SEO)
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <MetricCard
                            label="Smellir (Clicks)"
                            value={searchData.clicks?.toLocaleString() || '0'}
                            icon={<MousePointer className="w-5 h-5 text-blue-600" />}
                        />
                        <MetricCard
                            label="Birtingar (Impressions)"
                            value={searchData.impressions?.toLocaleString() || '0'}
                            icon={<Eye className="w-5 h-5 text-purple-600" />}
                        />
                        <MetricCard
                            label="CTR (Smellihlutfall)"
                            value={`${searchData.ctr?.toFixed(1) || '0'}%`}
                            icon={<TrendingUp className="w-5 h-5 text-green-600" />}
                        />
                        <MetricCard
                            label="Meðal Staða"
                            value={searchData.position?.toFixed(1) || '-'}
                            icon={<Globe className="w-5 h-5 text-amber" />}
                        />
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                        <h3 className="font-bold text-charcoal mb-4 flex items-center gap-2">
                            <Search className="w-4 h-4 text-stone-400" /> Top Search Queries
                        </h3>
                        {searchData.topQueries && searchData.topQueries.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-stone-500 uppercase bg-stone-50">
                                        <tr>
                                            <th className="px-4 py-2">Leitarorð</th>
                                            <th className="px-4 py-2 text-right">Smellir</th>
                                            <th className="px-4 py-2 text-right">Birtingar</th>
                                            <th className="px-4 py-2 text-right">CTR</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {searchData.topQueries.map((q, idx) => (
                                            <tr key={idx} className="hover:bg-stone-50">
                                                <td className="px-4 py-2 font-medium text-stone-700">{q.query}</td>
                                                <td className="px-4 py-2 text-right text-stone-600">{q.clicks}</td>
                                                <td className="px-4 py-2 text-right text-stone-600">{q.impressions}</td>
                                                <td className="px-4 py-2 text-right text-stone-600">
                                                    {((q.clicks / q.impressions) * 100).toFixed(1)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-stone-400 text-sm">Engin leitarorð fundust á þessu tímabili.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function MetricCard({ label, value, icon, trend }: { label: string, value: string, icon: React.ReactNode, trend?: string }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between h-24">
            <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-stone-500 uppercase tracking-widest">{label}</span>
                {icon}
            </div>
            <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-charcoal">{value}</span>
                {trend && <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded-full">{trend}</span>}
            </div>
        </div>
    );
}
