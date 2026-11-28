import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, CheckSquare, Menu } from 'lucide-react';

export default function MobileNav() {
    const location = useLocation();
    const path = location.pathname;

    const isActive = (p: string) => path === p;

    const navItems = [
        { label: 'Heim', path: '/dashboard', icon: Home },
        { label: 'Dagatal', path: '/calendar', icon: Calendar },
        { label: 'Verkefni', path: '/tasks', icon: CheckSquare },
        { label: 'Meira', path: '/settings', icon: Menu },
    ];

    return (
        <nav aria-label="Aðalvalmynd" className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-stone-200 pb-[env(safe-area-inset-bottom)] z-50 px-6 py-3 flex justify-between items-center font-sans shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {navItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;

                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        aria-current={active ? 'page' : undefined}
                        className={`flex flex-col items-center gap-1 transition-colors duration-200 w-16 ${active ? 'text-amber-ink' : 'text-stone-500 hover:text-stone-700'
                            }`}
                    >
                        <Icon
                            size={24}
                            aria-hidden="true"
                            strokeWidth={active ? 2.5 : 2}
                            fill={active && item.label === 'Heim' ? "currentColor" : "none"} // Special fill for Home if desired, or keep uniform
                        />
                        <span className="text-[10px] font-bold">
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
