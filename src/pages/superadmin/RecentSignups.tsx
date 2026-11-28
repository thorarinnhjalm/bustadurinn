import { Fragment } from 'react';
import { Users, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import FunnelTimeline from '@/components/analytics/FunnelTimeline';

import type { User } from '@/types/models';

interface RecentSignupsProps {
    users: User[];
    /** Expanded row is kept by the page so it survives the loading gate. */
    expandedUid: string | null;
    onExpandedChange: (uid: string | null) => void;
}

/** Recent Signups / Drop-off Monitor, shown above the tab bar on every tab. */
export default function RecentSignups({ users, expandedUid: expandedSignupUid, onExpandedChange: setExpandedSignupUid }: RecentSignupsProps) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200 mb-8">
            <h3 className="text-lg font-bold text-charcoal mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Nýskráningar (síðustu 24 klst)
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <caption className="sr-only">Nýskráningar síðustu 24 klukkustundir</caption>
                    <thead>
                        <tr className="border-b border-stone-100 text-grey-dark">
                            <th scope="col" className="pb-2">Tími</th>
                            <th scope="col" className="pb-2">Nafn / Netfang</th>
                            <th scope="col" className="pb-2">Staða</th>
                            <th scope="col" className="pb-2">Hús</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users
                            .filter(u => {
                                const now = new Date();
                                const created = u.created_at ? new Date((u.created_at as any).seconds * 1000) : new Date();
                                return (now.getTime() - created.getTime()) < 24 * 60 * 60 * 1000;
                            })
                            .sort((a, b) => {
                                const dateA = a.created_at ? new Date((a.created_at as any).seconds * 1000) : new Date();
                                const dateB = b.created_at ? new Date((b.created_at as any).seconds * 1000) : new Date();
                                return dateB.getTime() - dateA.getTime();
                            })
                            .map(user => {
                                const hasHouse = user.house_ids && user.house_ids.length > 0;
                                const createdDate = user.created_at ? new Date((user.created_at as any).seconds * 1000) : new Date();
                                const expanded = expandedSignupUid === user.uid;
                                return (
                                    <Fragment key={user.uid}>
                                    <tr
                                        className="relative border-b border-stone-50 last:border-0 hover:bg-stone-50"
                                    >
                                        <td className="py-2 text-grey-mid">
                                            <button
                                                type="button"
                                                onClick={() => setExpandedSignupUid(expanded ? null : user.uid)}
                                                aria-expanded={expanded}
                                                aria-label={`Sýna skref notanda ${user.name || user.email}`}
                                                title="Smelltu til að sjá skrefin"
                                                className="flex items-center gap-1 after:absolute after:inset-0 after:content-['']"
                                            >
                                                {expanded ? <ChevronDown className="w-4 h-4" aria-hidden="true" /> : <ChevronRight className="w-4 h-4" aria-hidden="true" />}
                                                {createdDate.toLocaleTimeString('is-IS', { hour: '2-digit', minute: '2-digit' })}
                                            </button>
                                        </td>
                                        <td className="py-2 font-medium text-charcoal">
                                            <div>{user.name || 'Nafnlaust'}</div>
                                            <div className="text-xs text-grey-mid">{user.email}</div>
                                        </td>
                                        <td className="py-2">
                                            {hasHouse ? (
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                                                    Kláraði
                                                </span>
                                            ) : (
                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                                    <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                                                    Festist?
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-2 text-grey-dark">
                                            {hasHouse ? `${user.house_ids?.length} hús` : '-'}
                                        </td>
                                    </tr>
                                    {expanded && (
                                        <tr className="border-b border-stone-100 bg-stone-50/50">
                                            <td colSpan={4} className="py-3 px-2">
                                                <FunnelTimeline uid={user.uid} />
                                            </td>
                                        </tr>
                                    )}
                                    </Fragment>
                                );
                            })}
                        {users.filter(u => {
                            const now = new Date();
                            const created = u.created_at ? new Date((u.created_at as any).seconds * 1000) : new Date();
                            return (now.getTime() - created.getTime()) < 24 * 60 * 60 * 1000;
                        }).length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-4 text-center text-grey-mid italic">
                                        Engar nýskráningar í dag
                                    </td>
                                </tr>
                            )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
