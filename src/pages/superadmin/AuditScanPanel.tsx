import { AlertTriangle, Trash2 } from 'lucide-react';

import type { AuditPanelProps } from './types';

/** System > Audit, first block: the three-column "Úttekt notenda" overview. */
export default function AuditScanPanel({ audit, userActions, actionLoading, handleRepairOrphan, exportOrphansCSV }: AuditPanelProps) {
    const { orphans, stuckUsers, testUsers, auditLoading } = audit;
    const { handleImpersonate, handleDeleteUser, handleSendRecoveryEmail } = userActions;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
                <h3 className="text-lg font-bold text-charcoal mb-2">Úttekt notenda</h3>
                <p className="text-stone-500 mb-6">Athugar samræmi milli auðkenningar (Auth) og Firestore.</p>

                {auditLoading ? (
                    <div className="text-center py-10" role="status">
                        <div className="animate-spin w-8 h-8 border-4 border-charcoal border-t-transparent rounded-full mx-auto mb-4" aria-hidden="true"></div>
                        <p>Skanna gagnagrunn...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* ORPHANS */}
                        <div className="border border-red-100 bg-red-50/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-red-700 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    Munaðarlausir notendur ({orphans.length})
                                </h4>
                                <button type="button" onClick={exportOrphansCSV} className="text-xs text-stone-500 underline px-2 py-1">Flytja út CSV</button>
                            </div>
                            <p className="text-sm text-stone-600 mb-4">
                                Notendur sem eru til í auðkenningu en hafa <strong>engan Firestore-prófíl</strong>.
                                Þetta þýðir yfirleitt að nýskráning hrundi eftir að aðgangur var stofnaður en áður en prófíll var búinn til.
                            </p>

                            <div className="max-h-60 overflow-y-auto bg-white rounded border border-red-100">
                                {orphans.length === 0 ? (
                                    <div className="p-4 text-center text-stone-500 text-sm">Engir munaðarlausir notendur fundust. ✅</div>
                                ) : (
                                    <table className="w-full text-left text-xs">
                                        <caption className="sr-only">Munaðarlausir notendur</caption>
                                        <thead className="bg-stone-50 sticky top-0">
                                            <tr>
                                                <th scope="col" className="p-2">Netfang</th>
                                                <th scope="col" className="p-2">Stofnað</th>
                                                <th scope="col" className="p-2">Aðgerð</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orphans.map(u => (
                                                <tr key={u.uid} className="border-b border-stone-100">
                                                    <td className="p-2 font-mono">{u.email}</td>
                                                    <td className="p-2 text-stone-500">{new Date(u.created).toLocaleDateString()}</td>
                                                    <td className="p-2">
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRepairOrphan(u.uid)}
                                                                className="px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                                                            >
                                                                Laga
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteUser({ uid: u.uid, name: u.name || 'Unknown', email: u.email } as any)}
                                                                className="px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100"
                                                            >
                                                                Eyða
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        {/* STUCK USERS */}
                        <div className="border border-orange-100 bg-orange-50/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-orange-700 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    Fastir notendur (án húss) ({stuckUsers.length})
                                </h4>
                            </div>
                            <p className="text-sm text-stone-600 mb-4">
                                Notendur sem eru með prófíl en <strong>ekkert hús tengt</strong>.
                                Þeir hættu líklega við í skrefinu „Stofna hús“.
                            </p>
                            <div className="max-h-60 overflow-y-auto bg-white rounded border border-orange-100">
                                {stuckUsers.length === 0 ? (
                                    <div className="p-4 text-center text-stone-500 text-sm">Engir fastir notendur fundust. ✅</div>
                                ) : (
                                    <table className="w-full text-left text-xs">
                                        <caption className="sr-only">Fastir notendur án húss</caption>
                                        <thead className="bg-stone-50 sticky top-0">
                                            <tr>
                                                <th scope="col" className="p-2">Nafn / Netfang</th>
                                                <th scope="col" className="p-2">Stofnað</th>
                                                <th scope="col" className="p-2">Aðgerð</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stuckUsers.map(u => (
                                                <tr key={u.uid} className="border-b border-stone-100">
                                                    <td className="p-2">
                                                        <div className="font-bold">{u.name}</div>
                                                        <div className="text-[10px] font-mono text-stone-500">{u.email}</div>
                                                    </td>
                                                    <td className="p-2 text-stone-500">{new Date(u.created).toLocaleDateString()}</td>
                                                    <td className="p-2">
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteUser({ uid: u.uid, email: u.email, name: u.name || 'Prufuaðgangur' } as any)}
                                                                className="text-red-600 hover:text-red-700 bg-red-50 p-1.5 rounded"
                                                                aria-label={`Eyða notandaprófíl ${u.email}`}
                                                                title="Eyða notandaprófíl"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        {/* TEST USERS (PRUFUAÐGANGAR) */}
                        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold flex items-center gap-2 text-purple-900 m-0">
                                    <AlertTriangle className="w-4 h-4" />
                                    Prufuaðgangar ({testUsers.length})
                                </h4>
                            </div>
                            <p className="text-sm text-purple-700 mb-4">
                                Notendur sem hafa 'test', 'prufa', 'demo' eða '@example.com' í nafninu eða netfanginu.
                                Þessu ætti að eyða til að halda kerfinu hreinu.
                            </p>
                            <div className="max-h-60 overflow-y-auto bg-white rounded border border-purple-100">
                                {testUsers.length === 0 ? (
                                    <div className="p-4 text-center text-purple-700 text-sm">Engir prufuaðgangar fundust. ✅</div>
                                ) : (
                                    <table className="w-full text-left text-xs">
                                        <caption className="sr-only">Prufuaðgangar</caption>
                                        <thead className="bg-purple-50 sticky top-0">
                                            <tr>
                                                <th scope="col" className="p-2">Nafn / Netfang</th>
                                                <th scope="col" className="p-2">Hús</th>
                                                <th scope="col" className="p-2">Stofnað</th>
                                                <th scope="col" className="p-2">Aðgerð</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {testUsers.map(u => (
                                                <tr key={u.uid} className="border-b border-purple-100">
                                                    <td className="p-2">
                                                        <div className="font-bold">{u.name}</div>
                                                        <div className="text-[10px] font-mono text-purple-500">{u.email}</div>
                                                    </td>
                                                    <td className="p-2 text-stone-500">
                                                        {u.houseIds && u.houseIds.length > 0 ? (
                                                            <span className="text-red-600 font-bold">{u.houseIds.length} hús</span>
                                                        ) : (
                                                            "0"
                                                        )}
                                                    </td>
                                                    <td className="p-2 text-stone-500">{new Date(u.created).toLocaleDateString()}</td>
                                                    <td className="p-2">
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleImpersonate(u as any)}
                                                                className="px-2 py-1 bg-amber/10 text-amber-ink rounded hover:bg-amber hover:text-charcoal"
                                                                title="Hefja uppsetningu fyrir notandann"
                                                            >
                                                                Setja sig í spor notanda
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSendRecoveryEmail(u as any)}
                                                                disabled={actionLoading === `recovery-${u.uid}`}
                                                                className="px-2 py-1 bg-purple-50 text-purple-700 rounded hover:bg-purple-100"
                                                                title="Senda tölvupóst um að klára uppsetningu"
                                                            >
                                                                Hafa samband
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
