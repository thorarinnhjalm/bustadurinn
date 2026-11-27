/**
 * Local-calendar-day helpers for `<input type="date">`.
 *
 * Bookings are whole-day ranges anchored at LOCAL midnight (that is what
 * react-big-calendar slot selection returns). `Date#toISOString()` and
 * `new Date('yyyy-MM-dd')` both work in UTC, which shifts the day outside
 * UTC, so date inputs must go through these helpers instead.
 */

const pad = (n: number, width = 2): string => String(n).padStart(width, '0');

/** Formats a Date as 'yyyy-MM-dd' using its LOCAL year/month/day. */
export function toDateInputValue(d: Date): string {
    return `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Parses a 'yyyy-MM-dd' string into a Date at LOCAL midnight.
 * Returns null for empty or invalid input (including impossible dates such as
 * 2026-02-31, which `new Date(y, m, d)` would otherwise silently roll over).
 */
export function fromDateInputValue(s: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? '');
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }
    return date;
}
