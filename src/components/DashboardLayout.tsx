import React, { useEffect, useId, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Calendar, CheckSquare,
    Plus, Bell, Shield,
    ChevronDown, Home,
    HelpCircle, UserPlus,
    BookOpen
} from 'lucide-react';
import MobileNav from '@/components/MobileNav';
import { useAppStore } from '@/store/appStore';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';
import { useNotifications } from '@/hooks/useNotifications';
import { format } from 'date-fns';
import { is } from 'date-fns/locale';
import QuickHelpModal from '@/components/QuickHelpModal';
import Logo from '@/components/Logo';
import BrandLogo from '@/components/BrandLogo';

// Every icon in the top bar is the same 40px touch target on one centre line.
const ICON_BTN = 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    // '/' and '/dashboard' both render the dashboard.
    const isActivePath = (path: string) =>
        path === '/'
            ? location.pathname === '/' || location.pathname === '/dashboard'
            : location.pathname === path;
    const currentHouse = useAppStore((state) => state.currentHouse);
    const userHouses = useAppStore((state) => state.userHouses);
    const setCurrentHouse = useAppStore((state) => state.setCurrentHouse);
    const { user: currentUser, isAdmin } = useEffectiveUser();

    // Notification Hook
    const { notifications, markAsRead, markAllAsRead } = useNotifications();

    // UI State
    const [showHouseSwitcher, setShowHouseSwitcher] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showQuickHelp, setShowQuickHelp] = useState(false);
    const houseSwitcherId = useId();
    const notificationsId = useId();

    // Close dropdowns when navigating
    const handleNavigate = (path: string) => {
        setShowHouseSwitcher(false);
        setShowNotifications(false);
        navigate(path);
    };

    // Escape closes whichever dropdown is open
    useEffect(() => {
        if (!showHouseSwitcher && !showNotifications) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowHouseSwitcher(false);
                setShowNotifications(false);
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [showHouseSwitcher, showNotifications]);

    const hasUnread = notifications.some(n => !n.read);

    return (
        <div className="min-h-screen bg-[#FDFCF8] text-[#1a1a1a] font-sans pb-24 md:pb-0">
            {/* --- TOP NAVIGATION (Mobile & Desktop) --- */}
            <nav aria-label="Efri valmynd" className="fixed top-0 w-full bg-[#FDFCF8]/90 backdrop-blur-md border-b border-stone-100 z-50 px-4 md:px-6 h-16 flex items-center justify-between gap-2 max-w-5xl mx-auto left-0 right-0">
                <div className="flex items-center gap-2 relative min-w-0 flex-1">
                    {currentHouse ? (
                        <button
                            type="button"
                            onClick={() => setShowHouseSwitcher(!showHouseSwitcher)}
                            aria-expanded={userHouses.length > 1 ? showHouseSwitcher : undefined}
                            aria-controls={userHouses.length > 1 ? houseSwitcherId : undefined}
                            className="flex items-center gap-2 hover:bg-stone-50 px-2 py-1 rounded-lg transition-colors group min-w-0 max-w-full"
                        >
                            <div className="text-[#1a1a1a]">
                                <Logo size={20} decorative />
                            </div>
                            <span className="font-serif font-bold text-lg tracking-tight truncate">{currentHouse.name}</span>
                            {userHouses.length > 1 && (
                                <ChevronDown size={16} aria-hidden="true" className={`text-stone-500 group-hover:text-amber-ink transition-transform ${showHouseSwitcher ? 'rotate-180' : ''} `} />
                            )}
                        </button>
                    ) : (
                        <div className="flex items-center px-2 py-1">
                            <BrandLogo size="sm" />
                        </div>
                    )}

                    {/* House Switcher Dropdown */}
                    {showHouseSwitcher && userHouses.length > 1 && currentHouse && (
                        <div id={houseSwitcherId} role="group" aria-label="Mín hús" className="absolute top-12 left-0 w-64 bg-white border border-stone-100 rounded-xl shadow-xl p-2 z-50 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 duration-200">
                            <p aria-hidden="true" className="text-[10px] font-bold text-stone-500 uppercase tracking-widest px-3 py-2">Mín hús</p>
                            <div className="space-y-1">
                                {userHouses.map(house => (
                                    <button
                                        type="button"
                                        key={house.id}
                                        aria-current={currentHouse.id === house.id ? 'true' : undefined}
                                        onClick={() => {
                                            setCurrentHouse(house);
                                            localStorage.setItem('last_house_id', house.id);
                                            setShowHouseSwitcher(false);
                                            window.location.reload();
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${currentHouse.id === house.id
                                            ? 'bg-amber/10 text-amber-ink font-bold'
                                            : 'text-stone-600 hover:bg-stone-50'
                                            } `}
                                    >
                                        <Home size={16} aria-hidden="true" className={currentHouse.id === house.id ? 'text-amber-ink' : 'text-stone-500'} />
                                        <span className="truncate">{house.name}</span>
                                        {currentHouse.id === house.id && <div aria-hidden="true" className="ml-auto w-1.5 h-1.5 bg-amber rounded-full"></div>}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-2 pt-2 border-t border-stone-100">
                                <button
                                    type="button"
                                    onClick={() => handleNavigate('/onboarding?new=true')}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-stone-500 hover:text-amber-ink hover:bg-stone-50 transition-colors"
                                >
                                    <Plus size={14} aria-hidden="true" />
                                    Bæta við nýju húsi
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1 md:gap-2 relative shrink-0">
                    {isAdmin && (
                        <Link
                            to="/super-admin"
                            onClick={() => { setShowHouseSwitcher(false); setShowNotifications(false); }}
                            className={`${ICON_BTN} w-auto gap-1 px-2 text-stone-500 hover:text-amber-ink text-xs font-bold uppercase tracking-wider`}
                            aria-label="Stjórnborð kerfisstjóra"
                        >
                            <Shield size={16} aria-hidden="true" />
                            <span className="hidden sm:inline" aria-hidden="true">Admin</span>
                        </Link>
                    )}
                    {/* Primary destinations. MobileNav covers these on small
                        screens but is hidden on desktop, so without them here
                        the calendar and tasks were only reachable via the
                        dashboard's quick-action buttons. */}
                    <Link
                        to="/"
                        onClick={() => { setShowHouseSwitcher(false); setShowNotifications(false); }}
                        className={`hidden md:inline-flex ${ICON_BTN} ${isActivePath('/') ? 'text-amber-ink' : 'text-stone-500 hover:text-amber-ink'}`}
                        title="Heim"
                        aria-label="Heim"
                        aria-current={isActivePath('/') ? 'page' : undefined}
                    >
                        <Home size={20} aria-hidden="true" />
                    </Link>
                    <Link
                        to="/calendar"
                        onClick={() => { setShowHouseSwitcher(false); setShowNotifications(false); }}
                        className={`hidden md:inline-flex ${ICON_BTN} ${isActivePath('/calendar') ? 'text-amber-ink' : 'text-stone-500 hover:text-amber-ink'}`}
                        title="Dagatal"
                        aria-label="Dagatal"
                        aria-current={isActivePath('/calendar') ? 'page' : undefined}
                    >
                        <Calendar size={20} aria-hidden="true" />
                    </Link>
                    <Link
                        to="/tasks"
                        onClick={() => { setShowHouseSwitcher(false); setShowNotifications(false); }}
                        className={`hidden md:inline-flex ${ICON_BTN} ${isActivePath('/tasks') ? 'text-amber-ink' : 'text-stone-500 hover:text-amber-ink'}`}
                        title="Verkefni"
                        aria-label="Verkefni"
                        aria-current={isActivePath('/tasks') ? 'page' : undefined}
                    >
                        <CheckSquare size={20} aria-hidden="true" />
                    </Link>
                    <Link
                        to="/arbok"
                        onClick={() => { setShowHouseSwitcher(false); setShowNotifications(false); }}
                        className={`${ICON_BTN} ${isActivePath('/arbok') ? 'text-amber-ink' : 'text-stone-500 hover:text-amber-ink'}`}
                        title="Árbók"
                        aria-label="Árbók"
                        aria-current={isActivePath('/arbok') ? 'page' : undefined}
                    >
                        <BookOpen size={20} aria-hidden="true" />
                    </Link>
                    <button
                        type="button"
                        onClick={() => setShowQuickHelp(true)}
                        className={`${ICON_BTN} text-stone-500 hover:text-amber-ink`}
                        title="Hjálp"
                        aria-label="Hjálp"
                    >
                        <HelpCircle size={20} aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowNotifications(!showNotifications)}
                        aria-expanded={showNotifications}
                        aria-controls={notificationsId}
                        aria-label={hasUnread ? 'Tilkynningar (ólesnar tilkynningar)' : 'Tilkynningar'}
                        className={`${ICON_BTN} text-stone-500 hover:text-[#1a1a1a]`}
                    >
                        <span className="relative flex">
                            <Bell size={20} aria-hidden="true" />
                            {hasUnread && (
                                <span aria-hidden="true" className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-[#FDFCF8] rounded-full"></span>
                            )}
                        </span>
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div id={notificationsId} role="region" aria-label="Tilkynningar" className="absolute top-12 right-0 w-80 bg-white border border-stone-100 rounded-xl shadow-2xl p-0 z-50 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-200 overflow-hidden">
                            <div className="p-4 border-b border-stone-50 flex items-center justify-between bg-stone-50/50">
                                <h2 className="font-bold text-sm text-[#1a1a1a]">Tilkynningar</h2>
                                {hasUnread && (
                                    <button
                                        type="button"
                                        onClick={markAllAsRead}
                                        className="text-[10px] font-bold text-amber-ink hover:underline uppercase tracking-wider"
                                    >
                                        Lesa allt
                                    </button>
                                )}
                            </div>
                            <div className="max-h-[400px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="text-center py-8 text-stone-500 text-xs">
                                        <Bell size={16} aria-hidden="true" className="mx-auto mb-2 opacity-50" />
                                        <p>Engar tilkynningar</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-stone-50">
                                        {notifications.map(notif => (
                                            <button
                                                type="button"
                                                key={notif.id}
                                                onClick={() => {
                                                    markAsRead(notif.id);
                                                    if (notif.type === 'booking') handleNavigate('/calendar');
                                                    if (notif.type === 'task') handleNavigate('/tasks');
                                                    if (notif.type === 'guestbook') handleNavigate('/settings?tab=guestbook');
                                                    if (notif.type === 'join_request') handleNavigate('/settings?tab=members');
                                                }}
                                                className={`w-full text-left p-4 hover:bg-stone-50 cursor-pointer transition-colors relative flex gap-3 ${!notif.read ? 'bg-amber/5' : ''}`}
                                            >
                                                {!notif.read && <div aria-hidden="true" className="absolute left-0 top-0 bottom-0 w-1 bg-amber"></div>}
                                                <div aria-hidden="true" className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notif.type === 'booking' ? 'bg-green-100 text-green-700' :
                                                    notif.type === 'task' ? 'bg-blue-100 text-blue-600' :
                                                        notif.type === 'join_request' ? 'bg-purple-100 text-purple-600' :
                                                            'bg-amber-100 text-amber-ink'
                                                    }`}>
                                                    {notif.type === 'booking' ? <Calendar size={14} /> :
                                                        notif.type === 'task' ? <CheckSquare size={14} /> :
                                                            notif.type === 'join_request' ? <UserPlus size={14} /> :
                                                                <Bell size={14} />}
                                                </div>
                                                <div>
                                                    {!notif.read && <span className="sr-only">Ólesin tilkynning: </span>}
                                                    <p className="text-sm font-bold text-charcoal leading-tight mb-0.5">{notif.title}</p>
                                                    <p className="text-xs text-stone-500 line-clamp-2">{notif.message}</p>
                                                    <p className="text-[10px] text-stone-500 mt-1 uppercase font-medium">
                                                        {format(notif.created_at, 'd. MMMM', { locale: is })}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <Link
                        to="/settings?tab=profile"
                        onClick={() => { setShowHouseSwitcher(false); setShowNotifications(false); }}
                        aria-label={`${currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'ME'}, prófíllinn minn`}
                        className={`${ICON_BTN} group`}
                    >
                        <span aria-hidden="true" className="w-8 h-8 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white text-xs font-bold group-hover:bg-stone-800 transition-colors">
                            {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'ME'}
                        </span>
                    </Link>
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
