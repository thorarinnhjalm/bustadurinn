/**
 * Icelandic Holidays (Íslenskir Frídagar)
 * Includes both fixed and movable holidays
 */

import { addDays, getYear, startOfYear, differenceInDays } from 'date-fns';

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
