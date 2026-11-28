import { useEffect, useRef } from 'react';
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
import type { LucideIcon } from 'lucide-react';
import type { Tab } from './tabs';

interface SettingsNavProps {
    activeTab: Tab;
    onSelectTab: (tab: Tab) => void;
    onLogout: () => void;
}

const TAB_ITEMS: Array<{ tab: Tab; label: string; Icon: LucideIcon }> = [
    { tab: 'house', label: 'Húsupplýsingar', Icon: Home },
    { tab: 'shopping', label: 'Innkaupalisti', Icon: ShoppingBag },
    { tab: 'logs', label: 'Verkefni & Viðhald', Icon: ClipboardList },
    { tab: 'members', label: 'Meðeigendur', Icon: Users },
    { tab: 'guests', label: 'Gestaupplýsingar', Icon: BookOpen },
    { tab: 'guestbook', label: 'Gestabók', Icon: Heart },
];

// Shared by every item. Phones: a scrollable row of tabs (items never shrink or wrap).
// md and up: a full-width list in the sidebar.
const ITEM_BASE =
    'flex shrink-0 snap-start items-center gap-2 md:gap-3 whitespace-nowrap rounded-md md:rounded-none px-3 py-2.5 md:w-full md:px-4 md:py-3 text-left text-sm md:text-base transition-colors';
const ITEM_IDLE = 'text-grey-dark hover:bg-bone';
const ITEM_ACTIVE = 'bg-charcoal text-white';

/**
 * Navigation between the settings tabs: a horizontally scrollable row of tabs on phones, a sidebar
 * from md up. The active tab is scrolled into view (on mount and whenever it changes). The marketplace
 * link and "Skrá út" are not tabs; they sit at the end of the row on phones and at the bottom of the
 * sidebar on desktop.
 */
export default function SettingsNav({ activeTab, onSelectTab, onLogout }: SettingsNavProps) {
    const navigate = useNavigate();
    const scrollerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scroller = scrollerRef.current;
        const active = scroller?.querySelector<HTMLElement>('[aria-current="page"]');
        if (!scroller || !active || scroller.scrollWidth <= scroller.clientWidth) return;
        // Centre the active tab inside the row (horizontal only: never scroll the page itself).
        const left = active.offsetLeft - (scroller.clientWidth - active.offsetWidth) / 2;
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        scroller.scrollTo({ left: Math.max(0, left), behavior: reduce ? 'auto' : 'smooth' });
    }, [activeTab]);

    const renderTab = ({ tab, label, Icon }: (typeof TAB_ITEMS)[number]) => (
        <button
            key={tab}
            type="button"
            aria-current={activeTab === tab ? 'page' : undefined}
            onClick={() => onSelectTab(tab)}
            className={`${ITEM_BASE} ${activeTab === tab ? ITEM_ACTIVE : ITEM_IDLE}`}
        >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{label}</span>
        </button>
    );

    return (
        <nav aria-label="Stillingar" className="w-full min-w-0 md:w-64 md:flex-shrink-0">
            <div
                ref={scrollerRef}
                className="relative flex snap-x snap-proximity gap-1 overflow-x-auto rounded-lg bg-white p-1 shadow-sm md:block md:snap-none md:gap-0 md:overflow-hidden md:p-0"
            >
                {TAB_ITEMS.map(renderTab)}

                <button
                    type="button"
                    onClick={() => navigate('/torgid')}
                    className={`${ITEM_BASE} ${ITEM_IDLE}`}
                >
                    <Hammer className="h-5 w-5" aria-hidden="true" />
                    <span>Þjónustutorg</span>
                </button>

                {renderTab({ tab: 'profile', label: 'Mínar stillingar', Icon: UserIcon })}

                <button
                    type="button"
                    onClick={onLogout}
                    className={`${ITEM_BASE} text-red-600 hover:bg-red-50 md:border-t md:border-grey-warm`}
                >
                    <LogOut className="h-5 w-5" aria-hidden="true" />
                    <span>Skrá út</span>
                </button>
            </div>
        </nav>
    );
}
