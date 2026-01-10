import { useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, ChevronRight } from 'lucide-react';
import type { House } from '@/types/models';

interface SetupProgressProps {
    house: House | null;
    onShowWalkthrough?: () => void;
}

interface SetupItem {
    id: string;
    label: string;
    isComplete: (house: House) => boolean;
    link?: string;
}

const SETUP_ITEMS: SetupItem[] = [
    {
        id: 'name',
        label: 'Nafn húss',
        isComplete: (h) => !!h.name && h.name.length > 0
    },
    {
        id: 'image',
        label: 'Mynd af húsi',
        isComplete: (h) => !!h.image_url && h.image_url.length > 0,
        link: '/settings'
    },
    {
        id: 'address',
        label: 'Heimilisfang',
        isComplete: (h) => !!h.address && h.address.length > 0,
        link: '/settings'
    },
    {
        id: 'wifi',
        label: 'WiFi upplýsingar',
        isComplete: (h) => !!h.wifi_ssid || !!h.wifi_password,
        link: '/settings'
    },
    {
        id: 'rules',
        label: 'Húsreglur',
        isComplete: (h) => !!h.house_rules && h.house_rules.length > 10,
        link: '/settings'
    },
    {
        id: 'guest',
        label: 'Gestahlekkur',
        isComplete: (h) => !!h.guest_token,
        link: '/settings?tab=guests'
    }
];

export default function SetupProgress({ house, onShowWalkthrough }: SetupProgressProps) {
    const navigate = useNavigate();

    if (!house) return null;

    const completedCount = SETUP_ITEMS.filter(item => item.isComplete(house)).length;
    const totalCount = SETUP_ITEMS.length;
    const percentage = Math.round((completedCount / totalCount) * 100);

    // Don't show if fully complete
    if (percentage === 100) return null;

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-serif font-bold text-lg text-charcoal">
                        Uppsetning húss
                    </h3>
                    <p className="text-sm text-stone-500">
                        {percentage}% tilbúið
                    </p>
                </div>
                {onShowWalkthrough && (
                    <button
                        onClick={onShowWalkthrough}
                        className="text-amber hover:text-amber-600 text-sm font-bold"
                    >
                        Sjá leiðbeiningar
                    </button>
                )}
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden mb-4">
                <div
                    className="h-full bg-gradient-to-r from-amber to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Items */}
            <div className="space-y-2">
                {SETUP_ITEMS.map(item => {
                    const isComplete = item.isComplete(house);
                    return (
                        <button
                            key={item.id}
                            onClick={() => item.link && navigate(item.link)}
                            disabled={isComplete}
                            className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors
                                ${isComplete
                                    ? 'text-stone-400 cursor-default'
                                    : 'text-charcoal hover:bg-amber/5 cursor-pointer group'
                                }`}
                        >
                            {isComplete ? (
                                <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
                            ) : (
                                <Circle size={18} className="text-stone-300 flex-shrink-0" />
                            )}
                            <span className={`flex-1 text-sm ${isComplete ? 'line-through' : 'font-medium'}`}>
                                {item.label}
                            </span>
                            {!isComplete && item.link && (
                                <ChevronRight size={16} className="text-stone-300 group-hover:text-amber" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
