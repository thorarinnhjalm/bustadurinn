import { Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import DataTable from '@/components/DataTable';

import type { SetStats, Stats } from './types';
import { invalidateStatsCache } from './useSuperAdminData';

interface NewsletterSubTabProps {
    stats: Stats;
    setStats: SetStats;
}

export default function NewsletterSubTab({ stats, setStats }: NewsletterSubTabProps) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-serif">Póstlisti</h2>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold border border-blue-100">
                    {stats.totalSubscribers} skráðir
                </div>
            </div>

            <DataTable
                caption="Póstlisti"
                columns={[
                    {
                        key: 'email',
                        label: 'Netfang',
                        render: (row) => <span className="font-medium text-charcoal">{row.email}</span>
                    },
                    {
                        key: 'created_at',
                        label: 'Skráður þann',
                        render: (row) => row.created_at.toLocaleDateString('is-IS', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                    },
                    {
                        key: 'source',
                        label: 'Uppruni',
                        render: (row) => (
                            <span className="text-xs bg-stone-100 text-grey-mid px-2 py-0.5 rounded">
                                {row.source || '/'}
                            </span>
                        )
                    },
                    {
                        key: 'status',
                        label: 'Staða',
                        render: (row) => (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase">
                                {row.status || 'active'}
                            </span>
                        )
                    },
                    {
                        key: 'actions',
                        label: 'Aðgerðir',
                        render: (row) => (
                            <button
                                type="button"
                                aria-label={`Eyða ${row.email} af póstlista`}
                                onClick={async () => {
                                    if (!confirm(`Eyða ${row.email} af póstlista?`)) return;
                                    await deleteDoc(doc(db, 'newsletter_subscribers', row.id));
                                    invalidateStatsCache();
                                    setStats(prev => ({
                                        ...prev,
                                        allSubscribers: prev.allSubscribers.filter(s => s.id !== row.id),
                                        totalSubscribers: prev.totalSubscribers - 1
                                    }));
                                }}
                                className="text-stone-500 hover:text-red-600 transition-colors p-1.5"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )
                    }
                ]}
                data={stats.allSubscribers}
                searchKeys={['email']}
            />
        </div>
    );
}
