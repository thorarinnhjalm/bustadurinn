/**
 * Admin Layout - Dark Sidebar Mission Control
 * Desktop-first, high-density professional interface
 */

import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Home,
    Users,
    BarChart2,
    Settings,
    Database,
    Activity
} from 'lucide-react';

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const navigation = [
        { name: 'Overview', href: '/super-admin', icon: BarChart2, exact: true },
        { name: 'Houses', href: '/super-admin/houses', icon: Home },
        { name: 'Users', href: '/super-admin/users', icon: Users },
        { name: 'Analytics', href: '/super-admin/analytics', icon: Activity },
        { name: 'System', href: '/super-admin/system', icon: Settings },
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

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navigation.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            end={item.exact}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${isActive
                                    ? 'bg-amber text-charcoal'
                                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </NavLink>
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
