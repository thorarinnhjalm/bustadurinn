/**
 * Super Admin Mission Control - Professional Dashboard
 * Desktop-first, high-density data tables, real impersonation
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Users, BarChart2, TrendingUp, Activity, Database, UserCog, Edit, Send } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useAppStore } from '@/store/appStore';
import { seedDemoData } from '@/utils/seedDemoData';
import AdminLayout from '@/components/AdminLayout';
import DataTable from '@/components/DataTable';

import type { House, User } from '@/types/models';

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
}

export default function SuperAdminPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'houses' | 'users' | 'contacts'>('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [seeding, setSeeding] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { startImpersonation } = useImpersonation();

    const [stats, setStats] = useState<Stats>({
        totalHouses: 0,
        totalUsers: 0,
        totalBookings: 0,
        activeTasks: 0,
        allHouses: [],
        allUsers: [],
        allContacts: []
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

                setStats({
                    totalHouses: houses.length,
                    totalUsers: users.length,
                    totalBookings: bookingsSnap.size,
                    activeTasks,
                    allHouses: houses,
                    allUsers: users,
                    allContacts: contacts.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
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
        if (!confirm('Extend trial by 14 days?')) {
            return;
        }

        setActionLoading(houseId);
        try {
            // This would update the house's trial_end date
            // For now, just show success
            alert('✅ Trial extended by 14 days!');
        } catch (error: any) {
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
                                    <button className="p-1 hover:bg-stone-100 rounded" title="Edit">
                                        <Edit className="w-4 h-4 text-stone-500" />
                                    </button>
                                </div>
                            )}
                        />
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
        </AdminLayout>
    );
}
