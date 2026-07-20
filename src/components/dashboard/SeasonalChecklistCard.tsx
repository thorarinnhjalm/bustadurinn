import { useState, useEffect } from 'react';
import { Loader2, Sparkles, Snowflake, X, ChevronRight } from 'lucide-react';
import type { House } from '@/types/models';

// Stable default: an inline `= []` default parameter would create a new array
// reference every render, which would loop the modal's reset effect below
// since it keys on `items` (same trap documented in CheckoutModal/CheckInModal).
const NO_ITEMS: string[] = [];

interface SeasonalChecklistCardProps {
    house: House;
    /** Whether a seasonal_spring / seasonal_autumn internal_log already exists
     * for the current calendar year, derived by the caller from its existing
     * internal_logs listener. */
    seasonalLogged: { spring: boolean; autumn: boolean };
    onConfirm: (season: 'spring' | 'autumn', checklist: Record<string, boolean>) => Promise<void>;
}

type Season = 'spring' | 'autumn';

/** April-May => spring-opening window; September-October => winter-closing window. */
function getActiveSeason(date: Date): Season | null {
    const month = date.getMonth(); // 0-indexed
    if (month === 3 || month === 4) return 'spring';
    if (month === 8 || month === 9) return 'autumn';
    return null;
}

const SEASON_COPY: Record<Season, { title: string; description: string; icon: typeof Sparkles; cta: string }> = {
    spring: {
        title: 'Vor-opnun framundan',
        description: 'Kominn tími á að opna bústaðinn fyrir sumarið.',
        icon: Sparkles,
        cta: 'Skrá vor-opnun'
    },
    autumn: {
        title: 'Vetrarfrágangur framundan',
        description: 'Kominn tími á að ganga frá bústaðnum fyrir veturinn.',
        icon: Snowflake,
        cta: 'Skrá vetrarfrágang'
    }
};

export default function SeasonalChecklistCard({ house, seasonalLogged, onConfirm }: SeasonalChecklistCardProps) {
    const [showModal, setShowModal] = useState(false);
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(false);

    const season = getActiveSeason(new Date());
    const items = (season ? house.seasonal_checklists?.[season] : undefined) || NO_ITEMS;

    // Reset checked state whenever the modal (re)opens or the item set changes.
    useEffect(() => {
        if (showModal) {
            setCheckedItems({});
        }
    }, [showModal, items]);

    if (!season || items.length === 0 || seasonalLogged[season]) {
        return null;
    }

    const { title, description, icon: Icon, cta } = SEASON_COPY[season];

    const toggleItem = (item: string) => {
        setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }));
    };

    const handleConfirm = async () => {
        const fullMap: Record<string, boolean> = Object.fromEntries(
            items.map((item) => [item, !!checkedItems[item]])
        );
        setLoading(true);
        try {
            await onConfirm(season, fullMap);
            setShowModal(false);
        } catch {
            // onConfirm already logs the error; keep the modal open so the
            // user can retry rather than silently losing their ticks.
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setShowModal(true)}
                className="w-full text-left bg-amber/10 border border-amber/20 rounded-2xl p-5 flex items-center gap-4 hover:bg-amber/15 transition-colors"
            >
                <div className="w-10 h-10 rounded-full bg-amber/20 flex items-center justify-center text-amber-900 flex-shrink-0">
                    <Icon size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="font-serif font-bold text-[#1a1a1a]">{title}</h3>
                    <p className="text-sm text-stone-600">{description}</p>
                </div>
                <ChevronRight size={18} className="text-amber-900 flex-shrink-0" />
            </button>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center text-amber">
                                        <Icon size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-serif font-bold text-xl text-[#1a1a1a]">{title}</h3>
                                        <p className="text-sm text-stone-500">{description}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-[#1a1a1a]">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-stone-50 p-4 rounded-xl">
                                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-3">
                                        Gátlisti (valfrjálst)
                                    </p>
                                    <div className="space-y-2">
                                        {items.map((item) => (
                                            <label
                                                key={item}
                                                className="flex items-center gap-3 cursor-pointer select-none"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={!!checkedItems[item]}
                                                    onChange={() => toggleItem(item)}
                                                    className="w-4 h-4 rounded border-stone-300 text-amber focus:ring-amber"
                                                />
                                                <span className="text-sm text-stone-700">{item}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        disabled={loading}
                                        className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-stone-600 hover:bg-stone-100 transition-colors"
                                    >
                                        Hætta við
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={loading}
                                        className="flex-1 bg-[#1a1a1a] text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
                                        {cta}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
