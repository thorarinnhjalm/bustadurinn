import { useNavigate } from 'react-router-dom';
import {
    Home,
    ShoppingBag,
    ClipboardList,
    Users,
    User as UserIcon,
    LogOut,
    Hammer,
    BookOpen,
    Heart,
} from 'lucide-react';
import type { Tab } from './tabs';

interface SettingsNavProps {
    activeTab: Tab;
    onSelectTab: (tab: Tab) => void;
    onLogout: () => void;
}

/** Sidebar navigation between the settings tabs. */
export default function SettingsNav({ activeTab, onSelectTab, onLogout }: SettingsNavProps) {
    const navigate = useNavigate();

    return (
        <nav aria-label="Stillingar" className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button
                    type="button"
                    aria-current={activeTab === 'house' ? 'page' : undefined}
                    onClick={() => onSelectTab('house')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'house'
                        ? 'bg-charcoal text-white'
                        : 'text-grey-dark hover:bg-bone'
                        }`}
                >
                    <Home className="w-5 h-5" aria-hidden="true" />
                    <span>Húsupplýsingar</span>
                </button>

                <button
                    type="button"
                    aria-current={activeTab === 'shopping' ? 'page' : undefined}
                    onClick={() => onSelectTab('shopping')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'shopping'
                        ? 'bg-amber text-charcoal font-bold'
                        : 'text-grey-dark hover:bg-bone'
                        }`}
                >
                    <ShoppingBag className="w-5 h-5" aria-hidden="true" />
                    <span>Innkaupalisti</span>
                </button>

                <button
                    type="button"
                    aria-current={activeTab === 'logs' ? 'page' : undefined}
                    onClick={() => onSelectTab('logs')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'logs'
                        ? 'bg-amber text-charcoal font-bold'
                        : 'text-grey-dark hover:bg-bone'
                        }`}
                >
                    <ClipboardList className="w-5 h-5" aria-hidden="true" />
                    <span>Verkefni & Viðhald</span>
                </button>

                <button
                    type="button"
                    aria-current={activeTab === 'members' ? 'page' : undefined}
                    onClick={() => onSelectTab('members')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'members'
                        ? 'bg-charcoal text-white'
                        : 'text-grey-dark hover:bg-bone'
                        }`}
                >
                    <Users className="w-5 h-5" aria-hidden="true" />
                    <span>Meðeigendur</span>
                </button>

                <button
                    type="button"
                    aria-current={activeTab === 'guests' ? 'page' : undefined}
                    onClick={() => onSelectTab('guests')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'guests'
                        ? 'bg-charcoal text-white'
                        : 'text-grey-dark hover:bg-bone'
                        }`}
                >
                    <BookOpen className="w-5 h-5" aria-hidden="true" />
                    <span>Gestaupplýsingar</span>
                </button>

                <button
                    type="button"
                    aria-current={activeTab === 'guestbook' ? 'page' : undefined}
                    onClick={() => onSelectTab('guestbook')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'guestbook'
                        ? 'bg-charcoal text-white'
                        : 'text-grey-dark hover:bg-bone'
                        }`}
                >
                    <Heart className="w-5 h-5" aria-hidden="true" />
                    <span>Gestabók</span>
                </button>

                <button
                    type="button"
                    onClick={() => navigate('/torgid')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-grey-dark hover:bg-bone transition-colors"
                >
                    <Hammer className="w-5 h-5" aria-hidden="true" />
                    <span>Þjónustutorg</span>
                </button>

                <button
                    type="button"
                    aria-current={activeTab === 'profile' ? 'page' : undefined}
                    onClick={() => onSelectTab('profile')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === 'profile'
                        ? 'bg-charcoal text-white'
                        : 'text-grey-dark hover:bg-bone'
                        }`}
                >
                    <UserIcon className="w-5 h-5" aria-hidden="true" />
                    <span>Mínar stillingar</span>
                </button>


                <button
                    type="button"
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border-t border-grey-warm text-red-600 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="w-5 h-5" aria-hidden="true" />
                    <span>Skrá út</span>
                </button>
            </div>
        </nav>
    );
}
