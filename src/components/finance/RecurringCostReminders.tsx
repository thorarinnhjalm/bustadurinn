import { useMemo } from 'react';
import { BellRing } from 'lucide-react';
import type { RecurringCost, LedgerEntry } from '@/types/models';

const MONTHS = [
    'janúar', 'febrúar', 'mars', 'apríl', 'maí', 'júní',
    'júlí', 'ágúst', 'september', 'október', 'nóvember', 'desember'
];

interface RecurringCostRemindersProps {
    recurringCosts: RecurringCost[];
    entries: LedgerEntry[];
    onFill: (cost: RecurringCost) => void;
}

/**
 * A recurring cost is "due" this month when its frequency is monthly, or
 * its due_month matches the current calendar month. It is considered
 * already handled (and hidden) once a matching expense entry — same
 * category, same month/year — exists in the ledger.
 */
export function getDueRecurringCosts(recurringCosts: RecurringCost[], entries: LedgerEntry[], now = new Date()): RecurringCost[] {
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    return recurringCosts.filter((cost) => {
        const isDue = cost.frequency === 'monthly' || cost.due_month === currentMonth;
        if (!isDue) return false;

        const alreadyRecorded = entries.some((entry) => {
            if (entry.type !== 'expense') return false;
            const entryDate = new Date(entry.date);
            return (
                entry.category.trim().toLowerCase() === cost.category.trim().toLowerCase() &&
                entryDate.getMonth() + 1 === currentMonth &&
                entryDate.getFullYear() === currentYear
            );
        });

        return !alreadyRecorded;
    });
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
        <div className="space-y-2 mb-6">
            {dueCosts.map((cost) => (
                <div
                    key={cost.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-amber/10 border border-amber/30 rounded-lg"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <BellRing className="w-4 h-4 text-amber-700 flex-shrink-0" />
                        <p className="text-sm text-charcoal min-w-0">
                            „{cost.name}" væntanlegur í {monthName} — skrá upphæð
                        </p>
                    </div>
                    <button
                        onClick={() => onFill(cost)}
                        className="btn btn-secondary btn-sm flex-shrink-0"
                    >
                        Skrá upphæð
                    </button>
                </div>
            ))}
        </div>
    );
}
