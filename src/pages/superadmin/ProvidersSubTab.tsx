import { Trash2, XCircle, CheckCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteField, writeBatch, doc, updateDoc } from 'firebase/firestore';
import DataTable from '@/components/DataTable';
import { logger } from '@/utils/logger';
import { getUserMessage } from '@/utils/userMessages';

import type { ServiceProvider } from '@/types/models';
import type { SetActionLoading, SetStats, Stats } from './types';
import { invalidateStatsCache } from './useSuperAdminData';

interface ProvidersSubTabProps {
    stats: Stats;
    setStats: SetStats;
    actionLoading: string | null;
    setActionLoading: SetActionLoading;
}

export default function ProvidersSubTab({ stats, setStats, actionLoading, setActionLoading }: ProvidersSubTabProps) {
    // One-off: move contact fields from service_providers docs to service_provider_contacts.
    const handleMigrateProviderContacts = async () => {
        if (!confirm('Færa tengiliðaupplýsingar verktaka í sér safn og fjarlægja þær af opinberu skránni?')) return;
        setActionLoading('migrate-provider-contacts');
        try {
            const snap = await getDocs(collection(db, 'service_providers'));
            const legacy = snap.docs.filter(d => {
                const x = d.data();
                return x.contact_email !== undefined || x.contact_phone !== undefined || x.address !== undefined;
            });
            for (let i = 0; i < legacy.length; i += 200) {
                const batch = writeBatch(db);
                legacy.slice(i, i + 200).forEach(d => {
                    const x = d.data();
                    batch.set(doc(db, 'service_provider_contacts', d.id), {
                        contact_email: x.contact_email ?? '',
                        contact_phone: x.contact_phone ?? '',
                        address: x.address ?? '',
                        owner_uid: x.owner_uid ?? null
                    });
                    batch.update(d.ref, {
                        contact_email: deleteField(),
                        contact_phone: deleteField(),
                        address: deleteField()
                    });
                });
                await batch.commit();
            }
            invalidateStatsCache();
            alert(`Lokið! ${legacy.length} verktakar fluttir.`);
        } catch (error: any) {
            logger.error('Error migrating provider contacts:', error);
            alert('Villa: ' + getUserMessage(error));
        } finally {
            setActionLoading(null);
        }
    };

    // Provider Logic
    const handleToggleProviderStatus = async (provider: ServiceProvider) => {
        const newStatus = provider.status === 'active' ? 'pending' : 'active';
        if (!confirm(`Breyta stöðu ${provider.name} í "${newStatus}"?`)) return;

        setActionLoading(`provider-${provider.id}`);
        try {
            await updateDoc(doc(db, 'service_providers', provider.id), {
                status: newStatus
            });

            invalidateStatsCache();
            setStats(prev => ({
                ...prev,
                allProviders: prev.allProviders.map(p =>
                    p.id === provider.id ? { ...p, status: newStatus } : p
                )
            }));
            alert(`✅ Staða uppfærð: ${newStatus}`);
        } catch (error: any) {
            logger.error('Error updating provider:', error);
            alert('Villa: ' + getUserMessage(error));
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteProvider = async (providerId: string) => {
        if (!confirm('Ertu viss um að þú viljir eyða þessum verktaka?')) return;
        setActionLoading(`delete-provider-${providerId}`);
        try {
            const delBatch = writeBatch(db);
            delBatch.delete(doc(db, 'service_providers', providerId));
            delBatch.delete(doc(db, 'service_provider_contacts', providerId));
            await delBatch.commit();
            invalidateStatsCache();
            setStats(prev => ({
                ...prev,
                allProviders: prev.allProviders.filter(p => p.id !== providerId)
            }));
            alert('✅ Verktaka eytt!');
        } catch (error: any) {
            logger.error('Error deleting provider:', error);
            alert('Villa: ' + getUserMessage(error));
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="bg-white border border-stone-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-serif font-semibold">Skráðir Verktakar</h2>
                <button
                    type="button"
                    onClick={handleMigrateProviderContacts}
                    disabled={actionLoading === 'migrate-provider-contacts'}
                    className="btn btn-secondary text-sm"
                >
                    Færa tengiliðaupplýsingar
                </button>
            </div>
            <DataTable
                caption="Skráðir verktakar"
                columns={[
                    { key: 'name', label: 'Nafn', sortable: true },
                    { key: 'category', label: 'Flokkur', sortable: true },
                    {
                        key: 'service_areas', label: 'Svæði', render: (row) => (
                            <div className="flex flex-wrap gap-1">
                                {row.service_areas?.map((area: string, i: number) => (
                                    <span key={i} className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">
                                        {area}
                                    </span>
                                )) || '-'}
                            </div>
                        )
                    },
                    { key: 'address', label: 'Heimilisfang', sortable: true },
                    {
                        key: 'contact_phone', label: 'Sími / Netfang', render: (row) => (
                            <div className="text-xs">
                                <div>{row.contact_phone}</div>
                                <div className="text-stone-500">{row.contact_email}</div>
                            </div>
                        )
                    },
                    {
                        key: 'status', label: 'Staða', render: (row) => (
                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                ${row.status === 'active' ? 'bg-green-100 text-green-700' :
                                    row.status === 'banned' ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'}`}>
                                {row.status}
                            </span>
                        )
                    },

                ]}
                data={stats.allProviders}
                searchKeys={['name', 'category', 'contact_email']}
                actions={(row) => (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => handleToggleProviderStatus(row)}
                            className={`p-2 rounded hover:bg-stone-50 transition-colors ${row.status === 'active' ? 'text-amber-ink hover:text-amber-700' : 'text-green-600 hover:text-green-700'}`}
                            title={row.status === 'active' ? 'Setja í bið' : 'Samþykkja'}
                            aria-label={row.status === 'active' ? `Setja verktaka ${row.name} í bið` : `Samþykkja verktaka ${row.name}`}
                        >
                            {row.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDeleteProvider(row.id)}
                            className="p-2 text-stone-500 hover:text-red-600 hover:bg-stone-50 rounded transition-colors"
                            title="Eyða verktaka"
                            aria-label={`Eyða verktaka ${row.name}`}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            />
        </div>
    );
}
