import { useState, useEffect } from 'react';
import { analyticsService, type AnalyticsData } from '@/services/analyticsService';
import { BarChart2, TrendingUp, Users, MousePointer, Eye, Globe } from 'lucide-react';

export default function AnalyticsDashboard() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const result = await analyticsService.getWebAnalytics(period);
                setData(result);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [period]);

    if (loading) return <div className="p-12 text-center text-grey-mid animate-pulse">Sæki gögn úr Google Analytics...</div>;
    if (!data) return <div className="p-12 text-center text-red-400">Gat ekki sótt gögn.</div>;

    return (
        <div className="space-y-8">
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

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    label="Notendur"
                    value={data.activeUsers.toLocaleString('is-IS')}
                    icon={<Users className="w-5 h-5 text-blue-500" />}
                    trend="Aukning"
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
                        {data.topPages.length === 0 && <p className="text-stone-400 text-sm">Engin gögn fundust.</p>}
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
                        {data.trafficSources.length === 0 && <p className="text-stone-400 text-sm">Engin gögn fundust.</p>}
                    </div>
                </div>
            </div>
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
