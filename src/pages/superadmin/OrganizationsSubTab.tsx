import { Trash2, Eye } from 'lucide-react';
import { db } from '@/lib/firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import DataTable from '@/components/DataTable';
import { logger } from '@/utils/logger';

import type { SetStats, Stats } from './types';

interface OrganizationsSubTabProps {
    stats: Stats;
    setStats: SetStats;
}

export default function OrganizationsSubTab({ stats, setStats }: OrganizationsSubTabProps) {
    return (
        <div className="bg-white border border-stone-200 rounded-lg p-6">
            <h2 className="text-lg font-serif font-semibold mb-6">Skráð félög</h2>
            <DataTable
                caption="Skráð félög"
                columns={[
                    { key: 'name', label: 'Nafn', sortable: true },
                    {
                        key: 'type', label: 'Tegund', sortable: true, render: (row) => (
                            <span className="capitalize">
                                {row.type === 'company' ? 'Fyrirtæki' : 'Félag'}
                            </span>
                        )
                    },
                    {
                        key: 'stats', label: 'Hús', render: (row) => (
                            <span className="text-sm font-medium">
                                {row.stats?.total_properties || 0}
                            </span>
                        )
                    },
                    {
                        key: 'stats', label: 'Meðlimir', render: (row) => (
                            <span className="text-sm font-medium">
                                {row.stats?.total_members || 0}
                            </span>
                        )
                    },
                    {
                        key: 'stats', label: 'Bókanir', render: (row) => (
                            <span className="text-sm font-medium">
                                {row.stats?.total_bookings || 0}
                            </span>
                        )
                    },
                    {
                        key: 'created_at', label: 'Stofnað', render: (row) => (
                            <span className="text-xs text-stone-500">
                                {row.created_at ? new Date(row.created_at).toLocaleDateString('is-IS') : '-'}
                            </span>
                        )
                    },
                ]}
                data={stats.allOrganizations}
                searchKeys={['name', 'billing_email']}
                actions={(row) => (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                // Navigate to organization dashboard or show details
                                window.open(`/organizations/${row.id}/admin`, '_blank');
                            }}
                            className="p-2 text-stone-500 hover:text-charcoal hover:bg-stone-50 rounded transition-colors"
                            title="Skoða félag"
                            aria-label={`Skoða félag ${row.name}`}
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={async () => {
                                if (window.confirm(`Ertu viss um að þú viljir eyða ${row.name}?`)) {
                                    try {
                                        await deleteDoc(doc(db, 'organizations', row.id));
                                        setStats(prev => ({
                                            ...prev,
                                            allOrganizations: prev.allOrganizations.filter(org => org.id !== row.id),
                                            totalOrganizations: prev.totalOrganizations - 1
                                        }));
                                    } catch (error) {
                                        logger.error('Error deleting organization:', error);
                                        alert('Villa kom upp við að eyða félagi');
                                    }
                                }
                            }}
                            className="p-2 text-stone-500 hover:text-red-600 hover:bg-stone-50 rounded transition-colors"
                            title="Eyða félagi"
                            aria-label={`Eyða félagi ${row.name}`}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            />
        </div>
    );
}
