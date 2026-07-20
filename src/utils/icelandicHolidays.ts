/**
 * Icelandic Holidays (Íslenskir Frídagar)
 * Includes both fixed and movable holidays
 */

import { addDays, addMonths, getYear } from 'date-fns';

export interface Holiday {
    name: string;
    date: Date;
    type: 'public' | 'bank' | 'observance';
    importance: 'high' | 'medium' | 'low';
}

/**
 * Calculate Easter Sunday for a given year (using Computus algorithm)
 */
const calculateEaster = (year: number): Date => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month, day);
};

/**
 * Calculate the first day of summer (Sumardagurinn fyrsti)
 * First Thursday after April 18th
 */
const calculateFirstDayOfSummer = (year: number): Date => {
    const april19 = new Date(year, 3, 19); // April 19
    const dayOfWeek = april19.getDay();
    // Thursday is 4, calculate days until next Thursday
    const daysUntilThursday = dayOfWeek <= 4 ? 4 - dayOfWeek : 11 - dayOfWeek;
    return addDays(april19, daysUntilThursday);
};

/**
 * Calculate Commerce Day (Frídagur verslunarmanna)
 * First Monday in August
 */
const calculateCommerceDay = (year: number): Date => {
    const august1 = new Date(year, 7, 1); // August 1
    const dayOfWeek = august1.getDay();
    // Monday is 1
    const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
    return addDays(august1, daysUntilMonday);
};

/**
 * Get all Icelandic holidays for a given year
 */
export const getIcelandicHolidays = (year: number): Holiday[] => {
    const easter = calculateEaster(year);
    const firstDayOfSummer = calculateFirstDayOfSummer(year);
    const commerceDay = calculateCommerceDay(year);

    return [
        // New Year's Day
        {
            name: 'Nýársdagur',
            date: new Date(year, 0, 1),
            type: 'public',
            importance: 'high'
        },

        // Maundy Thursday (Skírdagur)
        {
            name: 'Skírdagur',
            date: addDays(easter, -3),
            type: 'public',
            importance: 'high'
        },

        // Good Friday (Föstudagurinn langi)
        {
            name: 'Föstudagurinn langi',
            date: addDays(easter, -2),
            type: 'public',
            importance: 'high'
        },

        // Easter Sunday (Páskadagur)
        {
            name: 'Páskadagur',
            date: easter,
            type: 'public',
            importance: 'high'
        },

        // Easter Monday (Annar í páskum)
        {
            name: 'Annar í páskum',
            date: addDays(easter, 1),
            type: 'public',
            importance: 'high'
        },

        // First Day of Summer (Sumardagurinn fyrsti)
        {
            name: 'Sumardagurinn fyrsti',
            date: firstDayOfSummer,
            type: 'public',
            importance: 'medium'
        },

        // Labour Day (Verkalýðsdagurinn / Baráttudagur verkalýðsins)
        {
            name: 'Verkalýðsdagurinn',
            date: new Date(year, 4, 1), // May 1
            type: 'public',
            importance: 'medium'
        },

        // Ascension Day (Uppstigningardagur)
        {
            name: 'Uppstigningardagur',
            date: addDays(easter, 39),
            type: 'public',
            importance: 'medium'
        },

        // Whit Sunday (Hvítasunnudagur)
        {
            name: 'Hvítasunnudagur',
            date: addDays(easter, 49),
            type: 'public',
            importance: 'medium'
        },

        // Whit Monday (Annar í hvítasunnu)
        {
            name: 'Annar í hvítasunnu',
            date: addDays(easter, 50),
            type: 'public',
            importance: 'medium'
        },

        // Icelandic National Day (Þjóðhátíðardagurinn)
        {
            name: 'Þjóðhátíðardagurinn',
            date: new Date(year, 5, 17), // June 17
            type: 'public',
            importance: 'high'
        },

        // Commerce Day (Frídagur verslunarmanna)
        {
            name: 'Frídagur verslunarmanna',
            date: commerceDay,
            type: 'bank',
            importance: 'medium'
        },

        // Christmas Eve (Aðfangadagur jóla) - Half day
        {
            name: 'Aðfangadagur jóla',
            date: new Date(year, 11, 24),
            type: 'public',
            importance: 'high'
        },

        // Christmas Day (Jóladagur)
        {
            name: 'Jóladagur',
            date: new Date(year, 11, 25),
            type: 'public',
            importance: 'high'
        },

        // Boxing Day (Annar í jólum)
        {
            name: 'Annar í jólum',
            date: new Date(year, 11, 26),
            type: 'public',
            importance: 'high'
        },

        // New Year's Eve (Gamlársdagur) - Half day
        {
            name: 'Gamlársdagur',
            date: new Date(year, 11, 31),
            type: 'bank',
            importance: 'high'
        }
    ];
};

/**
 * Check if a date is an Icelandic holiday
 */
export const isHoliday = (date: Date): Holiday | null => {
    const year = getYear(date);
    const holidays = getIcelandicHolidays(year);

    return holidays.find(holiday => {
        return holiday.date.toDateString() === date.toDateString();
    }) || null;
};

/**
 * Check if a date range includes a major holiday (Christmas, Easter, New Year)
 */
export const includesMajorHoliday = (start: Date, end: Date): Holiday | null => {
    const year = getYear(start);
    const holidays = getIcelandicHolidays(year);

    const majorHolidays = holidays.filter(h =>
        h.importance === 'high' &&
        ['Jóladagur', 'Annar í jólum', 'Páskadagur', 'Nýársdagur'].includes(h.name)
    );

    for (const holiday of majorHolidays) {
        if (holiday.date >= start && holiday.date <= end) {
            return holiday;
        }
    }

    return null;
};

/**
 * Get all holidays in a date range
 */
export const getHolidaysInRange = (start: Date, end: Date): Holiday[] => {
    const startYear = getYear(start);
    const endYear = getYear(end);
    const allHolidays: Holiday[] = [];

    // Get holidays for all years in range
    for (let year = startYear; year <= endYear; year++) {
        allHolidays.push(...getIcelandicHolidays(year));
    }

    // Filter to date range
    return allHolidays.filter(holiday =>
        holiday.date >= start && holiday.date <= end
    );
};

/**
 * Contested-holiday fairness rotation (Phase 2 / ROADMAP_2026 2.1-2.3).
 *
 * These are the four Icelandic long-weekend/holiday windows that houses
 * rotate fairly among members, distinct from `getIcelandicHolidays` (which
 * lists every single-day public holiday). Each window's `end` is EXCLUSIVE
 * (midnight of the day after the window's last inclusive day) to match the
 * booking `end` convention used throughout the app — see `rangesOverlap` in
 * `src/services/bookingService.ts`.
 */
export type ContestedHolidayKey = 'paskar' | 'verslunarmannahelgi' | 'jol' | 'aramot';

export interface ContestedHolidayWindow {
    key: ContestedHolidayKey;
    /** Icelandic display name, e.g. "Páskar". */
    name: string;
    /** Inclusive start of the window. */
    start: Date;
    /** EXCLUSIVE end of the window (see rangesOverlap semantics). */
    end: Date;
}

const CONTESTED_HOLIDAY_NAMES: Record<ContestedHolidayKey, string> = {
    paskar: 'Páskar',
    verslunarmannahelgi: 'Verslunarmannahelgin',
    jol: 'Jólin',
    aramot: 'Áramótin',
};

export const CONTESTED_HOLIDAY_KEYS: ContestedHolidayKey[] = [
    'paskar',
    'verslunarmannahelgi',
    'jol',
    'aramot',
];

/**
 * The four contested-holiday windows for a given year.
 *
 * - `paskar`: Skírdagur (Easter − 3 days) through Annar í páskum (Easter + 1
 *   day) inclusive.
 * - `verslunarmannahelgi`: the Friday before the first Monday of August
 *   through that Monday (Frídagur verslunarmanna) inclusive.
 * - `jol`: Þorláksmessa (Dec 23) through Annar í jólum (Dec 26) inclusive.
 * - `aramot`: Gamlársdagur (Dec 31) through Nýársdagur (Jan 1 of the
 *   FOLLOWING year) inclusive. This window is keyed to `year` = the year of
 *   Dec 31 — i.e. `getContestedHolidayWindows(2026)` returns an `aramot`
 *   window starting 2026-12-31 and ending (exclusive) 2027-01-02, NOT a
 *   window for the year containing Jan 1st.
 */
export const getContestedHolidayWindows = (year: number): ContestedHolidayWindow[] => {
    const easter = calculateEaster(year);
    const commerceDay = calculateCommerceDay(year);

    return [
        {
            key: 'paskar',
            name: CONTESTED_HOLIDAY_NAMES.paskar,
            start: addDays(easter, -3), // Skírdagur
            end: addDays(easter, 2), // exclusive: day after Annar í páskum (easter + 1)
        },
        {
            key: 'verslunarmannahelgi',
            name: CONTESTED_HOLIDAY_NAMES.verslunarmannahelgi,
            start: addDays(commerceDay, -3), // Friday before commerce day
            end: addDays(commerceDay, 1), // exclusive: day after commerce Monday
        },
        {
            key: 'jol',
            name: CONTESTED_HOLIDAY_NAMES.jol,
            start: new Date(year, 11, 23), // Þorláksmessa
            end: new Date(year, 11, 27), // exclusive: day after Annar í jólum
        },
        {
            key: 'aramot',
            name: CONTESTED_HOLIDAY_NAMES.aramot,
            start: new Date(year, 11, 31), // Gamlársdagur
            end: new Date(year + 1, 0, 2), // exclusive: day after Nýársdagur (next year)
        },
    ];
};

/**
 * Contested-holiday windows starting within `monthsAhead` months of `from`,
 * sorted ascending by start date. May span two (or, near a year boundary,
 * three) calendar years internally — callers don't need to worry about the
 * `aramot` year-crossing convention documented on `getContestedHolidayWindows`.
 */
export const getUpcomingContestedWindows = (
    from: Date,
    monthsAhead: number
): ContestedHolidayWindow[] => {
    const rangeEnd = addMonths(from, monthsAhead);
    const startYear = getYear(from);
    const endYear = getYear(rangeEnd);

    const windows: ContestedHolidayWindow[] = [];
    // Generate one extra year on each side: an `aramot` window generated
    // from `startYear - 1` starts on Dec 31 of the previous year, which is
    // filtered out below unless it actually falls in range.
    for (let year = startYear - 1; year <= endYear + 1; year++) {
        windows.push(...getContestedHolidayWindows(year));
    }

    return windows
        .filter((w) => w.start >= from && w.start <= rangeEnd)
        .sort((a, b) => a.start.getTime() - b.start.getTime());
};

/**
 * Format holiday name for display
 */
export const formatHolidayName = (holiday: Holiday): string => {
    const typeEmoji = {
        'public': '🇮🇸',
        'bank': '🏦',
        'observance': '📅'
    };

    return `${typeEmoji[holiday.type]} ${holiday.name}`;
};
