/**
 * Pure helpers for the finance page: amount validation, per-year views of
 * the ledger and the fund balance (which always spans ALL entries).
 */
import type { LedgerEntry } from '@/types/models';

export const MAX_AMOUNT = 100_000_000;

/** Returns an Icelandic error message, or null when the amount is valid. */
export function validateAmount(amount: number): string | null {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
        return 'Upphæð verður að vera gild tala.';
    }
    if (amount <= 0) return 'Upphæð verður að vera hærri en 0.';
    if (amount > MAX_AMOUNT) return 'Upphæð má ekki vera hærri en 100.000.000 kr.';
    return null;
}

/** Parses the text of an amount input; returns NaN for anything that is not a plain number. */
export function parseAmountInput(s: string): number {
    const trimmed = s.trim();
    if (trimmed === '') return NaN;
    return Number(trimmed);
}

export function filterEntriesByYear(entries: LedgerEntry[], year: number): LedgerEntry[] {
    return entries.filter((e) => new Date(e.date).getFullYear() === year);
}

/** Years that have entries, plus the current year, newest first. */
export function getEntryYears(entries: LedgerEntry[], currentYear: number): number[] {
    const years = new Set<number>([currentYear]);
    entries.forEach((e) => {
        const y = new Date(e.date).getFullYear();
        if (Number.isFinite(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
}

export function computeTotals(entries: LedgerEntry[]): { income: number; expense: number; balance: number } {
    let income = 0;
    let expense = 0;
    entries.forEach((e) => {
        if (e.type === 'expense') expense += e.amount;
        else income += e.amount;
    });
    return { income, expense, balance: income - expense };
}

/**
 * Decides the `paid_by_name` to store for a ledger entry.
 * - Payers picked (split): names derived from the picked payers.
 * - New entry without split: the creator.
 * - Edited entry without split: keep the original payer (never overwrite it
 *   with the editor's name). If the original name was derived from a split
 *   that was just cleared, fall back to the creator's name when known.
 * Returns undefined when the stored value should be left untouched.
 */
export function resolvePaidByName(opts: {
    isEdit: boolean;
    split?: { name: string }[];
    creatorName?: string;
    original?: { paid_by_name?: string; split_between?: unknown[] } | null;
}): string | undefined {
    const { isEdit, split, creatorName, original } = opts;
    if (split && split.length > 0) {
        return split.map((u) => u.name.split(' ')[0]).join(', ');
    }
    if (!isEdit) return creatorName || 'Notandi';
    const hadSplit = (original?.split_between?.length ?? 0) > 0;
    if (hadSplit) return creatorName || undefined;
    return undefined;
}
