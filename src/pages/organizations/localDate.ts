/**
 * Local-date helpers for <input type="date"> values.
 * `toISOString()` / `new Date('YYYY-MM-DD')` work in UTC and shift the day
 * outside UTC, so these use the browser's local calendar day instead.
 */

const pad = (n: number): string => String(n).padStart(2, '0');

/** Date -> 'YYYY-MM-DD' using the local calendar day. */
export function toLocalDateInputValue(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 'YYYY-MM-DD' -> Date at local midnight, or null when the value is empty/invalid. */
export function parseLocalDateInput(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const [, y, m, d] = match;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(date.getTime()) ? null : date;
}
