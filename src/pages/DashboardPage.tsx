/**
 * Dashboard Page - Main Hub
 * Navigation to Calendar, Finance, Tasks, Settings
 */

import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, CheckSquare, Settings, LogOut, Home } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAppStore } from '@/store/appStore';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user: currentUser, isImpersonating } = useEffectiveUser();
    const setCurrentUser = useAppStore((state) => state.setCurrentUser);
    const setAuthenticated = useAppStore((state) => state.setAuthenticated);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setCurrentUser(null);
            setAuthenticated(false);
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const features = [
        {
            icon: Calendar,
            title: 'B\u00f3kunardagatal',
            description: 'Sj\u00e1 og b\u00faa til b\u00f3kanir fyrir sumarhúsið',
            path: '/calendar',
            color: 'bg-amber',
            available: true
        },
        {
            icon: DollarSign,
            title: 'Hússjóður',
            description: 'Rekstraráætlun og bókhald',
            path: '/finance',
            color: 'bg-green-500',
            available: true
        },
        {
            icon: CheckSquare,
            title: 'Verkefni',
            description: 'Viðhaldsverkefni og verkefnalisti',
            path: '/tasks',
            color: 'bg-blue-500',
            available: true
        },
        {
            icon: Settings,
            title: 'Stillingar',
            description: 'Húsupplýsingar og meðeigendur',
            path: '/settings',
            color: 'bg-grey-mid',
            available: true
        }
    ];

    return (
        <div className="min-h-screen bg-bone">
            {/* Header */}
            <div className="bg-charcoal text-bone">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Home className="w-8 h-8 text-amber" />
                                <h1 className="text-4xl font-serif">Stjórnborð</h1>
                            </div>
                            <p className="text-grey-warm text-lg">
                                Velkomin, <strong>{currentUser?.name || currentUser?.email}</strong>
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="btn btn-ghost text-bone border-bone hover:bg-bone hover:text-charcoal flex items-center gap-2"
                        >
                            <LogOut className="w-5 h-5" />
                            Útskrá
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-12">
                {/* Welcome Message */}
                <div className="card mb-8 bg-gradient-to-r from-amber/10 to-transparent border-l-4 border-amber">
                    <h2 className="text-2xl font-serif mb-2">Hvað viltu gera í dag?</h2>
                    <p className="text-grey-dark">
                        Veldu einn af eiginleikum hérna að neðan til að byrja að stjórna sumarhúsinu.
                    </p>
                </div>

                {/* Feature Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {features.map((feature, index) => (
                        <button
                            key={index}
                            onClick={() => feature.available && navigate(feature.path)}
                            disabled={!feature.available}
                            className={`
                card text-left transition-all
                ${feature.available
                                    ? 'hover:scale-105 hover:shadow-lg cursor-pointer'
                                    : 'opacity-50 cursor-not-allowed'
                                }
              `}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`${feature.color} p-4 rounded-lg`}>
                                    <feature.icon className="w-8 h-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-serif mb-2">
                                        {feature.title}
                                        {!feature.available && (
                                            <span className="ml-2 text-sm text-grey-mid font-sans">(Kemur fljótlega)</span>
                                        )}
                                    </h3>
                                    <p className="text-grey-dark">{feature.description}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Quick Stats (Coming Soon) */}
                <div className="mt-12">
                    <h2 className="text-2xl font-serif mb-6">Yfirlit</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="card">
                            <p className="text-grey-mid text-sm mb-1">Næsta bókun</p>
                            <p className="text-2xl font-serif">-</p>
                        </div>
                        <div className="card">
                            <p className="text-grey-mid text-sm mb-1">Óunnin verkefni</p>
                            <p className="text-2xl font-serif">-</p>
                        </div>
                        <div className="card">
                            <p className="text-grey-mid text-sm mb-1">Staða hússjóðs</p>
                            <p className="text-2xl font-serif">-</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
