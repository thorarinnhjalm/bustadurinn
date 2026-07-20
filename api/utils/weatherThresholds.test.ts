/**
 * weatherThresholds tests.
 * Runs under the root vitest config (see api/utils/emailSanitization.test.ts
 * for the precedent of testing api/utils modules directly).
 */

import { describe, it, expect } from 'vitest';
import {
    evaluateSevereWeather,
    parseMetNoCompactToDailySummaries,
    WEATHER_THRESHOLDS,
    type DailyWeatherSummary,
} from './weatherThresholds';

function fakeDay(overrides: Partial<DailyWeatherSummary> = {}): DailyWeatherSummary {
    return {
        date: '2026-07-21',
        tempLow: 10,
        tempHigh: 15,
        windSpeedAvg: 5,
        precipitationTotal: 0,
        isThunderstorm: false,
        isSnow: false,
        ...overrides,
    };
}

describe('evaluateSevereWeather', () => {
    it('is not severe for mild weather', () => {
        const result = evaluateSevereWeather([fakeDay()]);
        expect(result.isSevere).toBe(false);
        expect(result.reasons).toEqual([]);
    });

    it('flags thunderstorm regardless of other values', () => {
        const result = evaluateSevereWeather([fakeDay({ isThunderstorm: true })]);
        expect(result.isSevere).toBe(true);
        expect(result.reasons).toContain('thunderstorm');
    });

    it('flags snow', () => {
        const result = evaluateSevereWeather([fakeDay({ isSnow: true })]);
        expect(result.isSevere).toBe(true);
        expect(result.reasons).toContain('snow');
    });

    it('flags extreme cold below the threshold (exclusive)', () => {
        const belowThreshold = evaluateSevereWeather([
            fakeDay({ tempLow: WEATHER_THRESHOLDS.MIN_TEMP_C - 0.1 }),
        ]);
        expect(belowThreshold.isSevere).toBe(true);
        expect(belowThreshold.reasons).toContain('extreme_cold');

        const atThreshold = evaluateSevereWeather([fakeDay({ tempLow: WEATHER_THRESHOLDS.MIN_TEMP_C })]);
        expect(atThreshold.reasons).not.toContain('extreme_cold');
    });

    it('flags heavy rain when total precipitation exceeds the threshold (exclusive)', () => {
        const over = evaluateSevereWeather([
            fakeDay({ precipitationTotal: WEATHER_THRESHOLDS.TOTAL_PRECIP_MM + 0.1 }),
        ]);
        expect(over.reasons).toContain('heavy_rain');

        const at = evaluateSevereWeather([fakeDay({ precipitationTotal: WEATHER_THRESHOLDS.TOTAL_PRECIP_MM })]);
        expect(at.reasons).not.toContain('heavy_rain');
    });

    it('sums precipitation across multiple days', () => {
        const result = evaluateSevereWeather([
            fakeDay({ date: '2026-07-21', precipitationTotal: 10 }),
            fakeDay({ date: '2026-07-22', precipitationTotal: 10 }),
        ]);
        expect(result.totalPrecip).toBe(20);
        expect(result.reasons).toContain('heavy_rain');
    });

    it('flags high wind when the max daily average exceeds the threshold (exclusive)', () => {
        const over = evaluateSevereWeather([fakeDay({ windSpeedAvg: WEATHER_THRESHOLDS.MAX_WIND_MS + 0.1 })]);
        expect(over.reasons).toContain('high_wind');

        const at = evaluateSevereWeather([fakeDay({ windSpeedAvg: WEATHER_THRESHOLDS.MAX_WIND_MS })]);
        expect(at.reasons).not.toContain('high_wind');
    });

    it('takes the max wind across days, not the sum', () => {
        const result = evaluateSevereWeather([
            fakeDay({ date: '2026-07-21', windSpeedAvg: 5 }),
            fakeDay({ date: '2026-07-22', windSpeedAvg: 20 }),
        ]);
        expect(result.maxWind).toBe(20);
    });

    it('returns not-severe for an empty day list', () => {
        const result = evaluateSevereWeather([]);
        expect(result.isSevere).toBe(false);
        expect(result.reasons).toEqual([]);
    });
});

describe('parseMetNoCompactToDailySummaries', () => {
    function tsEntry(time: string, overrides: Partial<MetNoEntryData> = {}) {
        return {
            time,
            data: {
                instant: { details: { air_temperature: overrides.temp ?? 10, wind_speed: overrides.wind ?? 5 } },
                ...(overrides.next1h !== undefined
                    ? { next_1_hours: { summary: { symbol_code: overrides.symbol ?? 'cloudy' }, details: { precipitation_amount: overrides.next1h } } }
                    : {}),
                ...(overrides.next6h !== undefined
                    ? { next_6_hours: { summary: { symbol_code: overrides.symbol ?? 'cloudy' }, details: { precipitation_amount: overrides.next6h } } }
                    : {}),
            },
        };
    }

    interface MetNoEntryData {
        temp?: number;
        wind?: number;
        next1h?: number;
        next6h?: number;
        symbol?: string;
    }

    it('groups timeseries entries into per-day summaries within the date range', () => {
        const response = {
            properties: {
                timeseries: [
                    tsEntry('2026-07-21T06:00:00Z', { temp: 5, wind: 3, next1h: 1 }),
                    tsEntry('2026-07-21T12:00:00Z', { temp: 15, wind: 7, next1h: 2 }),
                    tsEntry('2026-07-22T06:00:00Z', { temp: 8, wind: 4, next1h: 0.5 }),
                    // Outside the range — should be excluded.
                    tsEntry('2026-07-25T06:00:00Z', { temp: 100, wind: 100, next1h: 100 }),
                ],
            },
        };

        const days = parseMetNoCompactToDailySummaries(
            response,
            new Date('2026-07-21T00:00:00Z'),
            new Date('2026-07-22T23:59:59Z')
        );

        expect(days).toHaveLength(2);
        expect(days[0].date).toBe('2026-07-21');
        expect(days[0].tempLow).toBe(5);
        expect(days[0].tempHigh).toBe(15);
        expect(days[0].precipitationTotal).toBe(3);
        expect(days[1].date).toBe('2026-07-22');
    });

    it('detects thunderstorm and snow symbol codes', () => {
        const response = {
            properties: {
                timeseries: [
                    tsEntry('2026-07-21T06:00:00Z', { next1h: 0, symbol: 'heavysnowandthunder' }),
                ],
            },
        };
        const days = parseMetNoCompactToDailySummaries(
            response,
            new Date('2026-07-21T00:00:00Z'),
            new Date('2026-07-21T23:59:59Z')
        );
        expect(days[0].isThunderstorm).toBe(true);
        expect(days[0].isSnow).toBe(true);
    });

    it('falls back to next_6_hours precipitation when next_1_hours is absent', () => {
        const response = {
            properties: {
                timeseries: [tsEntry('2026-07-23T06:00:00Z', { next6h: 12, symbol: 'rain' })],
            },
        };
        const days = parseMetNoCompactToDailySummaries(
            response,
            new Date('2026-07-23T00:00:00Z'),
            new Date('2026-07-23T23:59:59Z')
        );
        expect(days[0].precipitationTotal).toBe(12);
    });

    it('returns an empty array when there is no timeseries data', () => {
        const days = parseMetNoCompactToDailySummaries({}, new Date('2026-07-21'), new Date('2026-07-22'));
        expect(days).toEqual([]);
    });
});
