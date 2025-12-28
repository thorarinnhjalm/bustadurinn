/**
 * Settings Page
 * Manage house details, booking logic, members, and user preferences
 */

import { useState, useEffect } from 'react';
import { Home, Users, User as UserIcon, Save, Shield, Wifi, AlertTriangle, BookOpen } from 'lucide-react';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    onSnapshot,
    arrayUnion,
    deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore } from '@/store/appStore';
import type { House, User } from '@/types/models';

type Tab = 'house' | 'members' | 'profile' | 'guests';

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
        holiday_mode: 'first_come' as 'fairness' | 'first_come',
        house_rules: '',
        check_in_time: '',
        check_out_time: '',
        directions: '',
        access_instructions: '',
        emergency_contact: ''
    });

    // User State
    const [members, setMembers] = useState<User[]>([]);


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
                    holiday_mode: houseData.holiday_mode || 'first_come',
                    house_rules: houseData.house_rules || '',
                    check_in_time: houseData.check_in_time || '',
                    check_out_time: houseData.check_out_time || '',
                    directions: houseData.directions || '',
                    access_instructions: houseData.access_instructions || '',
                    emergency_contact: houseData.emergency_contact || ''
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

    const [joinRequests, setJoinRequests] = useState<any[]>([]);

    const isManager = house?.manager_id === currentUser?.uid;

    useEffect(() => {
        if (!house || !isManager || activeTab !== 'members') return;

        const q = query(
            collection(db, 'join_requests'),
            where('houseId', '==', house.id),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setJoinRequests(reqs);
        });

        return () => unsubscribe();
    }, [house?.id, isManager, activeTab]);

    // Fetch Members
    useEffect(() => {
        if (activeTab === 'members' && house?.owner_ids?.length) {
            const fetchMembers = async () => {
                try {
                    // Note: Firestore 'in' query supports max 10. Using Promise.all for robustness.
                    const promises = house.owner_ids.map(uid => getDoc(doc(db, 'users', uid)));
                    const docs = await Promise.all(promises);
                    const users = docs.map(d => ({ uid: d.id, ...d.data() } as User)).filter(u => u.uid);
                    setMembers(users);
                } catch (err) {
                    console.error("Error fetching members", err);
                }
            };
            fetchMembers();
        }
    }, [activeTab, house?.owner_ids]);

    const handleApproveRequest = async (req: any) => {
        if (!house) return;
        setLoading(true);
        try {
            // 1. Add to House
            await updateDoc(doc(db, 'houses', house.id), {
                owner_ids: arrayUnion(req.userId)
            });

            // 2. Add to User (Important: User needs to know they are in)
            // Note: This requires permission to update OTHER users. 
            // Standard Firestore rules might block this if not Manager/Admin of creating user.
            // If this fails, we need a Cloud Function.
            // For now, let's try. If it fails, we fall back to manual user update or assume user doc is self-writable? 
            // No, manager writes to user. Rules need to allow manager to update `house_ids` of any user if they are adding them to managed house? Complex.
            // Let's assume rules allow it for the sake of MVP or we update rules to `allow update: if request.auth != null`.

            // Actually, best bet: `updateDoc(doc(db, 'users', req.userId), { house_ids: arrayUnion(house.id) })`
            await updateDoc(doc(db, 'users', req.userId), {
                house_ids: arrayUnion(house.id)
            });

            // 3. Mark request approved (or delete)
            await deleteDoc(doc(db, 'join_requests', req.id));

            setSuccess(`Samþykkti ${req.userName}!`);
        } catch (err) {
            console.error('Error approving:', err);
            setError('Gat ekki samþykkt beiðni. Athugaðu réttindi.');
        } finally {
            setLoading(false);
        }
    };

    const handleRejectRequest = async (req: any) => {
        if (!confirm('Hafna þessari beiðni?')) return;
        try {
            await deleteDoc(doc(db, 'join_requests', req.id));
            setSuccess('Beiðni hafnað.');
        } catch (err) {
            console.error(err);
        }
    };

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
                house_rules: houseForm.house_rules,
                check_in_time: houseForm.check_in_time,
                check_out_time: houseForm.check_out_time,
                directions: houseForm.directions,
                access_instructions: houseForm.access_instructions,
                emergency_contact: houseForm.emergency_contact,
                updated_at: new Date()
            });

            // Sync Guest View
            if (house.guest_token) {
                await setDoc(doc(db, 'guest_views', house.guest_token), {
                    houseId: house.id,
                    name: houseForm.name,
                    address: houseForm.address,
                    wifi_ssid: houseForm.wifi_ssid,
                    wifi_password: houseForm.wifi_password,
                    house_rules: houseForm.house_rules,
                    check_in_time: houseForm.check_in_time,
                    check_out_time: houseForm.check_out_time,
                    directions: houseForm.directions,
                    access_instructions: houseForm.access_instructions,
                    emergency_contact: houseForm.emergency_contact,
                    updated_at: new Date()
                }, { merge: true });
            }

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

    const handleGenerateGuestToken = async (replace = false) => {
        if (replace && !confirm('Ertu viss? Gamli hlekkurinn mun hætta að virka.')) return;
        if (!house) return;

        setLoading(true);
        try {
            // Delete old if exists
            if (house.guest_token) {
                await deleteDoc(doc(db, 'guest_views', house.guest_token));
            }

            const newToken = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

            // Create new view
            await setDoc(doc(db, 'guest_views', newToken), {
                houseId: house.id,
                name: houseForm.name,
                address: houseForm.address,
                wifi_ssid: houseForm.wifi_ssid,
                wifi_password: houseForm.wifi_password,
                house_rules: houseForm.house_rules,
                check_in_time: houseForm.check_in_time,
                check_out_time: houseForm.check_out_time,
                directions: houseForm.directions,
                access_instructions: houseForm.access_instructions,
                emergency_contact: houseForm.emergency_contact,
                updated_at: new Date()
            });

            await updateDoc(doc(db, 'houses', house.id), { guest_token: newToken });
            setHouse({ ...house, guest_token: newToken });
            setSuccess('Nýr gestahlekkur búinn til!');
        } catch (err) {
            console.error(err);
            setError('Villa við að búa til hlekk.');
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
                                onClick={() => setActiveTab('guests')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'guests'
                                    ? 'bg-charcoal text-white'
                                    : 'text-grey-dark hover:bg-bone'
                                    }`}
                            >
                                <BookOpen className="w-5 h-5" />
                                <span>Gestabók (Renters)</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'profile'
                                    ? 'bg-charcoal text-white'
                                    : 'text-grey-dark hover:bg-bone'
                                    }`}
                            >
                                <UserIcon className="w-5 h-5" />
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
                                </div>

                                <div className="space-y-4">
                                    {/* Join Requests */}
                                    {joinRequests.length > 0 && (
                                        <div className="mb-6 p-4 bg-amber/10 border border-amber/30 rounded-lg">
                                            <h3 className="flex items-center gap-2 font-serif text-charcoal mb-4">
                                                <AlertTriangle className="w-5 h-5 text-amber" />
                                                Inngöngubeiðnir ({joinRequests.length})
                                            </h3>
                                            <div className="space-y-3">
                                                {joinRequests.map(req => (
                                                    <div key={req.id} className="flex items-center justify-between bg-white p-3 rounded shadow-sm">
                                                        <div>
                                                            <div className="font-semibold">{req.userName}</div>
                                                            <div className="text-xs text-grey-mid">{req.userEmail}</div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleApproveRequest(req)} className="btn btn-primary text-xs py-1 px-3">Samþykkja</button>
                                                            <button onClick={() => handleRejectRequest(req)} className="btn btn-ghost text-xs py-1 px-3 text-red-500 hover:text-red-700 hover:bg-red-50">Hafna</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Members List */}
                                    {members.length === 0 ? (
                                        <div className="text-center text-grey-mid py-4">Hleð meðeigendum...</div>
                                    ) : (
                                        members.map(member => (
                                            <div key={member.uid} className="flex items-center justify-between p-4 border rounded-lg bg-white mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-serif text-lg ${member.uid === currentUser?.uid ? 'bg-charcoal text-white' : 'bg-bone text-charcoal'}`}>
                                                        {member.name?.[0] || member.email?.[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold flex items-center gap-2">
                                                            {member.name || member.email}
                                                            {member.uid === currentUser?.uid && <span className="text-xs bg-grey-light px-2 py-0.5 rounded text-charcoal">Þú</span>}
                                                        </div>
                                                        <div className="text-sm text-grey-mid">
                                                            {house.manager_id === member.uid ? 'Bústaðastjóri (Manager)' : 'Meðeigandi (Member)'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div>
                                                    {isManager && house.manager_id !== member.uid && (
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm(`Ertu viss um að þú viljir gera ${member.name || member.email} að Bústaðastjóra? Þú missir stjórnenda-réttindi.`)) return;
                                                                try {
                                                                    await updateDoc(doc(db, 'houses', house.id), { manager_id: member.uid });
                                                                    setHouse({ ...house, manager_id: member.uid });
                                                                } catch (e) { console.error(e); }
                                                            }}
                                                            className="text-xs text-amber hover:text-amber-dark font-medium"
                                                        >
                                                            Gera að stjórnanda
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {/* Invite Section */}
                                    {isManager && (
                                        <div className="mt-8 pt-6 border-t border-grey-warm">
                                            <h3 className="text-lg font-serif mb-4">Bjóða nýjum aðilum</h3>
                                            <p className="text-sm text-grey-dark mb-4">
                                                Deildu hlekknum hér að neðan til að bjóða öðrum að ganga í húsfélagið.
                                            </p>

                                            <div className="bg-bone p-4 rounded-lg flex flex-col gap-4">
                                                {house.invite_code ? (
                                                    <div>
                                                        <label className="label text-xs uppercase text-grey-mid">Boðshlekkur</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                readOnly
                                                                className="input font-mono text-sm bg-white"
                                                                value={`${window.location.origin}/join?houseId=${house.id}&code=${house.invite_code}`}
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(`${window.location.origin}/join?houseId=${house.id}&code=${house.invite_code}`);
                                                                    setSuccess('Hlekkur afritaður!');
                                                                    setTimeout(() => setSuccess(''), 2000);
                                                                }}
                                                                className="btn btn-secondary whitespace-nowrap"
                                                            >
                                                                Afrita
                                                            </button>
                                                        </div>
                                                        <div className="mt-4">
                                                            <button
                                                                onClick={async () => {
                                                                    if (!confirm('Ertu viss? Gamli hlekkurinn mun hætta að virka.')) return;
                                                                    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                                                                    await updateDoc(doc(db, 'houses', house.id), { invite_code: newCode });
                                                                    setHouse({ ...house, invite_code: newCode });
                                                                }}
                                                                className="text-xs text-red-500 hover:text-red-700 underline"
                                                            >
                                                                Endurnýja hlekk (Gera gamlan ógildan)
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={async () => {
                                                            const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                                                            await updateDoc(doc(db, 'houses', house.id), { invite_code: newCode });
                                                            setHouse({ ...house, invite_code: newCode });
                                                        }}
                                                        className="btn btn-primary w-full md:w-auto self-start"
                                                    >
                                                        Búa til boðshlekk
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB: GUESTS */}
                        {activeTab === 'guests' && house && (
                            <div className="space-y-6">
                                {/* Link Section */}
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-2 mb-6">
                                        <BookOpen className="w-6 h-6 text-amber" />
                                        <h2 className="text-xl font-serif">Gestabók (Digital Guestbook)</h2>
                                    </div>
                                    <p className="text-grey-dark mb-4">
                                        Þú getur búið til hlekk fyrir leigjendur/gesti til að sjá upplýsingar um bústaðinn (Reglur, WiFi, leiðarlýsingu) án innskráningar.
                                    </p>

                                    <div className="bg-bone p-4 rounded-lg flex flex-col gap-4">
                                        {house.guest_token ? (
                                            <div>
                                                <label className="label text-xs uppercase text-grey-mid">Gestahlekkur</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        readOnly
                                                        className="input font-mono text-sm bg-white"
                                                        value={`${window.location.origin}/guest/${house.guest_token}`}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`${window.location.origin}/guest/${house.guest_token}`);
                                                            setSuccess('Hlekkur afritaður!');
                                                            setTimeout(() => setSuccess(''), 2000);
                                                        }}
                                                        className="btn btn-secondary whitespace-nowrap"
                                                    >
                                                        Afrita
                                                    </button>
                                                </div>
                                                <div className="mt-4">
                                                    <button
                                                        onClick={() => handleGenerateGuestToken(true)}
                                                        className="text-xs text-red-500 hover:text-red-700 underline"
                                                    >
                                                        Búa til nýjan hlekk (Ógilda gamlan)
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleGenerateGuestToken(false)}
                                                className="btn btn-primary"
                                            >
                                                Virkja Gestabók
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Content Editor */}
                                <div className="bg-white p-6 rounded-lg shadow-sm">
                                    <h3 className="text-lg font-medium mb-4">Upplýsingar fyrir gesti</h3>
                                    <form onSubmit={handleSaveHouse} className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="label">Innritun (kl.)</label>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    value={houseForm.check_in_time}
                                                    onChange={(e) => setHouseForm({ ...houseForm, check_in_time: e.target.value })}
                                                    placeholder="16:00"
                                                />
                                            </div>
                                            <div>
                                                <label className="label">Útritun (kl.)</label>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    value={houseForm.check_out_time}
                                                    onChange={(e) => setHouseForm({ ...houseForm, check_out_time: e.target.value })}
                                                    placeholder="12:00"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="label">Húsreglur</label>
                                            <textarea
                                                className="input min-h-[100px]"
                                                value={houseForm.house_rules}
                                                onChange={(e) => setHouseForm({ ...houseForm, house_rules: e.target.value })}
                                                placeholder="t.d. Reykingar bannaðar. Þrífa eftir sig..."
                                            />
                                        </div>

                                        <div>
                                            <label className="label">Leiðarlýsing (eða hlekkur á kort)</label>
                                            <textarea
                                                className="input"
                                                value={houseForm.directions}
                                                onChange={(e) => setHouseForm({ ...houseForm, directions: e.target.value })}
                                                placeholder="t.d. Keyrt er í gegnum..."
                                            />
                                        </div>

                                        <div>
                                            <label className="label">Aðgangsleiðbeiningar (Lykilbox ofl.)</label>
                                            <textarea
                                                className="input"
                                                value={houseForm.access_instructions}
                                                onChange={(e) => setHouseForm({ ...houseForm, access_instructions: e.target.value })}
                                                placeholder="t.d. Kóði í lykilbox er 1234..."
                                            />
                                        </div>

                                        <div>
                                            <label className="label">Neyðarnúmer / Tengiliður</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={houseForm.emergency_contact}
                                                onChange={(e) => setHouseForm({ ...houseForm, emergency_contact: e.target.value })}
                                                placeholder="Sími 555-1234"
                                            />
                                        </div>

                                        <div className="pt-4">
                                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                                Vista upplýsingar
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* TAB: PROFILE / MY SETTINGS */}
                        {activeTab === 'profile' && (
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                    <UserIcon className="w-6 h-6 text-amber" />
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
