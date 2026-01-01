/**
 * Admin Layout - Dark Sidebar Mission Control
 * Desktop-first, high-density professional interface
 */

import { useState, type ReactNode } from 'react';
import {
    Home,
    Users,
    BarChart2,
    Database,
    ArrowLeft,
    Mail,
    Menu,
    X
} from 'lucide-react';

interface AdminLayoutProps {
    children: ReactNode;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    onBackClick?: () => void;
}

export default function AdminLayout({ children, activeTab = 'overview', onTabChange, onBackClick }: AdminLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navigation = [
        { name: 'Yfirlit', id: 'overview', icon: BarChart2 },
        { name: 'Hús', id: 'houses', icon: Home },
        { name: 'Notendur', id: 'users', icon: Users },
        { name: 'Samskipti', id: 'contacts', icon: Mail },
    ];

    const handleTabClick = (id: string) => {
        onTabChange?.(id);
        setIsMobileMenuOpen(false); // Close menu on selection (mobile)
    };

    return (
        <div className="flex h-screen bg-stone-50 overflow-hidden">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-charcoal text-bone flex items-center justify-between px-4 z-40 border-b border-stone-800">
                <div>
                    <h1 className="text-lg font-mono font-bold text-amber">STJÓRNBORÐ</h1>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-stone-300 hover:text-white"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-charcoal text-bone flex flex-col border-r border-stone-800 transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo / Header (Desktop only) */}
                <div className="p-6 border-b border-stone-800 hidden md:block">
                    <h1 className="text-lg font-mono font-bold text-amber">STJÓRNBORÐ</h1>
                    <p className="text-xs text-stone-400 mt-1">Bústaðurinn Kerfisstjórn</p>
                </div>

                {/* Back Button */}
                <div className="p-4 border-b border-stone-800 space-y-2 mt-16 md:mt-0">
                    {onBackClick && (
                        <button
                            onClick={onBackClick}
                            className="w-full flex items-center justify-center gap-2 bg-stone-800 text-stone-200 hover:bg-stone-700 hover:text-white px-3 py-2 rounded text-sm transition-colors border border-stone-700"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Til baka í App
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navigation.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${activeTab === item.id
                                ? 'bg-amber text-charcoal'
                                : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </button>
                    ))}
                </nav>

                {/* System Status */}
                <div className="px-4 py-3 border-t border-stone-800">
                    <p className="text-xs text-stone-400 uppercase tracking-wider mb-3">Ástand Kerfis</p>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-stone-300">Firestore</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-stone-300">Vefþjónn</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-stone-300">Greiðslur</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-stone-800">
                    <div className="flex items-center gap-2 text-xs text-stone-400">
                        <Database className="w-4 h-4" />
                        <span className="font-mono">v1.0</span>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto w-full md:w-auto mt-16 md:mt-0">
                {children}
            </main>
        </div>
    );
}
