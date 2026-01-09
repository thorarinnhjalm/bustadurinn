

import { useState, useEffect } from 'react';
import {
    Calendar, CheckSquare, Sun,
    Plus, Users, Wallet, Bell,
    ChevronRight, Loader2, Shield,
    ChevronDown, Home, LogOut,
    X, Image as ImageIcon, ShoppingBag, Check, MapPin, Camera
} from 'lucide-react';
import MobileNav from '@/components/MobileNav';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';
import { format } from 'date-fns';
import { is } from 'date-fns/locale';
import { collection, query, where, orderBy, limit, addDoc, updateDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Booking, Task, ShoppingItem, InternalLog, LedgerEntry, AppNotification } from '@/types/models';
import { fetchWeather } from '@/utils/weather';
import BookingWeatherCard from '@/components/BookingWeatherCard';
import { shouldShowWeather } from '@/services/weatherService';
import { canViewBookingDetails } from '@/utils/permissions';


const ADMIN_EMAILS = [
    'thorarinnhjalmarsson@gmail.com',
];

// A-Frame Lógóið okkar
const CabinLogo = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 2L2 22H22L12 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 15V22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

import Walkthrough from '@/components/Walkthrough';

const UserDashboard = () => {
    const navigate = useNavigate();
    const currentHouse = useAppStore((state) => state.currentHouse);
    const userHouses = useAppStore((state) => state.userHouses);
    const setCurrentHouse = useAppStore((state) => state.setCurrentHouse);
    const { user: currentUser } = useEffectiveUser();

    // UI state
    const [showHouseSwitcher, setShowHouseSwitcher] = useState(false);
    const [showWalkthrough, setShowWalkthrough] = useState(false);

    // Check for first-time walkthrough
    useEffect(() => {
        const hasSeen = localStorage.getItem('has_seen_walkthrough');
        if (!hasSeen && currentUser && currentHouse) {
            // Small delay to allow fade-in
            const timer = setTimeout(() => setShowWalkthrough(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [currentUser, currentHouse]);

    // Real Data State
    const [loading, setLoading] = useState(true);
    const [nextBooking, setNextBooking] = useState<Booking | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isOccupied, setIsOccupied] = useState(false);
    const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
    const [weather, setWeather] = useState({ temp: "--" as string | number, wind: 0, condition: "—" });
    const [finances, setFinances] = useState({ balance: 0, lastAction: "—" });

    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    // Checkout State
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [checkoutMessage, setCheckoutMessage] = useState('');
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);
    const [showBookingDetailModal, setShowBookingDetailModal] = useState(false);


    useEffect(() => {
        if (currentUser && (!currentUser.house_ids || currentUser.house_ids.length === 0)) {
            navigate('/onboarding');
            return;
        }

        const unsubscribes: (() => void)[] = [];

        const setupListeners = async () => {
            if (!currentHouse || !currentUser) return;

            try {
                setLoading(true);
                const now = new Date();
                const todayStart = new Date(now.setHours(0, 0, 0, 0));

                // 0. Notifications (User-specific, top-level for now)
                try {
                    const notifsRef = collection(db, 'notifications');
                    const qNotifs = query(
                        notifsRef,
                        where('house_id', '==', currentHouse.id),
                        where('user_id', '==', currentUser.uid),
                        limit(40)
                    );
                    // Using onSnapshot for notifications too for consistency
                    unsubscribes.push(onSnapshot(qNotifs, (snapshot) => {
                        const notifsData = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                            created_at: doc.data().created_at?.toDate() || new Date()
                        } as AppNotification))
                            .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
                            .slice(0, 20);
                        setNotifications(notifsData);
                    }));
                } catch (e) {
                    console.error("Error setting up notification listener:", e);
                }

                // 1. Bookings & Occupancy (Subcollection)
                const qBookings = query(
                    collection(db, 'houses', currentHouse.id, 'bookings'),
                    where('end', '>=', todayStart),
                    orderBy('end', 'asc'),
                    limit(5)
                );

                unsubscribes.push(onSnapshot(qBookings, (snapshot) => {
                    const bookingsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        start: doc.data().start?.toDate(),
                        end: doc.data().end?.toDate(),
                        created_at: doc.data().created_at?.toDate()
                    })) as Booking[];

                    // Set Next Booking
                    setNextBooking(bookingsData.length > 0 ? bookingsData[0] : null);

                    // Check Occupancy
                    const active = bookingsData.find(b => b.start <= new Date() && b.end >= new Date());
                    setIsOccupied(!!active);
                }, (error) => console.error("Bookings listener error:", error)));

                // 2. Tasks (Subcollection)
                const qTasks = query(
                    collection(db, 'houses', currentHouse.id, 'tasks')
                    // Removed 'where' and 'orderBy' to avoid index issues / strictly require client-side sorting
                );
                unsubscribes.push(onSnapshot(qTasks, (snapshot) => {
                    const tasksData = snapshot.docs.map(doc => {
                        const d = doc.data();
                        return {
                            id: doc.id,
                            ...d,
                            created_at: d.created_at?.toDate(),
                            due_date: d.due_date?.toDate()
                        } as Task;
                    });

                    // Client-side Filter & Sort
                    const activeTasks = tasksData
                        .filter(t => ['pending', 'in_progress'].includes(t.status))
                        .sort((a, b) => (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0))
                        .slice(0, 5);

                    setTasks(activeTasks);
                }, (error) => console.error("Tasks listener error:", error)));

                // 3. Shopping List (Subcollection)
                const qShopping = query(
                    collection(db, 'houses', currentHouse.id, 'shopping_list')
                    // Removed 'where' and 'orderBy' to avoid index issues
                );
                unsubscribes.push(onSnapshot(qShopping, (snapshot) => {
                    const items = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        created_at: doc.data().created_at?.toDate() || new Date(),
                        checked_at: doc.data().checked_at?.toDate()
                    })) as ShoppingItem[];

                    // Client-side Filter & Sort
                    const unchecked = items
                        .filter(i => !i.checked)
                        .sort((a, b) => (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0))
                        .slice(0, 5);

                    setShoppingItems(unchecked);
                }, (error) => console.error("Shopping listener error:", error)));

                // 4. Internal Logs (Subcollection - for Check-in status)
                const qLogs = query(
                    collection(db, 'houses', currentHouse.id, 'internal_logs'),
                    orderBy('created_at', 'desc'),
                    limit(5)
                );
                unsubscribes.push(onSnapshot(qLogs, (snapshot) => {
                    const logsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        created_at: doc.data().created_at?.toDate()
                    })) as InternalLog[];

                    // Check check-in status
                    if (currentUser?.uid) {
                        const userLogs = logsData.filter(log => log.user_id === currentUser.uid);
                        if (userLogs.length > 0) {
                            const last = userLogs[0];
                            if (last.text.includes('skráði komu')) setIsCheckedIn(true);
                            else if (last.text.includes('skráði brottför')) setIsCheckedIn(false);
                        }
                    }
                }, (error) => console.error("Logs listener error:", error)));

                // 5. Finances (Subcollection)
                const qFinance = query(
                    collection(db, 'houses', currentHouse.id, 'finance_entries')
                );
                unsubscribes.push(onSnapshot(qFinance, (snapshot) => {
                    const entries = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        date: doc.data().date?.toDate(),
                        created_at: doc.data().created_at?.toDate()
                    })) as LedgerEntry[];

                    const income = entries.filter(e => e.type !== 'expense').reduce((s, e) => s + e.amount, 0);
                    const expense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
                    const bal = income - expense;

                    let action = "Ekkert að frétta";
                    if (entries.length > 0) {
                        entries.sort((a, b) => b.date.getTime() - a.date.getTime());
                        const last = entries[0];
                        const who = last.paid_by_name?.split(' ')[0] || 'Sjóðurinn';
                        const verb = last.type === 'expense' ? 'greiddi' : 'lagði inn';
                        action = `${who} ${verb} ${last.amount.toLocaleString('is-IS')} kr.`;
                    }

                    setFinances({ balance: bal, lastAction: action });
                }, (error) => console.error("Finance listener error:", error)));

                // 6. Weather (Async - One time)
                if (currentHouse.location?.lat && currentHouse.location?.lng) {
                    fetchWeather(currentHouse.location.lat, currentHouse.location.lng)
                        .then(wData => {
                            if (wData) setWeather({ temp: wData.temp, wind: wData.windSpeed, condition: wData.condition });
                        })
                        .catch(e => console.error("Weather fetch error:", e));
                } else {
                    setWeather({ temp: "?", wind: 0, condition: "Vantar staðsetningu" });
                }

                setLoading(false);

            } catch (err) {
                console.error("Setup listeners error:", err);
                setLoading(false);
            }
        };

        setupListeners();

        return () => {
            unsubscribes.forEach(u => u());
        };
    }, [currentHouse, currentUser, navigate]);

    if (!currentHouse || loading) {
        return (
            <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            </div>
        );
    }

    const formatBookingDates = (start: Date, end: Date) => {
        // 17. - 20. júní
        const startDay = start.getDate();
        const endDay = end.getDate();
        const month = format(end, 'MMMM', { locale: is });
        return `${startDay}.- ${endDay}. ${month} `;
    };

    const getDaysUntil = (date: Date) => {
        const diff = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (diff <= 0) return 'Í dag';
        if (diff === 1) return 'Á morgun';
        return `Eftir ${diff} daga`;
    };

    // Shopping List Handlers and Log Handlers Removed

    const handleCheckout = async () => {
        if (!currentHouse || !currentUser) return;
        setCheckoutLoading(true);
        try {
            // 1. Create Guestbook Entry if message provided
            if (checkoutMessage.trim()) {
                await addDoc(collection(db, 'guestbook'), {
                    house_id: currentHouse.id,
                    author: currentUser.name || currentUser.email || 'Óþekktur',
                    message: checkoutMessage.trim(),
                    created_at: serverTimestamp()
                });
            }

            // 2. Log Internal Check-out
            const text = `${currentUser.name} skráði brottför.`;
            const newLog = {
                house_id: currentHouse.id,
                user_id: currentUser.uid,
                user_name: currentUser.name,
                text,
                created_at: serverTimestamp()
            };
            await addDoc(collection(db, 'internal_logs'), newLog);

            // Optimistic Log Update Removed

            setShowCheckoutModal(false);
            setCheckoutMessage('');
            setIsCheckedIn(false);

        } catch (error) {
            console.error('Error during checkout:', error);
        } finally {
            setCheckoutLoading(false);
        }
    };

    // Handle missing house (e.g., during impersonation or onboarding incomplete)
    if (!currentHouse) {
        return (
            <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6">
                <div className="card max-w-md text-center">
                    <h2 className="text-2xl font-serif mb-4">Engin hús fundust</h2>
                    <p className="text-grey-dark mb-6">
                        Þessi notandi hefur ekki lokið við að setja upp hús.
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="btn btn-primary"
                    >
                        Til baka
                    </button>
                </div>
            </div>
        );
    }

    // ... (rest of component)

    return (
        <div className="min-h-screen bg-[#FDFCF8] text-[#1a1a1a] font-sans pb-24 md:pb-0">

            {/* --- TOP NAVIGATION (Mobile & Desktop) --- */}
            <nav className="fixed top-0 w-full bg-[#FDFCF8]/90 backdrop-blur-md border-b border-stone-100 z-50 px-4 h-16 flex items-center justify-between max-w-5xl mx-auto left-0 right-0">
                <div className="flex items-center gap-2 relative">
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

                    {/* House Switcher Dropdown */}
                    {showHouseSwitcher && userHouses.length > 1 && (
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
                                    onClick={() => navigate('/onboarding')}
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
                            onClick={() => navigate('/super-admin')}
                            className="flex items-center gap-1 text-stone-400 hover:text-amber transition-colors text-xs font-bold uppercase tracking-wider"
                            title="Admin Mission Control"
                        >
                            <Shield size={16} />
                            <span className="hidden sm:inline">Admin</span>
                        </button>
                    )}
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
                                        onClick={async () => {
                                            const unread = notifications.filter(n => !n.read);
                                            await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
                                            setNotifications(notifications.map(n => ({ ...n, read: true })));
                                        }}
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
                                                onClick={async () => {
                                                    if (!notif.read) {
                                                        await updateDoc(doc(db, 'notifications', notif.id), { read: true });
                                                        setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
                                                    }
                                                    // Handle navigation based on type
                                                    if (notif.type === 'booking') navigate('/calendar');
                                                    if (notif.type === 'task') navigate('/tasks');
                                                    if (notif.type === 'guestbook') navigate('/settings?tab=guestbook');
                                                    setShowNotifications(false);
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
                        onClick={() => navigate('/settings?tab=profile')}
                    >
                        {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'ME'}
                    </div>
                </div>
            </nav>

            {/* --- HERO IMAGE & STATUS --- */}
            <div className="pt-16 max-w-5xl mx-auto">
                <div className="relative h-64 md:h-96 w-full overflow-hidden md:rounded-b-3xl shadow-xl shadow-stone-200/50">
                    <img
                        src={currentHouse?.image_url || "/hero_summer_house.webp"}
                        alt={currentHouse?.name || "Cabin"}
                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/20 to-transparent opacity-90"></div>



                    {/* Gallery Preview Button */}
                    <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
                        {currentUser && (currentUser.uid === currentHouse?.manager_id || currentHouse?.owner_ids?.includes(currentUser.uid)) && (
                            <button
                                onClick={(e) => { e.stopPropagation(); navigate('/settings?tab=house'); }}
                                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-white/20 transition-all flex items-center gap-2"
                            >
                                <Camera size={14} />
                                <span className="hidden sm:inline">Breyta mynd</span>
                            </button>
                        )}

                        {currentHouse?.gallery_urls && currentHouse.gallery_urls.length > 0 && (
                            <button
                                onClick={() => setSelectedGalleryImage(currentHouse.image_url || currentHouse.gallery_urls![0])}
                                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-white/20 transition-all flex items-center gap-2"
                            >
                                <ImageIcon size={14} />
                                Skoða myndasafn ({currentHouse.gallery_urls.length + (currentHouse.image_url ? 1 : 0)})
                            </button>
                        )}
                    </div>

                    {/* Greeting & Weather */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <p className="text-amber font-bold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                                <span className="w-8 h-0.5 bg-amber inline-block"></span>
                                {(() => {
                                    const hour = new Date().getHours();
                                    if (hour < 12) return 'Góðan daginn';
                                    if (hour < 18) return 'Góðan dag';
                                    return 'Góða kvöldið';
                                })()}
                            </p>
                            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-2 text-white/95">
                                {currentUser?.name?.split(' ')[0] || 'Gestur'}
                            </h2>
                            <div className="flex items-center gap-4 text-stone-300 text-sm font-medium">
                                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                                    <Sun size={16} className="text-amber" />
                                    <span>{weather.temp}°</span>
                                    <span className="text-stone-400">|</span>
                                    <span>{weather.wind} m/s</span>
                                </div>
                                <span className="hidden md:inline text-stone-400">•</span>
                                <span className="hidden md:inline capitalize">{weather.condition}</span>
                            </div>
                        </div>

                        {/* Occupancy Status Badge */}
                        <div className="self-start md:self-end mb-1">
                            {isOccupied ? (
                                <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-100 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-lg">
                                    <div className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest leading-none">Húsið er í notkun</span>
                                </div>
                            ) : (
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 text-stone-200 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-lg">
                                    <div className="w-2.5 h-2.5 rounded-full bg-stone-400"></div>
                                    <span className="text-xs font-bold uppercase tracking-widest leading-none">Laust núna</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <main className="max-w-5xl mx-auto px-4 -mt-8 relative z-10 space-y-8">

                {/* Quick Actions Bar */}
                <div className="bg-white p-2 rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-100 flex p-1.5 gap-2">
                    <button
                        onClick={() => navigate('/calendar')}
                        className="flex-1 bg-[#1a1a1a] text-white py-4 rounded-xl font-bold text-sm hover:bg-stone-800 transition-all active:scale-[0.98] flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-stone-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-8 h-8 md:w-6 md:h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-amber group-hover:text-[#1a1a1a] transition-colors relative z-10">
                            <Plus size={16} />
                        </div>
                        <span className="relative z-10">Bóka helgi</span>
                    </button>

                    <button
                        onClick={async () => {
                            if (!currentHouse || !currentUser) return;
                            if (isCheckedIn) {
                                setShowCheckoutModal(true);
                            } else {
                                const confirmCheckIn = window.confirm("Viltu skrá komu þína í gestabókina?");
                                if (!confirmCheckIn) return;
                                try {
                                    const text = `${currentUser.name} skráði komu sína.`;
                                    const newLog = {
                                        house_id: currentHouse.id,
                                        user_id: currentUser.uid,
                                        user_name: currentUser.name,
                                        text,
                                        created_at: serverTimestamp()
                                    };
                                    await addDoc(collection(db, 'internal_logs'), newLog);
                                    // setLogs(prev => [{ id: docRef.id, ...newLog, created_at: new Date() } as InternalLog, ...prev]);
                                    setIsCheckedIn(true);
                                } catch (error) {
                                    console.error('Error logging check-in:', error);
                                }
                            }
                        }}
                        className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 border ${isCheckedIn
                            ? 'bg-amber text-[#1a1a1a] border-amber shadow-lg shadow-amber/20 hover:bg-[#d9a044]'
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 hover:border-stone-300'
                            } `}
                    >
                        <div className={`w-8 h-8 md:w-6 md:h-6 rounded-full flex items-center justify-center transition-colors ${isCheckedIn ? 'bg-black/10' : 'bg-stone-100'} `}>
                            {isCheckedIn ? <LogOut size={16} /> : <Home size={16} />}
                        </div>
                        <span>{isCheckedIn ? 'Skrá brottför' : 'Skrá komu'}</span>
                    </button>
                </div>

                {/* Missing Address Warning */}
                {(!currentHouse.address || currentHouse.address.trim() === '') && currentUser?.uid && (currentUser.uid === currentHouse.manager_id || currentHouse.owner_ids?.includes(currentUser.uid)) && (
                    <div className="bg-amber/10 border border-amber/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-4">
                            <div className="w-10 h-10 bg-amber rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber/20">
                                <MapPin size={24} className="text-[#1a1a1a]" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-[#1a1a1a] text-lg mb-1">Vantar heimilisfang!</h3>
                                <p className="text-stone-600 text-sm leading-relaxed max-w-2xl">
                                    Til þess að fá <strong>veðurspá</strong>, nákvæma <strong>staðsetningu á korti</strong> og leiðbeiningar fyrir gesti þarf að skrá heimilisfang hússins.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/settings?tab=house')}
                                className="bg-[#1a1a1a] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-stone-800 transition-all whitespace-nowrap shadow-lg"
                            >
                                Skrá heimilisfang
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">

                    {/* FINANCE SNAPSHOT - MOVED TO FIRST POSITION FOR VISIBILITY */}
                    {(!currentHouse?.privacy_hide_finances || currentHouse?.manager_id === currentUser?.uid) && (
                        <section onClick={() => navigate('/finance')} className="group cursor-pointer">
                            <div className="flex justify-between items-center mb-4 px-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">Hússjóður</h3>
                                    {currentHouse?.privacy_hide_finances && (
                                        <div title="Aðeins sýnilegt stjórnendum">
                                            <Shield size={16} className="text-amber" />
                                        </div>
                                    )}
                                </div>
                                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-[#1a1a1a] group-hover:text-white transition-colors">
                                    <ChevronRight size={18} />
                                </div>
                            </div>
                            <div className="bg-[#1a1a1a] p-6 rounded-2xl text-white shadow-xl shadow-stone-200 relative overflow-hidden group hover:shadow-2xl hover:scale-[1.01] transition-all duration-300">
                                {/* Decorative Gradients */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber/20 to-transparent opacity-50 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-white/10 rounded-md">
                                            <Wallet size={16} className="text-amber" />
                                        </div>
                                        <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Staða sjóðs</p>
                                    </div>

                                    <h4 className="text-4xl font-serif text-white mb-6 tracking-tight">
                                        {finances.balance.toLocaleString('is-IS')} <span className="text-xl text-stone-500 font-sans font-normal">kr.</span>
                                    </h4>

                                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className={`w-2 h-2 rounded-full ${finances.lastAction.includes('Greiddi') ? 'bg-red-500' : 'bg-green-500'} shadow-[0_0_8px_rgba(239, 68, 68, 0.6)]`}></div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-stone-300 text-xs uppercase tracking-wide font-bold mb-0.5">Síðasta færsla</p>
                                                <p className="text-white font-medium truncate">{finances.lastAction}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Empty State Overlay */}
                                {finances.balance === 0 && finances.lastAction === "Ekkert að frétta" && (
                                    <div className="absolute inset-0 bg-charcoal/95 backdrop-blur-sm flex items-center justify-center z-20 rounded-2xl">
                                        <div className="text-center p-6">
                                            <Wallet size={32} className="mx-auto mb-3 text-amber" />
                                            <p className="text-white font-bold mb-2">Sjóðurinn er tómur</p>
                                            <p className="text-stone-400 text-sm mb-4">Byrjaðu með að bæta við fyrstu færslunni</p>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate('/finance'); }}
                                                className="px-4 py-2 bg-amber text-charcoal rounded-lg font-bold text-sm hover:bg-amber/90 transition-colors"
                                            >
                                                Opna Hússjóð
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* NEXT BOOKING CARD */}
                    <section
                        onClick={() => nextBooking && setShowBookingDetailModal(true)}
                        className={nextBooking ? "group cursor-pointer" : ""}
                    >
                        <div className="flex justify-between items-center mb-4 px-1">
                            <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">Næst á dagskrá</h3>
                            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-amber group-hover:text-white transition-colors">
                                <ChevronRight size={18} />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber"></div>

                            {/* Background Pattern */}
                            <div className="absolute right-0 top-0 opacity-[0.03] transform translate-x-1/3 -translate-y-1/3 pointer-events-none">
                                <Calendar size={200} />
                            </div>

                            {nextBooking ? (
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 text-stone-600 text-xs font-bold uppercase tracking-wider mb-3">
                                                {getDaysUntil(nextBooking.start)}
                                            </span>
                                            <h4 className="text-2xl font-serif font-bold text-[#1a1a1a] leading-tight">{nextBooking.user_name}</h4>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-stone-500">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Dagsetningar</span>
                                            <span className="font-medium text-[#1a1a1a]">{formatBookingDates(nextBooking.start, nextBooking.end)}</span>
                                        </div>
                                        <div className="w-px h-8 bg-stone-200"></div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Tegund</span>
                                            <span className="font-medium text-[#1a1a1a] capitalize">
                                                {nextBooking.type === 'personal' ? 'Einkanot' : (nextBooking.type === 'rental' ? 'Útleiga' : 'Fjölskylda')}
                                            </span>
                                        </div>

                                        {/* Weather Status Badge - PRIVACY CONTROLLED */}
                                        {canViewBookingDetails(nextBooking, currentUser, currentHouse) &&
                                            currentHouse?.location &&
                                            shouldShowWeather(nextBooking.start) && (
                                                <>
                                                    <div className="w-px h-8 bg-stone-200"></div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Veður</span>
                                                        <span className="font-medium text-[#1a1a1a]">Sjá spá</span>
                                                    </div>
                                                </>
                                            )}
                                    </div>

                                    {/* Link to full Calendar */}
                                    <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between items-center">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate('/calendar'); }}
                                            className="text-xs font-bold text-stone-500 hover:text-amber flex items-center gap-1 transition-colors uppercase tracking-wide"
                                        >
                                            <Calendar size={12} />
                                            Skoða allt dagatalið
                                        </button>

                                        <span className="text-[10px] text-stone-400">
                                            Smelltu á spjaldið til að sjá nánar
                                        </span>
                                    </div>

                                    {/* Shopping List Integration - Only for booking owner */}
                                    {canViewBookingDetails(nextBooking, currentUser, currentHouse) && (
                                        <div className="mt-4 pt-4 border-t border-stone-100">
                                            {shoppingItems.filter(item => !item.checked).length > 0 ? (
                                                <div
                                                    onClick={(e) => { e.stopPropagation(); navigate('/settings', { state: { initialTab: 'shopping' } }); }}
                                                    className="flex items-center justify-between p-3 bg-amber/10 rounded-xl border border-amber/20 hover:bg-amber/15 transition-colors cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-amber/20 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <ShoppingBag size={16} className="text-amber" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-amber-900">
                                                                {shoppingItems.filter(item => !item.checked).length} {shoppingItems.filter(item => !item.checked).length === 1 ? 'hlutur' : 'hlutir'} á innkaupalistanum
                                                            </p>
                                                            <p className="text-xs text-amber-700">
                                                                Vantar að kaupa fyrir komuna
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={20} className="text-amber flex-shrink-0" />
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-green-600">
                                                    <Check size={16} />
                                                    <p className="text-sm font-medium">Allt til reiðu fyrir komuna!</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Privacy Notice for non-booking users */}
                                    {!canViewBookingDetails(nextBooking, currentUser, currentHouse) && (
                                        <div className="mt-4 pt-4 border-t border-stone-100">
                                            <p className="text-xs text-stone-400 italic flex items-center gap-1">
                                                🔒 Veðurupplýsingar og smáatriði sýnileg aðeins bókanda
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-stone-500 relative z-10 text-center">
                                    <div className="w-16 h-16 bg-gradient-to-br from-amber/20 to-orange-100 rounded-full flex items-center justify-center mb-4 shadow-sm animate-pulse-slow">
                                        <Calendar size={28} className="text-amber-600" />
                                    </div>
                                    <h4 className="text-lg font-serif font-bold text-charcoal mb-1">Ekkert framundan?</h4>
                                    <p className="text-sm text-stone-400 mb-5 max-w-[200px] mx-auto leading-relaxed">
                                        Húsið er laust næstu daga. Tilvalið tækifæri til að skella sér!
                                    </p>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigate('/calendar'); }}
                                        className="px-6 py-2 bg-[#1a1a1a] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                    >
                                        Bóka núna
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* TASKS */}
                    <section className="md:col-span-2">
                        <div className="flex justify-between items-center mb-4 px-1">
                            <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">Verkefni</h3>
                            <button onClick={() => navigate('/tasks')} className="text-xs font-bold text-stone-400 hover:text-[#e8b058]">Sjá öll</button>
                        </div>
                        <div className="bg-white rounded-2xl border border-stone-100 shadow-xl shadow-stone-200/50 divide-y divide-stone-100 overflow-hidden">
                            {tasks.length === 0 ? (
                                <div className="p-10 text-center flex flex-col items-center justify-center bg-stone-50/30">
                                    <div className="w-14 h-14 bg-white border border-stone-100 rounded-2xl flex items-center justify-center mb-4 rotate-3 shadow-sm group-hover:rotate-6 transition-transform duration-300">
                                        <CheckSquare size={24} className="text-stone-300" />
                                    </div>
                                    <h4 className="font-bold text-stone-600 mb-1">Engin verkefni</h4>
                                    <p className="text-xs text-stone-400 mb-4 max-w-[250px]">
                                        Haltu utan um viðhald og verkefni með því að skrá þau hér.
                                    </p>
                                    <button
                                        onClick={() => navigate('/tasks')}
                                        className="text-amber hover:text-amber-600 font-bold text-sm flex items-center gap-1 group/btn px-4 py-2 hover:bg-amber/5 rounded-full transition-colors"
                                    >
                                        <Plus size={16} className="group-hover/btn:rotate-90 transition-transform" />
                                        Bæta við verkefni
                                    </button>
                                </div>
                            ) : tasks.map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => navigate('/tasks')}
                                    className="p-4 flex items-center gap-4 hover:bg-stone-50 transition-colors cursor-pointer group"
                                >
                                    <div className={`w-6 h-6 rounded-lg border-2 ${task.status === 'completed' ? 'bg-[#e8b058] border-[#e8b058]' : 'border-stone-200 group-hover:border-[#e8b058]'} flex items-center justify-center transition-colors`}>
                                        {task.status === 'completed' && <CheckSquare size={14} className="text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-base font-bold text-[#1a1a1a] ${task.status === 'completed' ? 'line-through text-stone-400' : ''} `}>{task.title}</p>
                                        {task.assigned_to_name ? (
                                            <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-1"><Users size={12} /> {task.assigned_to_name}</p>
                                        ) : (
                                            <p className="text-xs text-[#e8b058] mt-0.5 group-hover:underline font-bold">+ Taka að sér</p>
                                        )}
                                    </div>
                                    <ChevronRight size={18} className="text-stone-300 group-hover:text-[#e8b058] transition-colors" />
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            </main>

            {/* --- FOOTER --- */}
            <footer className="max-w-5xl mx-auto px-4 py-8 mt-12 text-center border-t border-stone-100 hidden md:block">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-stone-400 text-sm">
                    <div className="flex items-center gap-2">
                        <CabinLogo size={16} className="opacity-50" />
                        <span>© {new Date().getFullYear()} Bústaðurinn.is</span>
                    </div>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-amber transition-colors">Hjálp</a>
                        <a href="#" className="hover:text-amber transition-colors">Skilmálar</a>
                        <a href="#" className="hover:text-amber transition-colors">Persónuvernd</a>
                    </div>
                </div>
            </footer>

            {/* --- MOBILE BOTTOM NAV --- */}
            <MobileNav />

            {/* CHECKOUT MODAL */}
            {showCheckoutModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-serif text-[#1a1a1a] mb-2">Skrá Brottför</h2>
                        <p className="text-stone-500 mb-4">Takk fyrir komuna! Viltu skrifa í gestabókina?</p>

                        <div className="mb-4">
                            <label className="label">Færsla í gestabók (valfrjálst)</label>
                            <textarea
                                className="input min-h-[100px]"
                                placeholder="Hvernig var dvölin? Eitthvað sem þarf að laga?"
                                value={checkoutMessage}
                                onChange={(e) => setCheckoutMessage(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCheckoutModal(false)}
                                className="btn btn-ghost flex-1"
                                disabled={checkoutLoading}
                            >
                                Hætta við
                            </button>
                            <button
                                onClick={handleCheckout}
                                className="btn btn-primary flex-1"
                                disabled={checkoutLoading}
                            >
                                {checkoutLoading ? 'Skrái...' : 'Staðfesta Brottför'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Detail Modal with Weather */}
            {showBookingDetailModal && nextBooking && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowBookingDetailModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-charcoal">{nextBooking.user_name}</h2>
                                <p className="text-sm text-stone-500">
                                    {nextBooking.start.toLocaleDateString('is-IS', { weekday: 'long', day: 'numeric', month: 'long' })} - {nextBooking.end.toLocaleDateString('is-IS', { day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowBookingDetailModal(false)}
                                className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-stone-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Booking Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-stone-50 rounded-lg p-4">
                                    <p className="text-xs uppercase font-bold text-stone-400 tracking-wider mb-1">Tegund</p>
                                    <p className="text-lg font-semibold text-charcoal capitalize">
                                        {nextBooking.type === 'personal' ? 'Einkanot' : nextBooking.type === 'rental' ? 'Útleiga' : 'Fjölskylda'}
                                    </p>
                                </div>
                                <div className="bg-stone-50 rounded-lg p-4">
                                    <p className="text-xs uppercase font-bold text-stone-400 tracking-wider mb-1">Lengd</p>
                                    <p className="text-lg font-semibold text-charcoal">
                                        {Math.ceil((nextBooking.end.getTime() - nextBooking.start.getTime()) / (1000 * 60 * 60 * 24))} nætur
                                    </p>
                                </div>
                            </div>

                            {nextBooking.notes && canViewBookingDetails(nextBooking, currentUser, currentHouse) && (
                                <div className="bg-amber/5 border border-amber/20 rounded-lg p-4">
                                    <p className="text-xs uppercase font-bold text-amber-700 tracking-wider mb-2">Athugasemdir</p>
                                    <p className="text-stone-700">{nextBooking.notes}</p>
                                </div>
                            )}

                            {/* Weather Forecast - PRIVACY CONTROLLED */}
                            {canViewBookingDetails(nextBooking, currentUser, currentHouse) &&
                                currentHouse?.location &&
                                shouldShowWeather(nextBooking.start) && (
                                    <div>
                                        <h3 className="text-lg font-serif font-bold text-charcoal mb-3">Veðurspá fyrir ferðina</h3>
                                        <BookingWeatherCard
                                            bookingId={nextBooking.id}
                                            startDate={nextBooking.start}
                                            endDate={nextBooking.end}
                                            houseLatitude={currentHouse.location.lat}
                                            houseLongitude={currentHouse.location.lng}
                                            houseName={currentHouse.name}
                                        />
                                    </div>
                                )}

                            {/* Privacy Notice for other users */}
                            {!canViewBookingDetails(nextBooking, currentUser, currentHouse) && (
                                <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 text-center">
                                    <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="text-2xl">🔒</span>
                                    </div>
                                    <p className="font-bold text-stone-700 mb-1">Einkaupplýsingar</p>
                                    <p className="text-sm text-stone-500">
                                        Veðurspá, athugasemdir og frekari smáatriði eru aðeins sýnileg bókanda og hússtjóra
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-stone-200">
                                <button
                                    onClick={() => {
                                        setShowBookingDetailModal(false);
                                        navigate('/calendar');
                                    }}
                                    className="btn btn-secondary flex-1"
                                >
                                    Opna dagatal
                                </button>
                                <button
                                    onClick={() => setShowBookingDetailModal(false)}
                                    className="btn btn-primary flex-1"
                                >
                                    Loka
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Gallery Modal */}
            {selectedGalleryImage && (
                <div
                    className="fixed inset-0 z-50 bg-[#1a1a1a]/95 flex flex-col items-center justify-center p-4 md:p-8"
                    onClick={() => setSelectedGalleryImage(null)}
                >
                    <button className="absolute top-8 right-8 text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={32} />
                    </button>

                    <div className="w-full max-w-5xl aspect-video relative group" onClick={e => e.stopPropagation()}>
                        <img
                            src={selectedGalleryImage}
                            alt="Full view"
                            className="w-full h-full object-contain rounded-xl"
                        />

                        {/* Simple gallery thumbnails inside modal */}
                        <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-2 overflow-x-auto py-2">
                            {[currentHouse?.image_url, ...(currentHouse?.gallery_urls || [])].filter(Boolean).map((url, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedGalleryImage(url!)}
                                    className={`w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${selectedGalleryImage === url ? 'border-amber scale-110 shadow-lg' : 'border-white/20 opacity-50 hover:opacity-100'}`}
                                >
                                    <img src={url!} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Walkthrough */}
            {showWalkthrough && <Walkthrough onClose={() => setShowWalkthrough(false)} />}
        </div>
    );
};
export default UserDashboard;
