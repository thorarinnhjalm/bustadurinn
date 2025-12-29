
import { useState, useEffect } from 'react';
import {
    Calendar, CheckSquare, Sun, Wind,
    Plus, Users, Wallet, Bell,
    ChevronRight, Loader2, Shield
} from 'lucide-react';
import MobileNav from '@/components/MobileNav';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';
import { format } from 'date-fns';
import { is } from 'date-fns/locale';
import { collection, query, where, orderBy, limit, getDocs, Timestamp, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Booking, Task, ShoppingItem, InternalLog } from '@/types/models';
import ShoppingList from '@/components/ShoppingList';
import InternalLogbook from '@/components/InternalLogbook';
import { fetchWeather } from '@/utils/weather';

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

const UserDashboard = () => {
    const navigate = useNavigate();
    const currentHouse = useAppStore((state) => state.currentHouse);
    const { user: currentUser } = useEffectiveUser();

    // Real Data State
    const [loading, setLoading] = useState(true);
    const [nextBooking, setNextBooking] = useState<Booking | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isOccupied, setIsOccupied] = useState(false);
    const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
    const [logs, setLogs] = useState<InternalLog[]>([]);
    const [weather, setWeather] = useState({ temp: "--" as string | number, wind: 0, condition: "—" });

    // Mock Data (until backend supported)
    const finances = { balance: 0, lastAction: "—" };

    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        if (currentUser && (!currentUser.house_ids || currentUser.house_ids.length === 0)) {
            navigate('/onboarding');
            return;
        }

        const fetchData = async () => {
            if (!currentHouse) {
                return;
            }

            try {
                const now = new Date();
                const todayStart = new Date(now.setHours(0, 0, 0, 0));

                // 1. Fetch Next Booking (using top-level collection)
                const bookingsRef = collection(db, 'bookings');
                const qNext = query(
                    bookingsRef,
                    where('house_id', '==', currentHouse.id),
                    where('start', '>=', Timestamp.fromDate(todayStart)),
                    orderBy('start', 'asc'),
                    limit(1)
                );
                const bookingSnap = await getDocs(qNext);
                if (!bookingSnap.empty) {
                    const bData = bookingSnap.docs[0].data();
                    setNextBooking({
                        id: bookingSnap.docs[0].id,
                        ...bData,
                        start: bData.start.toDate(),
                        end: bData.end.toDate(),
                        created_at: bData.created_at?.toDate() || new Date()
                    } as Booking);
                }

                // 2. Check Occupancy (Current Booking)
                const qActive = query(
                    bookingsRef,
                    where('house_id', '==', currentHouse.id),
                    where('end', '>=', Timestamp.fromDate(now)),
                    orderBy('end', 'asc')
                );
                const activeSnap = await getDocs(qActive);
                const active = activeSnap.docs.find(doc => {
                    const data = doc.data();
                    return data.start.toDate() <= now && data.end.toDate() >= now;
                });
                setIsOccupied(!!active);

                // 3. Fetch Top 3 Tasks (Pending/In Progress) - using top-level collection
                const tasksRef = collection(db, 'tasks');
                const qTasks = query(
                    tasksRef,
                    where('house_id', '==', currentHouse.id),
                    where('status', 'in', ['pending', 'in_progress']),
                    orderBy('created_at', 'desc'),
                    limit(3)
                );
                const tasksSnap = await getDocs(qTasks);
                const tasksData = tasksSnap.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        ...d,
                        created_at: d.created_at?.toDate()
                    } as Task;
                });
                setTasks(tasksData);

                // 4. Fetch Shopping List Items
                const shoppingRef = collection(db, 'shopping_list');
                const qShopping = query(
                    shoppingRef,
                    where('house_id', '==', currentHouse.id),
                    orderBy('checked', 'asc'),
                    orderBy('created_at', 'desc')
                );
                const shoppingSnap = await getDocs(qShopping);
                const shoppingData = shoppingSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    created_at: doc.data().created_at?.toDate() || new Date(),
                    checked_at: doc.data().checked_at?.toDate()
                })) as ShoppingItem[];
                setShoppingItems(shoppingData);

                // 5. Fetch Recent Internal Logs
                const logsRef = collection(db, 'internal_logs');
                const qLogs = query(
                    logsRef,
                    where('house_id', '==', currentHouse.id),
                    orderBy('created_at', 'desc'),
                    limit(10)
                );
                const logsSnap = await getDocs(qLogs);
                const logsData = logsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    created_at: doc.data().created_at?.toDate() || new Date()
                })) as InternalLog[];
                setLogs(logsData);

                // 6. Fetch Weather
                if (currentHouse.location?.lat && currentHouse.location?.lng) {
                    const wData = await fetchWeather(currentHouse.location.lat, currentHouse.location.lng);
                    if (wData) {
                        setWeather({
                            temp: wData.temp,
                            wind: wData.windSpeed,
                            condition: wData.condition
                        });
                    }
                } else {
                    setWeather({ temp: "?", wind: 0, condition: "Vantar staðsetningu" });
                }

            } catch (error) {
                console.error("Dashboard data fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
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
        return `${startDay}. - ${endDay}. ${month}`;
    };

    const getDaysUntil = (date: Date) => {
        const diff = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (diff <= 0) return 'Í dag';
        if (diff === 1) return 'Á morgun';
        return `Eftir ${diff} daga`;
    };

    // Shopping List Handlers
    const handleToggleShoppingItem = async (item: ShoppingItem) => {
        if (!currentHouse || !currentUser) return;

        try {
            const newChecked = !item.checked;
            await updateDoc(doc(db, 'shopping_list', item.id), {
                checked: newChecked,
                checked_by: newChecked ? currentUser.uid : null,
                checked_by_name: newChecked ? currentUser.name : null,
                checked_at: newChecked ? serverTimestamp() : null
            });

            // Optimistic update
            setShoppingItems(prev => prev.map(i => i.id === item.id ? {
                ...i,
                checked: newChecked,
                checked_by: newChecked ? currentUser.uid : undefined,
                checked_by_name: newChecked ? currentUser.name : undefined
            } : i));
        } catch (error) {
            console.error('Error toggling shopping item:', error);
        }
    };

    const handleDeleteShoppingItem = async (item: ShoppingItem) => {
        try {
            await deleteDoc(doc(db, 'shopping_list', item.id));
            setShoppingItems(prev => prev.filter(i => i.id !== item.id));
        } catch (error) {
            console.error('Error deleting shopping item:', error);
        }
    };

    const handleAddShoppingItem = async (itemName: string) => {
        if (!currentHouse || !currentUser) return;

        try {
            const newItem = {
                house_id: currentHouse.id,
                item: itemName,
                checked: false,
                added_by: currentUser.uid,
                added_by_name: currentUser.name,
                created_at: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'shopping_list'), newItem);

            // Optimistic update
            setShoppingItems(prev => [{
                id: docRef.id,
                ...newItem,
                created_at: new Date()
            } as ShoppingItem, ...prev]);
        } catch (error) {
            console.error('Error adding shopping item:', error);
        }
    };

    // Internal Log Handlers
    const handleAddLog = async (text: string) => {
        if (!currentHouse || !currentUser) return;

        try {
            const newLog = {
                house_id: currentHouse.id,
                user_id: currentUser.uid,
                user_name: currentUser.name,
                text,
                created_at: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'internal_logs'), newLog);

            // Optimistic update
            setLogs(prev => [{
                id: docRef.id,
                ...newLog,
                created_at: new Date()
            } as InternalLog, ...prev]);
        } catch (error) {
            console.error('Error adding log:', error);
        }
    };

    // ... (rest of component)

    return (
        <div className="min-h-screen bg-[#FDFCF8] text-[#1a1a1a] font-sans pb-24 md:pb-0">

            {/* --- TOP NAVIGATION (Mobile & Desktop) --- */}
            <nav className="fixed top-0 w-full bg-[#FDFCF8]/90 backdrop-blur-md border-b border-stone-100 z-50 px-4 h-16 flex items-center justify-between max-w-5xl mx-auto left-0 right-0">
                <div className="flex items-center gap-2">
                    <div className="text-[#1a1a1a]">
                        <CabinLogo size={20} />
                    </div>
                    <span className="font-serif font-bold text-lg tracking-tight">{currentHouse.name}</span>
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
                        {/* Only show dot if we actually had notifications (commented out for now) */}
                        {/* <span className="absolute top-0 right-0 w-2 h-2 bg-[#e8b058] rounded-full"></span> */}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute top-12 right-0 w-64 bg-white border border-stone-100 rounded-xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <h4 className="font-bold text-sm mb-2 text-[#1a1a1a]">Tilkynningar</h4>
                            <div className="text-center py-4 text-stone-400 text-xs">
                                <Bell size={16} className="mx-auto mb-2 opacity-50" />
                                <p>Engar nýjar tilkynningar</p>
                            </div>
                        </div>
                    )}

                    <div
                        className="w-8 h-8 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:bg-stone-800"
                        onClick={() => navigate('/settings')}
                    >
                        {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'ME'}
                    </div>
                </div>
            </nav>

            {/* --- HERO IMAGE & STATUS --- */}
            <div className="pt-16 max-w-5xl mx-auto">
                <div className="relative h-64 md:h-80 w-full overflow-hidden md:rounded-b-3xl">
                    <img
                        src={currentHouse?.image_url || "https://images.unsplash.com/photo-1542718610-a1d656d1884c?q=80&w=2670&auto=format&fit=crop"}
                        alt={currentHouse?.name || "Cabin"}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/80 to-transparent"></div>

                    {/* Weather Widget */}
                    <div className="absolute bottom-6 left-6 text-white">
                        <div className="flex items-center gap-3 mb-1">
                            <Sun size={28} className="text-[#e8b058]" />
                            <span className="text-4xl font-serif font-bold">{weather.temp}°</span>
                        </div>
                        <div className="flex items-center gap-2 text-stone-300 text-sm">
                            <Wind size={14} /> {weather.wind} m/s • {weather.condition}
                        </div>
                    </div>

                    {/* Occupancy Status */}
                    <div className="absolute bottom-6 right-6">
                        {isOccupied ? (
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl flex items-center gap-2 text-white">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                <span className="text-xs font-bold uppercase tracking-widest">Í notkun</span>
                            </div>
                        ) : (
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl flex items-center gap-2 text-white">
                                <span className="text-xs font-bold uppercase tracking-widest text-stone-300">Laust</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <main className="max-w-5xl mx-auto px-4 -mt-6 relative z-10 space-y-6">

                {/* Action Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex justify-between gap-3">
                    <button
                        onClick={() => navigate('/calendar')}
                        className="flex-1 bg-[#1a1a1a] text-white py-3 rounded-lg font-bold text-sm hover:bg-[#333] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-stone-200"
                    >
                        <Plus size={16} /> Bóka helgi
                    </button>
                    <button className="flex-1 bg-white border border-stone-200 text-[#1a1a1a] py-3 rounded-lg font-bold text-sm hover:bg-stone-50 transition-colors">
                        Skrá komu
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* NEXT BOOKING CARD */}
                    <section onClick={() => navigate('/calendar')} className="cursor-pointer">
                        <div className="flex justify-between items-center mb-3 px-1">
                            <h3 className="font-serif text-lg font-bold text-[#1a1a1a]">Næst á dagskrá</h3>
                            <button className="text-xs font-bold text-stone-400 hover:text-[#e8b058]">Sjá allt</button>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-stone-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#e8b058]"></div>

                            {nextBooking ? (
                                <>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                                                {getDaysUntil(nextBooking.start)}
                                            </p>
                                            <h4 className="text-xl font-bold text-[#1a1a1a]">{nextBooking.user_name}</h4>
                                            <p className="text-stone-500 text-sm mt-1">
                                                {formatBookingDates(nextBooking.start, nextBooking.end)}
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center text-stone-400">
                                            <Calendar size={20} />
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-stone-100 flex gap-2">
                                        <span className="text-[10px] bg-stone-100 px-2 py-1 rounded text-stone-600 font-bold uppercase">
                                            {nextBooking.type === 'personal' ? 'Einkanot' : (nextBooking.type === 'rental' ? 'Útleiga' : 'Fjölskylda')}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-stone-400">
                                    <Calendar size={32} className="mb-2 opacity-20" />
                                    <p className="text-sm font-medium">Engar bókanir framundan</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* FINANCE SNAPSHOT */}
                    <section onClick={() => navigate('/finance')} className="cursor-pointer">
                        <div className="flex justify-between items-center mb-3 px-1">
                            <h3 className="font-serif text-lg font-bold text-[#1a1a1a]">Hússjóður</h3>
                            <button className="text-xs font-bold text-stone-400 hover:text-[#e8b058]">Yfirlit</button>
                        </div>
                        <div className="bg-[#1a1a1a] p-5 rounded-xl text-white shadow-lg shadow-stone-200 relative overflow-hidden group hover:shadow-xl transition-shadow">
                            {/* Decorative */}
                            <div className="absolute -right-4 -bottom-4 text-stone-800 opacity-20 transform group-hover:scale-110 transition-transform">
                                <Wallet size={80} />
                            </div>

                            <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-1">Staða</p>
                            <h4 className="text-3xl font-serif text-[#e8b058] mb-4">{finances.balance.toLocaleString('is-IS')} kr.</h4>

                            <div className="flex items-center gap-3 text-sm border-t border-stone-800 pt-3">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-stone-400 truncate">Síðast: {finances.lastAction}</span>
                            </div>
                        </div>
                    </section>

                    {/* TASKS */}
                    <section className="md:col-span-2">
                        <div className="flex justify-between items-center mb-3 px-1">
                            <h3 className="font-serif text-lg font-bold text-[#1a1a1a]">Verkefni</h3>
                            <button onClick={() => navigate('/tasks')} className="text-xs font-bold text-stone-400 hover:text-[#e8b058]">Bæta við</button>
                        </div>
                        <div className="bg-white rounded-xl border border-stone-100 shadow-sm divide-y divide-stone-50">
                            {tasks.length === 0 ? (
                                <div className="p-8 text-center text-stone-400">
                                    <CheckSquare size={24} className="mx-auto mb-2 opacity-50" />
                                    <p>Engin verkefni skráð</p>
                                </div>
                            ) : tasks.map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => navigate('/tasks')}
                                    className="p-4 flex items-center gap-4 hover:bg-stone-50 transition-colors cursor-pointer group"
                                >
                                    <div className={`w-5 h-5 rounded border ${task.status === 'completed' ? 'bg-[#e8b058] border-[#e8b058]' : 'border-stone-300'} flex items-center justify-center`}>
                                        {task.status === 'completed' && <CheckSquare size={12} className="text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-[#1a1a1a]">{task.title}</p>
                                        {task.assigned_to_name ? (
                                            <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-1"><Users size={10} /> {task.assigned_to_name}</p>
                                        ) : (
                                            <p className="text-xs text-[#e8b058] mt-0.5 group-hover:underline">+ Taka að sér</p>
                                        )}
                                    </div>
                                    <ChevronRight size={16} className="text-stone-300" />
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            </main>

            {/* ROW 2: Shopping List & Logbook */}
            <div className="max-w-5xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* SHOPPING LIST */}
                    <section>
                        <div className="flex justify-between items-center mb-3 px-1">
                            <h3 className="font-serif text-lg font-bold text-[#1a1a1a]">Vantar</h3>
                        </div>
                        <ShoppingList
                            items={shoppingItems}
                            onToggle={handleToggleShoppingItem}
                            onDelete={handleDeleteShoppingItem}
                            onAdd={handleAddShoppingItem}

                        />
                    </section>

                    {/* INTERNAL LOGBOOK */}
                    <section>
                        <div className="flex justify-between items-center mb-3 px-1">
                            <h3 className="font-serif text-lg font-bold text-[#1a1a1a]">Gestapósturinn</h3>
                        </div>
                        <InternalLogbook
                            logs={logs}
                            currentUserName={currentUser?.name || ''}
                            onAddLog={handleAddLog}
                        />
                    </section>

                </div>
            </div>

            {/* --- MOBILE BOTTOM NAV --- */}
            <MobileNav />

        </div>
    );
};
export default UserDashboard;
