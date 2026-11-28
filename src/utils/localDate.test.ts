import { describe, it, expect, vi, afterEach } from 'vitest';
import { toDateInputValue, fromDateInputValue, bookingNights } from './localDate';

describe('localDate', () => {
    it('formats using local getters, padded', () => {
        expect(toDateInputValue(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
        expect(toDateInputValue(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31');
    });

    it('parses to local midnight', () => {
        const d = fromDateInputValue('2026-07-10')!;
        expect(d.getFullYear()).toBe(2026);
        expect(d.getMonth()).toBe(6);
        expect(d.getDate()).toBe(10);
        expect(d.getHours()).toBe(0);
        expect(d.getMinutes()).toBe(0);
    });

    it('round-trips', () => {
        expect(toDateInputValue(fromDateInputValue('2026-03-29')!)).toBe('2026-03-29');
        const local = new Date(2026, 6, 10);
        expect(fromDateInputValue(toDateInputValue(local))!.getTime()).toBe(local.getTime());
    });

    it('returns null for empty or invalid input', () => {
        expect(fromDateInputValue('')).toBeNull();
        expect(fromDateInputValue('abc')).toBeNull();
        expect(fromDateInputValue('2026-02-31')).toBeNull();
        expect(fromDateInputValue('2026-13-01')).toBeNull();
    });
});

describe('bookingNights', () => {
    afterEach(() => vi.unstubAllEnvs());

    it('counts calendar days between local midnights', () => {
        expect(bookingNights(new Date(2026, 6, 10), new Date(2026, 6, 13))).toBe(3);
        expect(bookingNights(new Date(2026, 6, 10), new Date(2026, 6, 11))).toBe(1);
        expect(bookingNights(new Date(2026, 11, 30), new Date(2027, 0, 2))).toBe(3);
    });

    it('is not thrown off by a DST change inside the stay', () => {
        // Europe/Berlin leaves DST on 2026-10-25 (that day has 25 hours) and enters it on 2026-03-29 (23 hours).
        vi.stubEnv('TZ', 'Europe/Berlin');
        const autumnStart = new Date(2026, 9, 24);
        const autumnEnd = new Date(2026, 9, 27);
        if (autumnEnd.getTime() - autumnStart.getTime() === 3 * 86_400_000) {
            // The runtime did not honour the TZ switch: the assertion below would prove nothing.
            return;
        }
        // Raw ms maths gives 73 h / 24 = 3.04 -> ceil 4: the bug this helper avoids.
        expect(Math.ceil((autumnEnd.getTime() - autumnStart.getTime()) / 86_400_000)).toBe(4);
        expect(bookingNights(autumnStart, autumnEnd)).toBe(3);

        const springStart = new Date(2026, 2, 27);
        const springEnd = new Date(2026, 2, 30);
        expect(springEnd.getTime() - springStart.getTime()).toBe(71 * 3_600_000);
        expect(bookingNights(springStart, springEnd)).toBe(3);
    });
});
