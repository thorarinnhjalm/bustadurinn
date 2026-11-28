import { BarChart2, Zap } from 'lucide-react';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import BusinessIntelligenceDashboard from '@/components/analytics/BusinessIntelligenceDashboard';

import type { AnalyticsSubTab, Stats } from './types';

interface AnalyticsTabProps {
    stats: Stats;
    /** Kept by the page so the selection survives switching top-level tabs. */
    subTab: AnalyticsSubTab;
    onSubTabChange: (tab: AnalyticsSubTab) => void;
}

export default function AnalyticsTab({ stats, subTab: analyticsSubTab, onSubTabChange: setAnalyticsSubTab }: AnalyticsTabProps) {
    return (
        <div className="space-y-6">
            {/* Sub-tab Navigation */}
            <div className="flex gap-2 border-b border-stone-200">
                <button
                    type="button"
                    aria-current={analyticsSubTab === 'bi' ? 'page' : undefined}
                    onClick={() => setAnalyticsSubTab('bi')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${analyticsSubTab === 'bi'
                        ? 'text-charcoal border-b-2 border-amber'
                        : 'text-stone-500 hover:text-stone-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Business Intel
                    </div>
                </button>
                <button
                    type="button"
                    aria-current={analyticsSubTab === 'analytics' ? 'page' : undefined}
                    onClick={() => setAnalyticsSubTab('analytics')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${analyticsSubTab === 'analytics'
                        ? 'text-charcoal border-b-2 border-amber'
                        : 'text-stone-500 hover:text-stone-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <BarChart2 className="w-4 h-4" />
                        Greining
                    </div>
                </button>
            </div>

            {/* Sub-tab Content */}
            {analyticsSubTab === 'bi' && (
                <BusinessIntelligenceDashboard
                    allHouses={stats.allHouses}
                    allUsers={stats.allUsers}
                    allBookings={stats.allBookings}
                    sandboxVisits={stats.sandboxVisits}
                />
            )}
            {analyticsSubTab === 'analytics' && <AnalyticsDashboard />}
        </div>
    );
}
