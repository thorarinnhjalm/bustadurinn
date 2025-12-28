/**
 * Settings Page
 * Manage house details, booking logic, members, and user preferences
 */

import { useState, useEffect } from 'react';
import { Home, Users, User, Save, Shield, Wifi, AlertTriangle } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore } from '@/store/appStore';
import type { House } from '@/types/models';

type Tab = 'house' | 'members' | 'profile';

export default function SettingsPage() {
    const currentUser = useAppStore((state) => state.currentUser);
    const setCurrentUser = useAppStore((state) => state.setCurrentUser);
    const [activeTab, setActiveTab] = useState<Tab>('house');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // House State
    const [house, setHouse] = useState<House | null>(null);
    const [houseForm, setHouseForm] = useState({
        name: '',
        address: '',
        wifi_ssid: '',
        wifi_password: '',
        holiday_mode: 'first_come' as 'fairness' | 'first_come'
    });

    // User State


    useEffect(() => {
        if (currentUser?.house_ids?.length) {
            loadHouse(currentUser.house_ids[0]);
        } else {
            // Fallback for demo/dev if no house linked yet
            // In real app, we might redirect to onboarding
            const demoId = 'demo-house-id'; // Or handle gracefully
            loadHouse(demoId);
        }
    }, [currentUser]);

    const loadHouse = async (houseId: string) => {
        try {
            setLoading(true);
            const houseDoc = await getDoc(doc(db, 'houses', houseId));
            if (houseDoc.exists()) {
                const houseData = { id: houseDoc.id, ...houseDoc.data() } as House;
                setHouse(houseData);
                setHouseForm({
                    name: houseData.name || '',
                    address: houseData.address || '',
                    wifi_ssid: houseData.wifi_ssid || '',
                    wifi_password: houseData.wifi_password || '',
                    holiday_mode: houseData.holiday_mode || 'first_come'
                });

                // Load members
                if (houseData.owner_ids?.length) {
                    // In a real app we would query 'users' where 'uid' in owner_ids
                    // For now let's just mock or skip, as reading all users might require rules update
                    // or multiple gets.
                    // Let's implement fetching *this* user at least if they are in the list.
                }
            }
        } catch (err) {
            console.error('Error loading house:', err);
            // setError('Gat ekki sótt upplýsingar um sumarhúsið.');
        } finally {
            setLoading(false);
        }
    };

    const isManager = house && currentUser && house.manager_uid === currentUser.uid;

    const handleSaveHouse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!house || !isManager) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await updateDoc(doc(db, 'houses', house.id), {
                name: houseForm.name,
                address: houseForm.address,
                wifi_ssid: houseForm.wifi_ssid,
                wifi_password: houseForm.wifi_password,
                holiday_mode: houseForm.holiday_mode,
                updated_at: new Date()
            });

            setHouse(prev => prev ? { ...prev, ...houseForm } : null);
            setSuccess('Breytingar vistaðar!');

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error updating house:', err);
            setError('Villa kom upp við vistun.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateLanguage = async (lang: 'is' | 'en' | 'de' | 'fr' | 'es') => {
        if (!currentUser) return;

        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                language: lang
            });

            // Update local state
            setCurrentUser({
                ...currentUser,
                language: lang
            });
        } catch (err) {
            console.error('Error updating language:', err);
        }
    };

    if (loading && !house) {
        return <div className="p-8 text-center text-grey-mid">Hleð...</div>;
    }

    return (
        <div className="min-h-screen bg-bone">
            {/* Header */}
            <div className="bg-white border-b border-grey-warm">
                <div className="container mx-auto px-6 py-6">
                    <h1 className="text-3xl font-serif mb-2">Stillingar</h1>
                    <p className="text-grey-mid">Stjórnaðu húsinu og þínum aðgangi</p>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Sidebar Navigation */}
                    <div className="w-full md:w-64 flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <button
                                onClick={() => setActiveTab('house')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'house'
                                    ? 'bg-charcoal text-white'
                                    : 'text-grey-dark hover:bg-bone'
                                    }`}
                            >
                                <Home className="w-5 h-5" />
                                <span>Húsupplýsingar</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('members')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'members'
                                    ? 'bg-charcoal text-white'
                                    : 'text-grey-dark hover:bg-bone'
                                    }`}
                            >
                                <Users className="w-5 h-5" />
                                <span>Meðeigendur</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'profile'
                                    ? 'bg-charcoal text-white'
                                    : 'text-grey-dark hover:bg-bone'
                                    }`}
                            >
                                <User className="w-5 h-5" />
                                <span>Mínar stillingar</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Feedback Messages */}
                        {success && (
                            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                                {success}
                            </div>
                        )}
                        {error && (
                            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                                {error}
                            </div>
                        )}

                        {/* TAB: HOUSE INFO */}
                        {activeTab === 'house' && house && (
                            <div className="space-y-6">

                                {/* General Info */}
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Home className="w-6 h-6 text-amber" />
                                        <h2 className="text-xl font-serif">Grunnupplýsingar</h2>
                                    </div>

                                    <form onSubmit={handleSaveHouse} className="space-y-4">
                                        <div>
                                            <label className="label">Nafn sumarhúss</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={houseForm.name}
                                                onChange={(e) => setHouseForm({ ...houseForm, name: e.target.value })}
                                                disabled={!isManager}
                                            />
                                        </div>

                                        <div>
                                            <label className="label">Heimilisfang</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={houseForm.address}
                                                onChange={(e) => setHouseForm({ ...houseForm, address: e.target.value })}
                                                disabled={!isManager}
                                            />
                                        </div>

                                        <div className="border-t border-grey-warm pt-4 mt-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Wifi className="w-5 h-5 text-amber" />
                                                <h3 className="font-serif text-lg">Internet (Wi-Fi)</h3>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="label">Nafn nets (SSID)</label>
                                                    <input
                                                        type="text"
                                                        className="input"
                                                        value={houseForm.wifi_ssid}
                                                        onChange={(e) => setHouseForm({ ...houseForm, wifi_ssid: e.target.value })}
                                                        disabled={!isManager}
                                                        placeholder="t.d. Sumarbústaður 5G"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="label">Lykilorð (Password)</label>
                                                    <input
                                                        type="text"
                                                        className="input"
                                                        value={houseForm.wifi_password}
                                                        onChange={(e) => setHouseForm({ ...houseForm, wifi_password: e.target.value })}
                                                        disabled={!isManager}
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {isManager && (
                                            <div className="pt-4">
                                                <button type="submit" className="btn btn-primary flex items-center gap-2" disabled={loading}>
                                                    <Save className="w-4 h-4" />
                                                    Vista breytingar
                                                </button>
                                            </div>
                                        )}
                                    </form>
                                </div>

                                {/* Booking Modes */}
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Shield className="w-6 h-6 text-amber" />
                                        <h2 className="text-xl font-serif">Bókunarreglur</h2>
                                    </div>

                                    <p className="text-grey-dark mb-4">Veldu hvernig úthlutun á helgum og frídögum fer fram.</p>

                                    <div className="space-y-3">
                                        <label className={`
                      flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all
                      ${houseForm.holiday_mode === 'fairness' ? 'border-amber bg-amber/5' : 'border-grey-warm hover:bg-bone'}
                    `}>
                                            <input
                                                type="radio"
                                                name="holiday_mode"
                                                value="fairness"
                                                checked={houseForm.holiday_mode === 'fairness'}
                                                onChange={() => setHouseForm({ ...houseForm, holiday_mode: 'fairness' })}
                                                disabled={!isManager}
                                                className="mt-1"
                                            />
                                            <div>
                                                <div className="font-semibold mb-1">Sanngirnisregla (Fairness Logic)</div>
                                                <p className="text-sm text-grey-dark">
                                                    Kerfið fylgist með bókunum á vinsælum helgum og frídögum (t.d. Jólum).
                                                    Ef meðeigandi fékk úthlutað í fyrra, getur hann ekki bókað sama frídag í ár.
                                                </p>
                                            </div>
                                        </label>

                                        <label className={`
                      flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all
                      ${houseForm.holiday_mode === 'first_come' ? 'border-amber bg-amber/5' : 'border-grey-warm hover:bg-bone'}
                    `}>
                                            <input
                                                type="radio"
                                                name="holiday_mode"
                                                value="first_come"
                                                checked={houseForm.holiday_mode === 'first_come'}
                                                onChange={() => setHouseForm({ ...houseForm, holiday_mode: 'first_come' })}
                                                disabled={!isManager}
                                                className="mt-1"
                                            />
                                            <div>
                                                <div className="font-semibold mb-1">Fyrstur kemur, fyrstur fær</div>
                                                <p className="text-sm text-grey-dark">
                                                    Engar takmarkanir. Sá sem bókar fyrstur fær dagana. Einfalt og fljótlegt.
                                                </p>
                                            </div>
                                        </label>
                                    </div>

                                    {isManager && (
                                        <div className="mt-4">
                                            <button
                                                onClick={handleSaveHouse}
                                                className="btn btn-secondary text-sm"
                                                disabled={loading}
                                            >
                                                Uppfæra reglur
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Danger Zone */}
                                {isManager && (
                                    <div className="border border-red-200 bg-red-50 p-6 rounded-lg">
                                        <div className="flex items-center gap-2 mb-4 text-red-700">
                                            <AlertTriangle className="w-6 h-6" />
                                            <h2 className="text-xl font-serif">Hættusvæði</h2>
                                        </div>
                                        <p className="text-sm text-red-600 mb-4">
                                            Ef þú eyðir húsinu þá tapast allar upplýsingar, bókanir og fjárhagsfærslur. Þessari aðgerð er ekki hægt að afturkalla.
                                        </p>
                                        <button className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded hover:bg-red-50 text-sm font-medium">
                                            Eyða sumarhúsi
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: MEMBERS */}
                        {activeTab === 'members' && house && (
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-6 h-6 text-amber" />
                                        <h2 className="text-xl font-serif">Meðeigendur</h2>
                                    </div>
                                    {isManager && (
                                        <button className="btn btn-primary text-sm">
                                            Bjóða nýjum aðila
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {/* Current User */}
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-charcoal text-white flex items-center justify-center font-serif text-lg">
                                                {currentUser?.name?.[0] || currentUser?.email?.[0]}
                                            </div>
                                            <div>
                                                <div className="font-semibold">{currentUser?.name || currentUser?.email} (Þú)</div>
                                                <div className="text-sm text-grey-mid">
                                                    {house.manager_uid === currentUser?.uid ? 'Bústaðastjóri (Manager)' : 'Meðeigandi (Member)'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Placeholder for other members logic */}
                                    <div className="text-center py-8 text-grey-mid bg-bone rounded-lg border border-dashed border-grey-mid">
                                        <p>Hér munu aðrir meðeigendur birtast þegar þeir hafa samþykkt boð.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: PROFILE / MY SETTINGS */}
                        {activeTab === 'profile' && (
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                    <User className="w-6 h-6 text-amber" />
                                    <h2 className="text-xl font-serif">Mínar stillingar</h2>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="label">Tungumál (Language)</label>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                            {[
                                                { code: 'is', label: '🇮🇸 Íslenska' },
                                                { code: 'en', label: '🇬🇧 English' },
                                                { code: 'de', label: '🇩🇪 Deutsch' },
                                                { code: 'fr', label: '🇫🇷 Français' },
                                                { code: 'es', label: '🇪🇸 Español' },
                                            ].map((lang) => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => handleUpdateLanguage(lang.code as any)}
                                                    className={`
                            p-3 rounded-lg border text-sm font-medium transition-all
                            ${currentUser?.language === lang.code
                                                            ? 'border-amber bg-amber/10 text-charcoal ring-1 ring-amber'
                                                            : 'border-grey-warm hover:border-grey-mid'
                                                        }
                          `}
                                                >
                                                    {lang.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-grey-warm">
                                        <label className="label">Nafn</label>
                                        <input
                                            type="text"
                                            className="input max-w-md"
                                            value={currentUser?.name || ''}
                                            readOnly // For now
                                            disabled
                                        />
                                        <p className="text-xs text-grey-mid mt-1">Hafðu samband við þjónustuver til að breyta nafni.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Empty State / Loading safety */}
                        {!house && !loading && (
                            <div className="text-center py-12">
                                <p className="text-grey-dark">Engin hús fundust. Vinsamlegast búðu til hús fyrst.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
