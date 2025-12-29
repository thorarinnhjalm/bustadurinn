/**
 * Admin Layout - Dark Sidebar Mission Control
 * Desktop-first, high-density professional interface
 */

import { type ReactNode } from 'react';
import {
    Home,
    Users,
    BarChart2,
    Database,
    ArrowLeft,
    Mail
} from 'lucide-react';

interface AdminLayoutProps {
    children: ReactNode;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    onBackClick?: () => void;
}

export default function AdminLayout({ children, activeTab = 'overview', onTabChange, onBackClick }: AdminLayoutProps) {
    const navigation = [
        { name: 'Overview', id: 'overview', icon: BarChart2 },
        { name: 'Houses', id: 'houses', icon: Home },
        { name: 'Users', id: 'users', icon: Users },
        { name: 'Contact', id: 'contacts', icon: Mail },
    ];

    return (
        <div className="flex h-screen bg-stone-50">
            {/* Dark Sidebar */}
            <aside className="w-64 bg-charcoal text-bone flex flex-col border-r border-stone-800">
                {/* Logo / Header */}
                <div className="p-6 border-b border-stone-800">
                    <h1 className="text-lg font-mono font-bold text-amber">ADMIN</h1>
                    <p className="text-xs text-stone-400 mt-1">Neðri Hóll Hugmyndahús</p>
                </div>

                {/* Back Button */}
                {onBackClick && (
                    <div className="p-4 border-b border-stone-800">
                        <button
                            onClick={onBackClick}
                            className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors text-sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </button>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navigation.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onTabChange?.(item.id)}
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

                {/* Footer */}
                <div className="p-4 border-t border-stone-800">
                    <div className="flex items-center gap-2 text-xs text-stone-400">
                        <Database className="w-4 h-4" />
                        <span className="font-mono">v1.0</span>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
