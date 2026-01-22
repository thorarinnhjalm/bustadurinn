/**
 * Business Intelligence Dashboard
 * Real-time metrics, revenue tracking, engagement analytics, and health scoring
 */

import { useMemo } from 'react';
import {
    TrendingUp, TrendingDown, Users, Home, DollarSign, Activity,
    AlertCircle, CheckCircle, Calendar, Target, Zap, ArrowUp, ArrowDown
} from 'lucide-react';
import type { House, User } from '@/types/models';

interface BIMetrics {
    // Revenue Metrics
    mrr: number;
    mrrGrowth: number;
    arr: number;
    potentialMrr: number; // Future MRR from launch offer houses
    averageRevenuePerHouse: number;

    // User Metrics
    totalUsers: number;
    activeUsers: number; // Logged in within 30 days
    userGrowth: number;

    // House Metrics
    totalHouses: number;
    activeHouses: number; // Activity within 30 days
    houseGrowth: number;
    averageHouseAge: number;
    launchOfferHouses: number; // Houses in 1-year free period

    // Engagement Metrics
    averageBookingsPerHouse: number;
    averageTasksPerHouse: number;
    averageLoginsPerUser: number;

    // Health Metrics
    healthyHouses: number; // Active + growing
    atRiskHouses: number; // Inactive 30+ days
    churnedHouses: number; // Inactive 90+ days

    // Conversion Metrics
    trialToActive: number;
    landingPageVisits: number;
    signupRate: number;
}

interface Props {
    allHouses: House[];
    allUsers: User[];
    allBookings?: any[];
    sandboxVisits?: number;
}

export default function BusinessIntelligenceDashboard({ allHouses, allUsers, allBookings = [], sandboxVisits = 0 }: Props) {

    const metrics = useMemo((): BIMetrics => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        // Filter out demo houses
        const realHouses = allHouses.filter(h => !h.name.toLowerCase().includes('demo') && !h.name.toLowerCase().includes('prufa'));

        // === REVENUE CALCULATIONS ===
        const MONTHLY_PRICE = 2990; // ISK per month

        // Categorize houses with detailed tracking
        const launchOfferHousesList: House[] = [];
        const paidHousesList: House[] = [];
        const freeHousesList: House[] = [];

        realHouses.forEach(h => {
            // Explicitly marked as permanently free
            if (h.subscription_status === 'free') {
                freeHousesList.push(h);
                return;
            }

            const createdAt = h.created_at instanceof Date ? h.created_at : new Date(h.created_at);
            const launchOfferEnds = new Date(createdAt.getTime() + 365 * 24 * 60 * 60 * 1000);

            // Still in 1-year free launch period
            if (now < launchOfferEnds) {
                launchOfferHousesList.push(h);
            } else {
                // After launch offer = should be paying
                paidHousesList.push(h);
            }
        });

        const launchOfferHouses = launchOfferHousesList;
        const paidHouses = paidHousesList;

        const mrr = paidHouses.length * MONTHLY_PRICE;
        const potentialMrr = (paidHouses.length + launchOfferHouses.length) * MONTHLY_PRICE;
        const arr = mrr * 12;
        const averageRevenuePerHouse = realHouses.length > 0 ? mrr / realHouses.length : 0;

        // MRR Growth (compare to 30 days ago)
        const paidHousesThirtyDaysAgo = realHouses.filter(h => {
            if (h.subscription_status === 'free') return false;

            const created = h.created_at instanceof Date ? h.created_at : new Date(h.created_at);
            if (created >= thirtyDaysAgo) return false; // House didn't exist 30 days ago

            const launchOfferEnds = new Date(created.getTime() + 365 * 24 * 60 * 60 * 1000);
            return thirtyDaysAgo >= launchOfferEnds; // Was it paying 30 days ago?
        }).length;
        const mrrThirtyDaysAgo = paidHousesThirtyDaysAgo * MONTHLY_PRICE;
        const mrrGrowth = mrrThirtyDaysAgo > 0 ? ((mrr - mrrThirtyDaysAgo) / mrrThirtyDaysAgo) * 100 : 0;

        // === USER METRICS ===
        const activeUsers = allUsers.filter(u => {
            const lastLogin = u.last_login instanceof Date ? u.last_login : (u.last_login ? new Date(u.last_login) : null);
            return lastLogin && lastLogin > thirtyDaysAgo;
        }).length;

        const usersThirtyDaysAgo = allUsers.filter(u => {
            const created = u.created_at instanceof Date ? u.created_at : new Date(u.created_at);
            return created < thirtyDaysAgo;
        }).length;
        const userGrowth = usersThirtyDaysAgo > 0 ? ((allUsers.length - usersThirtyDaysAgo) / usersThirtyDaysAgo) * 100 : 0;

        // === HOUSE METRICS ===
        const activeHouses = realHouses.filter(h => {
            const updated = h.updated_at instanceof Date ? h.updated_at : new Date(h.updated_at);
            return updated > thirtyDaysAgo;
        }).length;

        const housesThirtyDaysAgoCount = realHouses.filter(h => {
            const created = h.created_at instanceof Date ? h.created_at : new Date(h.created_at);
            return created < thirtyDaysAgo;
        }).length;
        const houseGrowth = housesThirtyDaysAgoCount > 0 ? ((realHouses.length - housesThirtyDaysAgoCount) / housesThirtyDaysAgoCount) * 100 : 0;

        const totalHouseAge = realHouses.reduce((sum, h) => {
            const created = h.created_at instanceof Date ? h.created_at : new Date(h.created_at);
            const ageInDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            return sum + ageInDays;
        }, 0);
        const averageHouseAge = realHouses.length > 0 ? totalHouseAge / realHouses.length : 0;

        // === ENGAGEMENT METRICS ===
        const averageBookingsPerHouse = realHouses.length > 0 ? allBookings.length / realHouses.length : 0;

        // === HEALTH METRICS ===
        const healthyHouses = realHouses.filter(h => {
            const updated = h.updated_at instanceof Date ? h.updated_at : new Date(h.updated_at);
            return updated > thirtyDaysAgo;
        }).length;

        const atRiskHouses = realHouses.filter(h => {
            const updated = h.updated_at instanceof Date ? h.updated_at : new Date(h.updated_at);
            return updated > ninetyDaysAgo && updated <= thirtyDaysAgo;
        }).length;

        const churnedHouses = realHouses.filter(h => {
            const updated = h.updated_at instanceof Date ? h.updated_at : new Date(h.updated_at);
            return updated <= ninetyDaysAgo;
        }).length;

        // === CONVERSION METRICS ===
        const trialHouses = realHouses.filter(h => h.subscription_status === 'trial').length;
        const activeSubscriptions = paidHouses.length;
        const trialToActive = trialHouses > 0 ? (activeSubscriptions / (activeSubscriptions + trialHouses)) * 100 : 0;

        const signupRate = sandboxVisits > 0 ? (allUsers.length / sandboxVisits) * 100 : 0;

        return {
            mrr,
            mrrGrowth,
            arr,
            potentialMrr,
            averageRevenuePerHouse,
            totalUsers: allUsers.length,
            activeUsers,
            userGrowth,
            totalHouses: realHouses.length,
            activeHouses,
            houseGrowth,
            averageHouseAge,
            launchOfferHouses: launchOfferHouses.length,
            averageBookingsPerHouse,
            averageTasksPerHouse: 0, // TODO: Calculate from tasks
            averageLoginsPerUser: activeUsers / (allUsers.length || 1),
            healthyHouses,
            atRiskHouses,
            churnedHouses,
            trialToActive,
            landingPageVisits: sandboxVisits,
            signupRate
        };
    }, [allHouses, allUsers, allBookings, sandboxVisits]);

    const MetricCard = ({
        title,
        value,
        change,
        icon: Icon,
        format = 'number',
        trend = 'neutral'
    }: {
        title: string;
        value: number;
        change?: number;
        icon: any;
        format?: 'number' | 'currency' | 'percentage' | 'days';
        trend?: 'up' | 'down' | 'neutral';
    }) => {
        const formatValue = () => {
            switch (format) {
                case 'currency':
                    return `${Math.round(value).toLocaleString('is-IS')} kr`;
                case 'percentage':
                    return `${value.toFixed(1)}%`;
                case 'days':
                    return `${Math.round(value)} dagar`;
                default:
                    return Math.round(value).toLocaleString('is-IS');
            }
        };

        const getTrendColor = () => {
            if (trend === 'neutral') return 'text-stone-500';
            return trend === 'up' ? 'text-green-600' : 'text-red-600';
        };

        const TrendIcon = change && change > 0 ? ArrowUp : ArrowDown;

        return (
            <div className="bg-white rounded-xl p-6 border border-stone-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center">
                        <Icon size={20} className="text-amber" />
                    </div>
                    {change !== undefined && (
                        <div className={`flex items-center gap-1 text-sm font-bold ${getTrendColor()}`}>
                            <TrendIcon size={14} />
                            <span>{Math.abs(change).toFixed(1)}%</span>
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <p className="text-stone-500 text-xs font-medium uppercase tracking-wider">{title}</p>
                    <p className="text-3xl font-serif font-bold text-charcoal">{formatValue()}</p>
                </div>
            </div>
        );
    };

    const HealthScoreCard = ({
        label,
        count,
        total,
        color,
        icon: Icon
    }: {
        label: string;
        count: number;
        total: number;
        color: string;
        icon: any;
    }) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;

        return (
            <div className="bg-white rounded-xl p-6 border border-stone-200">
                <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
                        <Icon size={20} className="text-white" />
                    </div>
                    <span className="text-2xl font-serif font-bold text-charcoal">{count}</span>
                </div>
                <div className="space-y-2">
                    <p className="text-stone-700 font-medium">{label}</p>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-full ${color} transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        <span className="text-xs font-bold text-stone-500">{percentage.toFixed(0)}%</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-charcoal mb-2">Business Intelligence</h2>
                    <p className="text-stone-600">Rauntíma greining á viðskiptaþróun og notendahegðun</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm font-bold text-green-700">Live Data</span>
                </div>
            </div>

            {/* Revenue Metrics */}
            <section>
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">💰 Tekjumælingar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="Mánaðarlegar endurteknar tekjur"
                        value={metrics.mrr}
                        change={metrics.mrrGrowth}
                        icon={DollarSign}
                        format="currency"
                        trend={metrics.mrrGrowth > 0 ? 'up' : metrics.mrrGrowth < 0 ? 'down' : 'neutral'}
                    />
                    <MetricCard
                        title="Áætlaðar framtíðartekjur (MRR)"
                        value={metrics.potentialMrr}
                        icon={TrendingUp}
                        format="currency"
                    />
                    <MetricCard
                        title="Ársendurteknar tekjur (ARR)"
                        value={metrics.arr}
                        icon={TrendingUp}
                        format="currency"
                    />
                    <MetricCard
                        title="Hús í 1 árs fríi"
                        value={metrics.launchOfferHouses}
                        icon={Home}
                    />
                </div>
            </section>

            {/* Growth Metrics */}
            <section>
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">📈 Vaxtarmælingar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="Hús alls"
                        value={metrics.totalHouses}
                        change={metrics.houseGrowth}
                        icon={Home}
                        trend={metrics.houseGrowth > 0 ? 'up' : 'down'}
                    />
                    <MetricCard
                        title="Virk hús (30 dagar)"
                        value={metrics.activeHouses}
                        icon={Activity}
                    />
                    <MetricCard
                        title="Notendur alls"
                        value={metrics.totalUsers}
                        change={metrics.userGrowth}
                        icon={Users}
                        trend={metrics.userGrowth > 0 ? 'up' : 'down'}
                    />
                    <MetricCard
                        title="Virkir notendur (30 dagar)"
                        value={metrics.activeUsers}
                        icon={Zap}
                    />
                </div>
            </section>

            {/* Engagement Metrics */}
            <section>
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">🎯 Notkunarmælingar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="Meðalaldur húsa"
                        value={metrics.averageHouseAge}
                        icon={Calendar}
                        format="days"
                    />
                    <MetricCard
                        title="Meðaltal bókana/hús"
                        value={metrics.averageBookingsPerHouse}
                        icon={Calendar}
                    />
                    <MetricCard
                        title="Heimsóknir á /prufa"
                        value={metrics.landingPageVisits}
                        icon={Activity}
                    />
                    <MetricCard
                        title="Skráningarhlutfall"
                        value={metrics.signupRate}
                        icon={Target}
                        format="percentage"
                        trend={metrics.signupRate > 10 ? 'up' : 'down'}
                    />
                </div>
            </section>

            {/* Health Score */}
            <section>
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">🏥 Heilsuskor húsa</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <HealthScoreCard
                        label="Heilbrigð hús"
                        count={metrics.healthyHouses}
                        total={metrics.totalHouses}
                        color="bg-green-500"
                        icon={CheckCircle}
                    />
                    <HealthScoreCard
                        label="Í áhættu (30-90 dagar óvirk)"
                        count={metrics.atRiskHouses}
                        total={metrics.totalHouses}
                        color="bg-amber"
                        icon={AlertCircle}
                    />
                    <HealthScoreCard
                        label="Fallin frá (90+ dagar óvirk)"
                        count={metrics.churnedHouses}
                        total={metrics.totalHouses}
                        color="bg-red-500"
                        icon={TrendingDown}
                    />
                </div>
            </section>

            {/* Breakdown Detail */}
            <section className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                <h3 className="text-lg font-serif font-bold text-charcoal mb-4">🔍 Sundurliðun húsa</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-stone-200">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <p className="text-sm font-bold text-stone-700 uppercase tracking-wider">Greiðandi hús</p>
                        </div>
                        <p className="text-3xl font-serif font-bold text-charcoal mb-1">{(metrics.mrr / 2990).toFixed(0)}</p>
                        <p className="text-xs text-stone-500">Hús sem hafa lokið 1 árs launch offer</p>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-stone-200">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-amber"></div>
                            <p className="text-sm font-bold text-stone-700 uppercase tracking-wider">Launch Offer</p>
                        </div>
                        <p className="text-3xl font-serif font-bold text-charcoal mb-1">{metrics.launchOfferHouses}</p>
                        <p className="text-xs text-stone-500">Hús í 1 árs fríi (verða greiðendur)</p>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-stone-200">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-stone-400"></div>
                            <p className="text-sm font-bold text-stone-700 uppercase tracking-wider">Hús alls</p>
                        </div>
                        <p className="text-3xl font-serif font-bold text-charcoal mb-1">{metrics.totalHouses}</p>
                        <p className="text-xs text-stone-500">Demo og prufa hús eru útilokuð</p>
                    </div>
                </div>
            </section>

            {/* Key Insights */}
            <section className="bg-gradient-to-br from-amber/5 to-stone-100 rounded-2xl p-8 border border-stone-200">
                <h3 className="text-xl font-serif font-bold text-charcoal mb-4">🔍 Lykilupplýsingar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <div className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>
                            <div>
                                <p className="font-bold text-charcoal">
                                    {((metrics.activeHouses / metrics.totalHouses) * 100).toFixed(0)}% aktíf hús síðustu 30 daga
                                </p>
                                <p className="text-sm text-stone-600">Sterkt engagement hlutfall</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber mt-2"></div>
                            <div>
                                <p className="font-bold text-charcoal">
                                    {metrics.atRiskHouses} hús í áhættuhóp
                                </p>
                                <p className="text-sm text-stone-600">Þarfnast engagement herferðar</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
                            <div>
                                <p className="font-bold text-charcoal">
                                    MRR vöxtur: {metrics.mrrGrowth > 0 ? '+' : ''}{metrics.mrrGrowth.toFixed(1)}%
                                </p>
                                <p className="text-sm text-stone-600">Mánaðarlegur samanburður</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2"></div>
                            <div>
                                <p className="font-bold text-charcoal">
                                    {((metrics.activeUsers / metrics.totalUsers) * 100).toFixed(0)}% notenda virkir
                                </p>
                                <p className="text-sm text-stone-600">Innskráð síðustu 30 daga</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
