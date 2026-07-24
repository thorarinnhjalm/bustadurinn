/**
 * Holiday Fairness Panel ("Stórhelgar") — ROADMAP_2026 Phase 2.4
 *
 * Shows the upcoming contested-holiday windows (Páskar, Verslunarmannahelgin,
 * Jólin, Áramótin) for the next 12 months, whose turn it is under the
 * fairness rotation, and a short claim history. Purely additive UI on top of
 * the Stage A logic layer (`icelandicHolidays.ts` / `fairnessService.ts`) —
 * this component does not implement any fairness logic itself.
 *
 * Fetches priorities lazily on mount, in parallel, and never blocks the
 * calendar: the caller decides whether to render this panel at all (it
 * should only be mounted when `house.holiday_mode === 'fairness'` and the
 * house has 2+ owners).
 */

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Trophy, Unlock, Sparkles } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { is } from 'date-fns/locale';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUpcomingContestedWindows } from '@/utils/icelandicHolidays';
import type { ContestedHolidayWindow } from '@/utils/icelandicHolidays';
import { getHolidayPriority } from '@/services/fairnessService';
import type { HolidayPriority } from '@/services/fairnessService';
import { logger } from '@/utils/logger';

interface HolidayFairnessPanelProps {
    houseId: string;
    ownerIds: string[];
    onClaimWindow: (window: ContestedHolidayWindow) => void;
}

interface WindowRow {
    window: ContestedHolidayWindow;
    priority: HolidayPriority | null;
}

/** "2.–7. apríl 2026" style range, using the window's last INCLUSIVE day
 * (the window's `end` is exclusive, see icelandicHolidays.ts). */
function formatWindowRange(window: ContestedHolidayWindow): string {
    const lastDay = subDays(window.end, 1);
    const sameMonth = window.start.getMonth() === lastDay.getMonth();
    const sameYear = window.start.getFullYear() === lastDay.getFullYear();

    if (sameMonth && sameYear) {
        return `${window.start.getDate()}.–${lastDay.getDate()}. ${format(lastDay, 'MMMM yyyy', { locale: is })}`;
    }
    if (sameYear) {
        return `${format(window.start, 'd. MMM', { locale: is })} – ${format(lastDay, 'd. MMM yyyy', { locale: is })}`;
    }
    return `${format(window.start, 'd. MMM yyyy', { locale: is })} – ${format(lastDay, 'd. MMM yyyy', { locale: is })}`;
}

function formatHistoryLine(priority: HolidayPriority): string {
    return [...priority.history]
        .reverse() // most recent year first
        .map((entry) => `${entry.year}: ${entry.heldByUserName ?? '—'}`)
        .join(' · ');
}

export default function HolidayFairnessPanel({ houseId, ownerIds, onClaimWindow }: HolidayFairnessPanelProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<WindowRow[]>([]);
    const [userNames, setUserNames] = useState<Record<string, string>>({});

    const ownerIdsKey = ownerIds.join(',');

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            const upcoming = getUpcomingContestedWindows(new Date(), 12);

            const [priorities, nameEntries] = await Promise.all([
                Promise.all(
                    upcoming.map((window) =>
                        getHolidayPriority(houseId, window, ownerIds).catch((err) => {
                            logger.error('HolidayFairnessPanel: failed to load priority', window.key, err);
                            return null;
                        })
                    )
                ),
                Promise.all(
                    ownerIds.map(async (uid) => {
                        try {
                            const snap = await getDoc(doc(db, 'users', uid));
                            const name = (snap.data() as { name?: string } | undefined)?.name ?? 'Meðlimur';
                            return [uid, name] as const;
                        } catch (err) {
                            logger.error('HolidayFairnessPanel: failed to resolve user name', uid, err);
                            return [uid, 'Meðlimur'] as const;
                        }
                    })
                ),
            ]);

            if (cancelled) return;

            setRows(upcoming.map((window, i) => ({ window, priority: priorities[i] })));
            setUserNames(Object.fromEntries(nameEntries));
            setLoading(false);
        }

        if (houseId && ownerIds.length >= 2) {
            load();
        } else {
            setRows([]);
            setLoading(false);
        }

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- ownerIdsKey stands in for ownerIds identity
    }, [houseId, ownerIdsKey]);

    if (!loading && rows.length === 0) return null;

    return (
        <div className="mt-6 card">
            <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className="w-full flex items-center justify-between gap-2"
            >
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber" />
                    <h3 className="text-lg font-serif">Stórhelgar</h3>
                </div>
                {collapsed ? (
                    <ChevronDown className="w-5 h-5 text-grey-mid" />
                ) : (
                    <ChevronUp className="w-5 h-5 text-grey-mid" />
                )}
            </button>

            {!collapsed && (
                <div className="mt-4 space-y-3">
                    {loading &&
                        [0, 1].map((i) => (
                            <div key={i} className="animate-pulse bg-stone-100 rounded-md h-20" />
                        ))}

                    {!loading &&
                        rows.map(({ window, priority }) => {
                            const now = new Date();
                            const opensToAllAt = priority?.opensToAllAt ?? null;
                            // Open when the cutoff has passed OR when there is no
                            // rotation history yet (topUserId null => nobody's turn
                            // to protect, the service allows everyone).
                            const isOpenToAll =
                                (opensToAllAt !== null && now >= opensToAllAt) ||
                                priority?.topUserId === null;
                            const topUserName =
                                priority?.topUserId != null
                                    ? userNames[priority.topUserId] ?? 'Óþekktur'
                                    : null;
                            const historyLine = priority ? formatHistoryLine(priority) : '';

                            return (
                                <div
                                    key={window.key}
                                    className="border border-stone-200 rounded-md p-4 bg-bone/40"
                                >
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div>
                                            <p className="font-serif text-base text-charcoal">{window.name}</p>
                                            <p className="text-sm text-grey-mid">{formatWindowRange(window)}</p>
                                        </div>

                                        {priority && (
                                            <span
                                                className={
                                                    isOpenToAll
                                                        ? 'badge bg-green-500/10 text-green-700 border-green-500/20'
                                                        : 'badge'
                                                }
                                            >
                                                {isOpenToAll ? (
                                                    <span className="flex items-center gap-1">
                                                        <Unlock className="w-3 h-3" /> Opið öllum
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        <Trophy className="w-3 h-3" /> Forgangur: {topUserName ?? '—'}
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </div>

                                    {priority && !isOpenToAll && opensToAllAt && (
                                        <p className="text-xs text-grey-mid mt-2">
                                            Opnast öllum meðlimum {format(opensToAllAt, 'd. MMMM yyyy', { locale: is })}.
                                        </p>
                                    )}

                                    {priority && historyLine && (
                                        <p className="text-xs text-grey-mid mt-2 uppercase tracking-widest">
                                            {historyLine}
                                        </p>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => onClaimWindow(window)}
                                        className="btn btn-secondary text-sm mt-3 w-full sm:w-auto"
                                    >
                                        Bóka þessa helgi
                                    </button>
                                </div>
                            );
                        })}
                </div>
            )}
        </div>
    );
}
