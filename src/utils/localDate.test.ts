import { describe, it, expect } from 'vitest';
import { toDateInputValue, fromDateInputValue } from './localDate';

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
