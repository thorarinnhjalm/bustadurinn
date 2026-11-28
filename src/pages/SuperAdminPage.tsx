/**
 * Super Admin Mission Control - Professional Dashboard
 * Desktop-first, high-density data tables, real impersonation
 *
 * This file is the orchestrator: auth/loading/error gates, the header with the top-level
 * tab bar, and one tab component per tab. Tabs, sub-tabs, modals and hooks live in
 * `src/pages/superadmin/`.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, BarChart2, Mail, Settings,
    Database, LogOut, AlertTriangle, XCircle, Shield
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { seedDemoData } from '@/utils/seedDemoData';
import AdminLayout from '@/components/AdminLayout';
import { logger } from '@/utils/logger';
import { getUserMessage } from '@/utils/userMessages';

import type { House } from '@/types/models';
import type { AnalyticsSubTab, CommunicationsSubTab, DataSubTab, SystemSubTab, TopTab } from './superadmin/types';
import { useSuperAdminData } from './superadmin/useSuperAdminData';
import { useEmailTemplates } from './superadmin/useEmailTemplates';
import { useAdminAudit } from './superadmin/useAdminAudit';
import { useUserActions } from './superadmin/useUserActions';
import RecentSignups from './superadmin/RecentSignups';
import OverviewTab from './superadmin/OverviewTab';
import DataTab from './superadmin/DataTab';
import CommunicationsTab from './superadmin/CommunicationsTab';
import AnalyticsTab from './superadmin/AnalyticsTab';
import SystemTab from './superadmin/SystemTab';
import ConfirmModal from './superadmin/ConfirmModal';
import type { ConfirmModalState } from './superadmin/ConfirmModal';

export default function SuperAdminPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TopTab>('overview');

    // Sub-tab states for consolidated tabs (kept here so they survive switching top-level tabs)
    const [dataSubTab, setDataSubTab] = useState<DataSubTab>('houses');
    const [communicationsSubTab, setCommunicationsSubTab] = useState<CommunicationsSubTab>('contacts');
    const [analyticsSubTab, setAnalyticsSubTab] = useState<AnalyticsSubTab>('bi');
    const [systemSubTab, setSystemSubTab] = useState<SystemSubTab>('audit');

    const [replyText, setReplyText] = useState('');
    const [expandedSignupUid, setExpandedSignupUid] = useState<string | null>(null);
    const [seeding, setSeeding] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const currentUser = useAppStore((state) => state.currentUser);
    const userHouses = useAppStore((state) => state.userHouses);
    const setCurrentHouse = useAppStore((state) => state.setCurrentHouse);

    const handleHouseSwitch = (house: House) => {
        setCurrentHouse(house);
        navigate('/dashboard');
    };

    const { stats, setStats, loading, setLoading, error, fetchWarnings, setFetchWarnings, fetchStats } = useSuperAdminData();
    const emailTemplates = useEmailTemplates(activeTab === 'communications' && communicationsSubTab === 'emails');
    const audit = useAdminAudit(activeTab === 'system' && systemSubTab === 'audit');
    const userActions = useUserActions(setStats, setActionLoading, audit);

    // Seed demo data
    const handleSeedDemo = async () => {
        if (!confirm('Create demo house with 3 users, bookings, tasks, and finance data?')) {
            return;
        }

        setSeeding(true);
        try {
            const result = await seedDemoData();
            alert(`✅ Demo data created!\n\nHouse: Sumarbústaður við Þingvallavatn\n\nDemo Users:\n${result.users.map(u => `• ${u.name} (${u.email})`).join('\n')}\n\nPassword: Demo123!`);
            // Refresh data instead of reloading page
            window.location.reload();
        } catch (error: any) {
            logger.error('Seed demo error:', error);
            alert(`❌ Villa: ${getUserMessage(error)}`);
        } finally {
            setSeeding(false);
        }
    };

    const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

    if (loading) {
        return (
            <AdminLayout
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as 'overview' | 'data' | 'communications' | 'analytics' | 'system')}
                onBackClick={() => navigate('/dashboard')}
                userHouses={userHouses}
                onHouseSelect={handleHouseSwitch}
            >
                <div className="flex items-center justify-center h-full">
                    <div className="text-center" role="status">
                        <div className="animate-spin w-12 h-12 border-4 border-charcoal border-t-transparent rounded-full mx-auto mb-4" aria-hidden="true"></div>
                        <p className="text-stone-500 font-mono text-sm">Hleð kerfisgögnum...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    // Error state
    if (error) {
        return (
            <AdminLayout
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as 'overview' | 'data' | 'communications' | 'analytics' | 'system')}
                onBackClick={() => navigate('/dashboard')}
                userHouses={userHouses}
                onHouseSelect={handleHouseSwitch}
            >
                <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-md" role="alert">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl" aria-hidden="true">⚠️</span>
                        </div>
                        <h2 className="text-xl font-serif font-bold text-charcoal mb-2">Ekki tókst að sækja gögn</h2>
                        <p className="text-stone-600 mb-4">{error}</p>
                        <button type="button" onClick={() => window.location.reload()} className="btn btn-primary">
                            Reyna aftur
                        </button>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    // Empty state with Debug Info
    const isEmpty = stats.totalHouses === 0 && stats.totalUsers === 0;
    if (isEmpty) {
        return (
            <AdminLayout
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as 'overview' | 'data' | 'communications' | 'analytics' | 'system')}
                onBackClick={() => navigate('/dashboard')}
                userHouses={userHouses}
                onHouseSelect={handleHouseSwitch}
            >
                <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Database className="w-8 h-8 text-stone-400" aria-hidden="true" />
                        </div>
                        <h2 className="text-xl font-serif font-bold text-charcoal mb-2">Engin gögn fundust</h2>
                        <p className="text-stone-600 mb-6">Gagnagrunnurinn virðist tómur eða aðgangi var hafnað.</p>

                        <div className="bg-stone-50 p-4 rounded-lg mb-6 text-left text-xs font-mono text-stone-500 break-all border border-stone-200">
                            <p className="font-bold text-stone-700 mb-2">Villuleitarupplýsingar:</p>
                            <p>UID: {currentUser?.uid}</p>
                            <p>Netfang: {currentUser?.email}</p>
                            <p className="mt-2 text-amber-700">
                                Athugaðu að þetta UID sé í firestore.rules í fallinu "isSuperAdmin()".
                            </p>
                        </div>

                        <div className="flex gap-3 justify-center">
                            <button
                                type="button"
                                onClick={handleSeedDemo}
                                disabled={seeding}
                                className="btn btn-primary flex items-center gap-2"
                            >
                                <Database className="w-4 h-4" aria-hidden="true" />
                                {seeding ? 'Bý til gögn...' : 'Búa til sýnigögn'}
                            </button>
                            <button
                                type="button"
                                onClick={() => fetchStats(true)}
                                className="px-4 py-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors font-medium text-stone-600"
                            >
                                Endurhlaða
                            </button>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as any)}
            onBackClick={() => navigate('/dashboard')}
            userHouses={userHouses}
            onHouseSelect={handleHouseSwitch}
        >
            {fetchWarnings.length > 0 && (
                <div className="bg-amber/10 border border-amber/30 text-amber-900 px-4 py-3 rounded-xl mb-6 relative shadow-sm" role="alert">
                    <strong className="font-bold flex items-center gap-2"><AlertTriangle size={18} className="text-amber-600"/> Athugið: Sum gögn hlóðust ekki rétt</strong>
                    <ul className="list-disc ml-8 mt-2 text-sm space-y-1 text-amber-800">
                        {fetchWarnings.map((warning, idx) => (
                            <li key={idx}>{warning}</li>
                        ))}
                    </ul>
                    <p className="mt-3 text-xs text-amber-700 bg-amber/10 inline-block px-2 py-1 rounded-md">Aðgerðir eða greiningar gætu verið ófullkomnar. Athugaðu Firebase öryggisreglur (Firestore Rules).</p>
                    <button type="button" aria-label="Loka viðvörun" onClick={() => setFetchWarnings([])} className="absolute top-2 right-2 p-1.5 hover:bg-amber/20 rounded-lg transition-colors">
                        <XCircle size={20} className="text-amber-700" aria-hidden="true"/>
                    </button>
                </div>
            )}

            {/* Recent Signups / Drop-off Monitor */}
            <RecentSignups users={stats.allUsers} expandedUid={expandedSignupUid} onExpandedChange={setExpandedSignupUid} />

            {/* Premium Sticky Header & Navigation */}
            <div className="sticky top-0 z-50 flex flex-col bg-white/80 backdrop-blur-xl border-b border-stone-200/60 shadow-sm transition-all duration-300">
                <div className="max-w-7xl mx-auto w-full px-4 md:px-8">
                    {/* Top Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between py-4 md:h-20 gap-4 md:gap-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className={`p-2.5 rounded-xl bg-gradient-to-br from-charcoal to-stone-800 text-white shadow-lg shadow-charcoal/20 transition-transform duration-500 motion-safe:hover:rotate-180`}>
                                    <Shield className={`w-5 h-5 md:w-6 md:h-6`} aria-hidden="true" />
                                </div>
                                <div>
                                    <h1 className="text-xl md:text-2xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-charcoal to-stone-600">
                                        Super Admin
                                    </h1>
                                    <p className="text-[10px] md:text-xs text-stone-500 font-medium tracking-wide">
                                        v1.2.0 • <span className="text-green-600 flex-inline items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 motion-safe:animate-pulse inline-block" aria-hidden="true"></span>Online</span>
                                    </p>
                                </div>
                            </div>

                            {/* Mobile Actions */}
                            <div className="flex md:hidden gap-2">
                                <button
                                    type="button"
                                    onClick={() => window.location.href = '/'}
                                    aria-label="Hætta"
                                    className="p-2 text-stone-500 hover:text-charcoal transition-colors"
                                >
                                    <LogOut className="w-5 h-5" aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleSeedDemo}
                                disabled={actionLoading === 'seed'}
                                className="flex items-center gap-2 px-4 py-2 bg-stone-100/50 hover:bg-stone-100 text-stone-600 rounded-lg text-sm font-medium transition-all motion-safe:hover:scale-105 motion-safe:active:scale-95"
                            >
                                <Database className={`w-4 h-4 ${actionLoading === 'seed' ? 'animate-spin' : ''}`} aria-hidden="true" />
                                <span className="font-bold">Seed Data</span>
                            </button>

                            <div className="h-8 w-px bg-stone-200 mx-2"></div>

                            <button
                                type="button"
                                onClick={() => window.location.href = '/'}
                                className="group flex items-center gap-2 px-4 py-2 text-stone-500 hover:text-red-600 transition-colors"
                            >
                                <span className="text-sm font-medium group-hover:underline decoration-red-600/30 underline-offset-4">Hætta</span>
                                <LogOut className="w-4 h-4 motion-safe:group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                            </button>
                        </div>
                    </div>

                    {/* Streamlined 5-Tab Navigation */}
                    <div className="flex items-center gap-1 md:gap-2 pb-0 overflow-x-auto no-scrollbar" role="tablist" aria-label="Flipar stjórnborðs">
                        {[
                            { id: 'overview', icon: LayoutDashboard, label: 'Yfirlit' },
                            { id: 'data', icon: Database, label: 'Gögn' },
                            { id: 'communications', icon: Mail, label: 'Samskipti' },
                            { id: 'analytics', icon: BarChart2, label: 'Greining' },
                            { id: 'system', icon: Settings, label: 'Kerfi' }
                        ].map(tab => (
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === tab.id}
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                                    relative flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-300
                                    whitespace-nowrap rounded-t-lg select-none
                                    ${activeTab === tab.id
                                        ? 'text-charcoal'
                                        : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50/50'
                                    }
                                `}
                            >
                                <tab.icon className={`w-4 h-4 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110 text-amber-ink' : 'motion-safe:group-hover:scale-110'}`} aria-hidden="true" />
                                {tab.label}

                                {/* Active Indicator Line */}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber to-orange-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-8" role="tabpanel" aria-label={{ overview: 'Yfirlit', data: 'Gögn', communications: 'Samskipti', analytics: 'Greining', system: 'Kerfi' }[activeTab as string]}>
                {/* Analytics Tab - Consolidated */}
                {activeTab === 'analytics' && (
                    <AnalyticsTab stats={stats} subTab={analyticsSubTab} onSubTabChange={setAnalyticsSubTab} />
                )}

                {/* Data Tab - Consolidated (houses, users, organizations, providers + edit-house modal) */}
                {activeTab === 'data' && (
                    <DataTab
                        stats={stats}
                        setStats={setStats}
                        actionLoading={actionLoading}
                        setActionLoading={setActionLoading}
                        userActions={userActions}
                        subTab={dataSubTab}
                        onSubTabChange={setDataSubTab}
                    />
                )}

                {/* Communications Tab - Consolidated (contacts + reply modal, templates + editor modal, newsletter, feedback) */}
                {activeTab === 'communications' && (
                    <CommunicationsTab
                        stats={stats}
                        setStats={setStats}
                        loading={loading}
                        setLoading={setLoading}
                        actionLoading={actionLoading}
                        setActionLoading={setActionLoading}
                        emailTemplates={emailTemplates}
                        reply={{ replyText, setReplyText }}
                        subTab={communicationsSubTab}
                        onSubTabChange={setCommunicationsSubTab}
                    />
                )}

                {/* System Tab - Consolidated (audit panels) */}
                {activeTab === 'system' && (
                    <SystemTab
                        audit={audit}
                        userActions={userActions}
                        actionLoading={actionLoading}
                        setActionLoading={setActionLoading}
                        subTab={systemSubTab}
                        onSubTabChange={setSystemSubTab}
                    />
                )}

                {/* Overview Tab */}
                {activeTab === 'overview' && <OverviewTab stats={stats} />}

                {/* Custom Confirmation Modal */}
                <ConfirmModal confirmModal={confirmModal} onClose={() => setConfirmModal(null)} />
            </div >
        </AdminLayout >
    );
}
