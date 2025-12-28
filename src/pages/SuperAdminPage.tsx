/**
 * Super Admin Dashboard Page
 * Protected route for system administrators
 */

import { useState } from 'react';
import { Home, Users, BarChart2 } from 'lucide-react';

export default function SuperAdminPage() {
    const [activeTab, setActiveTab] = useState<'houses' | 'users' | 'analytics'>('houses');

    return (
        <div className="min-h-screen bg-bone">
            {/* Header */}
            <header className="bg-charcoal text-bone">
                <div className="container mx-auto px-6 py-4">
                    <h1 className="text-2xl font-serif">Super Admin</h1>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white border-b border-grey-warm">
                <div className="container mx-auto px-6">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('houses')}
                            className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${activeTab === 'houses'
                                ? 'border-amber text-charcoal'
                                : 'border-transparent text-grey-mid hover:text-charcoal'
                                }`}
                        >
                            <Home className="w-5 h-5" />
                            Hús
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${activeTab === 'users'
                                ? 'border-amber text-charcoal'
                                : 'border-transparent text-grey-mid hover:text-charcoal'
                                }`}
                        >
                            <Users className="w-5 h-5" />
                            Notendur
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${activeTab === 'analytics'
                                ? 'border-amber text-charcoal'
                                : 'border-transparent text-grey-mid hover:text-charcoal'
                                }`}
                        >
                            <BarChart2 className="w-5 h-5" />
                            Greining
                        </button>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="container mx-auto px-6 py-12">
                {activeTab === 'houses' && (
                    <div className="animate-fade-in">
                        <h2 className="mb-6">Öll hús í kerfinu</h2>
                        <div className="card">
                            <p className="text-grey-mid">Engin hús skráð ennþá...</p>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="animate-fade-in">
                        <h2 className="mb-6">Allir notendur</h2>
                        <div className="card">
                            <p className="text-grey-mid">Engir notendur skráðir ennþá...</p>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="animate-fade-in">
                        <h2 className="mb-6">Kerfisgreining</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="card text-center">
                                <p className="text-sm text-grey-mid mb-2">Heildarfjöldi húsa</p>
                                <p className="text-4xl font-serif font-bold">0</p>
                            </div>
                            <div className="card text-center">
                                <p className="text-sm text-grey-mid mb-2">Heildarfjöldi notenda</p>
                                <p className="text-4xl font-serif font-bold">0</p>
                            </div>
                            <div className="card text-center">
                                <p className="text-sm text-grey-mid mb-2">Virkar bókanir</p>
                                <p className="text-4xl font-serif font-bold">0</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
