import { Home, Users, Send, Activity, UserCog, Building2 } from 'lucide-react';

import type { Stats } from './types';

interface OverviewTabProps {
    stats: Stats;
}

export default function OverviewTab({ stats }: OverviewTabProps) {
    // Activity Calculation
    const unifiedActivity = [
        ...stats.allHouses.map(h => {
            const date = (h.created_at as any)?.toDate ? (h.created_at as any).toDate() : new Date(h.created_at || 0);
            return { type: 'house', data: h, date };
        }),
        ...stats.allUsers.map(u => {
            const date = (u.created_at as any)?.toDate ? (u.created_at as any).toDate() : new Date(u.created_at || 0);
            return { type: 'user', data: u, date };
        })
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

    return (
        <div className="space-y-6">
            {/* Primary Metrics Grid - Mobile Optimized */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
                {/* Total Houses */}
                <div className="bg-white border border-stone-200 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                            <Home className="w-4 h-4 text-stone-500" />
                        </div>
                        <p className="text-[10px] md:text-xs text-stone-500 font-bold uppercase tracking-wider">Hús</p>
                    </div>
                    <p className="text-2xl md:text-4xl font-serif font-bold text-charcoal mb-1">{stats.totalHouses}</p>
                    <p className="text-[10px] md:text-xs text-stone-500">Skráð hús</p>
                </div>

                {/* Total Users */}
                <div className="bg-white border border-stone-200 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                            <Users className="w-4 h-4 text-stone-500" />
                        </div>
                        <p className="text-[10px] md:text-xs text-stone-500 font-bold uppercase tracking-wider">Notendur</p>
                    </div>
                    <p className="text-2xl md:text-4xl font-serif font-bold text-charcoal mb-1">{stats.totalUsers}</p>
                    <p className="text-[10px] md:text-xs text-stone-500">
                        {stats.totalHouses > 0 ? (stats.totalUsers / stats.totalHouses).toFixed(1) : 0} að meðaltali
                    </p>
                </div>

                {/* Newsletter Subscribers */}
                <div className="bg-white border border-stone-200 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                            <Send className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-[10px] md:text-xs text-stone-500 font-bold uppercase tracking-wider">Póstlisti</p>
                    </div>
                    <p className="text-2xl md:text-4xl font-serif font-bold text-charcoal mb-1">{stats.totalSubscribers}</p>
                    <p className="text-[10px] md:text-xs text-stone-500">
                        Væntanlegir viðskiptavinir
                    </p>
                </div>

                {/* Total Providers */}
                <div className="bg-white border border-stone-200 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                            <UserCog className="w-4 h-4 text-amber-ink" />
                        </div>
                        <p className="text-[10px] md:text-xs text-stone-500 font-bold uppercase tracking-wider">Verktakar</p>
                    </div>
                    <p className="text-2xl md:text-4xl font-serif font-bold text-charcoal mb-1">{stats.totalProviders}</p>
                    <p className="text-[10px] md:text-xs text-stone-500">
                        Skráðir þjónustuaðilar
                    </p>
                </div>

                {/* Organizations */}
                <div className="bg-white border border-stone-200 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-indigo-600" />
                        </div>
                        <p className="text-[10px] md:text-xs text-stone-500 font-bold uppercase tracking-wider">Félög</p>
                    </div>
                    <p className="text-2xl md:text-4xl font-serif font-bold text-charcoal mb-1">{stats.totalOrganizations}</p>
                    <p className="text-[10px] md:text-xs text-stone-500">
                        Skráð félög og fyrirtæki
                    </p>
                </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-serif font-bold mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-stone-400" />
                    Nýleg virkni
                </h3>
                <div className="space-y-4">
                    {unifiedActivity.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 pb-4 border-b border-stone-100 last:border-0 last:pb-0">
                            <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${item.type === 'house' ? 'bg-amber/10 text-amber-ink' : 'bg-blue-50 text-blue-600'
                                }`}>
                                {item.type === 'house' ? <Home className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-charcoal">
                                    {item.type === 'house'
                                        ? `Nýtt hús skráð: ${item.data.name}`
                                        : `Nýr notandi skráður: ${item.data.name}`
                                    }
                                </p>
                                <p className="text-xs text-stone-500">
                                    {item.date.toLocaleDateString('is-IS', {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                    {item.type === 'house' && item.data.address && ` • ${item.data.address}`}
                                    {item.type === 'user' && ` • ${item.data.email}`}
                                </p>
                            </div>
                        </div>
                    ))}
                    {unifiedActivity.length === 0 && (
                        <p className="text-stone-500 text-sm italic">Engin nýleg virkni fundin.</p>
                    )}
                </div>
            </div>

            {/* Organizations Overview */}
            {stats.allOrganizations.length > 0 && (
                <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-serif font-bold mb-4 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-stone-400" />
                        Félög - Yfirlit
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Top Organizations by Members */}
                        <div>
                            <h4 className="text-sm font-semibold text-stone-600 mb-3">Stærstu félög (eftir meðlimum)</h4>
                            <div className="space-y-3">
                                {stats.allOrganizations
                                    .sort((a, b) => (b.stats?.total_members || 0) - (a.stats?.total_members || 0))
                                    .slice(0, 5)
                                    .map((org, idx) => (
                                        <div key={org.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-charcoal">{org.name}</p>
                                                    <p className="text-xs text-stone-500">
                                                        {org.type === 'company' ? 'Fyrirtæki' : 'Félag'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-charcoal">{org.stats?.total_members || 0}</p>
                                                <p className="text-xs text-stone-500">meðlimir</p>
                                            </div>
                                        </div>
                                    ))}
                                {stats.allOrganizations.length === 0 && (
                                    <p className="text-stone-500 text-sm italic">Engin félög skráð ennþá.</p>
                                )}
                            </div>
                        </div>

                        {/* Recent Organizations */}
                        <div>
                            <h4 className="text-sm font-semibold text-stone-600 mb-3">Nýjustu félög</h4>
                            <div className="space-y-3">
                                {stats.allOrganizations
                                    .sort((a, b) => {
                                        const dateA = a.created_at instanceof Date ? a.created_at : new Date(0);
                                        const dateB = b.created_at instanceof Date ? b.created_at : new Date(0);
                                        return dateB.getTime() - dateA.getTime();
                                    })
                                    .slice(0, 5)
                                    .map((org) => (
                                        <div key={org.id} className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                                <Building2 className="w-4 h-4 text-indigo-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-charcoal truncate">{org.name}</p>
                                                <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
                                                    <span>
                                                        {org.created_at instanceof Date
                                                            ? org.created_at.toLocaleDateString('is-IS', { month: 'short', day: 'numeric' })
                                                            : 'Óþekkt dagsetning'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
