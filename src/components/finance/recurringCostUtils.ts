import type { RecurringCost, LedgerEntry } from '@/types/models';

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
