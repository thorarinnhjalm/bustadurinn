
import { useState, useEffect } from 'react';
import {
    Calendar, Sun,
    Plus, Wallet,
    ChevronRight, Loader2, Shield,
    Home, LogOut,
    Image as ImageIcon, MapPin, Camera,
    ShoppingCart, CheckSquare, Sparkles, Coffee
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';
import { format } from 'date-fns';
import { is } from 'date-fns/locale';
import { collection, query, where, orderBy, limit, addDoc, onSnapshot, serverTimestamp, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Booking, Task, ShoppingItem, InternalLog, LedgerEntry, House, BudgetPlan } from '@/types/models';
import { fetchWeather } from '@/utils/weather';
import MyServiceWidget from '@/components/dashboard/MyServiceWidget';
import SetupProgress from '@/components/SetupProgress';
import WhatsNext from '@/components/WhatsNext';
import DashboardLayout from '@/components/DashboardLayout';
import BookingDetailModal from '@/components/calendar/BookingDetailModal';
import CheckoutModal from '@/components/dashboard/CheckoutModal';
import Walkthrough from '@/components/Walkthrough';
import ErrorBoundary from '@/components/ErrorBoundary';

const UserDashboard = () => {
    const navigate = useNavigate();
    const currentHouse = useAppStore((state) => state.currentHouse);
    const { user: currentUser } = useEffectiveUser();

    // UI state
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
    const appLoading = useAppStore((state) => state.isLoading);
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [nextBooking, setNextBooking] = useState<Booking | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isOccupied, setIsOccupied] = useState(false);
    const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
    const [weather, setWeather] = useState({ temp: "--" as string | number, wind: 0, condition: "—" });
    const [finances, setFinances] = useState({ balance: 0, lastAction: "—", totalBudget: 0, actualYTD: 0 });
    const [budgetPlan, setBudgetPlan] = useState<BudgetPlan | null>(null);

    // Checkout State
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [checkoutMessage, setCheckoutMessage] = useState('');
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [_selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);
    const [showBookingDetailModal, setShowBookingDetailModal] = useState(false);
    const [justActivated, setJustActivated] = useState(false);


    useEffect(() => {
        if (currentUser && (!currentUser.house_ids || currentUser.house_ids.length === 0)) {
            navigate('/onboarding');
            return;
        }

        const unsubscribes: (() => void)[] = [];

        const setupListeners = async () => {
            if (!currentHouse || !currentUser) return;

            try {
                const now = new Date();
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const startOfYear = new Date(now.getFullYear(), 0, 1);


                // 0. Listen to the House itself (for subscription updates)
                const houseRef = doc(db, 'houses', currentHouse.id);
                unsubscribes.push(onSnapshot(houseRef, (snap) => {
                    if (snap.exists()) {
                        const newData = { id: snap.id, ...snap.data() } as House;
                        const oldStatus = currentHouse.subscription_status;
                        const newStatus = newData.subscription_status;

                        // Local state update via store
                        useAppStore.getState().setCurrentHouse(newData);

                        // Success Feedback
                        if (oldStatus === 'trial' && newStatus === 'active') {
                            setJustActivated(true);
                        }
                    }
                }));

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

                // 5. Finances (Subcollection - Optimized with Start of Year filter)
                const qFinance = query(
                    collection(db, 'houses', currentHouse.id, 'finance_entries'),
                    where('date', '>=', startOfYear),
                    orderBy('date', 'desc')
                );

                // Fetch Budget Plan for current year
                const qBudget = query(
                    collection(db, 'houses', currentHouse.id, 'budget_plans'),
                    where('year', '==', now.getFullYear()),
                    limit(1)
                );

                unsubscribes.push(onSnapshot(qBudget, (snapshot) => {
                    if (!snapshot.empty) {
                        setBudgetPlan({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as BudgetPlan);
                    } else {
                        setBudgetPlan(null);
                    }
                }));

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
                        // Entries are already sorted by DESC date in query
                        const last = entries[0];
                        const who = last.paid_by_name?.split(' ')[0] || 'Sjóðurinn';
                        const verb = last.type === 'expense' ? 'greiddi' : 'lagði inn';
                        action = `${who} ${verb} ${last.amount.toLocaleString('is-IS')} kr.`;
                    }

                    setFinances(prev => ({
                        ...prev,
                        balance: bal,
                        lastAction: action,
                        actualYTD: expense
                    }));
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

            } catch (err) {
                console.error("Setup listeners error:", err);
                setDashboardLoading(false);
            }
        };

        setupListeners();

        return () => {
            unsubscribes.forEach(u => u());
        };
    }, [currentHouse?.id, currentUser?.uid, navigate]);

    if (appLoading) {
        return (
            <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            </div>
        );
    }

    // Handle missing house (e.g., during impersonation or onboarding incomplete)
    // MOVED UP: Check this BEFORE trying to render dashboard content
    if (!currentHouse) {
        return (
            <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6">
                <div className="card max-w-md text-center">
                    <h2 className="text-2xl font-serif mb-4">Engin hús fundust</h2>
                    <p className="text-grey-dark mb-6">
                        Þessi notandi hefur ekki lokið við að setja upp hús.
                    </p>
                    <button
                        onClick={() => window.location.href = '/onboarding'}
                        className="btn btn-primary"
                    >
                        Fara í uppsetningu
                    </button>
                    <button
                        onClick={() => window.history.back()}
                        className="btn btn-ghost mt-2"
                    >
                        Til baka
                    </button>
                </div>
            </div>
        );
    }

    if (dashboardLoading) {
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

            setShowCheckoutModal(false);
            setCheckoutMessage('');
            setIsCheckedIn(false);

        } catch (error) {
            console.error('Error during checkout:', error);
        } finally {
            setCheckoutLoading(false);
        }
    };


    return (
        <DashboardLayout>
            {/* --- HERO IMAGE & STATUS --- */}
            <div className="max-w-5xl mx-auto">
                <div className="relative h-64 md:h-96 w-full overflow-hidden md:rounded-b-3xl shadow-xl shadow-stone-200/50" style={{ minHeight: '256px' }}>
                    <img
                        src={currentHouse?.image_url || "/hero_summer_house.jpg"}
                        alt={currentHouse?.name || "Cabin"}
                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-1000"
                        fetchPriority="high"
                        loading="eager"
                        decoding="async"
                        width="800"
                        height="600"
                        sizes="(max-width: 768px) 100vw, 800px"
                        srcSet={`${currentHouse?.image_url || "/hero_summer_house.jpg"}?w=400 400w, ${currentHouse?.image_url || "/hero_summer_house.jpg"}?w=800 800w`}
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
                                <span className="hidden sm:inline">Skoða myndasafn ({currentHouse.gallery_urls.length + (currentHouse.image_url ? 1 : 0)})</span>
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
            <div className="max-w-5xl mx-auto px-4 relative z-10 space-y-8 -mt-8">

                {/* SUPPORT BANNER (replaces old trial banner) */}
                {(() => {
                    // Don't show if user dismissed it
                    const dismissed = localStorage.getItem('support_banner_dismissed');
                    if (dismissed) return null;

                    return (
                        <div className="bg-gradient-to-r from-amber/10 to-amber/5 border border-amber/20 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="p-2 bg-amber/20 rounded-lg">
                                    <Coffee className="w-5 h-5 text-amber" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm md:text-base text-charcoal">Ef þér líkar við kerfið</p>
                                    <p className="text-stone-500 text-xs md:text-sm">er velkomið að styrkja þróun þess með kaffibolla ☕</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 relative z-10">
                                <a
                                    href={`https://askell.is/public/payments/170/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-amber text-charcoal px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-amber/90 transition-all shadow-sm"
                                >
                                    Styrkja
                                </a>
                                <button
                                    onClick={() => {
                                        localStorage.setItem('support_banner_dismissed', 'true');
                                        window.location.reload();
                                    }}
                                    className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-xs"
                                    title="Loka"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    );
                })()}

                {/* Service Provider Widget (Only visible for providers) */}
                <MyServiceWidget />

                {/* Setup Progress (shows if incomplete) */}
                <SetupProgress
                    house={currentHouse}
                    onShowWalkthrough={() => setShowWalkthrough(true)}
                />

                {/* What's Next nudges (shows when setup complete but actions pending) */}
                {/* Success Popup */}
                {justActivated && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none md:items-center">
                        <div className="bg-white rounded-2xl shadow-2xl border border-green-100 p-6 max-w-sm w-full animate-in slide-in-from-bottom-8 fade-in duration-500 pointer-events-auto">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                    <Sparkles className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-charcoal mb-2">Áskrift virkjuð!</h3>
                                <p className="text-stone-600 mb-6 font-medium">Bústaðurinn þinn er nú fullvirkur. Velkomin(n) til leiks!</p>
                                <button
                                    onClick={() => setJustActivated(false)}
                                    className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
                                >
                                    FRÁBÆRT
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <WhatsNext
                    house={currentHouse}
                    currentUser={currentUser}
                    bookingsCount={nextBooking ? 1 : 0}
                    membersCount={currentHouse?.owner_ids?.length || 1}
                />

                {/* Quick Actions Bar */}
                <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-100 flex p-1.5 gap-2">
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

                    {/* FINANCE SNAPSHOT */}
                    {(!currentHouse?.privacy_hide_finances ||
                        currentHouse?.manager_id === currentUser?.uid ||
                        currentHouse?.finance_viewer_ids?.includes(currentUser?.uid || '')) && (
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

                                        {budgetPlan ? (
                                            <div className="space-y-3">
                                                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                                                    <div className="flex justify-between items-end mb-2">
                                                        <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Nýting áætlunar ({budgetPlan.year})</p>
                                                        <p className="text-white text-xs font-bold">{Math.round((finances.actualYTD / (budgetPlan.items.filter(i => i.type !== 'income').reduce((sum, i) => sum + (i.frequency === 'monthly' ? i.estimated_amount * 12 : i.estimated_amount), 0) || 1)) * 100)}%</p>
                                                    </div>
                                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ${finances.actualYTD > budgetPlan.items.filter(i => i.type !== 'income').reduce((sum, i) => sum + (i.frequency === 'monthly' ? i.estimated_amount * 12 : i.estimated_amount), 0) ? 'bg-red-400' : 'bg-amber'}`}
                                                            style={{ width: `${Math.min((finances.actualYTD / (budgetPlan.items.filter(i => i.type !== 'income').reduce((sum, i) => sum + (i.frequency === 'monthly' ? i.estimated_amount * 12 : i.estimated_amount), 0) || 1)) * 100, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-4">
                                                    <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                                                        <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">Áætlun ársins</p>
                                                        <p className="text-white font-serif text-lg leading-none">
                                                            {budgetPlan.items.filter(i => i.type !== 'income').reduce((sum, i) => sum + (i.frequency === 'monthly' ? i.estimated_amount * 12 : i.estimated_amount), 0).toLocaleString('is-IS')} <span className="text-[10px] font-sans font-normal text-stone-500">kr.</span>
                                                        </p>
                                                    </div>
                                                    <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                                                        <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">Raun eyðsla</p>
                                                        <p className="text-white font-serif text-lg leading-none">
                                                            {finances.actualYTD.toLocaleString('is-IS')} <span className="text-[10px] font-sans font-normal text-stone-500">kr.</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                                                <div className="flex items-center gap-3 text-sm">
                                                    <div className={`w-2 h-2 rounded-full ${finances.lastAction.includes('Greiddi') ? 'bg-red-500' : 'bg-green-500'} shadow-[0_0_8px_rgba(239, 68, 68, 0.6)]`}></div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-stone-300 text-xs uppercase tracking-wide font-bold mb-0.5">Síðasta færsla</p>
                                                        <p className="text-white font-medium truncate">{finances.lastAction}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Empty State Overlay - Only if both balance and budget are zero/missing */}
                                    {finances.balance === 0 && finances.lastAction === "Ekkert að frétta" && !budgetPlan && (
                                        <div className="absolute inset-0 bg-charcoal/95 backdrop-blur-sm flex items-center justify-center z-20 rounded-2xl">
                                            <div className="text-center p-6">
                                                <Wallet size={32} className="mx-auto mb-3 text-amber" />
                                                <p className="text-white font-bold mb-2">Engin gögn fundust</p>
                                                <p className="text-stone-400 text-sm mb-4">Byrjaðu á að bæta við færslu eða gera áætlun</p>
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

                            <div className="relative z-10">
                                {nextBooking ? (
                                    <>
                                        <div className="flex items-start justify-between mb-6">
                                            <div>
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber/10 text-amber font-bold text-xs rounded-full uppercase tracking-wider mb-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse"></div>
                                                    {getDaysUntil(nextBooking.start)}
                                                </div>
                                                <h4 className="text-2xl font-serif font-bold text-[#1a1a1a] mb-1">
                                                    {formatBookingDates(nextBooking.start, nextBooking.end)}
                                                </h4>
                                                <p className="text-stone-500 font-medium">
                                                    {nextBooking.user_name}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 pt-4 border-t border-stone-100">
                                            <div className="text-center flex-1">
                                                <p className="text-[10px] uppercase text-stone-400 font-bold tracking-widest mb-0.5">Nætur</p>
                                                <p className="font-bold text-lg text-[#1a1a1a]">
                                                    {Math.ceil((nextBooking.end.getTime() - nextBooking.start.getTime()) / (1000 * 60 * 60 * 24))}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-8 text-center">
                                        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
                                            <Calendar size={32} />
                                        </div>
                                        <h4 className="font-bold text-lg text-stone-900 mb-2">Ekkert bókað</h4>
                                        <p className="text-stone-500 text-sm mb-6 max-w-[200px] mx-auto">
                                            Það eru engar bókanir framundan. Bústaðurinn er laus!
                                        </p>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate('/calendar'); }}
                                            className="text-amber font-bold text-sm hover:underline"
                                        >
                                            Bóka helgi núna
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* SHOPPING LIST */}
                    <section onClick={() => navigate('/settings?tab=shopping')} className="group cursor-pointer">
                        <div className="flex justify-between items-center mb-4 px-1">
                            <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">Innkaupalistinn</h3>
                            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-amber group-hover:text-white transition-colors">
                                <ChevronRight size={18} />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300 min-h-[200px]">
                            {shoppingItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-6">
                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                                        <ShoppingCart size={20} />
                                    </div>
                                    <p className="font-bold text-[#1a1a1a]">Allt til alls!</p>
                                    <p className="text-xs text-stone-500">Enginn hefur skráð vantar efni.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {shoppingItems.map(item => (
                                        <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 group/item hover:bg-amber/10 transition-colors">
                                            <div className="mt-0.5 w-5 h-5 rounded-md border-2 border-stone-300 flex items-center justify-center group-hover/item:border-amber"></div>
                                            <div>
                                                <p className="font-bold text-[#1a1a1a] text-sm leading-tight">{item.item}</p>
                                                <p className="text-[10px] text-stone-400 mt-0.5">Skráð af {item.added_by_name?.split(' ')[0]}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {shoppingItems.length >= 5 && (
                                        <p className="text-xs text-center text-stone-400 pt-2">... og fleira</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* TASKS */}
                    <section onClick={() => navigate('/tasks')} className="group cursor-pointer">
                        <div className="flex justify-between items-center mb-4 px-1">
                            <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">Verkefni</h3>
                            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-amber group-hover:text-white transition-colors">
                                <ChevronRight size={18} />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300 min-h-[200px]">
                            {tasks.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-6">
                                    <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mb-3">
                                        <CheckSquare size={20} />
                                    </div>
                                    <p className="font-bold text-[#1a1a1a]">Ekkert á listanum</p>
                                    <p className="text-xs text-stone-500">Bústaðurinn er í toppstandi!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {tasks.map(task => (
                                        <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.priority === 'high' || task.priority === 'urgent' ? 'bg-red-500' : 'bg-blue-500'
                                                }`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-[#1a1a1a] text-sm truncate">{task.title}</p>
                                                <p className="text-[10px] text-stone-500 truncate">
                                                    {task.assigned_to_names && task.assigned_to_names.length > 0
                                                        ? `Ábyrgð: ${task.assigned_to_names[0].split(' ')[0]}`
                                                        : 'Óúthlutað'}
                                                </p>
                                            </div>
                                            {task.due_date && (
                                                <span className="text-[10px] bg-white px-2 py-1 rounded-md border border-stone-200 text-stone-500 whitespace-nowrap">
                                                    {format(task.due_date, 'd. MMM', { locale: is })}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {nextBooking && (
                <ErrorBoundary fallback={
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <div className="text-center">
                                <div className="text-4xl mb-4">⚠️</div>
                                <h3 className="font-serif font-bold text-xl mb-2">Villa kom upp</h3>
                                <p className="text-stone-600 mb-4">Ekki tókst að hlaða bókunarglugga</p>
                                <button
                                    onClick={() => setShowBookingDetailModal(false)}
                                    className="btn btn-primary"
                                >
                                    Loka
                                </button>
                            </div>
                        </div>
                    </div>
                }>
                    <BookingDetailModal
                        isOpen={showBookingDetailModal}
                        onClose={() => setShowBookingDetailModal(false)}
                        booking={nextBooking}
                        currentHouse={currentHouse}
                        currentUser={currentUser}
                    />
                </ErrorBoundary>
            )}

            {showCheckoutModal && (
                <ErrorBoundary fallback={
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <div className="text-center">
                                <div className="text-4xl mb-4">⚠️</div>
                                <h3 className="font-serif font-bold text-xl mb-2">Villa kom upp</h3>
                                <p className="text-stone-600 mb-4">Ekki tókst að hlaða útskráningarglugga</p>
                                <button
                                    onClick={() => setShowCheckoutModal(false)}
                                    className="btn btn-primary"
                                >
                                    Loka
                                </button>
                            </div>
                        </div>
                    </div>
                }>
                    <CheckoutModal
                        isOpen={showCheckoutModal}
                        onClose={() => setShowCheckoutModal(false)}
                        loading={checkoutLoading}
                        onCheckout={handleCheckout}
                        message={checkoutMessage}
                        onMessageChange={setCheckoutMessage}
                    />
                </ErrorBoundary>
            )}
            {showWalkthrough && (
                <Walkthrough onClose={() => setShowWalkthrough(false)} />
            )}
        </DashboardLayout>
    );
};

export default UserDashboard;
