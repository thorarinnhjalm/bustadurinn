import { FileSearch } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { logger } from '@/utils/logger';
import { getUserMessage } from '@/utils/userMessages';

import type { AuditState, SetActionLoading, SystemSubTab, UserActions } from './types';
import AuditScanPanel from './AuditScanPanel';
import AuditHealthPanel from './AuditHealthPanel';

interface SystemTabProps {
    audit: AuditState;
    userActions: UserActions;
    actionLoading: string | null;
    setActionLoading: SetActionLoading;
    /** Kept by the page so the selection survives switching top-level tabs. */
    subTab: SystemSubTab;
    onSubTabChange: (tab: SystemSubTab) => void;
}

export default function SystemTab({
    audit, userActions, actionLoading, setActionLoading, subTab: systemSubTab, onSubTabChange: setSystemSubTab
}: SystemTabProps) {
    const { orphans, setOrphans } = audit;

    const handleRepairOrphan = async (uid: string) => {
        if (!confirm('Viltu búa til Firestore prófíl fyrir þennan notanda?')) return;

        setActionLoading(`repair-${uid}`);
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/admin-repair-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ uid })
            });

            if (res.ok) {
                alert('✅ Notandi lagfærður!');
                setOrphans(prev => prev.filter(o => o.uid !== uid));
            } else {
                const data = await res.json();
                throw new Error(data.error || 'Failed to repair');
            }
        } catch (e: any) {
            logger.error('Repair error:', e);
            alert('Villa við viðgerð: ' + getUserMessage(e));
        } finally {
            setActionLoading(null);
        }
    };

    const exportOrphansCSV = () => {
        if (orphans.length === 0) return;

        const headers = ['Created', 'Email', 'Name', 'isTest', 'UID'];
        const rows = orphans.map(o => [
            new Date(o.createdAt).toISOString(),
            o.email || '',
            o.displayName || '',
            o.isTest ? 'TRUE' : 'FALSE',
            o.uid
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `orphan_users_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div className="space-y-6">
                {/* Sub-tab Navigation */}
                <div className="flex gap-2 border-b border-stone-200 overflow-x-auto">
                    <button
                        type="button"
                        aria-current={systemSubTab === 'audit' ? 'page' : undefined}
                        onClick={() => setSystemSubTab('audit')}
                        className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${systemSubTab === 'audit'
                            ? 'text-charcoal border-b-2 border-amber'
                            : 'text-stone-500 hover:text-stone-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <FileSearch className="w-4 h-4" />
                            Audit
                        </div>
                    </button>
                </div>
            </div>

            {/* Audit Tab */}
            {systemSubTab === 'audit' && (
                <AuditScanPanel
                    audit={audit}
                    userActions={userActions}
                    actionLoading={actionLoading}
                    handleRepairOrphan={handleRepairOrphan}
                    exportOrphansCSV={exportOrphansCSV}
                />
            )}

            {systemSubTab === 'audit' && (
                <AuditHealthPanel
                    audit={audit}
                    userActions={userActions}
                    actionLoading={actionLoading}
                    setActionLoading={setActionLoading}
                    handleRepairOrphan={handleRepairOrphan}
                    exportOrphansCSV={exportOrphansCSV}
                />
            )}
        </>
    );
}
