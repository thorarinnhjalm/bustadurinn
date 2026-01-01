/**
 * Public Sandbox - Interactive Mock
 * A fully functional "Demo Mode" running on local state.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays } from 'date-fns';
import { is } from 'date-fns/locale';
import {
    Calendar, DollarSign, CheckSquare, Settings,
    Bell, Menu, User as UserIcon
} from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup Calendar Localizer
const locales = { 'is': is };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
});

// --- Mock Data ---

const INITIAL_BOOKINGS = [
    {
        id: '1',
        title: 'Jón Jónsson',
        start: addDays(new Date(), 2),
        end: addDays(new Date(), 4),
        type: 'personal',
        notes: 'Fjölskylduhelgi'
    },
    {
        id: '2',
        title: 'Leiga - Airbnb',
        start: addDays(new Date(), 10),
        end: addDays(new Date(), 15),
        type: 'rental',
        notes: 'Gestir frá Þýskalandi'
    }
];

const INITIAL_FINANCE = [
    { id: '1', date: '2025-01-01', description: 'Leigutekjur janúar', amount: 150000, type: 'income', category: 'Rent' },
    { id: '2', date: '2025-01-05', description: 'Orkureikningur', amount: -24500, type: 'expense', category: 'Utilities' },
    { id: '3', date: '2025-01-10', description: 'Snjómokstur', amount: -15000, type: 'expense', category: 'Maintenance' },
];

const INITIAL_TASKS = [
    { id: '1', title: 'Skipta um ljósaperu á baði', assignee: 'Jón', status: 'todo' },
    { id: '2', title: 'Mála pallinn', assignee: 'Guðrún', status: 'in_progress' },
    { id: '3', title: 'Kauptu nýjan slökkvitæki', assignee: '', status: 'done' },
];

// --- Sub-Components ---

const SandboxCalendar = () => {
    const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
    const [view, setView] = useState<any>('month');
    const [date, setDate] = useState(new Date());

    const handleSelectSlot = ({ start, end }: any) => {
        const title = prompt('Nafn bókunar (eða "Leiga"):');
        if (title) {
            setBookings([...bookings, {
                id: Math.random().toString(),
                title,
                start,
                end,
                type: title.toLowerCase().includes('leiga') ? 'rental' : 'personal',
                notes: ''
            }]);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif font-bold text-charcoal">Bókunardagatal</h2>
                <button
                    onClick={() => alert('Í fullu kerfi opnast bókunargluggi hér!')}
                    className="btn btn-primary"
                >
                    + Ný bókun
                </button>
            </div>

            <div className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-stone-200 min-h-[600px]">
                <BigCalendar
                    localizer={localizer}
                    events={bookings}
                    startAccessor="start"
                    endAccessor="end"
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
                            backgroundColor: event.type === 'rental' ? '#10b981' : '#e8b058',
                            borderRadius: '4px',
                            color: 'white',
                            border: '0px',
                            display: 'block'
                        }
                    })}
                />
            </div>
        </div>
    );
};

const SandboxFinance = () => {
    const [entries, setEntries] = useState(INITIAL_FINANCE);

    const balance = entries.reduce((acc, curr) => acc + curr.amount, 0);

    const handleAdd = () => {
        const desc = prompt('Skýring færslu:');
        const amountStr = prompt('Upphæð (neikvæð fyrir útgjöld):');
        if (desc && amountStr) {
            setEntries([{
                id: Math.random().toString(),
                date: new Date().toISOString().split('T')[0],
                description: desc,
                amount: parseInt(amountStr),
                type: parseInt(amountStr) > 0 ? 'income' : 'expense',
                category: 'General'
            }, ...entries]);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
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
                {/* Stats placeholder */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex flex-col justify-center">
                    <p className="text-sm text-grey-mid">Tekjur (Jan)</p>
                    <p className="text-xl font-bold text-green-600">+150.000 kr.</p>
                    <div className="h-4"></div>
                    <p className="text-sm text-grey-mid">Gjöld (Jan)</p>
                    <p className="text-xl font-bold text-red-500">-39.500 kr.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                    <h3 className="font-semibold text-charcoal">Færsluyfirlit</h3>
                    <button className="text-sm text-amber font-medium">Sækja Excel</button>
                </div>
                <div className="divide-y divide-stone-100">
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

const SandboxTasks = () => {
    const [tasks, setTasks] = useState(INITIAL_TASKS);

    const toggleTask = (id: string) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t));
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-serif font-bold text-charcoal mb-6">Verkefni & Viðhald</h2>

            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
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
                            if (t) setTasks([...tasks, { id: Math.random().toString(), title: t, assignee: '', status: 'todo' }]);
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

// --- Main Page Component ---

export default function SandboxPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'calendar' | 'finance' | 'tasks' | 'settings'>('calendar');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const MenuLink = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium mb-1 ${activeTab === id
                ? 'bg-amber text-charcoal shadow-sm'
                : 'text-stone-400 hover:text-white hover:bg-charcoal-light'
                }`}
        >
            <Icon size={20} />
            {label}
        </button>
    );

    return (
        <div className="flex h-screen bg-bone font-sans overflow-hidden">
            {/* Sidebar (Mocking the real one) */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-charcoal text-white transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-6">
                    <h1 className="text-2xl font-serif text-amber italic tracking-wide">bústaðurinn</h1>
                    <div className="mt-2 text-[10px] bg-amber/20 text-amber inline-block px-2 py-0.5 rounded uppercase tracking-wider font-semibold">
                        Prufu-hamur
                    </div>
                </div>

                <nav className="px-3 mt-6">
                    <MenuLink id="calendar" icon={Calendar} label="Dagatal" />
                    <MenuLink id="finance" icon={DollarSign} label="Fjármál" />
                    <MenuLink id="tasks" icon={CheckSquare} label="Verkefni" />
                    <MenuLink id="settings" icon={Settings} label="Stillingar" />
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-charcoal-light bg-charcoal">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-amber text-charcoal flex items-center justify-center font-bold">
                            G
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">Gestur (Þú)</p>
                            <p className="text-xs text-stone-400 truncate">Prufuaðgangur</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/signup')}
                        className="w-full btn bg-white text-charcoal hover:bg-stone-100 flex items-center justify-center gap-2"
                    >
                        <UserIcon size={16} />
                        Stofna aðgang
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full mt-2 text-xs text-stone-500 hover:text-stone-300 text-center"
                    >
                        Hætta í prufu
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
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

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-auto p-4 md:p-8 relative">
                    {/* Floating Info Banner */}
                    <div className="bg-blue-50 border border-blue-100 text-blue-800 px-4 py-3 rounded-lg mb-6 flex items-start gap-3 shadow-sm max-w-4xl mx-auto">
                        <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                            <Bell size={16} />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Velkomin(n) í sandkassann!</p>
                            <p className="text-xs mt-1 opacity-90">
                                Hér getur þú prófað virkni kerfisins. Öll gögn eru vistuð tímabundið í vafranum þínum.
                                Engar breytingar vistast varanlega.
                            </p>
                        </div>
                        <button onClick={() => navigate('/signup')} className="ml-auto text-xs font-bold underline whitespace-nowrap hidden md:block">
                            Stofna alvöru aðgang →
                        </button>
                    </div>

                    {/* View Rendering */}
                    <div className="max-w-7xl mx-auto h-full pb-20">
                        {activeTab === 'calendar' && <SandboxCalendar />}
                        {activeTab === 'finance' && <SandboxFinance />}
                        {activeTab === 'tasks' && <SandboxTasks />}
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
                </div>

            </main>

            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
