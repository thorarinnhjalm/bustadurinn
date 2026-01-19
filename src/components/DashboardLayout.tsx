import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, CheckSquare,
    Plus, Bell, Shield,
    ChevronDown, Home,
    HelpCircle
} from 'lucide-react';
import MobileNav from '@/components/MobileNav';
import { useAppStore } from '@/store/appStore';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';
import { useNotifications } from '@/hooks/useNotifications';
import { format } from 'date-fns';
import { is } from 'date-fns/locale';
import QuickHelpModal from '@/components/QuickHelpModal';

// A-Frame Lógóið okkar
const CabinLogo = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 2L2 22H22L12 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 15V22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ADMIN_EMAILS = [
    'thorarinnhjalmarsson@gmail.com',
];

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const navigate = useNavigate();
    const currentHouse = useAppStore((state) => state.currentHouse);
    const userHouses = useAppStore((state) => state.userHouses);
    const setCurrentHouse = useAppStore((state) => state.setCurrentHouse);
    const { user: currentUser } = useEffectiveUser();

    // Notification Hook
    const { notifications, markAsRead, markAllAsRead } = useNotifications();

    // UI State
    const [showHouseSwitcher, setShowHouseSwitcher] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showQuickHelp, setShowQuickHelp] = useState(false);

    // Close dropdowns when navigating
    const handleNavigate = (path: string) => {
        setShowHouseSwitcher(false);
        setShowNotifications(false);
        navigate(path);
    };

    return (
        <div className="min-h-screen bg-[#FDFCF8] text-[#1a1a1a] font-sans pb-24 md:pb-0">
            {/* --- TOP NAVIGATION (Mobile & Desktop) --- */}
            <nav className="fixed top-0 w-full bg-[#FDFCF8]/90 backdrop-blur-md border-b border-stone-100 z-50 px-4 h-16 flex items-center justify-between max-w-5xl mx-auto left-0 right-0">
                <div className="flex items-center gap-2 relative">
                    {currentHouse ? (
                        <button
                            onClick={() => setShowHouseSwitcher(!showHouseSwitcher)}
                            className="flex items-center gap-2 hover:bg-stone-50 px-2 py-1 rounded-lg transition-colors group"
                        >
                            <div className="text-[#1a1a1a]">
                                <CabinLogo size={20} />
                            </div>
                            <span className="font-serif font-bold text-lg tracking-tight">{currentHouse.name}</span>
                            {userHouses.length > 1 && (
                                <ChevronDown size={16} className={`text-stone-400 group-hover:text-amber transition-transform ${showHouseSwitcher ? 'rotate-180' : ''} `} />
                            )}
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 px-2 py-1">
                            <div className="text-[#1a1a1a]">
                                <CabinLogo size={20} />
                            </div>
                            <span className="font-serif font-bold text-lg tracking-tight">Bústaðurinn.is</span>
                        </div>
                    )}

                    {/* House Switcher Dropdown */}
                    {showHouseSwitcher && userHouses.length > 1 && currentHouse && (
                        <div className="absolute top-12 left-0 w-64 bg-white border border-stone-100 rounded-xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-3 py-2">Mín hús</p>
                            <div className="space-y-1">
                                {userHouses.map(house => (
                                    <button
                                        key={house.id}
                                        onClick={() => {
                                            setCurrentHouse(house);
                                            localStorage.setItem('last_house_id', house.id);
                                            setShowHouseSwitcher(false);
                                            window.location.reload();
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${currentHouse.id === house.id
                                            ? 'bg-amber/10 text-amber font-bold'
                                            : 'text-stone-600 hover:bg-stone-50'
                                            } `}
                                    >
                                        <Home size={16} className={currentHouse.id === house.id ? 'text-amber' : 'text-stone-400'} />
                                        <span className="truncate">{house.name}</span>
                                        {currentHouse.id === house.id && <div className="ml-auto w-1.5 h-1.5 bg-amber rounded-full"></div>}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-2 pt-2 border-t border-stone-100">
                                <button
                                    onClick={() => handleNavigate('/onboarding?new=true')}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-stone-400 hover:text-amber hover:bg-stone-50 transition-colors"
                                >
                                    <Plus size={14} />
                                    Bæta við nýju húsi
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-4 relative">
                    {currentUser?.email && ADMIN_EMAILS.includes(currentUser.email) && (
                        <button
                            onClick={() => handleNavigate('/super-admin')}
                            className="flex items-center gap-1 text-stone-400 hover:text-amber transition-colors text-xs font-bold uppercase tracking-wider"
                            title="Admin Mission Control"
                        >
                            <Shield size={16} />
                            <span className="hidden sm:inline">Admin</span>
                        </button>
                    )}
                    <button
                        onClick={() => setShowQuickHelp(true)}
                        className="text-stone-400 hover:text-amber transition-colors"
                        title="Hjálp"
                    >
                        <HelpCircle size={20} />
                    </button>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative text-stone-400 hover:text-[#1a1a1a] transition-colors"
                    >
                        <Bell size={20} />
                        {notifications.some(n => !n.read) && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-[#FDFCF8] rounded-full"></span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute top-12 right-0 w-80 bg-white border border-stone-100 rounded-xl shadow-2xl p-0 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                            <div className="p-4 border-b border-stone-50 flex items-center justify-between bg-stone-50/50">
                                <h4 className="font-bold text-sm text-[#1a1a1a]">Tilkynningar</h4>
                                {notifications.some(n => !n.read) && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-[10px] font-bold text-amber hover:underline uppercase tracking-wider"
                                    >
                                        Lesa allt
                                    </button>
                                )}
                            </div>
                            <div className="max-h-[400px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="text-center py-8 text-stone-400 text-xs">
                                        <Bell size={16} className="mx-auto mb-2 opacity-50" />
                                        <p>Engar tilkynningar</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-stone-50">
                                        {notifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                onClick={() => {
                                                    markAsRead(notif.id);
                                                    if (notif.type === 'booking') handleNavigate('/calendar');
                                                    if (notif.type === 'task') handleNavigate('/tasks');
                                                    if (notif.type === 'guestbook') handleNavigate('/settings?tab=guestbook');
                                                }}
                                                className={`p-4 hover:bg-stone-50 cursor-pointer transition-colors relative flex gap-3 ${!notif.read ? 'bg-amber/5' : ''}`}
                                            >
                                                {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber"></div>}
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notif.type === 'booking' ? 'bg-green-100 text-green-600' :
                                                    notif.type === 'task' ? 'bg-blue-100 text-blue-600' :
                                                        'bg-amber-100 text-amber'
                                                    }`}>
                                                    {notif.type === 'booking' ? <Calendar size={14} /> :
                                                        notif.type === 'task' ? <CheckSquare size={14} /> :
                                                            <Bell size={14} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-charcoal leading-tight mb-0.5">{notif.title}</p>
                                                    <p className="text-xs text-stone-500 line-clamp-2">{notif.message}</p>
                                                    <p className="text-[10px] text-stone-400 mt-1 uppercase font-medium">
                                                        {format(notif.created_at, 'd. MMMM', { locale: is })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div
                        className="w-8 h-8 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:bg-stone-800"
                        onClick={() => handleNavigate('/settings?tab=profile')}
                    >
                        {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'ME'}
                    </div>
                </div>
            </nav>

            <main className="pt-16">
                {children}
            </main>

            <MobileNav />

            {/* Quick Help Modal - rendered when requested */}
            <QuickHelpModal isOpen={showQuickHelp} onClose={() => setShowQuickHelp(false)} />
        </div>
    );
}
