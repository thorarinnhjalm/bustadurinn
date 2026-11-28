/**
 * Public Sandbox - Interactive Mock
 * A fully functional "Demo Mode" running on local state.
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import Modal from '@/components/ui/Modal';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays } from 'date-fns';
import { is } from 'date-fns/locale';
import {
    Calendar, DollarSign, CheckSquare, Settings,
    Bell, Menu, User as UserIcon, Plus, Shield, Users,
    Sparkles
} from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/styles/calendar.css'; // must follow the library CSS

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
    { id: '1', date: '2025-01-05', description: 'Leigutekjur vegna helgar', amount: 45000, type: 'income', category: 'Rent' },
    { id: '2', date: '2025-01-12', description: 'Nýtt gas á grillið', amount: -7500, type: 'expense', category: 'Supplies' },
    { id: '3', date: '2025-01-15', description: 'Rafmagnsreikningur', amount: -24500, type: 'expense', category: 'Utilities' },
    { id: '4', date: '2025-01-20', description: 'Framlag í hússjóð (Guðrún)', amount: 15000, type: 'income', category: 'Fund' },
];

const INITIAL_TASKS = [
    { id: '1', title: 'Skipta um gas á grillinu', assignee: 'Jón', status: 'todo' },
    { id: '2', title: 'Mála pallinn sunnan megin', assignee: 'Guðrún', status: 'in_progress' },
    { id: '3', title: 'Sækja nýtt WiFi box í pósthólf', assignee: 'Siggi', status: 'todo' },
    { id: '4', title: 'Ganga frá garðhúsgögnum', assignee: '', status: 'done' },
];

// --- Sub-Components ---

const SandboxCalendar = ({ onUnlockRequest }: { onUnlockRequest: (feature: string) => void }) => {
    const [bookings] = useState(INITIAL_BOOKINGS);
    const [view, setView] = useState<any>('month');
    const [date, setDate] = useState(new Date());

    const handleSelectSlot = () => {
        onUnlockRequest('Bókanir í dagatal');
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif font-bold text-charcoal">Bókunardagatal</h2>
                <button
                    type="button"
                    onClick={() => onUnlockRequest('Ný Bókun')}
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
                            backgroundColor: event.type === 'rental' ? '#047857' : '#e8b058',
                            borderRadius: '4px',
                            color: event.type === 'rental' ? 'white' : '#1a1a1a',
                            border: '0px',
                            display: 'block'
                        }
                    })}
                />
            </div>
        </div>
    );
};

const SandboxFinance = ({ onUnlockRequest }: { onUnlockRequest: (feature: string) => void }) => {
    const [entries] = useState(INITIAL_FINANCE);

    const balance = entries.reduce((acc, curr) => acc + curr.amount, 0);

    const handleAdd = () => {
        onUnlockRequest('Bæta við fjármálafærslu');
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-serif font-bold text-charcoal">Fjármál</h2>
                <button type="button" onClick={handleAdd} className="btn btn-primary">Skrá færslu</button>
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
                    <p className="text-xl font-bold text-green-700">+150.000 kr.</p>
                    <div className="h-4"></div>
                    <p className="text-sm text-grey-mid">Gjöld (Jan)</p>
                    <p className="text-xl font-bold text-red-500">-39.500 kr.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                    <h3 className="font-semibold text-charcoal">Færsluyfirlit</h3>
                    <button type="button" className="text-sm text-amber-ink font-medium">Sækja Excel</button>
                </div>
                <div className="divide-y divide-stone-100">
                    {entries.map(entry => (
                        <div key={entry.id} className="p-4 hover:bg-stone-50 transition-colors flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${entry.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'
                                    }`}>
                                    <DollarSign aria-hidden="true" className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-charcoal">{entry.description}</p>
                                    <p className="text-xs text-stone-500">{entry.date} • {entry.category}</p>
                                </div>
                            </div>
                            <span className={`font-mono font-medium ${entry.type === 'income' ? 'text-green-700' : 'text-charcoal'
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

const SandboxTasks = ({ onUnlockRequest }: { onUnlockRequest: (feature: string) => void }) => {
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
                        <button
                            type="button"
                            role="checkbox"
                            aria-checked={task.status === 'done'}
                            key={task.id}
                            className="w-full p-4 flex items-center gap-4 text-left hover:bg-stone-50"
                            onClick={() => toggleTask(task.id)}
                        >
                            <span className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-stone-300'
                                }`}>
                                {task.status === 'done' && <CheckSquare aria-hidden="true" className="w-4 h-4 text-white" />}
                            </span>
                            <span className="flex-1">
                                <span className={`block font-medium ${task.status === 'done' ? 'line-through text-stone-500' : 'text-charcoal'}`}>
                                    {task.title}
                                </span>
                                {task.assignee && (
                                    <span className="block text-xs text-stone-500 mt-0.5">Ábyrgð: {task.assignee}</span>
                                )}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${task.status === 'done' ? 'bg-green-100 text-green-700' :
                                task.status === 'in_progress' ? 'bg-amber/10 text-amber-dark' :
                                    'bg-stone-100 text-stone-600'
                                }`}>
                                {task.status === 'done' ? 'Lokið' : task.status === 'in_progress' ? 'Í vinnslu' : 'Óunnið'}
                            </span>
                        </button>
                    ))}
                </div>
                <div className="p-4 bg-stone-50 border-t border-stone-200">
                    <button
                        type="button"
                        onClick={() => {
                            onUnlockRequest('Stofna nýtt verkefni');
                        }}
                        className="text-amber-ink font-medium text-sm hover:underline"
                    >
                        + Bæta við verkefni
                    </button>
                </div>
            </div>
        </div>
    );
};
const SandboxUsers = ({ onUnlockRequest }: { onUnlockRequest: (feature: string) => void }) => {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-serif font-bold text-charcoal">Fjölskyldan</h2>
                <button
                    type="button"
                    onClick={() => onUnlockRequest('Bjóða Fjölskyldunni')}
                    className="btn btn-secondary flex items-center gap-2"
                >
                    <Plus size={16} aria-hidden="true" />
                    Bjóða meðeiganda <Shield size={14} aria-hidden="true" className="text-amber-ink" />
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden relative">
                {/* Locked Overlay */}
                <button
                    type="button"
                    className="absolute inset-0 bg-stone-50/40 backdrop-blur-sm z-10 flex items-center justify-center p-8 text-center cursor-pointer"
                    onClick={() => onUnlockRequest('Fjölskyldan & Meðeigendur')}
                >
                    <span className="block bg-white/90 p-8 rounded-2xl shadow-xl border border-stone-100 max-w-sm motion-safe:hover:scale-105 transition-transform duration-300">
                        <Users aria-hidden="true" className="w-12 h-12 text-amber-ink mx-auto mb-4" />
                        <span className="block text-xl font-bold mb-2">Læstur eiginleiki</span>
                        <span className="block text-stone-500 text-sm mb-6">
                            Í alvöru kerfinu geturðu fjölgað eigendum og fjölskyldumeðlimum að vild, algjörlega án takmarkana.
                        </span>
                        <span className="btn btn-primary w-full">Sjá meira</span>
                    </span>
                </button>

                <div aria-hidden="true" className="p-6 space-y-6 opacity-30">
                    <div className="flex items-center justify-between py-4 border-b border-stone-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-stone-200"></div>
                            <div>
                                <p className="font-bold text-charcoal">Jón Jónsson</p>
                                <p className="text-xs text-stone-500">Eigandi</p>
                            </div>
                        </div>
                        <span className="text-xs bg-stone-100 px-2 py-1 rounded">Stjórnandi</span>
                    </div>
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-stone-200"></div>
                            <div>
                                <p className="font-bold text-charcoal">Guðrún Sigurðardóttir</p>
                                <p className="text-xs text-stone-500">Meðeigandi</p>
                            </div>
                        </div>
                        <span className="text-xs bg-stone-100 px-2 py-1 rounded">Notandi</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Reusable Components ---

const MenuLink = ({
    id,
    icon: Icon,
    label,
    isActive,
    onClick
}: {
    id: any,
    icon: any,
    label: string,
    isActive: boolean,
    onClick: (id: any) => void
}) => (
    <button
        type="button"
        aria-current={isActive ? 'page' : undefined}
        onClick={() => onClick(id)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium mb-1 ${isActive
            ? 'bg-amber text-charcoal shadow-sm'
            : 'text-stone-400 hover:text-white hover:bg-charcoal-light'
            }`}
    >
        <Icon size={20} aria-hidden="true" />
        {label}
    </button>
);

// --- Main Page Component ---

export default function SandboxPage() {
    const [activeTab, setActiveTab] = useState<'calendar' | 'finance' | 'tasks' | 'users' | 'settings'>('calendar');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [unlockModal, setUnlockModal] = useState<{ isOpen: boolean; feature: string }>({ isOpen: false, feature: '' });
    const sidebarToggleRef = useRef<HTMLButtonElement>(null);

    // Close the mobile menu with Escape and return focus to the toggle
    useEffect(() => {
        if (!sidebarOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSidebarOpen(false);
                sidebarToggleRef.current?.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [sidebarOpen]);

    const handleUnlockRequest = (feature: string) => {
        setUnlockModal({ isOpen: true, feature });
    };

    return (
        <div className="flex h-screen bg-bone font-sans overflow-hidden">
            <SEO title="Prufa Bústaðurinn.is — Gagnvirkt dæmi" noIndex={true} />
            <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[300] focus:bg-charcoal focus:text-white focus:px-4 focus:py-2 focus:rounded"
            >
                Fara beint í efni
            </a>
            {/* Sidebar (Mocking the real one) */}
            <aside id="sandbox-sidebar" className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-charcoal text-white transform transition-[transform,visibility] duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full max-md:invisible md:translate-x-0'}
            `}>
                <div className="p-6">
                    <p className="text-2xl font-serif text-amber italic tracking-wide">bústaðurinn</p>
                    <div className="mt-2 text-[10px] bg-amber/20 text-amber inline-block px-2 py-0.5 rounded uppercase tracking-wider font-semibold">
                        Prufu-hamur
                    </div>
                </div>

                <nav aria-label="Prufuvalmynd" className="px-3 mt-6">
                    <MenuLink id="calendar" icon={Calendar} label="Dagatal" isActive={activeTab === 'calendar'} onClick={setActiveTab} />
                    <MenuLink id="finance" icon={DollarSign} label="Fjármál" isActive={activeTab === 'finance'} onClick={setActiveTab} />
                    <MenuLink id="tasks" icon={CheckSquare} label="Verkefni" isActive={activeTab === 'tasks'} onClick={setActiveTab} />
                    <MenuLink id="users" icon={Users} label="Fjölskyldan" isActive={activeTab === 'users'} onClick={setActiveTab} />
                    <MenuLink id="settings" icon={Settings} label="Stillingar" isActive={activeTab === 'settings'} onClick={setActiveTab} />
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
                    <Link
                        to="/signup"
                        className="w-full btn bg-white text-charcoal hover:bg-stone-100 flex items-center justify-center gap-2"
                    >
                        <UserIcon size={16} aria-hidden="true" />
                        Stofna aðgang
                    </Link>
                    <Link
                        to="/"
                        className="block w-full mt-2 py-1 text-xs text-stone-400 hover:text-stone-300 text-center"
                    >
                        Hætta í prufu
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main id="main" className="flex-1 md:ml-64 flex flex-col h-full overflow-hidden relative">
                <h1 className="sr-only">Prufu-hamur Bústaðurinn.is</h1>

                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-stone-200">
                    <div className="flex items-center gap-3">
                        <button
                            ref={sidebarToggleRef}
                            type="button"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 text-charcoal"
                            aria-label={sidebarOpen ? 'Loka valmynd' : 'Opna valmynd'}
                            aria-expanded={sidebarOpen}
                            aria-controls="sandbox-sidebar"
                        >
                            <Menu size={24} aria-hidden="true" />
                        </button>
                        <p className="font-serif text-lg">Prufu-hamur</p>
                    </div>
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-auto p-4 md:p-8 relative">
                    {/* Floating Info Banner */}
                    <div className="bg-blue-50 border border-blue-100 text-blue-800 px-4 py-3 rounded-lg mb-6 flex items-start gap-3 shadow-sm max-w-4xl mx-auto">
                        <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                            <Bell size={16} aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Velkomin(n) í sandkassann!</p>
                            <p className="text-xs mt-1 opacity-90">
                                Hér getur þú prófað virkni kerfisins. Öll gögn eru vistuð tímabundið í vafranum þínum.
                                Engar breytingar vistast varanlega.
                            </p>
                        </div>
                        <Link to="/signup" className="ml-auto text-xs font-bold underline whitespace-nowrap hidden md:block">
                            Stofna alvöru aðgang →
                        </Link>
                    </div>

                    {/* View Rendering */}
                    <div className="max-w-7xl mx-auto h-full pb-32">
                        {activeTab === 'calendar' && <SandboxCalendar onUnlockRequest={handleUnlockRequest} />}
                        {activeTab === 'finance' && <SandboxFinance onUnlockRequest={handleUnlockRequest} />}
                        {activeTab === 'tasks' && <SandboxTasks onUnlockRequest={handleUnlockRequest} />}
                        {activeTab === 'users' && <SandboxUsers onUnlockRequest={handleUnlockRequest} />}
                        {activeTab === 'settings' && (
                            <div className="text-center py-20 hover:bg-white/50 rounded-2xl transition-colors p-8">
                                <Settings aria-hidden="true" className="w-16 h-16 text-amber-ink mx-auto mb-4" />
                                <h2 className="text-xl font-bold text-charcoal">Stillingar hússins</h2>
                                <p className="text-stone-500 max-w-md mx-auto mt-2 mb-6">
                                    Hér myndir þú stilla WiFi lykilorð, húsreglur og upplýsingar sem gestir þínir sjá strax í símanum sínum.
                                </p>
                                <button type="button" onClick={() => handleUnlockRequest('Stillingar Hússins')} className="btn btn-primary">Prófa alvöru kerfið</button>
                            </div>
                        )}
                    </div>
                    
                    {/* Unlock Modal */}
                    <Modal
                        open={unlockModal.isOpen}
                        onClose={() => setUnlockModal({ isOpen: false, feature: '' })}
                        title={`Opnaðu ${unlockModal.feature}`}
                        size="md"
                        footer={
                            <>
                                <button type="button" onClick={() => setUnlockModal({ isOpen: false, feature: '' })} className="btn btn-ghost py-3 text-stone-600">
                                    Skoða áfram sýnishornið
                                </button>
                                <Link to="/signup" className="btn btn-primary bg-amber text-charcoal hover:bg-amber-dark py-3 border-0">
                                    Stofna ókeypis aðgang
                                </Link>
                            </>
                        }
                    >
                        <div className="w-16 h-16 bg-amber/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Sparkles aria-hidden="true" className="w-8 h-8 text-amber-ink" />
                        </div>
                        <p className="text-stone-600 text-center leading-relaxed">
                            Þetta er sýnishorn af kerfinu. Ef þú stofnar ókeypis aðgang núna geturðu byrjað á að leika þér með kerfið sjálft fyrir þinn bústað.
                        </p>
                    </Modal>

                    {/* Conversion Footer Banner */}
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:w-auto md:min-w-[500px] z-50">
                        <div className="bg-charcoal text-white p-4 md:p-6 rounded-2xl shadow-2xl border border-amber/30 flex flex-col md:flex-row items-center gap-4 md:gap-8 overflow-hidden relative">
                            {/* Accent Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber/10 blur-3xl -z-10"></div>

                            <div className="flex-1">
                                <p className="text-amber text-xs font-bold uppercase tracking-widest mb-1">Einfaldara líf í sumar</p>
                                <h2 className="text-lg font-serif font-bold text-white mb-0">Prófaðu kerfið — ókeypis og án skuldbindinga</h2>
                                <p className="text-stone-400 text-xs mt-1">Bættu við fjölskyldunni og sjáðu hvort þetta hentar ykkur.</p>
                            </div>

                            <Link
                                to="/signup"
                                className="w-full md:w-auto btn bg-amber text-charcoal hover:bg-amber-dark font-bold px-8 py-3 rounded-xl shadow-[0_0_20px_rgba(232,176,88,0.3)] transition-all transform motion-safe:hover:scale-105 border-0"
                            >
                                Stofna ókeypis aðgang
                            </Link>
                        </div>
                    </div>
                </div>

            </main>

            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Loka valmynd"
                    className="fixed inset-0 bg-black/50 z-30 md:hidden cursor-default"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
