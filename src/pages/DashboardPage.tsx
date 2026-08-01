
import { useState, useEffect } from 'react';
import {
    Calendar, Sun,
    Plus, Wallet,
    ChevronRight, Loader2, Shield,
    Home, LogOut,
    Image as ImageIcon, MapPin, Camera,
    ShoppingCart, CheckSquare, Coffee, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';
import { format } from 'date-fns';
import { is } from 'date-fns/locale';
import { collection, query, where, orderBy, limit, addDoc, getDocs, onSnapshot, serverTimestamp, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Booking, Task, ShoppingItem, InternalLog, LedgerEntry, House, BudgetPlan, InventoryItem } from '@/types/models';
import { fetchWeather } from '@/utils/weather';
import { shouldShowWeather } from '@/services/weatherService';
import MyServiceWidget from '@/components/dashboard/MyServiceWidget';
import PushOptInPrompt from '@/components/dashboard/PushOptInPrompt';
import BookingWeatherCard from '@/components/BookingWeatherCard';
import SetupProgress from '@/components/SetupProgress';
import WhatsNext from '@/components/WhatsNext';
import DashboardLayout from '@/components/DashboardLayout';
import BookingDetailModal from '@/components/calendar/BookingDetailModal';
import CheckoutModal from '@/components/dashboard/CheckoutModal';
import CheckInModal from '@/components/dashboard/CheckInModal';
import SeasonalChecklistCard from '@/components/dashboard/SeasonalChecklistCard';
import GasCylinderCard from '@/components/dashboard/GasCylinderCard';
import InventoryCard from '@/components/dashboard/InventoryCard';
import Walkthrough from '@/components/Walkthrough';
import ErrorBoundary from '@/components/ErrorBoundary';

// InternalLog does not (yet) declare a structured `kind` field in src/types/models.ts.
// We add it locally here rather than editing the shared model file (owned by another
// concurrent change). Older logs in production predate this field, hence optional.
// `checklist` is populated on check_out/check_in logs when the house has a configured
// checkout/arrival checklist, and on the once-a-year seasonal logs — keyed by item label.
type CheckInOutLog = InternalLog & {
    kind?: 'check_in' | 'check_out' | 'seasonal_spring' | 'seasonal_autumn';
    checklist?: Record<string, boolean>;
};

interface LastCheckoutChecklist {
    allChecked: boolean;
    uncheckedItems: string[];
}

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
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [weather, setWeather] = useState({ temp: "--" as string | number, wind: 0, condition: "—" });
    const [finances, setFinances] = useState({ balance: 0, lastAction: "—", totalBudget: 0, actualYTD: 0 });
    const [budgetPlan, setBudgetPlan] = useState<BudgetPlan | null>(null);

    // Checkout State
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [checkoutMessage, setCheckoutMessage] = useState('');
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [lastCheckoutChecklist, setLastCheckoutChecklist] = useState<LastCheckoutChecklist | null>(null);

    // Check-in State
    const [showCheckInModal, setShowCheckInModal] = useState(false);
    const [checkInLoading, setCheckInLoading] = useState(false);

    // Seasonal checklist state: whether a seasonal_spring/seasonal_autumn log
    // already exists for the current calendar year (derived from the same
    // internal_logs listener used for check-in/out status, see setup below).
    const [seasonalLogged, setSeasonalLogged] = useState({ spring: false, autumn: false });
    const [_selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);
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
                const now = new Date();
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const startOfYear = new Date(now.getFullYear(), 0, 1);


                // 0. Listen to the House itself (for subscription updates)
                const houseRef = doc(db, 'houses', currentHouse.id);
                unsubscribes.push(onSnapshot(houseRef, (snap) => {
                    if (snap.exists()) {
                        const newData = { id: snap.id, ...snap.data() } as House;
                        useAppStore.getState().setCurrentHouse(newData);
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
                // Limit raised from 5 to 30 so this same listener can also answer
                // "has a seasonal checklist already been logged this year?" for
                // SeasonalChecklistCard (that only happens twice a year, but a
                // busy house's check-in/check-out traffic could otherwise push
                // it out of a tighter window) without standing up a second
                // onSnapshot subscription just for that.
                const qLogs = query(
                    collection(db, 'houses', currentHouse.id, 'internal_logs'),
                    orderBy('created_at', 'desc'),
                    limit(30)
                );
                unsubscribes.push(onSnapshot(qLogs, (snapshot) => {
                    const logsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        created_at: doc.data().created_at?.toDate()
                    })) as CheckInOutLog[];

                    // Check check-in status
                    if (currentUser?.uid) {
                        const userLogs = logsData.filter(log => log.user_id === currentUser.uid);
                        if (userLogs.length > 0) {
                            const last = userLogs[0];
                            // Prefer the structured field; fall back to string-matching
                            // Icelandic log text for older logs written before `kind` existed.
                            if (last.kind === 'check_in') setIsCheckedIn(true);
                            else if (last.kind === 'check_out') setIsCheckedIn(false);
                            else if (last.text.includes('skráði komu')) setIsCheckedIn(true);
                            else if (last.text.includes('skráði brottför')) setIsCheckedIn(false);
                        }
                    }

                    // Last checkout checklist state (any user, not just the current
                    // user) — shown to whoever arrives next. `logsData` is already
                    // ordered desc by created_at, so the first check_out log found
                    // is the most recent one overall.
                    const lastCheckoutLog = logsData.find(log => log.kind === 'check_out');
                    if (lastCheckoutLog?.checklist && Object.keys(lastCheckoutLog.checklist).length > 0) {
                        const entries = Object.entries(lastCheckoutLog.checklist);
                        const uncheckedItems = entries.filter(([, checked]) => !checked).map(([item]) => item);
                        setLastCheckoutChecklist({ allChecked: uncheckedItems.length === 0, uncheckedItems });
                    } else {
                        setLastCheckoutChecklist(null);
                    }

                    // Seasonal checklist status: has a seasonal_spring/seasonal_autumn
                    // log already been written this calendar year?
                    const currentYear = new Date().getFullYear();
                    const springLogged = logsData.some(
                        log => log.kind === 'seasonal_spring' && log.created_at?.getFullYear() === currentYear
                    );
                    const autumnLogged = logsData.some(
                        log => log.kind === 'seasonal_autumn' && log.created_at?.getFullYear() === currentYear
                    );
                    setSeasonalLogged({ spring: springLogged, autumn: autumnLogged });
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

                // 6. Inventory Subcollection ("Hvað er til")
                const qInventory = query(
                    collection(db, 'houses', currentHouse.id, 'inventory')
                );
                unsubscribes.push(onSnapshot(qInventory, (snapshot) => {
                    const items = snapshot.docs.map(docSnap => ({
                        id: docSnap.id,
                        ...docSnap.data(),
                        created_at: docSnap.data().created_at?.toDate(),
                        updated_at: docSnap.data().updated_at?.toDate()
                    })) as InventoryItem[];
                    setInventoryItems(items);
                }, (error) => console.error("Inventory listener error:", error)));

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

    const handleCheckout = async (checklist: Record<string, boolean>, suppliesOut: string[]) => {
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

            // 2. Add any "Á þrotum" supplies to the shopping list, skipping
            // items that already have a matching unchecked entry (case-
            // insensitive match, queried fresh here rather than reused from
            // the dashboard's own listener since that one is limited/sorted
            // for display purposes only).
            let addedSuppliesCount = 0;
            if (suppliesOut.length > 0) {
                const qUnchecked = query(
                    collection(db, 'houses', currentHouse.id, 'shopping_list'),
                    where('checked', '==', false)
                );
                const existingSnapshot = await getDocs(qUnchecked);
                const existingNames = new Set(
                    existingSnapshot.docs.map(d => String(d.data().item || '').trim().toLowerCase())
                );
                for (const item of suppliesOut) {
                    if (existingNames.has(item.trim().toLowerCase())) continue;
                    await addDoc(collection(db, 'houses', currentHouse.id, 'shopping_list'), {
                        house_id: currentHouse.id,
                        item,
                        checked: false,
                        created_at: serverTimestamp(),
                        added_by: currentUser.uid,
                        added_by_name: currentUser.name
                    });
                    addedSuppliesCount++;
                }

                // Sync status with inventory subcollection
                const qInv = query(collection(db, 'houses', currentHouse.id, 'inventory'));
                const invSnapshot = await getDocs(qInv);
                for (const docSnap of invSnapshot.docs) {
                    const data = docSnap.data();
                    if (suppliesOut.includes(data.name)) {
                        await updateDoc(doc(db, 'houses', currentHouse.id, 'inventory', docSnap.id), {
                            status: 'out',
                            updated_at: serverTimestamp(),
                            updated_by: currentUser.uid,
                            updated_by_name: currentUser.name
                        });
                    }
                }
            }

            // 3. Log Internal Check-out
            let text = `${currentUser.name} skráði brottför`;
            text += addedSuppliesCount > 0
                ? ` og skráði ${addedSuppliesCount} vörur á innkaupalistann.`
                : '.';
            const hasChecklist = !!currentHouse.checkout_checklist && currentHouse.checkout_checklist.length > 0;
            const newLog: Record<string, unknown> = {
                house_id: currentHouse.id,
                user_id: currentUser.uid,
                user_name: currentUser.name,
                text,
                kind: 'check_out' as const,
                created_at: serverTimestamp()
            };
            if (hasChecklist) {
                newLog.checklist = checklist;
            }
            await addDoc(collection(db, 'houses', currentHouse.id, 'internal_logs'), newLog);

            setShowCheckoutModal(false);
            setCheckoutMessage('');
            setIsCheckedIn(false);

        } catch (error) {
            console.error('Error during checkout:', error);
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handleCheckIn = async (checklist: Record<string, boolean>) => {
        if (!currentHouse || !currentUser) return;
        setCheckInLoading(true);
        try {
            const text = `${currentUser.name} skráði komu sína.`;
            const hasChecklist = !!currentHouse.arrival_checklist && currentHouse.arrival_checklist.length > 0;
            const newLog: Record<string, unknown> = {
                house_id: currentHouse.id,
                user_id: currentUser.uid,
                user_name: currentUser.name,
                text,
                kind: 'check_in' as const,
                created_at: serverTimestamp()
            };
            if (hasChecklist) {
                newLog.checklist = checklist;
            }
            await addDoc(collection(db, 'houses', currentHouse.id, 'internal_logs'), newLog);

            setShowCheckInModal(false);
            setIsCheckedIn(true);
        } catch (error) {
            console.error('Error during check-in:', error);
        } finally {
            setCheckInLoading(false);
        }
    };

    const handleSeasonalChecklistConfirm = async (season: 'spring' | 'autumn', checklist: Record<string, boolean>) => {
        if (!currentHouse || !currentUser) return;
        const kind = season === 'spring' ? 'seasonal_spring' as const : 'seasonal_autumn' as const;
        const label = season === 'spring' ? 'vor-opnun' : 'vetrarfrágang';
        const text = `${currentUser.name} skráði ${label} bústaðarins.`;
        try {
            await addDoc(collection(db, 'houses', currentHouse.id, 'internal_logs'), {
                house_id: currentHouse.id,
                user_id: currentUser.uid,
                user_name: currentUser.name,
                text,
                kind,
                checklist,
                created_at: serverTimestamp()
            });
        } catch (error) {
            console.error('Error logging seasonal checklist:', error);
            throw error;
        }
    };

    // Stamps the replacement on the house doc and drops a log line, so the
    // "who last changed it" question has an answer beyond the current value.
    const handleGasCylinderChanged = async () => {
        if (!currentHouse?.gas_cylinder || !currentUser) return;
        try {
            await updateDoc(doc(db, 'houses', currentHouse.id), {
                gas_cylinder: {
                    ...currentHouse.gas_cylinder,
                    last_changed_at: new Date(),
                    last_changed_by: currentUser.uid,
                    last_changed_by_name: currentUser.name
                },
                updated_at: new Date()
            });

            await addDoc(collection(db, 'houses', currentHouse.id, 'internal_logs'), {
                house_id: currentHouse.id,
                user_id: currentUser.uid,
                user_name: currentUser.name,
                text: `${currentUser.name} skipti um gaskút.`,
                kind: 'gas_cylinder_changed',
                created_at: serverTimestamp()
            });
        } catch (error) {
            console.error('Error recording gas cylinder change:', error);
        }
    };

    const handleInitializeInventory = async () => {
        if (!currentHouse || !currentUser) return;
        try {
            const batch = writeBatch(db);
            const inventoryColRef = collection(db, 'houses', currentHouse.id, 'inventory');
            const hasLegacy = currentHouse.supply_checklist && currentHouse.supply_checklist.length > 0;

            if (hasLegacy && currentHouse.supply_checklist) {
                currentHouse.supply_checklist.forEach((item: string) => {
                    const docRef = doc(inventoryColRef);
                    const isCleaning = [
                        'uppþvottalögur', 'klósettpappír', 'eldhúsrúllur', 
                        'álpappír', 'bökunarpappír', 'kerti', 'sápa', 'tuska',
                        'tuskur', 'svampur', 'svampar', 'ruslapokar', 'ruslapoki'
                    ].some(keyword => item.toLowerCase().includes(keyword));

                    const isOut = currentHouse.supplies_out?.includes(item);

                    batch.set(docRef, {
                        house_id: currentHouse.id,
                        name: item,
                        category: isCleaning ? 'cleaning' : 'pantry',
                        status: isOut ? 'out' : 'ok',
                        quantity: '',
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp(),
                        updated_by: currentUser.uid,
                        updated_by_name: currentUser.name
                    });
                });

                const kitchenItems = [
                    { name: 'Diskar', quantity: '12 stk' },
                    { name: 'Glös', quantity: '12 stk' },
                    { name: 'Bollar', quantity: '12 stk' },
                    { name: 'Hnífapör', quantity: '12 pör' }
                ];
                const beddingItems = [
                    { name: 'Sængur', quantity: '6 stk' },
                    { name: 'Koddar', quantity: '6 stk' }
                ];

                kitchenItems.forEach((item) => {
                    const docRef = doc(inventoryColRef);
                    batch.set(docRef, {
                        house_id: currentHouse.id,
                        name: item.name,
                        category: 'kitchen',
                        status: 'ok',
                        quantity: item.quantity,
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp(),
                        updated_by: currentUser.uid,
                        updated_by_name: currentUser.name
                    });
                });

                beddingItems.forEach((item) => {
                    const docRef = doc(inventoryColRef);
                    batch.set(docRef, {
                        house_id: currentHouse.id,
                        name: item.name,
                        category: 'bedding',
                        status: 'ok',
                        quantity: item.quantity,
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp(),
                        updated_by: currentUser.uid,
                        updated_by_name: currentUser.name
                    });
                });
            } else {
                const pantryItems = [
                    'Salt', 'Pipar', 'Grillkrydd', 'Oregano', 'Ólífuolía',
                    'Matarolía', 'Sykur', 'Kaffi'
                ];
                const cleaningItems = [
                    'Uppþvottalögur', 'Klósettpappír', 'Eldhúsrúllur', 
                    'Álpappír', 'Bökunarpappír', 'Kerti'
                ];
                const kitchenItems = [
                    { name: 'Diskar', quantity: '12 stk' },
                    { name: 'Glös', quantity: '12 stk' },
                    { name: 'Bollar', quantity: '12 stk' },
                    { name: 'Hnífapör', quantity: '12 pör' }
                ];
                const beddingItems = [
                    { name: 'Sængur', quantity: '6 stk' },
                    { name: 'Koddar', quantity: '6 stk' }
                ];

                pantryItems.forEach((item) => {
                    const docRef = doc(inventoryColRef);
                    batch.set(docRef, {
                        house_id: currentHouse.id,
                        name: item,
                        category: 'pantry',
                        status: 'ok',
                        quantity: '',
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp(),
                        updated_by: currentUser.uid,
                        updated_by_name: currentUser.name
                    });
                });

                cleaningItems.forEach((item) => {
                    const docRef = doc(inventoryColRef);
                    batch.set(docRef, {
                        house_id: currentHouse.id,
                        name: item,
                        category: 'cleaning',
                        status: 'ok',
                        quantity: '',
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp(),
                        updated_by: currentUser.uid,
                        updated_by_name: currentUser.name
                    });
                });

                kitchenItems.forEach((item) => {
                    const docRef = doc(inventoryColRef);
                    batch.set(docRef, {
                        house_id: currentHouse.id,
                        name: item.name,
                        category: 'kitchen',
                        status: 'ok',
                        quantity: item.quantity,
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp(),
                        updated_by: currentUser.uid,
                        updated_by_name: currentUser.name
                    });
                });

                beddingItems.forEach((item) => {
                    const docRef = doc(inventoryColRef);
                    batch.set(docRef, {
                        house_id: currentHouse.id,
                        name: item.name,
                        category: 'bedding',
                        status: 'ok',
                        quantity: item.quantity,
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp(),
                        updated_by: currentUser.uid,
                        updated_by_name: currentUser.name
                    });
                });
            }

            await batch.commit();

            // Clear legacy supply_checklist from house doc
            await updateDoc(doc(db, 'houses', currentHouse.id), {
                supply_checklist: [],
                supplies_out: []
            });
        } catch (error) {
            console.error('Error initializing inventory:', error);
        }
    };

    const handleCheckShoppingItem = async (e: React.MouseEvent, item: ShoppingItem) => {
        e.stopPropagation();
        if (!currentHouse) return;
        try {
            await updateDoc(doc(db, 'houses', currentHouse.id, 'shopping_list', item.id), {
                checked: true,
                checked_by: currentUser?.uid,
                checked_at: serverTimestamp()
            });

            // Bi-directional sync with inventory subcollection
            if (item.item) {
                const qInv = query(collection(db, 'houses', currentHouse.id, 'inventory'));
                const invSnap = await getDocs(qInv);
                for (const docSnap of invSnap.docs) {
                    const invData = docSnap.data();
                    if (invData.name?.trim().toLowerCase() === item.item.trim().toLowerCase() && invData.status === 'out') {
                        await updateDoc(doc(db, 'houses', currentHouse.id, 'inventory', docSnap.id), {
                            status: 'ok',
                            updated_at: serverTimestamp(),
                            updated_by: currentUser?.uid || '',
                            updated_by_name: currentUser?.name || ''
                        });
                    }
                }
            }
        } catch (err) {
            console.error("Error checking shopping item on dashboard:", err);
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
            <div className="max-w-5xl mx-auto px-4 relative z-10 space-y-8 -mt-8 pt-10">

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

                {/* Push notification opt-in nudge (booking + weather alerts) */}
                <PushOptInPrompt currentUser={currentUser} />

                {/* Service Provider Widget (Only visible for providers) */}
                <MyServiceWidget />

                {/* Setup Progress (shows if incomplete) */}
                <SetupProgress
                    house={currentHouse}
                    onShowWalkthrough={() => setShowWalkthrough(true)}
                />

                {/* What's Next nudges (shows when setup complete but actions pending) */}
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
                                return;
                            }

                            // Use the richer CheckInModal when the house has configured
                            // an arrival checklist; otherwise fall back to the plain
                            // confirm dialog that existed before that feature.
                            const hasArrivalChecklist = !!currentHouse.arrival_checklist && currentHouse.arrival_checklist.length > 0;
                            if (hasArrivalChecklist) {
                                setShowCheckInModal(true);
                                return;
                            }

                            const confirmCheckIn = window.confirm("Viltu skrá komu þína í gestabókina?");
                            if (!confirmCheckIn) return;
                            try {
                                const text = `${currentUser.name} skráði komu sína.`;
                                const newLog = {
                                    house_id: currentHouse.id,
                                    user_id: currentUser.uid,
                                    user_name: currentUser.name,
                                    text,
                                    kind: 'check_in' as const,
                                    created_at: serverTimestamp()
                                };
                                await addDoc(collection(db, 'houses', currentHouse.id, 'internal_logs'), newLog);
                                setIsCheckedIn(true);
                            } catch (error) {
                                console.error('Error logging check-in:', error);
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

                {/* Seasonal checklist nudge (spring-opening / winter-closing) */}
                <SeasonalChecklistCard
                    house={currentHouse}
                    seasonalLogged={seasonalLogged}
                    onConfirm={handleSeasonalChecklistConfirm}
                />

                {/* Gas cylinder — renders only when configured in settings */}
                <GasCylinderCard
                    gasCylinder={currentHouse.gas_cylinder}
                    onRecordChange={handleGasCylinderChanged}
                />

                {/* Last Checkout Checklist Strip */}
                {lastCheckoutChecklist && (
                    lastCheckoutChecklist.allChecked ? (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl text-xs font-medium">
                            Síðasta brottför: allt staðfest ✓
                        </div>
                    ) : (
                        <div className="bg-amber/10 border border-amber/20 text-amber-900 px-4 py-2.5 rounded-xl text-xs font-medium">
                            Ekki staðfest við síðustu brottför: {lastCheckoutChecklist.uncheckedItems.join(', ')}
                        </div>
                    )
                )}

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
                                            <div 
                                                onClick={(e) => handleCheckShoppingItem(e, item)} 
                                                className="mt-0.5 w-5 h-5 rounded-md border-2 border-stone-300 flex items-center justify-center cursor-pointer hover:border-amber hover:bg-amber/20 transition-colors shrink-0"
                                                title="Merkja sem keypt"
                                            >
                                                <Check size={14} className="text-amber hidden group-hover/item:block" />
                                            </div>
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

                    {/* HVAÐ ER TIL (INVENTORY & EQUIPMENT) */}
                    <InventoryCard
                        houseId={currentHouse.id}
                        currentUserId={currentUser?.uid || ''}
                        currentUserName={currentUser?.name || currentUser?.email || ''}
                        inventoryItems={inventoryItems}
                        onInitialize={handleInitializeInventory}
                    />

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

                {/* WEATHER FORECAST (only when a booking is coming up within the next 7 days) */}
                {nextBooking && currentHouse?.location?.lat && currentHouse?.location?.lng && shouldShowWeather(nextBooking.start) && (
                    <ErrorBoundary fallback={<></>}>
                        <BookingWeatherCard
                            bookingId={nextBooking.id}
                            startDate={nextBooking.start}
                            endDate={nextBooking.end}
                            houseLatitude={currentHouse.location.lat}
                            houseLongitude={currentHouse.location.lng}
                            houseName={currentHouse.name}
                        />
                    </ErrorBoundary>
                )}
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
                        checklist={currentHouse?.checkout_checklist}
                        supplyChecklist={
                            inventoryItems.length > 0
                                ? inventoryItems.filter(i => i.category === 'pantry' || i.category === 'cleaning').map(i => i.name)
                                : currentHouse?.supply_checklist
                        }
                    />
                </ErrorBoundary>
            )}
            {showCheckInModal && (
                <ErrorBoundary fallback={
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <div className="text-center">
                                <div className="text-4xl mb-4">⚠️</div>
                                <h3 className="font-serif font-bold text-xl mb-2">Villa kom upp</h3>
                                <p className="text-stone-600 mb-4">Ekki tókst að hlaða innskráningarglugga</p>
                                <button
                                    onClick={() => setShowCheckInModal(false)}
                                    className="btn btn-primary"
                                >
                                    Loka
                                </button>
                            </div>
                        </div>
                    </div>
                }>
                    <CheckInModal
                        isOpen={showCheckInModal}
                        onClose={() => setShowCheckInModal(false)}
                        loading={checkInLoading}
                        onCheckIn={handleCheckIn}
                        checklist={currentHouse?.arrival_checklist}
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
