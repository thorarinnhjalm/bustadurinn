/**
 * Tests for the contested-holiday window helpers added for the Phase 2
 * fairness rotation (getContestedHolidayWindows / getUpcomingContestedWindows).
 * The rest of icelandicHolidays.ts (getIcelandicHolidays, isHoliday, etc.)
 * predates this work and is intentionally left untested here.
 */

import { describe, it, expect } from 'vitest';
import {
    getContestedHolidayWindows,
    getUpcomingContestedWindows,
    CONTESTED_HOLIDAY_KEYS,
} from './icelandicHolidays';

function dateOnly(d: Date): string {
    return d.toISOString().slice(0, 10);
}

describe('getContestedHolidayWindows', () => {
    it('computes the paskar window for 2026 (Easter Sunday = Apr 5, 2026)', () => {
        const windows = getContestedHolidayWindows(2026);
        const paskar = windows.find((w) => w.key === 'paskar')!;

        expect(paskar.name).toBe('Páskar');
        expect(dateOnly(paskar.start)).toBe('2026-04-02'); // Skírdagur
        expect(dateOnly(paskar.end)).toBe('2026-04-07'); // exclusive, day after Annar í páskum (Apr 6)
    });

    it('computes the verslunarmannahelgi window for 2026 (first Monday of Aug = Aug 3, 2026)', () => {
        const windows = getContestedHolidayWindows(2026);
        const vmh = windows.find((w) => w.key === 'verslunarmannahelgi')!;

        expect(vmh.name).toBe('Verslunarmannahelgin');
        expect(dateOnly(vmh.start)).toBe('2026-07-31'); // Friday before
        expect(dateOnly(vmh.end)).toBe('2026-08-04'); // exclusive, day after commerce Monday
    });

    it('computes the jol window for 2026 (Þorláksmessa - Annar í jólum inclusive)', () => {
        const windows = getContestedHolidayWindows(2026);
        const jol = windows.find((w) => w.key === 'jol')!;

        expect(jol.name).toBe('Jólin');
        expect(dateOnly(jol.start)).toBe('2026-12-23');
        expect(dateOnly(jol.end)).toBe('2026-12-27'); // exclusive, day after Annar í jólum (Dec 26)
    });

    it('computes the aramot window keyed to the year of Gamlársdagur (Dec 31), crossing into the next year', () => {
        const windows = getContestedHolidayWindows(2026);
        const aramot = windows.find((w) => w.key === 'aramot')!;

        expect(aramot.name).toBe('Áramótin');
        expect(dateOnly(aramot.start)).toBe('2026-12-31'); // Gamlársdagur
        expect(dateOnly(aramot.end)).toBe('2027-01-02'); // exclusive, day after Nýársdagur (Jan 1, 2027)
    });

    it('returns exactly the four known keys, in a stable set', () => {
        const windows = getContestedHolidayWindows(2026);
        expect(windows.map((w) => w.key).sort()).toEqual([...CONTESTED_HOLIDAY_KEYS].sort());
    });
});

describe('getUpcomingContestedWindows', () => {
    it('returns windows whose start falls within the range, sorted ascending', () => {
        // From Jul 20, 2026, 3 months ahead lands early Oct 2026: should pick up
        // verslunarmannahelgi (Jul 31) only - paskar (Apr) is in the past, jol/aramot are later.
        const windows = getUpcomingContestedWindows(new Date(2026, 6, 20), 3);

        expect(windows).toHaveLength(1);
        expect(windows[0].key).toBe('verslunarmannahelgi');
        expect(dateOnly(windows[0].start)).toBe('2026-07-31');
    });

    it('spans a calendar-year boundary correctly and stays sorted ascending', () => {
        // From Nov 1, 2026, 3 months ahead lands Feb 1, 2027: should pick up jol
        // (Dec 23, 2026) then aramot (Dec 31, 2026) - NOT a next-year aramot window.
        const windows = getUpcomingContestedWindows(new Date(2026, 10, 1), 3);

        expect(windows.map((w) => w.key)).toEqual(['jol', 'aramot']);
        expect(dateOnly(windows[0].start)).toBe('2026-12-23');
        expect(dateOnly(windows[1].start)).toBe('2026-12-31');
    });

    it('excludes a previous aramot window whose start is before "from", even near Jan 1', () => {
        // From Jan 5, 2027: the aramot window generated for year 2026 starts Dec
        // 31, 2026, which is before `from` and must not be included.
        const windows = getUpcomingContestedWindows(new Date(2027, 0, 5), 1);
        expect(windows.some((w) => w.key === 'aramot' && dateOnly(w.start) === '2026-12-31')).toBe(false);
    });
});
