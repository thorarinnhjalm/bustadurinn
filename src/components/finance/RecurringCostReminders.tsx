import { useMemo } from 'react';
import { BellRing } from 'lucide-react';
import type { RecurringCost, LedgerEntry } from '@/types/models';
import { getDueRecurringCosts } from '@/components/finance/recurringCostUtils';

const MONTHS = [
    'janúar', 'febrúar', 'mars', 'apríl', 'maí', 'júní',
    'júlí', 'ágúst', 'september', 'október', 'nóvember', 'desember'
];

interface RecurringCostRemindersProps {
    recurringCosts: RecurringCost[];
    entries: LedgerEntry[];
    onFill: (cost: RecurringCost) => void;
}

export default function RecurringCostReminders({ recurringCosts, entries, onFill }: RecurringCostRemindersProps) {
    const now = new Date();
    const dueCosts = useMemo(
        () => getDueRecurringCosts(recurringCosts, entries, now),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [recurringCosts, entries]
    );

    if (dueCosts.length === 0) return null;

    const monthName = MONTHS[now.getMonth()];

    return (
        <section aria-label="Áminningar um endurtekinn kostnað" className="space-y-2 mb-6">
            {dueCosts.map((cost) => (
                <div
                    key={cost.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-amber/10 border border-amber/30 rounded-lg"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <BellRing className="w-4 h-4 text-amber-700 flex-shrink-0" aria-hidden="true" />
                        <p className="text-sm text-charcoal min-w-0">
                            „{cost.name}" væntanlegur í {monthName} — skrá upphæð
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onFill(cost)}
                        className="btn btn-secondary btn-sm flex-shrink-0"
                    >
                        Skrá upphæð
                        <span className="sr-only"> fyrir {cost.name}</span>
                    </button>
                </div>
            ))}
        </section>
    );
}
