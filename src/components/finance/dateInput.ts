/**
 * Local-date helpers for <input type="date"> values (YYYY-MM-DD).
 * Using local getters avoids the UTC off-by-one that toISOString() causes
 * for users in non-UTC timezones.
 */

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateInputValue(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parses YYYY-MM-DD into local midnight. Returns an Invalid Date for bad input. */
export function fromDateInputValue(s: string): Date {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return new Date(NaN);
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const date = new Date(y, mo - 1, d);
    // Reject overflow like 2025-02-31
    if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) {
        return new Date(NaN);
    }
    return date;
}
