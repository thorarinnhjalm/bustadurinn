/**
 * Árbók bústaðarins — Auto-generated year-in-review page for a shared
 * summer house. Aggregates bookings, guestbook entries, and contested-holiday
 * rotation winners for a chosen year via arbokService.buildYearbook.
 *
 * Print-friendly: `print:` utility variants hide chrome (back button, year
 * selector, print button) and a small `@media print` style block cleans up
 * backgrounds/shadows so "Prenta / vista sem PDF" (window.print()) produces a
 * clean PDF.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Printer, Moon, Users, CalendarDays, Sparkles, Quote } from 'lucide-react';
import { format, getYear } from 'date-fns';
import { is } from 'date-fns/locale';
import { useAppStore } from '@/store/appStore';
import MobileNav from '@/components/MobileNav';
import EmptyState from '@/components/EmptyState';
import { buildYearbook } from '@/services/arbokService';
import type { Yearbook } from '@/services/arbokService';
import { logger } from '@/utils/logger';

const PRINT_STYLES = `
@media print {
  nav, .arbok-no-print { display: none !important; }
  body, .arbok-print-bg { background: white !important; }
  .arbok-card { box-shadow: none !important; border: 1px solid #ddd !important; break-inside: avoid; }
  .arbok-hero { break-inside: avoid; }
}
`;

const monthLabel = (month: number) => format(new Date(2000, month, 1), 'MMMM', { locale: is });

const dateLabel = (date: Date) => format(date, 'd. MMMM', { locale: is });

export default function ArbokPage() {
    const navigate = useNavigate();
    const currentHouse = useAppStore((state) => state.currentHouse);

    const currentYear = getYear(new Date());
    // `currentHouse` comes straight from the Firestore snapshot in the store,
    // so `created_at` is still a Timestamp (not a Date) — getYear() on it
    // yields NaN, which made the year loop below produce ZERO options.
    const earliestYear = useMemo(() => {
        const raw: any = currentHouse?.created_at;
        const asDate =
            raw && typeof raw.toDate === 'function'
                ? raw.toDate()
                : raw instanceof Date
                    ? raw
                    : raw
                        ? new Date(raw)
                        : null;
        const y = asDate && !isNaN(asDate.getTime()) ? getYear(asDate) : currentYear;
        // Never let a bogus/future created_at collapse the selector.
        return Math.min(y, currentYear);
    }, [currentHouse?.created_at, currentYear]);

    const yearOptions = useMemo(() => {
        const years: number[] = [];
        for (let y = currentYear; y >= earliestYear; y--) years.push(y);
        return years.length > 0 ? years : [currentYear];
    }, [currentYear, earliestYear]);

    const [year, setYear] = useState(currentYear);
    const [yearbook, setYearbook] = useState<Yearbook | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentHouse?.id) return;
        let cancelled = false;
        setLoading(true);

        buildYearbook(currentHouse.id, year, currentHouse)
            .then((result) => {
                if (!cancelled) setYearbook(result);
            })
            .catch((err) => {
                logger.error('ArbokPage: failed to build yearbook', err);
                if (!cancelled) setYearbook(null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [currentHouse, year]);

    if (!currentHouse) {
        return (
            <div className="min-h-screen bg-bone flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-charcoal border-t-transparent rounded-full" />
            </div>
        );
    }

    // A failed fetch is NOT an empty year — surface it instead of pretending
    // there was no activity.
    const loadErrors = yearbook?.errors ?? [];
    const hasLoadError = (!loading && !yearbook) || loadErrors.length > 0;

    const isEmpty =
        !loading &&
        yearbook &&
        loadErrors.length === 0 &&
        yearbook.totalBookings === 0 &&
        yearbook.guestbookTotalCount === 0 &&
        yearbook.holidays.every((h) => !h.winnerUserId);

    const maxFamilyNights = yearbook?.familyNights[0]?.nights ?? 0;

    return (
        <div className="min-h-screen bg-bone pb-24 arbok-print-bg">
            <style>{PRINT_STYLES}</style>

            {/* Header */}
            <div className="max-w-4xl mx-auto px-6 pt-6 arbok-no-print">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-grey-mid hover:text-charcoal mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Til baka
                </button>

                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-serif text-charcoal mb-1">Árbók bústaðarins</h1>
                        <p className="text-grey-mid">Sjálfvirkt samantekt ársins fyrir {currentHouse.name}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="input w-auto"
                            aria-label="Veldu ár"
                        >
                            {yearOptions.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                        <button onClick={() => window.print()} className="btn btn-primary">
                            <Printer className="w-4 h-4 mr-2" />
                            Prenta / vista sem PDF
                        </button>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="max-w-4xl mx-auto px-6 space-y-6 animate-pulse">
                    <div className="h-64 bg-stone-200 rounded-lg" />
                    <div className="grid grid-cols-3 gap-4">
                        <div className="h-24 bg-stone-200 rounded-lg" />
                        <div className="h-24 bg-stone-200 rounded-lg" />
                        <div className="h-24 bg-stone-200 rounded-lg" />
                    </div>
                    <div className="h-48 bg-stone-200 rounded-lg" />
                </div>
            )}

            {!loading && hasLoadError && (
                <div className="max-w-4xl mx-auto px-6 arbok-no-print">
                    <div className="bg-amber/10 border border-amber/30 rounded-xl p-5">
                        <p className="font-serif font-bold text-charcoal mb-1">
                            Ekki tókst að sækja öll gögn
                        </p>
                        <p className="text-sm text-stone-600">
                            Árbókin gæti því verið ófullgerð. Reyndu að endurhlaða síðuna — ef þetta
                            heldur áfram gætu gögnin þurft uppfærslu.
                        </p>
                        {loadErrors.length > 0 && (
                            <ul className="mt-3 text-xs text-stone-500 font-mono space-y-1">
                                {loadErrors.map((e) => (
                                    <li key={e}>{e}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {!loading && isEmpty && (
                <div className="max-w-4xl mx-auto px-6">
                    <EmptyState
                        icon={BookOpen}
                        title="Engin gögn fyrir þetta ár enn"
                        description={`Þegar bókanir og færslur í gestabók bætast við fyrir ${year} birtist árbókin hér.`}
                    />
                </div>
            )}

            {!loading && yearbook && !isEmpty && (
                <div className="max-w-4xl mx-auto px-6 space-y-8">
                    {/* Hero */}
                    <div
                        className="arbok-card arbok-hero relative rounded-lg overflow-hidden border border-stone-200 min-h-[280px] flex items-end"
                        style={{
                            backgroundImage: currentHouse.image_url
                                ? `linear-gradient(to top, rgba(26,26,26,0.85), rgba(26,26,26,0.15)), url(${currentHouse.image_url})`
                                : 'linear-gradient(135deg, #1a1a1a, #4a4642)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        {/* index.css sets `text-charcoal` directly on every h1-h6,
                            and a rule on the element beats colour inherited from
                            this wrapper — so the heading needs its own light
                            colour class to be readable over the photo. */}
                        <div className="relative p-8 text-bone">
                            <p className="uppercase tracking-widest text-xs font-medium text-amber mb-2 drop-shadow">
                                Árbók {year}
                            </p>
                            <h2 className="text-4xl md:text-5xl font-serif font-semibold text-bone mb-0 drop-shadow-lg">
                                {currentHouse.name} {year}
                            </h2>
                        </div>
                    </div>

                    {/* Big stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="arbok-card card text-center">
                            <Moon className="w-5 h-5 text-amber mx-auto mb-2" />
                            <p className="text-4xl font-serif text-charcoal">{yearbook.totalNights}</p>
                            <p className="text-sm text-grey-mid mt-1">nætur</p>
                        </div>
                        <div className="arbok-card card text-center">
                            <CalendarDays className="w-5 h-5 text-amber mx-auto mb-2" />
                            <p className="text-4xl font-serif text-charcoal">{yearbook.totalBookings}</p>
                            <p className="text-sm text-grey-mid mt-1">bókanir</p>
                        </div>
                        <div className="arbok-card card text-center">
                            <Users className="w-5 h-5 text-amber mx-auto mb-2" />
                            <p className="text-4xl font-serif text-charcoal">{yearbook.familyNights.length}</p>
                            <p className="text-sm text-grey-mid mt-1">fjölskyldur</p>
                        </div>
                    </div>

                    {/* Highlights */}
                    {(yearbook.busiestMonth || yearbook.longestStay || yearbook.firstVisit || yearbook.lastVisit) && (
                        <div className="arbok-card card">
                            <h3 className="text-xl font-serif text-charcoal mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber" />
                                Hápunktar ársins
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                {yearbook.busiestMonth && (
                                    <div>
                                        <p className="text-grey-mid">Annasamasti mánuðurinn</p>
                                        <p className="text-charcoal font-medium capitalize">
                                            {monthLabel(yearbook.busiestMonth.month)} ({yearbook.busiestMonth.nights} nætur)
                                        </p>
                                    </div>
                                )}
                                {yearbook.longestStay && (
                                    <div>
                                        <p className="text-grey-mid">Lengsta dvölin</p>
                                        <p className="text-charcoal font-medium">
                                            {yearbook.longestStay.userName} — {yearbook.longestStay.nights} nætur (
                                            {dateLabel(yearbook.longestStay.start)} – {dateLabel(yearbook.longestStay.end)})
                                        </p>
                                    </div>
                                )}
                                {yearbook.firstVisit && (
                                    <div>
                                        <p className="text-grey-mid">Fyrsta heimsóknin</p>
                                        <p className="text-charcoal font-medium">
                                            {yearbook.firstVisit.userName} — {dateLabel(yearbook.firstVisit.start)}
                                        </p>
                                    </div>
                                )}
                                {yearbook.lastVisit && (
                                    <div>
                                        <p className="text-grey-mid">Síðasta heimsóknin</p>
                                        <p className="text-charcoal font-medium">
                                            {yearbook.lastVisit.userName} — {dateLabel(yearbook.lastVisit.start)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Contested holidays */}
                    <div className="arbok-card card">
                        <h3 className="text-xl font-serif text-charcoal mb-4">Stórhelgar ársins</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {yearbook.holidays.map((h) => (
                                <div
                                    key={h.key}
                                    className="flex items-center justify-between px-4 py-3 bg-bone rounded-md border border-stone-200"
                                >
                                    <span className="font-medium text-charcoal">{h.name}</span>
                                    <span className="text-sm text-grey-mid">
                                        {h.winnerUserName ?? 'Engin bókun'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Per-family nights bar */}
                    {yearbook.familyNights.length > 0 && (
                        <div className="arbok-card card">
                            <h3 className="text-xl font-serif text-charcoal mb-4">Nætur eftir fjölskyldu</h3>
                            <div className="space-y-3">
                                {yearbook.familyNights.map((f) => (
                                    <div key={f.userId}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-charcoal">{f.userName}</span>
                                            <span className="text-grey-mid">{f.nights} nætur</span>
                                        </div>
                                        <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-amber rounded-full"
                                                style={{
                                                    width: `${maxFamilyNights > 0 ? (f.nights / maxFamilyNights) * 100 : 0}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Guestbook quotes */}
                    {yearbook.guestbookEntries.length > 0 && (
                        <div className="arbok-card card">
                            <h3 className="text-xl font-serif text-charcoal mb-4">Úr gestabókinni</h3>
                            <div className="space-y-6">
                                {yearbook.guestbookEntries.map((q) => (
                                    <blockquote key={q.id} className="border-l-2 border-amber pl-4">
                                        <Quote className="w-4 h-4 text-amber/60 mb-1" />
                                        <p className="text-charcoal italic leading-relaxed">&ldquo;{q.message}&rdquo;</p>
                                        <footer className="text-sm text-grey-mid mt-2">
                                            — {q.author}, {dateLabel(q.date)}
                                        </footer>
                                    </blockquote>
                                ))}
                            </div>
                            {yearbook.guestbookTotalCount > yearbook.guestbookEntries.length && (
                                <p className="text-xs text-grey-mid mt-4">
                                    Og {yearbook.guestbookTotalCount - yearbook.guestbookEntries.length} færslur til viðbótar.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Closing line */}
                    <div className="text-center py-8">
                        <p className="font-serif text-xl text-charcoal">
                            Þannig leið árið {year} í {currentHouse.name} — takk fyrir samveruna.
                        </p>
                    </div>
                </div>
            )}

            <div className="arbok-no-print">
                <MobileNav />
            </div>
        </div>
    );
}
