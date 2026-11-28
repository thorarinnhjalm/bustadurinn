import { AlertTriangle, Loader2, Mail, Reply, RefreshCw, Trash2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { logger } from '@/utils/logger';

import type { AuditPanelProps, SetActionLoading } from './types';

interface AuditHealthPanelProps extends AuditPanelProps {
    setActionLoading: SetActionLoading;
}

/** System > Audit, second block: "Audit & Health" (orphan table, stuck users, bulk recovery email). */
export default function AuditHealthPanel({
    audit, userActions, actionLoading, setActionLoading, handleRepairOrphan, exportOrphansCSV
}: AuditHealthPanelProps) {
    const { orphans, stuckUsers, auditLoading, fetchOrphans } = audit;
    const { handleDeleteUser, handleSendRecoveryEmail } = userActions;

    const handleBulkRecoveryEmails = async () => {
        const count = stuckUsers.length;
        if (count === 0) return;
        if (!confirm(`Viltu senda recovery tölvupóst á ALLA ${count} notendur sem vantar hús?`)) return;

        setActionLoading('bulk-recovery');
        let successCount = 0;
        let failCount = 0;

        for (const user of stuckUsers) {
            try {
                const res = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
                    },
                    body: JSON.stringify({
                        templateId: 'finish_setup',
                        to: user.email,
                        variables: {
                            name: user.name || 'Vinur',
                        }
                    })
                });
                if (!res.ok) throw new Error(`send-email failed (${res.status})`);
                successCount++;
            } catch (error) {
                logger.error(`Failed to send to ${user.email}:`, error);
                failCount++;
            }
        }

        setActionLoading(null);
        alert(`Lokið! Sendi á ${successCount} notendur. ${failCount > 0 ? `${failCount} mistókust.` : ''}`);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center text-charcoal">
                <div>
                    <h2 className="text-2xl font-serif font-bold">Audit & Health</h2>
                    <p className="text-stone-500">Finna og laga notendur sem vantar Firestore prófíl (Orphans)</p>
                </div>
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={exportOrphansCSV}
                        disabled={orphans.length === 0}
                        className="btn border-stone-200 bg-white text-charcoal hover:bg-stone-50 flex items-center gap-2"
                    >
                        <Reply className="w-4 h-4 rotate-180" />
                        Flytja út CSV
                    </button>
                    <button
                        type="button"
                        onClick={fetchOrphans}
                        disabled={auditLoading}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${auditLoading ? 'animate-spin' : ''}`} />
                        Keyra úttekt
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                <table className="w-full text-left">
                    <caption className="sr-only">Munaðarlausir notendur</caption>
                    <thead className="bg-stone-50 border-b border-stone-200">
                        <tr>
                            <th scope="col" className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Stofnað</th>
                            <th scope="col" className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Netfang</th>
                            <th scope="col" className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Nafn</th>
                            <th scope="col" className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Tegund</th>
                            <th scope="col" className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Aðgerðir</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {auditLoading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-stone-500" role="status">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                    Sæki gögn og athuga Firestore...
                                </td>
                            </tr>
                        ) : orphans.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-green-600 font-medium">
                                    ✅ Engir munaðarlausir notendur fundust! Allt í góðu.
                                </td>
                            </tr>
                        ) : (
                            orphans.map((o) => (
                                <tr key={o.uid} className="hover:bg-stone-50">
                                    <td className="px-6 py-4 text-sm text-stone-600">
                                        {new Date(o.createdAt).toLocaleString('is-IS')}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-charcoal">{o.email}</td>
                                    <td className="px-6 py-4 text-sm text-stone-500">{o.displayName || '-'}</td>
                                    <td className="px-6 py-4">
                                        {o.isTest ? (
                                            <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 text-[10px] uppercase font-bold tracking-wider">Prufuaðgangur</span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] uppercase font-bold tracking-wider">Mögulega raunverulegur notandi</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleRepairOrphan(o.uid)}
                                                disabled={actionLoading === `repair-${o.uid}`}
                                                className="px-3 py-1 text-xs bg-amber/10 text-amber-ink border border-amber/20 rounded hover:bg-amber/20 flex items-center gap-1"
                                            >
                                                {actionLoading === `repair-${o.uid}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                                Gera við
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteUser({ uid: o.uid, email: o.email, name: o.displayName || 'Munaðarlaus' } as any)}
                                                disabled={actionLoading === `delete-user-${o.uid}`}
                                                className="p-1.5 hover:bg-red-50 text-stone-500 hover:text-red-600 rounded transition-colors"
                                                title="Eyða notanda"
                                                aria-label={`Eyða notanda ${o.email}`}
                                            >
                                                {actionLoading === `delete-user-${o.uid}` ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-3 h-3" />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {orphans.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-800">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <div className="text-sm">
                        <p className="font-bold">Hvað eru „munaðarlausir notendur“?</p>
                        <p className="mt-1 opacity-90">
                            Þetta eru notendur sem hafa tekist að stofna aðgang (Firebase Auth) en vegna villu tókst ekki að búa til prófíl í gagnagrunninum (Firestore).
                            Með því að smella á "Gera við" býrðu til lágmarks prófíl svo þeir geti skráð sig inn og haldið áfram.
                        </p>
                    </div>
                </div>
            )}

            <div className="pt-8 border-t border-stone-200">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-xl font-serif font-bold">Notendur án húss (Stuck)</h3>
                        <p className="text-stone-500 text-sm">Notendur sem hafa búið til prófíl en ekki klárað að búa til eða tengjast húsi.</p>
                    </div>
                    {stuckUsers.length > 0 && (
                        <button
                            type="button"
                            onClick={handleBulkRecoveryEmails}
                            disabled={actionLoading === 'bulk-recovery'}
                            className="btn bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2"
                        >
                            {actionLoading === 'bulk-recovery' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                            Senda á alla ({stuckUsers.length})
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                    <table className="w-full text-left">
                        <caption className="sr-only">Notendur án húss</caption>
                        <thead className="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Stofnað</th>
                                <th scope="col" className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Netfang</th>
                                <th scope="col" className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Nafn</th>
                                <th scope="col" className="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Aðgerðir</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {auditLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-stone-500" role="status">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                        Sæki gögn...
                                    </td>
                                </tr>
                            ) : stuckUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-green-600 font-medium">
                                        ✅ Engir notendur fastir í onboarding!
                                    </td>
                                </tr>
                            ) : (
                                stuckUsers.map((u) => (
                                    <tr key={u.uid} className="hover:bg-stone-50">
                                        <td className="px-6 py-4 text-sm text-stone-600">
                                            {new Date(u.created).toLocaleString('is-IS')}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-charcoal">{u.email}</td>
                                        <td className="px-6 py-4 text-sm text-stone-500">{u.name}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSendRecoveryEmail(u)}
                                                    disabled={actionLoading === `recovery-${u.uid}`}
                                                    className="px-3 py-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 rounded hover:bg-indigo-100 flex items-center gap-1"
                                                >
                                                    {actionLoading === `recovery-${u.uid}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                                                    Senda tölvupóst
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteUser({ uid: u.uid, email: u.email, name: u.name || 'Óþekktur' } as any)}
                                                    disabled={actionLoading === `delete-user-${u.uid}`}
                                                    className="p-1.5 hover:bg-red-50 text-stone-500 hover:text-red-600 rounded transition-colors"
                                                    title="Eyða notanda"
                                                    aria-label={`Eyða notanda ${u.email}`}
                                                >
                                                    {actionLoading === `delete-user-${u.uid}` ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-3 h-3" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
