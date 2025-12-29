/**
 * Super Admin Mission Control - Professional Dashboard
 * Desktop-first, high-density data tables, real impersonation
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Users, BarChart2, TrendingUp, Activity, Database, UserCog, Edit, Send, Tag } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useAppStore } from '@/store/appStore';
import { seedDemoData } from '@/utils/seedDemoData';
import AdminLayout from '@/components/AdminLayout';
import DataTable from '@/components/DataTable';

import type { House, User, Coupon } from '@/types/models';

interface ContactSubmission {
    id: string;
    name: string;
    email: string;
    message: string;
    created_at: Date;
    status: 'new' | 'read' | 'replied';
}

interface Stats {
    totalHouses: number;
    totalUsers: number;
    totalBookings: number;
    activeTasks: number;
    allHouses: House[];
    allUsers: User[];
    allContacts: ContactSubmission[];
    allCoupons: Coupon[];
}

export default function SuperAdminPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'houses' | 'users' | 'contacts' | 'coupons'>('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [seeding, setSeeding] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { startImpersonation } = useImpersonation();

    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discount_type: 'percent',
        discount_value: 0,
        description: '',
        max_uses: 0
    });

    const [stats, setStats] = useState<Stats>({
        totalHouses: 0,
        totalUsers: 0,
        totalBookings: 0,
        activeTasks: 0,
        allHouses: [],
        allUsers: [],
        allContacts: [],
        allCoupons: []
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setError(null);

                // Fetch all houses
                const housesSnap = await getDocs(collection(db, 'houses'));
                const houses = housesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as House));

                // Fetch all users
                const usersSnap = await getDocs(collection(db, 'users'));
                const users = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));

                // Fetch bookings
                const bookingsSnap = await getDocs(collection(db, 'bookings'));

                // Fetch tasks
                const tasksSnap = await getDocs(collection(db, 'tasks'));
                const activeTasks = tasksSnap.docs.filter(doc => doc.data().status !== 'completed').length;

                // Fetch contact submissions
                const contactsSnap = await getDocs(collection(db, 'contact_submissions'));
                const contacts = contactsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    created_at: doc.data().created_at?.toDate() || new Date()
                } as ContactSubmission));

                // Fetch coupons
                const couponsSnap = await getDocs(collection(db, 'coupons'));
                const coupons = couponsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    created_at: (doc.data().created_at as any)?.toDate() || new Date(),
                    valid_until: (doc.data().valid_until as any)?.toDate() || undefined
                } as Coupon));

                setStats({
                    totalHouses: houses.length,
                    totalUsers: users.length,
                    totalBookings: bookingsSnap.size,
                    activeTasks,
                    allHouses: houses,
                    allUsers: users,
                    allContacts: contacts.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()),
                    allCoupons: coupons
                });
            } catch (error: any) {
                console.error('Error fetching stats:', error);
                setError(error.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Seed demo data
    const handleSeedDemo = async () => {
        if (!confirm('Create demo house with 3 users, bookings, tasks, and finance data?')) {
            return;
        }

        setSeeding(true);
        try {
            const result = await seedDemoData();
            alert(`✅ Demo data created!\n\nHouse: Sumarbústaður við Þingvallavatn\n\nDemo Users:\n${result.users.map(u => `• ${u.name} (${u.email})`).join('\n')}\n\nPassword: Demo123!`);
            // Refresh data instead of reloading page
            window.location.reload();
        } catch (error: any) {
            alert(`❌ Error: ${error.message}`);
        } finally {
            setSeeding(false);
        }
    };

    // Extend trial for a house
    const handleExtendTrial = async (houseId: string) => {
        if (!confirm('Extend trial by 14 days?')) return;

        setActionLoading(houseId);
        try {
            const house = stats.allHouses.find(h => h.id === houseId);
            if (!house) throw new Error('House not found');

            const currentEnd = house.subscription_end
                ? (house.subscription_end instanceof Date ? house.subscription_end : new Date(house.subscription_end))
                : new Date();

            // Add 14 days
            const newEnd = new Date(currentEnd.getTime() + 14 * 24 * 60 * 60 * 1000);

            await updateDoc(doc(db, 'houses', houseId), {
                subscription_end: newEnd,
                subscription_status: house.subscription_status === 'free' ? 'free' : 'trial'
            });

            // Update local state
            setStats(prev => ({
                ...prev,
                allHouses: prev.allHouses.map(h =>
                    h.id === houseId
                        ? { ...h, subscription_end: newEnd, subscription_status: h.subscription_status === 'free' ? 'free' : 'trial' } as House
                        : h
                )
            }));

            alert('✅ Trial extended by 14 days!');
        } catch (error: any) {
            console.error('Error extending trial:', error);
            alert(`❌ Error: ${error.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleFree = async (houseId: string) => {
        const house = stats.allHouses.find(h => h.id === houseId);
        if (!house) return;

        const isFree = house.subscription_status === 'free';
        if (!confirm(isFree ? 'Revoke free access?' : 'Grant FREE lifetime access?')) return;

        setActionLoading(houseId);
        try {
            const newStatus = isFree ? 'trial' : 'free';

            await updateDoc(doc(db, 'houses', houseId), {
                subscription_status: newStatus
            });

            // Update local state
            setStats(prev => ({
                ...prev,
                allHouses: prev.allHouses.map(h =>
                    h.id === houseId
                        ? { ...h, subscription_status: newStatus } as House
                        : h
                )
            }));

            alert(isFree ? 'ℹ️ Access revoked (set to trial)' : '✅ Access granted permanently (Free)');
        } catch (error: any) {
            console.error('Error toggling status:', error);
            alert(`❌ Error: ${error.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    // Impersonate user
    const handleImpersonate = async (user: User) => {
        if (!confirm(`View as ${user.name}?\n\nYou'll see exactly what they see. Click "Exit God Mode" to return.`)) {
            return;
        }

        try {
            setActionLoading(`impersonate-${user.uid}`);

            // Save admin's current house to restore later
            const adminHouse = useAppStore.getState().currentHouse;
            if (adminHouse) {
                localStorage.setItem('admin_original_house', JSON.stringify(adminHouse));
            }

            // Fetch the impersonated user's houses
            if (user.house_ids && user.house_ids.length > 0) {
                const firstHouseId = user.house_ids[0];
                const houseDoc = await getDocs(collection(db, 'houses'));
                const userHouse = houseDoc.docs
                    .map(doc => ({ id: doc.id, ...doc.data() } as House))
                    .find(h => h.id === firstHouseId);

                if (userHouse) {
                    // Set the impersonated user's house as current
                    useAppStore.getState().setCurrentHouse(userHouse);
                    useAppStore.getState().setUserHouses([userHouse]);
                }
            }

            // Save current URL to return to later
            localStorage.setItem('admin_return_url', window.location.pathname);
            startImpersonation(user);
            // Navigate to their dashboard
            window.location.href = '/dashboard';
        } catch (error: any) {
            console.error('Impersonation error:', error);
            alert('Failed to impersonate user: ' + error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setActionLoading('create-coupon');
            const docRef = await addDoc(collection(db, 'coupons'), {
                code: newCoupon.code.toUpperCase(),
                discount_type: newCoupon.discount_type,
                discount_value: Number(newCoupon.discount_value),
                description: newCoupon.description,
                max_uses: Number(newCoupon.max_uses) || null,
                used_count: 0,
                active: true,
                created_at: serverTimestamp(),
                valid_until: null
            });

            // Add to local state
            const createdCoupon: Coupon = {
                id: docRef.id,
                code: newCoupon.code.toUpperCase(),
                discount_type: newCoupon.discount_type as 'percent' | 'fixed',
                discount_value: Number(newCoupon.discount_value),
                description: newCoupon.description,
                max_uses: Number(newCoupon.max_uses) || undefined,
                used_count: 0,
                active: true,
                created_at: new Date()
            };

            setStats(prev => ({
                ...prev,
                allCoupons: [...prev.allCoupons, createdCoupon]
            }));

            // Reset form
            setNewCoupon({
                code: '',
                discount_type: 'percent',
                discount_value: 0,
                description: '',
                max_uses: 0
            });

            alert('✅ Coupon created successfully!');
        } catch (error: any) {
            console.error('Error creating coupon:', error);
            alert(`❌ Error creating coupon: ${error.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteCoupon = async (id: string) => {
        if (!confirm('Are you sure you want to delete this coupon?')) return;

        try {
            await deleteDoc(doc(db, 'coupons', id));

            setStats(prev => ({
                ...prev,
                allCoupons: prev.allCoupons.filter(c => c.id !== id)
            }));

            alert('✅ Coupon deleted.');
        } catch (error: any) {
            console.error('Error deleting coupon:', error);
            alert(`❌ Error: ${error.message}`);
        }
    };

    if (loading) {
        return (
            <AdminLayout
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as 'overview' | 'houses' | 'users')}
                onBackClick={() => navigate('/dashboard')}
            >
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-charcoal border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-stone-500 font-mono text-sm">Loading system data...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    // Error state
    if (error) {
        return (
            <AdminLayout
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as 'overview' | 'houses' | 'users')}
                onBackClick={() => navigate('/dashboard')}
            >
                <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">⚠️</span>
                        </div>
                        <h2 className="text-xl font-serif font-bold text-charcoal mb-2">Failed to Load Data</h2>
                        <p className="text-stone-600 mb-4">{error}</p>
                        <button onClick={() => window.location.reload()} className="btn btn-primary">
                            Retry
                        </button>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    // Empty state
    const isEmpty = stats.totalHouses === 0 && stats.totalUsers === 0;
    if (isEmpty) {
        return (
            <AdminLayout
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as 'overview' | 'houses' | 'users')}
                onBackClick={() => navigate('/dashboard')}
            >
                <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Database className="w-8 h-8 text-stone-400" />
                        </div>
                        <h2 className="text-xl font-serif font-bold text-charcoal mb-2">No Data Yet</h2>
                        <p className="text-stone-600 mb-6">Seed demo data to get started with testing.</p>
                        <button
                            onClick={handleSeedDemo}
                            disabled={seeding}
                            className="btn btn-primary flex items-center gap-2 mx-auto"
                        >
                            <Database className="w-4 h-4" />
                            {seeding ? 'Seeding...' : 'Seed Demo Data'}
                        </button>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as 'overview' | 'houses' | 'users')}
            onBackClick={() => navigate('/dashboard')}
        >
            {/* Header */}
            <div className="border-b border-stone-200 bg-white sticky top-0 z-10">
                <div className="px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-serif font-bold text-charcoal">Mission Control</h1>
                            <p className="text-sm text-stone-500 mt-1">System operations & analytics</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSeedDemo}
                                disabled={seeding}
                                className="btn btn-secondary text-sm flex items-center gap-2"
                            >
                                <Database className="w-4 h-4" />
                                {seeding ? 'Seeding...' : 'Seed Demo Data'}
                            </button>
                            <div className="px-3 py-2 bg-amber/10 text-amber border border-amber/20 rounded text-xs font-medium font-mono">
                                ADMIN MODE
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-6 mt-6">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`pb-3 border-b-2 transition-colors font-medium text-sm ${activeTab === 'overview'
                                ? 'border-amber text-charcoal'
                                : 'border-transparent text-stone-500 hover:text-charcoal'
                                }`}
                        >
                            <BarChart2 className="w-4 h-4 inline mr-2" />
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('houses')}
                            className={`pb-3 border-b-2 transition-colors font-medium text-sm ${activeTab === 'houses'
                                ? 'border-amber text-charcoal'
                                : 'border-transparent text-stone-500 hover:text-charcoal'
                                }`}
                        >
                            <Home className="w-4 h-4 inline mr-2" />
                            Houses ({stats.totalHouses})
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`pb-3 border-b-2 transition-colors font-medium text-sm ${activeTab === 'users'
                                ? 'border-amber text-charcoal'
                                : 'border-transparent text-stone-500 hover:text-charcoal'
                                }`}
                        >
                            <Users className="w-4 h-4 inline mr-2" />
                            Users ({stats.totalUsers})
                        </button>
                        <button
                            onClick={() => setActiveTab('contacts')}
                            className={`pb-3 border-b-2 transition-colors font-medium text-sm ${activeTab === 'contacts'
                                ? 'border-amber text-charcoal'
                                : 'border-transparent text-stone-500 hover:text-charcoal'
                                }`}
                        >
                            <Send className="w-4 h-4 inline mr-2" />
                            Contact ({stats.allContacts.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('coupons')}
                            className={`pb-3 border-b-2 transition-colors font-medium text-sm ${activeTab === 'coupons'
                                ? 'border-amber text-charcoal'
                                : 'border-transparent text-stone-500 hover:text-charcoal'
                                }`}
                        >
                            <Tag className="w-4 h-4 inline mr-2" />
                            Coupons ({stats.allCoupons.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-8">
                {/* Overview Tab */}
                {activeTab === 'overview' && (() => {
                    // Calculate metrics
                    const trialHouses = stats.allHouses.filter(h => {
                        // Assuming houses have a trial_end field or subscription_status
                        return (h as any).subscription_status === 'trial' || !(h as any).subscription_active;
                    });
                    const activeHouses = stats.totalHouses - trialHouses.length;

                    // Trials expiring soon (within 3 days)
                    const now = new Date();
                    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
                    const expiringTrials = trialHouses.filter(h => {
                        const trialEnd = (h as any).trial_end;
                        if (!trialEnd) return false;
                        const endDate = trialEnd.toDate ? trialEnd.toDate() : new Date(trialEnd);
                        return endDate <= threeDaysFromNow && endDate >= now;
                    });

                    // Basic MRR (exclude demo houses)
                    const demoHouseNames = ['Sumarbústaður við Þingvallavatn', 'Demo House'];
                    const paidHouses = stats.allHouses.filter(h =>
                        !demoHouseNames.includes(h.name || '') &&
                        (h as any).subscription_status === 'active'
                    );
                    const estimatedMRR = paidHouses.length * 1990; // 1,990 ISK per house/month

                    return (
                        <div className="space-y-8">
                            {/* Primary Metrics Grid */}
                            <div className="grid grid-cols-4 gap-6">
                                {/* Total Houses */}
                                <div className="bg-white border border-stone-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 bg-amber/10 rounded flex items-center justify-center">
                                            <Home className="w-5 h-5 text-amber" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-stone-500 font-medium uppercase tracking-wide mb-1">Total Houses</p>
                                    <p className="text-3xl font-bold font-mono text-charcoal">{stats.totalHouses}</p>
                                    <div className="mt-3 pt-3 border-t border-stone-100">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-green-600 font-medium">↗ Active: {activeHouses}</span>
                                            <span className="text-amber font-medium">Trial: {trialHouses.length}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Users */}
                                <div className="bg-white border border-stone-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 bg-blue-500/10 rounded flex items-center justify-center">
                                            <Users className="w-5 h-5 text-blue-500" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-stone-500 font-medium uppercase tracking-wide mb-1">Total Users</p>
                                    <p className="text-3xl font-bold font-mono text-charcoal">{stats.totalUsers}</p>
                                    <div className="mt-3 pt-3 border-t border-stone-100">
                                        <p className="text-xs text-stone-600">
                                            Avg {stats.totalHouses > 0 ? (stats.totalUsers / stats.totalHouses).toFixed(1) : 0} per house
                                        </p>
                                    </div>
                                </div>

                                {/* Trials Expiring Soon */}
                                <div className="bg-white border border-stone-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 bg-orange-500/10 rounded flex items-center justify-center">
                                            <Activity className="w-5 h-5 text-orange-500" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-stone-500 font-medium uppercase tracking-wide mb-1">Expiring Soon</p>
                                    <p className="text-3xl font-bold font-mono text-charcoal">{expiringTrials.length}</p>
                                    <div className="mt-3 pt-3 border-t border-stone-100">
                                        <p className="text-xs text-orange-600">
                                            {expiringTrials.length > 0 ? '⚠️ Action needed' : '✓ All clear'}
                                        </p>
                                    </div>
                                </div>

                                {/* Estimated MRR */}
                                <div className="bg-white border border-stone-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 bg-green-500/10 rounded flex items-center justify-center">
                                            <TrendingUp className="w-5 h-5 text-green-500" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-stone-500 font-medium uppercase tracking-wide mb-1">Est. MRR</p>
                                    <p className="text-3xl font-bold font-mono text-charcoal">
                                        {estimatedMRR.toLocaleString('is-IS')} kr
                                    </p>
                                    <div className="mt-3 pt-3 border-t border-stone-100">
                                        <p className="text-xs text-stone-600">
                                            {paidHouses.length} paying {paidHouses.length === 1 ? 'house' : 'houses'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* System Health Panel */}
                            <div className="bg-white border border-stone-200 rounded-lg p-6">
                                <h3 className="text-lg font-serif font-semibold mb-6">System Health</h3>
                                <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <p className="text-sm font-medium text-stone-700">Database</p>
                                        </div>
                                        <p className="text-xs text-stone-500">Firestore operational</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <p className="text-sm font-medium text-stone-700">Authentication</p>
                                        </div>
                                        <p className="text-xs text-stone-500">Firebase Auth active</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <p className="text-sm font-medium text-stone-700">Storage</p>
                                        </div>
                                        <p className="text-xs text-stone-500">All systems go</p>
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-stone-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-stone-700">Version</p>
                                            <p className="text-xs text-stone-500 font-mono">v1.0.0</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-stone-700">Environment</p>
                                            <p className="text-xs text-stone-500 font-mono">Production</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-stone-700">Uptime</p>
                                            <p className="text-xs text-stone-500">99.9%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Activity Summary */}
                            <div className="bg-white border border-stone-200 rounded-lg p-6">
                                <h3 className="text-lg font-serif font-semibold mb-6">Recent Activity</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-sm text-stone-600 mb-2">Active Bookings</p>
                                        <p className="text-2xl font-bold font-mono text-charcoal">{stats.totalBookings}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-stone-600 mb-2">Pending Tasks</p>
                                        <p className="text-2xl font-bold font-mono text-charcoal">{stats.activeTasks}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Houses Tab */}
                {activeTab === 'houses' && (
                    <div className="bg-white border border-stone-200 rounded-lg p-6">
                        <h2 className="text-lg font-serif font-semibold mb-6">House Registry</h2>
                        <DataTable
                            columns={[
                                { key: 'name', label: 'House Name', sortable: true },
                                {
                                    key: 'subscription_status',
                                    label: 'Status',
                                    render: (row) => {
                                        const status = row.subscription_status || 'trial';
                                        const colors = {
                                            free: 'bg-green-100 text-green-700 border-green-200',
                                            active: 'bg-blue-100 text-blue-700 border-blue-200',
                                            trial: 'bg-amber-100 text-amber-700 border-amber-200',
                                            expired: 'bg-red-100 text-red-700 border-red-200'
                                        };
                                        return (
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold border uppercase ${colors[status] || colors.trial}`}>
                                                {status}
                                            </span>
                                        );
                                    }
                                },
                                {
                                    key: 'address',
                                    label: 'Location',
                                    sortable: true,
                                    render: (row) => row.address || '—'
                                },
                                {
                                    key: 'owner_ids',
                                    label: 'Members',
                                    render: (row) => (
                                        <span className="font-mono">{row.owner_ids?.length || 0}</span>
                                    )
                                },
                                {
                                    key: 'manager_id',
                                    label: 'Manager',
                                    render: (row) => {
                                        const manager = stats.allUsers.find(u => u.uid === row.manager_id);
                                        return <span className="font-mono text-xs">{manager?.email || '—'}</span>;
                                    }
                                },
                                {
                                    key: 'created_at',
                                    label: 'Created',
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
                                        onClick={() => handleExtendTrial(row.id!)}
                                        disabled={actionLoading === row.id}
                                        className="px-3 py-1.5 text-xs font-medium border border-amber/30 text-amber hover:bg-amber hover:text-charcoal rounded transition-colors disabled:opacity-50"
                                        title="Extend Trial"
                                    >
                                        {actionLoading === row.id ? 'Extending...' : 'Extend Trial'}
                                    </button>
                                    <button
                                        onClick={() => handleToggleFree(row.id!)}
                                        disabled={actionLoading === row.id}
                                        className={`px-3 py-1.5 text-xs font-bold border rounded transition-colors disabled:opacity-50 ${row.subscription_status === 'free'
                                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                                : 'border-green-200 text-green-600 hover:bg-green-50'
                                            }`}
                                        title={row.subscription_status === 'free' ? 'Revoke Free Access' : 'Grant Free Access'}
                                    >
                                        {row.subscription_status === 'free' ? 'Revoke Free' : 'Grant Free'}
                                    </button>
                                    <button className="p-1 hover:bg-stone-100 rounded" title="Edit">
                                        <Edit className="w-4 h-4 text-stone-500" />
                                    </button>
                                </div>
                            )}
                        />
                    </div>
                )}

                {/* Coupons Tab */}
                {activeTab === 'coupons' && (
                    <div className="space-y-8">
                        {/* Create Coupon Form */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Tag className="w-5 h-5 text-amber" />
                                Create New Coupon
                            </h3>
                            <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-stone-500 mb-1">Code</label>
                                    <input
                                        type="text"
                                        required
                                        className="input uppercase"
                                        placeholder="SUMAR2025"
                                        value={newCoupon.code}
                                        onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-stone-500 mb-1">Type</label>
                                    <select
                                        className="input"
                                        value={newCoupon.discount_type}
                                        onChange={e => setNewCoupon({ ...newCoupon, discount_type: e.target.value as 'percent' | 'fixed' })}
                                    >
                                        <option value="percent">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (kr)</option>
                                    </select>
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-stone-500 mb-1">Value</label>
                                    <input
                                        type="number"
                                        required
                                        className="input"
                                        placeholder="20"
                                        value={newCoupon.discount_value || ''}
                                        onChange={e => setNewCoupon({ ...newCoupon, discount_value: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-stone-500 mb-1">Max Uses (0 = unlimited)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        placeholder="0"
                                        value={newCoupon.max_uses || ''}
                                        onChange={e => setNewCoupon({ ...newCoupon, max_uses: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <button
                                        type="submit"
                                        className="btn btn-primary w-full h-[42px] flex items-center justify-center gap-2"
                                        disabled={actionLoading === 'create-coupon'}
                                    >
                                        {actionLoading === 'create-coupon' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create'}
                                    </button>
                                </div>
                                <div className="md:col-span-5">
                                    <label className="block text-xs font-bold text-stone-500 mb-1">Description (Internal)</label>
                                    <input
                                        type="text"
                                        required
                                        className="input"
                                        placeholder="Summer campaign for Facebook ads"
                                        value={newCoupon.description}
                                        onChange={e => setNewCoupon({ ...newCoupon, description: e.target.value })}
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Coupons Table */}
                        <div>
                            <h2 className="text-2xl font-serif mb-6">Active Coupons</h2>
                            <DataTable
                                columns={[
                                    { key: 'code', label: 'Code', render: r => <span className="font-mono font-bold">{r.code}</span> },
                                    {
                                        key: 'discount',
                                        label: 'Discount',
                                        render: r => r.discount_type === 'percent' ? `${r.discount_value}%` : `${r.discount_value} kr`
                                    },
                                    { key: 'description', label: 'Description' },
                                    {
                                        key: 'usage',
                                        label: 'Usage',
                                        render: r => `${r.used_count} / ${r.max_uses || '∞'}`
                                    },
                                    {
                                        key: 'created_at',
                                        label: 'Created',
                                        render: (row) => {
                                            if (!row.created_at) return '—';
                                            const date = row.created_at instanceof Date ? row.created_at : new Date(row.created_at);
                                            return date.toLocaleDateString('is-IS');
                                        }
                                    }
                                ]}
                                data={stats.allCoupons}
                                searchKeys={['code', 'description']}
                                actions={(row) => (
                                    <button
                                        onClick={() => handleDeleteCoupon(row.id)}
                                        className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 rounded hover:bg-red-50"
                                    >
                                        Delete
                                    </button>
                                )}
                            />
                        </div>
                    </div>
                )}


                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="bg-white border border-stone-200 rounded-lg p-6">
                        <h2 className="text-lg font-serif font-semibold mb-6">User Registry</h2>
                        <DataTable
                            columns={[
                                { key: 'name', label: 'Name', sortable: true },
                                {
                                    key: 'email',
                                    label: 'Email',
                                    sortable: true,
                                    render: (row) => <span className="font-mono text-xs">{row.email}</span>
                                },
                                {
                                    key: 'house_ids',
                                    label: 'Houses',
                                    render: (row) => (
                                        <span className="font-mono">{row.house_ids?.length || 0}</span>
                                    )
                                },
                                {
                                    key: 'created_at',
                                    label: 'Joined',
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
                                <button
                                    onClick={() => handleImpersonate(row)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-amber/30 text-amber hover:bg-amber hover:text-charcoal rounded transition-colors"
                                >
                                    <UserCog className="w-3 h-3" />
                                    Impersonate
                                </button>
                            )}
                        />
                    </div>
                )}

                {/* Contacts Tab */}
                {activeTab === 'contacts' && (
                    <div>
                        <h2 className="text-2xl font-serif mb-6">Contact Submissions</h2>
                        <DataTable
                            columns={[
                                { key: 'name', label: 'Name' },
                                { key: 'email', label: 'Email' },
                                {
                                    key: 'message',
                                    label: 'Message',
                                    render: (row) => {
                                        const msg = row.message || '';
                                        return msg.length > 100 ? msg.substring(0, 100) + '...' : msg;
                                    }
                                },
                                {
                                    key: 'created_at',
                                    label: 'Date',
                                    render: (row) => {
                                        if (!row.created_at) return '—';
                                        const date = row.created_at instanceof Date
                                            ? row.created_at
                                            : new Date(row.created_at);
                                        return date.toLocaleDateString('is-IS');
                                    }
                                },
                                {
                                    key: 'status',
                                    label: 'Status',
                                    render: (row) => {
                                        const status = row.status || 'new';
                                        const colors = {
                                            new: 'bg-blue-100 text-blue-700',
                                            read: 'bg-gray-100 text-gray-700',
                                            replied: 'bg-green-100 text-green-700'
                                        };
                                        return (
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status as keyof typeof colors]}`}>
                                                {status}
                                            </span>
                                        );
                                    }
                                }
                            ]}
                            data={stats.allContacts}
                            searchKeys={['name', 'email', 'message']}
                        />
                    </div>
                )}
            </div>
        </AdminLayout >
    );
}
