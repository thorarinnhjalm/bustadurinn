import { describe, it, expect } from 'vitest';
import type { LedgerEntry } from '@/types/models';
import {
    validateAmount,
    parseAmountInput,
    filterEntriesByYear,
    getEntryYears,
    computeTotals,
    resolvePaidByName
} from '@/components/finance/ledgerUtils';
import { toDateInputValue, fromDateInputValue } from '@/components/finance/dateInput';
import { computeSettlement, FORMER_MEMBER_NAME } from '@/components/finance/settlement';

const entry = (over: Partial<LedgerEntry>): LedgerEntry => ({
    id: Math.random().toString(),
    house_id: 'h',
    date: new Date(2025, 5, 1),
    category: 'x',
    description: '',
    amount: 1000,
    type: 'expense',
    paid_by_user_id: 'a',
    created_at: new Date(),
    ...over
});

describe('validateAmount', () => {
    it('accepts valid amounts', () => {
        expect(validateAmount(1)).toBeNull();
        expect(validateAmount(100_000_000)).toBeNull();
    });
    it('rejects zero, negative, NaN, Infinity and huge amounts', () => {
        expect(validateAmount(0)).toBeTruthy();
        expect(validateAmount(-5)).toBeTruthy();
        expect(validateAmount(NaN)).toBeTruthy();
        expect(validateAmount(Infinity)).toBeTruthy();
        expect(validateAmount(100_000_001)).toBeTruthy();
    });
    it('parseAmountInput gives NaN for junk', () => {
        expect(parseAmountInput('')).toBeNaN();
        expect(parseAmountInput('abc')).toBeNaN();
        expect(parseAmountInput(' 1500 ')).toBe(1500);
    });
});

describe('year views and fund balance', () => {
    const entries = [
        entry({ date: new Date(2026, 0, 2), amount: 500, type: 'income' }),
        entry({ date: new Date(2025, 11, 31), amount: 200, type: 'expense' }),
        entry({ date: new Date(2024, 3, 1), amount: 1000, type: 'income' })
    ];
    it('lists years with entries plus the current year, newest first', () => {
        expect(getEntryYears(entries, 2027)).toEqual([2027, 2026, 2025, 2024]);
        expect(getEntryYears([], 2026)).toEqual([2026]);
    });
    it('filters by local year (back-dated entries stay visible)', () => {
        expect(filterEntriesByYear(entries, 2024)).toHaveLength(1);
        expect(filterEntriesByYear(entries, 2025)).toHaveLength(1);
    });
    it('fund balance spans all years', () => {
        expect(computeTotals(entries)).toEqual({ income: 1500, expense: 200, balance: 1300 });
        expect(computeTotals(filterEntriesByYear(entries, 2026)).balance).toBe(500);
    });
});

describe('date input helpers', () => {
    it('round-trips local dates', () => {
        const d = new Date(2025, 0, 1, 0, 30);
        expect(toDateInputValue(d)).toBe('2025-01-01');
        const back = fromDateInputValue('2025-01-01');
        expect(back.getFullYear()).toBe(2025);
        expect(back.getMonth()).toBe(0);
        expect(back.getDate()).toBe(1);
        expect(back.getHours()).toBe(0);
    });
    it('rejects invalid input', () => {
        expect(Number.isNaN(fromDateInputValue('').getTime())).toBe(true);
        expect(Number.isNaN(fromDateInputValue('2025-02-31').getTime())).toBe(true);
    });
});

describe('resolvePaidByName', () => {
    it('new entry uses creator', () => {
        expect(resolvePaidByName({ isEdit: false, creatorName: 'Jón' })).toBe('Jón');
    });
    it('edit without split preserves original (undefined = untouched)', () => {
        expect(resolvePaidByName({ isEdit: true, creatorName: 'Editor', original: { paid_by_name: 'Anna' } })).toBeUndefined();
    });
    it('split derives names', () => {
        expect(resolvePaidByName({ isEdit: true, split: [{ name: 'Anna Jónsdóttir' }, { name: 'Páll' }] })).toBe('Anna, Páll');
    });
});

describe('computeSettlement', () => {
    const names: Record<string, string> = { a: 'Anna', b: 'Bjarni' };
    const nameFor = (uid: string) => names[uid] || 'Meðeigandi';
    it('differences net to zero including former members', () => {
        const entries = [
            entry({ amount: 3000, paid_by_user_id: 'a' }),
            entry({ amount: 1001, paid_by_user_id: 'gone', paid_by_name: 'Gunnar' }),
            entry({ amount: 500, paid_by_user_id: 'gone2' }),
            entry({ amount: 900, paid_by_user_id: 'a', split_between: [{ uid: 'b', name: 'Bjarni' }, { uid: 'gone', name: 'Gunnar' }] }),
            entry({ amount: 700, type: 'income' })
        ];
        const r = computeSettlement(entries, ['a', 'b'], undefined, nameFor);
        const sum = r.rows.reduce((s, row) => s + row.difference, 0);
        expect(Math.abs(sum)).toBeLessThan(1);
        expect(r.rows.find((x) => x.uid === 'gone')?.name).toBe('Gunnar');
        expect(r.rows.find((x) => x.uid === 'gone2')?.name).toBe(FORMER_MEMBER_NAME);
        expect(r.totalIncome).toBe(700);
    });
});
