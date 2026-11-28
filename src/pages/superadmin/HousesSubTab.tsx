import { useId, useState } from 'react';
import { MapPin, Trash2, Edit } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { searchHMSAddresses, formatHMSAddress } from '@/utils/hmsSearch';
import DataTable from '@/components/DataTable';
import Modal from '@/components/ui/Modal';
import { logger } from '@/utils/logger';

import type { House } from '@/types/models';
import type { SetActionLoading, SetStats, Stats } from './types';
import { invalidateStatsCache } from './useSuperAdminData';

interface HousesSubTabProps {
    stats: Stats;
    setStats: SetStats;
    actionLoading: string | null;
    setActionLoading: SetActionLoading;
}

export default function HousesSubTab({ stats, setStats, actionLoading, setActionLoading }: HousesSubTabProps) {
    const fieldBaseId = useId();
    const houseNameId = `${fieldBaseId}-house-name`;
    const houseAddressId = `${fieldBaseId}-house-address`;
    const houseManagerId = `${fieldBaseId}-house-manager`;

    const [editingHouse, setEditingHouse] = useState<House | null>(null);
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [addressSearchTimer, setAddressSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    const handleDeleteHouse = async (houseId: string) => {
        const house = stats.allHouses.find(h => h.id === houseId);
        if (!house) return;

        const confirmText = `EYÐA "${house.name}"?\n\nÞETTA EYÐIR:\n- Húsinu\n- Öllum bókunum, verkefnum, fjármálum og innkaupalistanum\n- Gestatenglum, boðum, gestabók og tilkynningum\n- Húsinu af notendum\n\nÞetta er ÓAFTURKRÆFT!\n\nSkrifaðu nafn hússins til að sta staðfesta:`;
        const userInput = prompt(confirmText);

        if (userInput !== house.name) {
            alert('Hætt við - nafnið passaði ekki');
            return;
        }

        setActionLoading(houseId);
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) throw new Error('Not authenticated');

            const res = await fetch('/api/admin-delete-house', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ houseId })
            });
            if (!res.ok) throw new Error(`Delete house failed (${res.status})`);
            const result = await res.json().catch(() => ({}));

            // Update local state
            setStats(prev => ({
                ...prev,
                totalHouses: prev.totalHouses - 1,
                allHouses: prev.allHouses.filter(h => h.id !== houseId)
            }));
            invalidateStatsCache();

            alert(`✅ Húsinu og tengdum gögnum var eytt (bókanir, verkefni, fjármál, innkaupalisti, gestatenglar, boð o.fl.).${result?.note ? `\n\n${result.note}` : ''}`);
        } catch (error: any) {
            logger.error('Error deleting house:', error);
            alert('❌ Ekki tókst að eyða húsinu. Sumum gögnum gæti hafa verið eytt að hluta. Athugaðu stöðuna og reyndu aftur.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateHouse = async (houseData: House) => {
        if (!houseData.id) return;
        setActionLoading('updating-house');
        try {
            await updateDoc(doc(db, 'houses', houseData.id), {
                name: houseData.name,
                address: houseData.address,
                location: houseData.location || { lat: 0, lng: 0 },
                manager_id: houseData.manager_id
            });
            setStats(prev => ({
                ...prev,
                allHouses: prev.allHouses.map(h => h.id === houseData.id ? houseData : h)
            }));
            setEditingHouse(null);
            alert('Hús uppfært!');
        } catch (e: any) {
            logger.error('Error updating house:', e);
            alert('Villa við að uppfæra hús. Reyndu aftur.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleAddressChange = (val: string) => {
        if (!editingHouse) return;
        setEditingHouse({ ...editingHouse, address: val });

        if (addressSearchTimer) clearTimeout(addressSearchTimer);

        if (val.length < 2) {
            setAddressSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const results = await searchHMSAddresses(val);
                setAddressSuggestions(results);
            } catch (e) {
                logger.error(e);
            }
        }, 300);
        setAddressSearchTimer(timer);
    };

    const selectCMSAddress = (hmsItem: any) => {
        if (!editingHouse) return;
        const fullAddr = formatHMSAddress(hmsItem);
        setEditingHouse({
            ...editingHouse,
            address: fullAddr,
            location: {
                lat: hmsItem.lat,
                lng: hmsItem.lng
            }
        });
        setAddressSuggestions([]);
    };

    return (
        <>
            <div className="space-y-6">
                {/* Desktop Table */}
                <div className="hidden md:block bg-white border border-stone-200 rounded-lg p-6">
                    <h2 className="text-lg font-serif font-semibold mb-6">Húsaskrá</h2>
                    <DataTable
                        caption="Húsaskrá"
                        columns={[
                            { key: 'name', label: 'Nafn hús', sortable: true },
                            {
                                key: 'address',
                                label: 'Staðsetning',
                                sortable: true,
                                render: (row) => row.address || '—'
                            },
                            {
                                key: 'owner_ids',
                                label: 'Meðlimir',
                                render: (row) => (
                                    <span className="font-mono">{row.owner_ids?.length || 0}</span>
                                )
                            },
                            {
                                key: 'manager_id',
                                label: 'Stjórnandi',
                                render: (row) => {
                                    const manager = stats.allUsers.find(u => u.uid === row.manager_id);
                                    return <span className="font-mono text-xs">{manager?.email || '—'}</span>;
                                }
                            },
                            {
                                key: 'created_at',
                                label: 'Búið til',
                                sortable: true,
                                render: (row) => {
                                    if (!row.created_at) return '—';
                                    const date = row.created_at as any;
                                    const timestamp = date.seconds ? new Date(date.seconds * 1000) : new Date();
                                    return timestamp.toLocaleDateString('is-IS');
                                }
                            },
                        ]}
                        data={stats.allHouses}
                        searchKeys={['name', 'address']}
                        actions={(row) => (
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingHouse(row)}
                                    className="p-1.5 hover:bg-stone-100 rounded"
                                    title="Breyta"
                                    aria-label={`Breyta húsi ${row.name}`}
                                >
                                    <Edit className="w-4 h-4 text-stone-500" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteHouse(row.id!)}
                                    disabled={actionLoading === row.id}
                                    className="p-1.5 hover:bg-red-100 rounded disabled:opacity-50"
                                    title="Eyða húsi"
                                    aria-label={`Eyða húsi ${row.name}`}
                                >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                            </div>
                        )}
                    />
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    <h2 className="text-xl font-serif font-bold px-1">Húsaskrá ({stats.allHouses.length})</h2>
                    {stats.allHouses.map((house) => (
                        <div key={house.id} className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
                            <div className="mb-3">
                                <h3 className="font-serif font-bold text-lg text-charcoal">{house.name}</h3>
                                <p className="text-sm text-stone-500 flex items-center gap-1 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    {house.address || 'Engin staðsetning'}
                                </p>
                            </div>
                            <div className="text-sm mb-4">
                                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-0.5">Stjórnandi</p>
                                <p className="font-medium truncate">{stats.allUsers.find(u => u.uid === house.manager_id)?.email || '—'}</p>
                            </div>
                            <div className="flex gap-2 pt-3 border-t border-stone-100">
                                <button
                                    type="button"
                                    onClick={() => setEditingHouse(house)}
                                    className="px-3 py-2 bg-stone-100 text-stone-600 rounded-lg"
                                    aria-label={`Breyta húsi ${house.name}`}
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteHouse(house.id!)}
                                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg"
                                    aria-label={`Eyða húsi ${house.name}`}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Edit House Modal */}
            {
                editingHouse && (
                    <Modal
                        open
                        onClose={() => setEditingHouse(null)}
                        title="Breyta húsi"
                        size="md"
                        footer={
                            <>
                                <button type="button" onClick={() => setEditingHouse(null)} className="btn btn-ghost">Hætta við</button>
                                <button
                                    type="button"
                                    onClick={() => handleUpdateHouse(editingHouse)}
                                    className="btn btn-primary"
                                    disabled={actionLoading === 'updating-house'}
                                >
                                    {actionLoading === 'updating-house' ? 'Vistar...' : 'Vista breytingar'}
                                </button>
                            </>
                        }
                    >
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor={houseNameId} className="text-xs font-bold text-stone-500 uppercase">Nafn húss</label>
                                    <input
                                        id={houseNameId}
                                        type="text"
                                        className="input mt-1"
                                        value={editingHouse.name}
                                        onChange={e => setEditingHouse({ ...editingHouse, name: e.target.value })}
                                    />
                                </div>
                                <div className="relative">
                                    <label htmlFor={houseAddressId} className="text-xs font-bold text-stone-500 uppercase">Heimilisfang (HMS Leit)</label>
                                    <input
                                        id={houseAddressId}
                                        type="text"
                                        className="input mt-1"
                                        value={editingHouse.address || ''}
                                        onChange={e => handleAddressChange(e.target.value)}
                                        placeholder="Byrjaðu að skrifa heimilisfang..."
                                        autoComplete="off"
                                    />
                                    {/* Suggestions dropdown */}
                                    {addressSuggestions.length > 0 && (
                                        <div className="absolute z-50 w-full bg-white border border-stone-200 mt-1 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                            {addressSuggestions.map((item, idx) => (
                                                <button
                                                    type="button"
                                                    key={idx}
                                                    className="w-full text-left px-4 py-2 hover:bg-amber/10 text-sm border-b border-stone-50 last:border-0 transition-colors flex items-center justify-between group"
                                                    onClick={() => selectCMSAddress(item)}
                                                >
                                                    <span className="font-medium text-stone-700 group-hover:text-charcoal">{formatHMSAddress(item)}</span>
                                                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200 font-bold uppercase">HMS</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {/* Lat/Lng Indicator */}
                                    <div className="absolute right-2 top-0 text-[10px] font-mono text-stone-500 mt-1">
                                        {editingHouse.location?.lat ? '📍 GPS fannst' : '❌ Ekkert GPS'}
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor={houseManagerId} className="text-xs font-bold text-stone-500 uppercase">Stjórnandi (UID)</label>
                                    <input
                                        id={houseManagerId}
                                        type="text"
                                        className="input mt-1 font-mono text-xs"
                                        value={editingHouse.manager_id}
                                        onChange={e => setEditingHouse({ ...editingHouse, manager_id: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-stone-500 uppercase">Staða</span>
                                    <p className="mt-1 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">Frítt (öll hús)</p>
                                </div>
                            </div>
                    </Modal>
                )
            }
        </>
    );
}
