import { Mail, Trash2, RefreshCw, Loader2, UserCog } from 'lucide-react';
import { updateUserNameInAllCollections } from '@/services/userService';
import DataTable from '@/components/DataTable';
import { logger } from '@/utils/logger';
import { getUserMessage } from '@/utils/userMessages';

import type { User } from '@/types/models';
import type { SetActionLoading, Stats, UserActions } from './types';

interface UsersSubTabProps {
    stats: Stats;
    actionLoading: string | null;
    setActionLoading: SetActionLoading;
    userActions: UserActions;
}

export default function UsersSubTab({ stats, actionLoading, setActionLoading, userActions }: UsersSubTabProps) {
    const { handleImpersonate, handleDeleteUser, handleSendRecoveryEmail } = userActions;

    const handleSyncName = async (user: User) => {
        if (!confirm(`Force update name "${user.name}" across all system records (tasks, logs, bookings etc)?`)) return;

        setActionLoading(`sync-name-${user.uid}`);
        try {
            await updateUserNameInAllCollections(user.uid, user.name, user.house_ids || []);
            alert('✅ Nafn notanda samstillt í öllum söfnum.');
        } catch (error: any) {
            logger.error('Error syncing name:', error);
            alert(`❌ Villa: ${getUserMessage(error)}`);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Desktop Table */}
            <div className="hidden md:block bg-white border border-stone-200 rounded-lg p-6">
                <h2 className="text-lg font-serif font-semibold mb-6">Notendaskrá</h2>
                <DataTable
                    caption="Notendaskrá"
                    columns={[
                        { key: 'name', label: 'Nafn', sortable: true },
                        {
                            key: 'email',
                            label: 'Netfang',
                            sortable: true,
                            render: (row) => <span className="font-mono text-xs">{row.email}</span>
                        },
                        {
                            key: 'house_ids',
                            label: 'Hús',
                            render: (row) => (
                                <span className="font-mono">{row.house_ids?.length || 0}</span>
                            )
                        },
                        {
                            key: 'created_at',
                            label: 'Skráður',
                            sortable: true,
                            render: (row) => {
                                if (!row.created_at) return '—';
                                const date = row.created_at as any;
                                const timestamp = date.seconds ? new Date(date.seconds * 1000) : new Date();
                                return timestamp.toLocaleDateString('is-IS');
                            }
                        }
                    ]}
                    data={stats.allUsers}
                    searchKeys={['name', 'email']}
                    actions={(row) => (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => handleImpersonate(row)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-amber/30 text-amber-ink hover:bg-amber hover:text-charcoal rounded transition-colors"
                            >
                                <UserCog className="w-3 h-3" />
                                Líkja eftir
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSyncName(row)}
                                disabled={actionLoading === `sync-name-${row.uid}`}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-blue-200 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Samstilla nafn í öllu kerfinu"
                            >
                                <RefreshCw className={`w-3 h-3 ${actionLoading === `sync-name-${row.uid}` ? 'animate-spin' : ''}`} />
                                Samstilla
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteUser(row)}
                                disabled={actionLoading === `delete-user-${row.uid}`}
                                className="p-1.5 hover:bg-red-50 text-stone-500 hover:text-red-600 rounded transition-colors"
                                title="Eyða notanda"
                                aria-label={`Eyða notanda ${row.name}`}
                            >
                                {actionLoading === `delete-user-${row.uid}` ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSendRecoveryEmail(row)}
                                disabled={actionLoading === `recovery-${row.uid}`}
                                className="p-1.5 hover:bg-purple-50 text-stone-500 hover:text-purple-600 rounded transition-colors"
                                title="Senda póst um að klára uppsetningu"
                                aria-label={`Senda ${row.name} póst um að klára uppsetningu`}
                            >
                                {actionLoading === `recovery-${row.uid}` ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Mail className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    )}
                />
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                <h2 className="text-xl font-serif font-bold px-1">Notendaskrá ({stats.allUsers.length})</h2>
                {stats.allUsers.map((user) => {
                    const createdAt = user.created_at as any;
                    const timestamp = createdAt?.seconds ? new Date(createdAt.seconds * 1000) : new Date();

                    return (
                        <div key={user.uid} className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-lg font-serif font-bold text-stone-500">
                                    {user.name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-charcoal truncate">{user.name}</h3>
                                    <p className="text-xs text-stone-500 font-mono truncate">{user.email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm mb-4 border-t border-stone-100 pt-3">
                                <div>
                                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-0.5">Hús</p>
                                    <p className="font-mono">{user.house_ids?.length || 0}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-0.5">Skráður</p>
                                    <p className="font-mono text-xs">{timestamp.toLocaleDateString('is-IS')}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleImpersonate(user)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber/10 text-amber-ink border border-amber/20 rounded-lg text-xs font-bold hover:bg-amber hover:text-charcoal transition-colors"
                                >
                                    <UserCog className="w-3 h-3" />
                                    Líkja eftir
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSyncName(user)}
                                    className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg"
                                    aria-label={`Samstilla nafn ${user.name}`}
                                >
                                    <RefreshCw className={`w-4 h-4 ${actionLoading === `sync-name-${user.uid}` ? 'animate-spin' : ''}`} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteUser(user)}
                                    className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-lg"
                                    aria-label={`Eyða notanda ${user.name}`}
                                >
                                    {actionLoading === `delete-user-${user.uid}` ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
