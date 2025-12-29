import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, CheckSquare, Menu } from 'lucide-react';

export default function MobileNav() {
    const navigate = useNavigate();
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
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-stone-200 pb-[env(safe-area-inset-bottom)] z-50 px-6 py-3 flex justify-between items-center font-sans shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {navItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;

                return (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`flex flex-col items-center gap-1 transition-colors duration-200 w-16 ${active ? 'text-[#e8b058]' : 'text-stone-400 hover:text-stone-600'
                            }`}
                    >
                        <Icon
                            size={24}
                            strokeWidth={active ? 2.5 : 2}
                            fill={active && item.label === 'Heim' ? "currentColor" : "none"} // Special fill for Home if desired, or keep uniform
                        />
                        <span className={`text-[10px] font-bold ${active ? 'text-[#e8b058]' : ''}`}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
