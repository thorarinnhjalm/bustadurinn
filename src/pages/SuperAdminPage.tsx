/**
 * Super Admin Dashboard Page
 * Protected route for system administrators
 * Real-time analytics and system management
 */

import { useState, useEffect } from 'react';
import { Home, Users, BarChart2, TrendingUp, Activity, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import type { House, User } from '@/types/models';

interface Stats {
    totalHouses: number;
    totalUsers: number;
    totalBookings: number;
    activeTasks: number;
    recentHouses: House[];
    recentUsers: User[];
}

export default function SuperAdminPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'houses' | 'users'>('overview');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Stats>({
        totalHouses: 0,
        totalUsers: 0,
        totalBookings: 0,
        activeTasks: 0,
        recentHouses: [],
        recentUsers: []
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch houses
                const housesSnap = await getDocs(collection(db, 'houses'));
                const houses = housesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as House));

                // Fetch users
                const usersSnap = await getDocs(collection(db, 'users'));
                const users = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));

                // Fetch bookings
                const bookingsSnap = await getDocs(collection(db, 'bookings'));

                // Fetch tasks
                const tasksSnap = await getDocs(query(
                    collection(db, 'tasks'),
                    orderBy('created_at', 'desc'),
                    limit(10)
                ));
                const activeTasks = tasksSnap.docs.filter(doc => doc.data().status !== 'completed').length;

                // Get recent houses (last 5)
                const recentHouses = houses
                    .sort((a, b) => {
                        const aTime = a.created_at && typeof a.created_at === 'object' && 'seconds' in a.created_at ? (a.created_at as any).seconds : 0;
                        const bTime = b.created_at && typeof b.created_at === 'object' && 'seconds' in b.created_at ? (b.created_at as any).seconds : 0;
                        return bTime - aTime;
                    })
                    .slice(0, 5);

                // Get recent users (last 5)
                const recentUsers = users
                    .sort((a, b) => {
                        const aTime = a.created_at && typeof a.created_at === 'object' && 'seconds' in a.created_at ? (a.created_at as any).seconds : 0;
                        const bTime = b.created_at && typeof b.created_at === 'object' && 'seconds' in b.created_at ? (b.created_at as any).seconds : 0;
                        return bTime - aTime;
                    })
                    .slice(0, 5);

                setStats({
                    totalHouses: houses.length,
                    totalUsers: users.length,
                    totalBookings: bookingsSnap.size,
                    activeTasks,
                    recentHouses,
                    recentUsers
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-bone">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-charcoal border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-grey-mid">Hleð tölfræði...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bone">
            {/* Header */}
            <header className="bg-charcoal text-bone">
                <div className="container mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="btn btn-ghost text-bone hover:bg-white/10"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-serif mb-1">Super Admin</h1>
                                <p className="text-grey-warm text-sm">Kerfisstjórnun og greining</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber/20 text-amber rounded">
                            <Activity className="w-4 h-4" />
                            <span className="text-sm font-medium">Admin Access</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white border-b border-grey-warm sticky top-0 z-10">
                <div className="container mx-auto px-6">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${activeTab === 'overview'
                                ? 'border-amber text-charcoal font-medium'
                                : 'border-transparent text-grey-mid hover:text-charcoal'
                                }`}
                        >
                            <BarChart2 className="w-5 h-5" />
                            Yfirlit
                        </button>
                        <button
                            onClick={() => setActiveTab('houses')}
                            className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${activeTab === 'houses'
                                ? 'border-amber text-charcoal font-medium'
                                : 'border-transparent text-grey-mid hover:text-charcoal'
                                }`}
                        >
                            <Home className="w-5 h-5" />
                            Hús ({stats.totalHouses})
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${activeTab === 'users'
                                ? 'border-amber text-charcoal font-medium'
                                : 'border-transparent text-grey-mid hover:text-charcoal'
                                }`}
                        >
                            <Users className="w-5 h-5" />
                            Notendur ({stats.totalUsers})
                        </button>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="container mx-auto px-6 py-12">
                {activeTab === 'overview' && (
                    <div className="animate-fade-in space-y-8">
                        {/* Stats Grid */}
                        <div>
                            <h2 className="text-2xl font-serif mb-6">Tölfræði kerfis</h2>
                            <div className="grid md:grid-cols-4 gap-6">
                                <div className="card text-center bg-gradient-to-br from-amber/5 to-transparent border-l-4 border-amber">
                                    <div className="flex justify-center mb-3">
                                        <Home className="w-8 h-8 text-amber" />
                                    </div>
                                    <p className="text-sm text-grey-mid mb-2">Heildarfjöldi húsa</p>
                                    <p className="text-5xl font-serif font-bold text-charcoal">{stats.totalHouses}</p>
                                </div>
                                <div className="card text-center bg-gradient-to-br from-blue-500/5 to-transparent border-l-4 border-blue-500">
                                    <div className="flex justify-center mb-3">
                                        <Users className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <p className="text-sm text-grey-mid mb-2">Heildarfjöldi notenda</p>
                                    <p className="text-5xl font-serif font-bold text-charcoal">{stats.totalUsers}</p>
                                </div>
                                <div className="card text-center bg-gradient-to-br from-green-500/5 to-transparent border-l-4 border-green-500">
                                    <div className="flex justify-center mb-3">
                                        <TrendingUp className="w-8 h-8 text-green-500" />
                                    </div>
                                    <p className="text-sm text-grey-mid mb-2">Virkar bókanir</p>
                                    <p className="text-5xl font-serif font-bold text-charcoal">{stats.totalBookings}</p>
                                </div>
                                <div className="card text-center bg-gradient-to-br from-purple-500/5 to-transparent border-l-4 border-purple-500">
                                    <div className="flex justify-center mb-3">
                                        <Activity className="w-8 h-8 text-purple-500" />
                                    </div>
                                    <p className="text-sm text-grey-mid mb-2">Virk verkefni</p>
                                    <p className="text-5xl font-serif font-bold text-charcoal">{stats.activeTasks}</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Recent Houses */}
                            <div>
                                <h3 className="text-xl font-serif mb-4">Nýleg hús</h3>
                                <div className="card">
                                    {stats.recentHouses.length > 0 ? (
                                        <div className="space-y-4">
                                            {stats.recentHouses.map((house) => (
                                                <div key={house.id} className="pb-4 border-b border-grey-warm last:border-0 last:pb-0">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium text-charcoal">{house.name}</p>
                                                            <p className="text-sm text-grey-mid">{house.address}</p>
                                                        </div>
                                                        <span className="text-xs bg-amber/10 text-amber px-2 py-1 rounded">
                                                            {house.owner_ids?.length || 0} eigendur
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-grey-mid text-center py-8">Engin hús skráð ennþá</p>
                                    )}
                                </div>
                            </div>

                            {/* Recent Users */}
                            <div>
                                <h3 className="text-xl font-serif mb-4">Nýjir notendur</h3>
                                <div className="card">
                                    {stats.recentUsers.length > 0 ? (
                                        <div className="space-y-4">
                                            {stats.recentUsers.map((user) => (
                                                <div key={user.uid} className="pb-4 border-b border-grey-warm last:border-0 last:pb-0">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium text-charcoal">{user.name || 'Nafnlaus'}</p>
                                                            <p className="text-sm text-grey-mid">{user.email}</p>
                                                        </div>
                                                        <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded">
                                                            {user.house_ids?.length || 0} hús
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-grey-mid text-center py-8">Engir notendur skráðir ennþá</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'houses' && (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-serif mb-6">Öll hús í kerfinu</h2>
                        {stats.recentHouses.length > 0 ? (
                            <div className="space-y-4">
                                {stats.recentHouses.map((house) => (
                                    <div key={house.id} className="card hover:shadow-lg transition-shadow">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-serif font-medium mb-2">{house.name}</h3>
                                                <p className="text-grey-mid mb-3">{house.address}</p>
                                                <div className="flex gap-4 text-sm">
                                                    <span className="text-grey-dark">
                                                        <strong>{house.owner_ids?.length || 0}</strong> eigendur
                                                    </span>
                                                    {house.manager_id && (
                                                        <span className="text-amber">
                                                            • Stjórnandi: {house.manager_id}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right text-sm text-grey-mid">
                                                <p>ID: {house.id?.slice(0, 8)}...</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="card text-center py-12">
                                <Home className="w-16 h-16 text-grey-warm mx-auto mb-4" />
                                <p className="text-grey-mid">Engin hús skráð ennþá</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-serif mb-6">Allir notendur</h2>
                        {stats.recentUsers.length > 0 ? (
                            <div className="space-y-4">
                                {stats.recentUsers.map((user) => (
                                    <div key={user.uid} className="card hover:shadow-lg transition-shadow">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-serif font-medium mb-2">
                                                    {user.name || 'Nafnlaus notandi'}
                                                </h3>
                                                <p className="text-grey-mid mb-3">{user.email}</p>
                                                <div className="flex gap-4 text-sm">
                                                    <span className="text-grey-dark">
                                                        <strong>{user.house_ids?.length || 0}</strong> hús
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right text-sm text-grey-mid">
                                                <p>UID: {user.uid?.slice(0, 8)}...</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="card text-center py-12">
                                <Users className="w-16 h-16 text-grey-warm mx-auto mb-4" />
                                <p className="text-grey-mid">Engir notendur skráðir ennþá</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
