/**
 * Public Sandbox - Interactive Mock
 * Enhanced demo with persistence, guided tour, and full feature showcase
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, differenceInDays } from 'date-fns';
import { is } from 'date-fns/locale';
import {
    Calendar, DollarSign, CheckSquare, Settings,
    Menu, User as UserIcon, Plus, Users,
    Home, Cloud, ShoppingBag, X, Sparkles
} from 'lucide-react';
import { driver } from 'driver.js';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'driver.js/dist/driver.css';
import SEO from '@/components/SEO';

// Utils and mock data
import {
    INITIAL_BOOKINGS,
    INITIAL_FINANCE,
    INITIAL_TASKS,
    INITIAL_SHOPPING,
    MOCK_MEMBERS,
    type MockBooking,
    type MockFinanceEntry,
    type MockTask,
    type MockShoppingItem
} from '@/utils/sandboxMockData';
import {
    loadSandboxState,
    saveSandboxState,
    clearSandboxState,
    markTourAsSeen
} from '@/utils/sandboxStorage';

// Setup Calendar Localizer
const locales = { 'is': is };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
});

// --- Dashboard Component ---
const SandboxDashboard = ({
    bookings,
    tasks,
    financeEntries
}: {
    bookings: MockBooking[],
    tasks: MockTask[],
    financeEntries: MockFinanceEntry[]
}) => {
    // Calculate stats
    const upcomingBookings = bookings
        .filter(b => b.start > new Date())
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .slice(0, 3);

    const nextBooking = upcomingBookings[0];
    const pendingTasks = tasks.filter(t => t.status !== 'done');
    const balance = financeEntries.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-charcoal">Góðan daginn! 👋</h2>
                    <p className="text-grey-mid mt-1">Yfirlit yfir sumarbústaðinn þinn</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-xl shadow-stone-200/50 border border-stone-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-amber/10 rounded-full flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-amber" />
                        </div>
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium">
                            {upcomingBookings.length} komandi
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-charcoal mb-1">{bookings.length}</h3>
                    <p className="text-sm text-grey-mid">Bókanir samtals</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-xl shadow-stone-200/50 border border-stone-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${balance >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                            }`}>
                            {balance >= 0 ? 'Jákvæð' : 'Neikvæð'}
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-charcoal mb-1">
                        {balance.toLocaleString('is-IS')} kr
                    </h3>
                    <p className="text-sm text-grey-mid">Staða sjóðs</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-xl shadow-stone-200/50 border border-stone-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-amber/10 rounded-full flex items-center justify-center">
                            <CheckSquare className="w-6 h-6 text-amber" />
                        </div>
                        <span className="text-xs bg-amber/10 text-amber px-2 py-1 rounded font-medium">
                            {pendingTasks.length} eftir
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-charcoal mb-1">{tasks.length}</h3>
                    <p className="text-sm text-grey-mid">Verkefni samtals</p>
                </div>
            </div>

            {/* Next Booking Card */}
            {nextBooking && (
                <div className="bg-gradient-to-br from-amber/5 to-amber/10 border border-amber/20 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-xs font-bold text-amber uppercase tracking-wider mb-2">Næsta bókun</p>
                            <h3 className="text-2xl font-serif font-bold text-charcoal">{nextBooking.userName}</h3>
                            <p className="text-grey-mid mt-1">
                                {format(nextBooking.start, 'd. MMM', { locale: is })} - {format(nextBooking.end, 'd. MMM yyyy', { locale: is })}
                            </p>
                        </div>
                        <span className="bg-white/80 px-3 py-1 rounded-full text-sm font-medium text-charcoal">
                            Eftir {differenceInDays(nextBooking.start, new Date())} daga
                        </span>
                    </div>
                    {nextBooking.notes && (
                        <p className="text-sm text-grey-dark italic">"{nextBooking.notes}"</p>
                    )}
                </div>
            )}

            {/* Mock Weather Widget */}
            <div className="bg-white rounded-xl shadow-xl shadow-stone-200/50 border border-stone-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-serif font-bold">Veður við sumarbústaðinn</h3>
                    <Cloud className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-5xl font-bold text-charcoal">12°C</div>
                    <div>
                        <p className="font-medium text-charcoal">Heiðskírt</p>
                        <p className="text-sm text-grey-mid">Vindur 5 m/s</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Calendar Component ---
const SandboxCalendar = ({
    bookings,
    setBookings,
    onDataChange
}: {
    bookings: MockBooking[],
    setBookings: (b: MockBooking[]) => void,
    onDataChange: () => void
}) => {
    const [view, setView] = useState<any>('month');
    const [date, setDate] = useState(new Date());

    const handleSelectSlot = ({ start, end }: any) => {
        const title = prompt('Nafn bókunar:');
        if (title) {
            const newBooking: MockBooking = {
                id: Date.now().toString(),
                title,
                userName: title,
                start,
                end,
                type: title.toLowerCase().includes('leiga') ? 'rental' : 'personal',
                notes: ''
            };
            setBookings([...bookings, newBooking]);
            onDataChange();
        }
    };

    return (
        <div className="h-full flex flex-col" id="sandbox-calendar">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif font-bold text-charcoal">Bókunardagatal</h2>
                <button
                    onClick={() => handleSelectSlot({ start: new Date(), end: addDays(new Date(), 2) })}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus size={16} />
                    Ný bókun
                </button>
            </div>

            <div className="flex-1 bg-white p-6 rounded-xl shadow-xl shadow-stone-200/50 border border-stone-200 min-h-[600px]">
                <BigCalendar
                    localizer={localizer}
                    events={bookings}
                    startAccessor="start"
                    endAccessor="end"
                    titleAccessor="userName"
                    style={{ height: '100%' }}
                    views={['month', 'week', 'agenda']}
                    view={view}
                    onView={setView}
                    date={date}
                    onNavigate={setDate}
                    culture="is"
                    selectable
                    onSelectSlot={handleSelectSlot}
                    messages={{
                        next: "Áfram",
                        previous: "Til baka",
                        today: "Í dag",
                        month: "Mánuður",
                        week: "Vika",
                        day: "Dagur",
                        agenda: "Listi"
                    }}
                    eventPropGetter={(event: any) => ({
                        style: {
                            backgroundColor: event.type === 'rental' ? '#10b981' :
                                event.type === 'maintenance' ? '#ef4444' : '#e8b058',
                            borderRadius: '6px',
                            color: 'white',
                            border: '0px',
                            display: 'block',
                            padding: '4px 8px'
                        }
                    })}
                />
            </div>
        </div>
    );
};

// --- Finance Component ---
const SandboxFinance = ({
    entries,
    setEntries,
    onDataChange
}: {
    entries: MockFinanceEntry[],
    setEntries: (e: MockFinanceEntry[]) => void,
    onDataChange: () => void
}) => {
    const balance = entries.reduce((acc, curr) => acc + curr.amount, 0);

    const handleAdd = () => {
        const desc = prompt('Skýring færslu:');
        const amountStr = prompt('Upphæð (neikvæð fyrir útgjöld):');
        if (desc && amountStr) {
            setEntries([{
                id: Date.now().toString(),
                date: new Date().toISOString().split('T')[0],
                description: desc,
                amount: parseInt(amountStr),
                type: parseInt(amountStr) > 0 ? 'income' : 'expense',
                category: 'General'
            }, ...entries]);
            onDataChange();
        }
    };

    return (
        <div className="max-w-4xl mx-auto" id="sandbox-finance">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-serif font-bold text-charcoal">Fjármál</h2>
                <button onClick={handleAdd} className="btn btn-primary">Skrá færslu</button>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-charcoal text-white p-6 rounded-xl shadow-lg col-span-2">
                    <p className="text-stone-400 text-sm font-medium mb-2 uppercase tracking-wide">Staða sjóðs</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-4xl font-mono font-bold tracking-tight">
                            {balance.toLocaleString('is-IS')}
                        </h3>
                        <span className="text-stone-400">kr.</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-xl shadow-stone-200/50 border border-stone-200 flex flex-col justify-center">
                    <p className="text-sm text-grey-mid">Tekjur (Jan)</p>
                    <p className="text-xl font-bold text-green-600">+150.000 kr.</p>
                    <div className="h-4"></div>
                    <p className="text-sm text-grey-mid">Gjöld (Jan)</p>
                    <p className="text-xl font-bold text-red-500">-54.390 kr.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-xl shadow-stone-200/50 border border-stone-200 overflow-hidden">
                <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                    <h3 className="font-semibold text-charcoal">Færsluyfirlit</h3>
                </div>
                <div className="divide-y divide-stone-100 max-h-[500px] overflow-y-auto">
                    {entries.map(entry => (
                        <div key={entry.id} className="p-4 hover:bg-stone-50 transition-colors flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${entry.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-500'
                                    }`}>
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-charcoal">{entry.description}</p>
                                    <p className="text-xs text-stone-500">{entry.date} • {entry.category}</p>
                                </div>
                            </div>
                            <span className={`font-mono font-medium ${entry.type === 'income' ? 'text-green-600' : 'text-charcoal'
                                }`}>
                                {entry.amount > 0 ? '+' : ''}{entry.amount.toLocaleString('is-IS')} kr
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Tasks Component ---
const SandboxTasks = ({
    tasks,
    setTasks,
    onDataChange
}: {
    tasks: MockTask[],
    setTasks: (t: MockTask[]) => void,
    onDataChange: () => void
}) => {
    const toggleTask = (id: string) => {
        setTasks(tasks.map(t =>
            t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t
        ));
        onDataChange();
    };

    return (
        <div className="max-w-3xl mx-auto" id="sandbox-tasks">
            <h2 className="text-2xl font-serif font-bold text-charcoal mb-6">Verkefni & Viðhald</h2>

            <div className="bg-white rounded-xl shadow-xl shadow-stone-200/50 border border-stone-200 overflow-hidden">
                <div className="p-4 bg-stone-50 border-b border-stone-200 flex justify-between">
                    <h3 className="font-semibold">Verkefnalisti</h3>
                    <span className="text-sm text-stone-500">{tasks.filter(t => t.status !== 'done').length} ólokið</span>
                </div>
                <div className="divide-y divide-stone-100">
                    {tasks.map(task => (
                        <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-stone-50 cursor-pointer" onClick={() => toggleTask(task.id)}>
                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-stone-300'
                                }`}>
                                {task.status === 'done' && <CheckSquare className="w-4 h-4 text-white" />}
                            </div>
                            <div className="flex-1">
                                <p className={`font-medium ${task.status === 'done' ? 'line-through text-stone-400' : 'text-charcoal'}`}>
                                    {task.title}
                                </p>
                                {task.assignee && (
                                    <p className="text-xs text-stone-500 mt-0.5">Ábyrgð: {task.assignee}</p>
                                )}
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${task.status === 'done' ? 'bg-green-100 text-green-700' :
                                task.status === 'in_progress' ? 'bg-amber/10 text-amber-dark' :
                                    'bg-stone-100 text-stone-600'
                                }`}>
                                {task.status === 'done' ? 'Lokið' : task.status === 'in_progress' ? 'Í vinnslu' : 'Óunnið'}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-stone-50 border-t border-stone-200">
                    <button
                        onClick={() => {
                            const t = prompt('Nýtt verkefni:');
                            if (t) {
                                setTasks([...tasks, {
                                    id: Date.now().toString(),
                                    title: t,
                                    assignee: '',
                                    status: 'todo',
                                    priority: 'medium',
                                    category: 'General'
                                }]);
                                onDataChange();
                            }
                        }}
                        className="text-amber font-medium text-sm hover:underline"
                    >
                        + Bæta við verkefni
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Shopping List Component ---
const SandboxShopping = ({
    items,
    setItems,
    onDataChange
}: {
    items: MockShoppingItem[],
    setItems: (i: MockShoppingItem[]) => void,
    onDataChange: () => void
}) => {
    const toggleItem = (id: string) => {
        setItems(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
        onDataChange();
    };

    const deleteItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
        onDataChange();
    };

    return (
        <div className="max-w-2xl mx-auto" id="sandbox-shopping">
            <h2 className="text-2xl font-serif font-bold text-charcoal mb-6">Innkaupalisti</h2>

            <div className="bg-white rounded-xl shadow-xl shadow-stone-200/50 border border-stone-200 overflow-hidden">
                <div className="p-4 bg-stone-50 border-b border-stone-200 flex justify-between">
                    <h3 className="font-semibold">Hlutir sem vantar</h3>
                    <span className="text-sm text-stone-500">{items.filter(i => !i.checked).length} ókeypt</span>
                </div>
                <div className="divide-y divide-stone-100">
                    {items.map(item => (
                        <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-stone-50 group">
                            <button
                                onClick={() => toggleItem(item.id)}
                                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${item.checked ? 'bg-green-500 border-green-500' : 'border-stone-300'
                                    }`}
                            >
                                {item.checked && <CheckSquare className="w-4 h-4 text-white" />}
                            </button>
                            <div className="flex-1">
                                <p className={`font-medium ${item.checked ? 'line-through text-stone-400' : 'text-charcoal'}`}>
                                    {item.item}
                                </p>
                                <p className="text-xs text-stone-500">Bætt við af {item.addedBy}</p>
                            </div>
                            <button
                                onClick={() => deleteItem(item.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded transition-opacity"
                            >
                                <X className="w-4 h-4 text-red-500" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-stone-50 border-t border-stone-200">
                    <button
                        onClick={() => {
                            const item = prompt('Hvað á að kaupa?');
                            if (item) {
                                setItems([...items, {
                                    id: Date.now().toString(),
                                    item,
                                    checked: false,
                                    addedBy: 'Þú'
                                }]);
                                onDataChange();
                            }
                        }}
                        className="text-amber font-medium text-sm hover:underline"
                    >
                        + Bæta við hlut
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Users Component ---
const SandboxUsers = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-serif font-bold text-charcoal">Fjölskyldan</h2>
                <button
                    onClick={() => navigate('/signup')}
                    className="btn btn-secondary flex items-center gap-2"
                >
                    <Plus size={16} />
                    Bjóða meðeiganda
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-xl shadow-stone-200/50 border border-stone-200 overflow-hidden">
                <div className="p-6 space-y-6">
                    {MOCK_MEMBERS.map(member => (
                        <div key={member.id} className="flex items-center justify-between py-4 border-b border-stone-100 last:border-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-amber/10 text-amber flex items-center justify-center font-bold text-lg">
                                    {member.initials}
                                </div>
                                <div>
                                    <p className="font-bold text-charcoal">{member.name}</p>
                                    <p className="text-xs text-stone-500">{member.email}</p>
                                </div>
                            </div>
                            <span className={`text-xs px-3 py-1 rounded ${member.role === 'owner' ? 'bg-amber/10 text-amber' : 'bg-stone-100 text-stone-600'
                                }`}>
                                {member.role === 'owner' ? 'Stjórnandi' : 'Meðeigandi'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Main Page Component ---
export default function SandboxPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'finance' | 'tasks' | 'shopping' | 'users' | 'settings'>(() => {
        const tab = searchParams.get('tab');
        return (tab as any) || 'dashboard';
    });
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Track sandbox visit
    useEffect(() => {
        // Log page view (this would be tracked by your analytics system)
        console.log('[Analytics] Sandbox visited');
    }, []);

    // Track tab changes
    useEffect(() => {
        console.log(`[Analytics] Sandbox tab changed: ${activeTab}`);
    }, [activeTab]);

    // State with localStorage persistence
    const [bookings, setBookings] = useState<MockBooking[]>([]);
    const [financeEntries, setFinanceEntries] = useState<MockFinanceEntry[]>([]);
    const [tasks, setTasks] = useState<MockTask[]>([]);
    const [shoppingItems, setShoppingItems] = useState<MockShoppingItem[]>([]);
    const [hasSeenTour, setHasSeenTour] = useState(false);

    // Load state from localStorage on mount
    useEffect(() => {
        const saved = loadSandboxState();
        if (saved && saved.bookings && saved.bookings.length > 0) {
            // Parse dates back to Date objects
            const parsedBookings = saved.bookings.map((b: any) => ({
                ...b,
                start: new Date(b.start),
                end: new Date(b.end)
            }));
            setBookings(parsedBookings);
            setFinanceEntries(saved.financeEntries || INITIAL_FINANCE);
            setTasks(saved.tasks || INITIAL_TASKS);
            setShoppingItems(saved.shoppingItems || INITIAL_SHOPPING);
            setHasSeenTour(saved.hasSeenTour || false);
        } else {
            // First visit - use initial data
            setBookings(INITIAL_BOOKINGS);
            setFinanceEntries(INITIAL_FINANCE);
            setTasks(INITIAL_TASKS);
            setShoppingItems(INITIAL_SHOPPING);
        }
    }, []);

    // Save state to localStorage whenever it changes
    const handleDataChange = () => {
        saveSandboxState({
            bookings,
            financeEntries,
            tasks,
            shoppingItems,
            hasSeenTour
        });
    };

    useEffect(() => {
        if (bookings.length > 0) {
            handleDataChange();
        }
    }, [bookings, financeEntries, tasks, shoppingItems]);

    // Guided tour
    useEffect(() => {
        if (!hasSeenTour && activeTab === 'dashboard') {
            const driverObj = driver({
                showProgress: true,
                steps: [
                    {
                        element: '#sandbox-banner',
                        popover: {
                            title: 'Velkomin í sandkassann! 🎉',
                            description: 'Hér geturðu prófað alla virkni kerfisins. Öll gögn vistast í vafranum þínum.',
                            side: 'bottom',
                            align: 'center'
                        }
                    },
                    {
                        element: '#sidebar-nav',
                        popover: {
                            title: 'Flakkaðu um',
                            description: 'Skoðaðu dagatal, fjármál, verkefni og meira. Allt virkar eins og alvöru kerfið!',
                            side: 'right',
                            align: 'start'
                        }
                    },
                    {
                        popover: {
                            title: 'Tilbúinn að byrja? 🚀',
                            description: 'Þegar þú ert tilbúinn að búa til alvöru aðgang, smelltu bara á "Stofna aðgang" hnappinn.',
                        }
                    }
                ],
                onDestroyed: () => {
                    setHasSeenTour(true);
                    markTourAsSeen();
                }
            });

            setTimeout(() => driverObj.drive(), 500);
        }
    }, [hasSeenTour, activeTab]);

    const MenuLink = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium mb-1 ${activeTab === id
                ? 'bg-amber text-charcoal shadow-xl shadow-stone-200/50'
                : 'text-stone-400 hover:text-white hover:bg-charcoal-light'
                }`}
        >
            <Icon size={20} />
            {label}
        </button>
    );

    return (
        <>
            <SEO
                title="Prófaðu Bústaðurinn.is frítt - Lifandi Demo"
                description="Prófaðu fullt vinnandi dæmi af Bústaðurinn.is án þess að skrá þig. Sjáðu bókunardagatal, fjármál, verkefni, innkaupalista og fleira. Engin skráning þörf."
                keywords="bústaðurinn demo, sumarhús prufa, bókunarkerfi demo, prufuaðgangur, sýnishorn"
                canonical="https://bustadurinn.is/prufa"
            />
            <div className="flex h-screen bg-[#FDFCF8] font-sans overflow-hidden">
                {/* Sidebar */}
                <aside className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-charcoal text-white transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                    <div className="p-6">
                        <h1 className="text-2xl font-serif text-amber italic tracking-wide">bústaðurinn</h1>
                        <div className="mt-2 text-[10px] bg-amber/20 text-amber inline-flex items-center gap-1 px-2 py-0.5 rounded uppercase tracking-wider font-semibold">
                            <Sparkles size={10} />
                            Prufu-hamur
                        </div>
                    </div>

                    <nav className="px-3 mt-6" id="sidebar-nav">
                        <MenuLink id="dashboard" icon={Home} label="Yfirlit" />
                        <MenuLink id="calendar" icon={Calendar} label="Dagatal" />
                        <MenuLink id="finance" icon={DollarSign} label="Fjármál" />
                        <MenuLink id="tasks" icon={CheckSquare} label="Verkefni" />
                        <MenuLink id="shopping" icon={ShoppingBag} label="Innkaupalisti" />
                        <MenuLink id="users" icon={Users} label="Fjölskyldan" />
                        <MenuLink id="settings" icon={Settings} label="Stillingar" />
                    </nav>

                    <div className="absolute bottom-0 w-full p-4 border-t border-charcoal-light bg-charcoal">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="w-8 h-8 rounded-full bg-amber text-charcoal flex items-center justify-center font-bold text-sm">
                                G
                            </div>
                            <div className="overflow-hidden flex-1">
                                <p className="text-sm font-medium truncate">Gestur (Þú)</p>
                                <p className="text-xs text-stone-400 truncate">Prufuaðgangur</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/signup')}
                            className="w-full btn bg-amber text-charcoal hover:bg-amber-dark flex items-center justify-center gap-2 shadow-lg"
                        >
                            <UserIcon size={16} />
                            Stofna aðgang
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('Eyða öllum prufugögnum og byrja upp á nýtt?')) {
                                    clearSandboxState();
                                    window.location.reload();
                                }
                            }}
                            className="w-full mt-2 text-xs text-stone-500 hover:text-stone-300 text-center"
                        >
                            Núllstilla sandkassa
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 md:ml-64 flex flex-col h-full overflow-hidden relative">
                    {/* Mobile Header */}
                    <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-stone-200">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-charcoal">
                                <Menu size={24} />
                            </button>
                            <h1 className="font-serif text-lg">Prufu-hamur</h1>
                        </div>
                    </header>

                    {/* Content Area */}
                    <div className="flex-1 overflow-auto p-4 md:p-8 relative">
                        {/* Info Banner */}
                        <div id="sandbox-banner" className="bg-gradient-to-r from-blue-50 to-amber/5 border border-blue-100 text-blue-800 px-4 py-3 rounded-lg mb-6 flex items-start gap-3 shadow-xl shadow-stone-200/50 max-w-5xl mx-auto">
                            <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                                <Sparkles size={16} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">Velkomin(n) í sandkassann!</p>
                                <p className="text-xs mt-1 opacity-90">
                                    Prófaðu alla eiginleika kerfisins. Gögnin þín vistast í vafranum og hverra ekki við refresh.
                                </p>
                            </div>
                            <button onClick={() => navigate('/signup')} className="ml-auto text-xs font-bold underline whitespace-nowrap hidden md:block">
                                Stofna aðgang →
                            </button>
                        </div>

                        {/* View Rendering */}
                        <div className="max-w-7xl mx-auto h-full pb-32">
                            {activeTab === 'dashboard' && <SandboxDashboard bookings={bookings} tasks={tasks} financeEntries={financeEntries} />}
                            {activeTab === 'calendar' && <SandboxCalendar bookings={bookings} setBookings={setBookings} onDataChange={handleDataChange} />}
                            {activeTab === 'finance' && <SandboxFinance entries={financeEntries} setEntries={setFinanceEntries} onDataChange={handleDataChange} />}
                            {activeTab === 'tasks' && <SandboxTasks tasks={tasks} setTasks={setTasks} onDataChange={handleDataChange} />}
                            {activeTab === 'shopping' && <SandboxShopping items={shoppingItems} setItems={setShoppingItems} onDataChange={handleDataChange} />}
                            {activeTab === 'users' && <SandboxUsers />}
                            {activeTab === 'settings' && (
                                <div className="text-center py-20">
                                    <Settings className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                                    <h2 className="text-xl font-bold text-charcoal">Stillingar</h2>
                                    <p className="text-stone-500 max-w-md mx-auto mt-2">
                                        Í fullu útgáfunni getur þú stillt WiFi, húsreglur, boðið meðeigendum og fleira.
                                    </p>
                                    <button onClick={() => navigate('/signup')} className="btn btn-primary mt-6">
                                        Stofna aðgang til að sjá meira
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Conversion Footer */}
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:w-auto md:min-w-[500px] z-50">
                            <div className="bg-charcoal text-white p-4 md:p-6 rounded-2xl shadow-2xl border border-amber/30 flex flex-col md:flex-row items-center gap-4 md:gap-8 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber/10 blur-3xl -z-10"></div>
                                <div className="flex-1">
                                    <p className="text-amber text-xs font-bold uppercase tracking-widest mb-1">Takmarkað stofn-tilboð</p>
                                    <h4 className="text-lg font-serif font-bold">Frítt í 1 ár fyrir fyrstu 50 húsin</h4>
                                    <p className="text-stone-400 text-xs mt-1">Engin greiðslukortaupplýsingar þarf.</p>
                                </div>
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="w-full md:w-auto btn bg-amber text-charcoal hover:bg-amber-dark font-bold px-8 py-3 rounded-xl shadow-[0_0_20px_rgba(232,176,88,0.3)] transition-all transform hover:scale-105"
                                >
                                    Virkja mitt hús
                                </button>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Mobile Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </div>
        </>
    );
}
