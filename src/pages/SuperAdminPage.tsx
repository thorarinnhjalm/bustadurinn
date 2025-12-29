/**
 * Super Admin Mission Control - Professional Dashboard
 * Desktop-first, high-density data tables, real impersonation
 */

import { useState, useEffect } from 'react';
import { Home, Users, BarChart2, TrendingUp, Activity, Database, UserCog, Edit } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { seedDemoData } from '@/utils/seedDemoData';
import AdminLayout from '@/components/AdminLayout';
import DataTable from '@/components/DataTable';

import type { House, User } from '@/types/models';

interface Stats {
    totalHouses: number;
    totalUsers: number;
    totalBookings: number;
    activeTasks: number;
    allHouses: House[];
    allUsers: User[];
}

export default function SuperAdminPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'houses' | 'users'>('overview');
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const { startImpersonation } = useImpersonation();

    const [stats, setStats] = useState<Stats>({
        totalHouses: 0,
        totalUsers: 0,
        totalBookings: 0,
        activeTasks: 0,
        allHouses: [],
        allUsers: []
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
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

                setStats({
                    totalHouses: houses.length,
                    totalUsers: users.length,
                    totalBookings: bookingsSnap.size,
                    activeTasks,
                    allHouses: houses,
                    allUsers: users
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
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
            window.location.reload();
        } catch (error: any) {
            alert(`❌ Error: ${error.message}`);
        } finally {
            setSeeding(false);
        }
    };

    // Impersonate user
    const handleImpersonate = (user: User) => {
        if (!confirm(`View as ${user.name}?\n\nYou'll see exactly what they see. Click "Exit God Mode" to return.`)) {
            return;
        }
        startImpersonation(user);
        // Navigate to their dashboard
        window.location.href = '/dashboard';
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-charcoal border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-stone-500 font-mono text-sm">Loading system data...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
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
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-8">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-4 gap-6">
                            <div className="bg-white border border-stone-200 rounded-lg p-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-amber/10 rounded flex items-center justify-center">
                                        <Home className="w-5 h-5 text-amber" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-stone-500 font-medium">Total Houses</p>
                                        <p className="text-2xl font-bold font-mono text-charcoal">{stats.totalHouses}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-stone-200 rounded-lg p-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded flex items-center justify-center">
                                        <Users className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-stone-500 font-medium">Total Users</p>
                                        <p className="text-2xl font-bold font-mono text-charcoal">{stats.totalUsers}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-stone-200 rounded-lg p-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-green-500/10 rounded flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-stone-500 font-medium">Active Bookings</p>
                                        <p className="text-2xl font-bold font-mono text-charcoal">{stats.totalBookings}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-stone-200 rounded-lg p-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-purple-500/10 rounded flex items-center justify-center">
                                        <Activity className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-stone-500 font-medium">Active Tasks</p>
                                        <p className="text-2xl font-bold font-mono text-charcoal">{stats.activeTasks}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Access */}
                        <div className="bg-white border border-stone-200 rounded-lg p-6">
                            <h3 className="text-lg font-serif font-semibold mb-4">Quick Stats</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-stone-600 mb-2">System Status</p>
                                    <p className="text-lg font-mono text-green-600">🟢 All Systems Operational</p>
                                </div>
                                <div>
                                    <p className="text-sm text-stone-600 mb-2">Version</p>
                                    <p className="text-lg font-mono">v1.0.0</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                            actions={() => (
                                <div className="flex gap-2">
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
            </div>
        </AdminLayout>
    );
}
