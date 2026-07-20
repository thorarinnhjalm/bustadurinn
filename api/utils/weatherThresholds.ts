/**
 * Weather severity thresholds + met.no compact-forecast parsing for the
 * weather-alerts cron (api/cron/weather-alerts.ts).
 *
 * api/ files cannot import from src/ (separate build, no `@` alias), so this
 * is a self-contained port of:
 *  - the numeric severity thresholds from
 *    src/services/weatherNotifications.ts (`shouldSendNotification`)
 *  - the met.no compact response day-grouping logic from
 *    src/services/weatherService.ts (`parseMetNoForecast` / `groupByDay` /
 *    `determineCondition`)
 *
 * Keep the threshold values here in sync with weatherNotifications.ts if
 * they ever change — they are intentionally duplicated rather than shared
 * because the two modules run in different build targets.
 */

// Thresholds ported from src/services/weatherNotifications.ts shouldSendNotification():
//   hasThunderstorm || hasSnow || minTemp < -5 || totalPrecip > 15 || maxWind > 15
export const WEATHER_THRESHOLDS = {
    MIN_TEMP_C: -5,
    TOTAL_PRECIP_MM: 15,
    MAX_WIND_MS: 15,
} as const;

export type SevereWeatherReason =
    | 'thunderstorm'
    | 'snow'
    | 'extreme_cold'
    | 'heavy_rain'
    | 'high_wind';

export interface DailyWeatherSummary {
    /** YYYY-MM-DD (UTC), Iceland has no DST so this matches local date too. */
    date: string;
    tempLow: number;
    tempHigh: number;
    /** Average of instant wind speeds (m/s) sampled during the day. */
    windSpeedAvg: number;
    /** Summed precipitation (mm) for the day from available forecast windows. */
    precipitationTotal: number;
    isThunderstorm: boolean;
    isSnow: boolean;
}

export interface SevereWeatherResult {
    isSevere: boolean;
    reasons: SevereWeatherReason[];
    minTemp: number;
    maxWind: number;
    totalPrecip: number;
    hasThunderstorm: boolean;
    hasSnow: boolean;
}

/**
 * Evaluate a set of daily summaries (typically the days spanning a booking)
 * against the severe-weather thresholds. Mirrors
 * weatherNotifications.shouldSendNotification but returns *why* it's severe
 * so the alert message can name the specific condition(s).
 */
export function evaluateSevereWeather(days: DailyWeatherSummary[]): SevereWeatherResult {
    if (days.length === 0) {
        return {
            isSevere: false,
            reasons: [],
            minTemp: NaN,
            maxWind: NaN,
            totalPrecip: 0,
            hasThunderstorm: false,
            hasSnow: false,
        };
    }

    const minTemp = Math.min(...days.map((d) => d.tempLow));
    const maxWind = Math.max(...days.map((d) => d.windSpeedAvg));
    const totalPrecip = days.reduce((sum, d) => sum + d.precipitationTotal, 0);
    const hasThunderstorm = days.some((d) => d.isThunderstorm);
    const hasSnow = days.some((d) => d.isSnow);

    const reasons: SevereWeatherReason[] = [];
    if (hasThunderstorm) reasons.push('thunderstorm');
    if (hasSnow) reasons.push('snow');
    if (minTemp < WEATHER_THRESHOLDS.MIN_TEMP_C) reasons.push('extreme_cold');
    if (totalPrecip > WEATHER_THRESHOLDS.TOTAL_PRECIP_MM) reasons.push('heavy_rain');
    if (maxWind > WEATHER_THRESHOLDS.MAX_WIND_MS) reasons.push('high_wind');

    return {
        isSevere: reasons.length > 0,
        reasons,
        minTemp,
        maxWind,
        totalPrecip,
        hasThunderstorm,
        hasSnow,
    };
}

interface MetNoTimeseriesEntry {
    time: string;
    data: {
        instant?: { details?: { air_temperature?: number; wind_speed?: number } };
        next_1_hours?: { summary?: { symbol_code?: string }; details?: { precipitation_amount?: number } };
        next_6_hours?: { summary?: { symbol_code?: string }; details?: { precipitation_amount?: number } };
    };
}

/** Expected shape of the raw met.no JSON payload (see `response: any` above). */
export interface MetNoCompactResponse {
    properties?: { timeseries?: MetNoTimeseriesEntry[] };
}

/**
 * Parse a met.no locationforecast/2.0/compact JSON response into per-day
 * summaries, restricted to the [startDate, endDate] (inclusive) date range.
 * Prefers the finer-grained `next_1_hours` window when present (near-term
 * forecasts) and falls back to `next_6_hours` for entries further out, which
 * is how met.no compact responses degrade resolution over time — matching
 * the real shape of the API rather than double-counting overlapping windows.
 */
export function parseMetNoCompactToDailySummaries(
    // Untyped JSON from `fetch(...).json()` — matches the `data: any` convention
    // used by parseMetNoForecast in src/services/weatherService.ts for the same
    // external payload. `MetNoCompactResponse` below documents the expected shape.
    response: any,
    startDate: Date,
    endDate: Date
): DailyWeatherSummary[] {
    const timeseries: MetNoTimeseriesEntry[] = response?.properties?.timeseries || [];

    const startKey = toDateKey(startDate);
    const endKey = toDateKey(endDate);

    interface DayAccumulator {
        temps: number[];
        winds: number[];
        precipitation: number;
        symbols: string[];
    }
    const days = new Map<string, DayAccumulator>();

    for (const entry of timeseries) {
        const entryDate = new Date(entry.time);
        const dateKey = toDateKey(entryDate);
        if (dateKey < startKey || dateKey > endKey) continue;

        if (!days.has(dateKey)) {
            days.set(dateKey, { temps: [], winds: [], precipitation: 0, symbols: [] });
        }
        const acc = days.get(dateKey)!;

        const instant = entry.data.instant?.details;
        if (instant?.air_temperature !== undefined) acc.temps.push(instant.air_temperature);
        if (instant?.wind_speed !== undefined) acc.winds.push(instant.wind_speed);

        const window = entry.data.next_1_hours || entry.data.next_6_hours;
        if (window?.details?.precipitation_amount !== undefined) {
            acc.precipitation += window.details.precipitation_amount;
        }
        if (window?.summary?.symbol_code) {
            acc.symbols.push(window.summary.symbol_code);
        }
    }

    return Array.from(days.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, acc]) => {
            const symbolText = acc.symbols.join(' ').toLowerCase();
            return {
                date,
                tempLow: acc.temps.length > 0 ? Math.min(...acc.temps) : 0,
                tempHigh: acc.temps.length > 0 ? Math.max(...acc.temps) : 0,
                windSpeedAvg: acc.winds.length > 0 ? acc.winds.reduce((a, b) => a + b, 0) / acc.winds.length : 0,
                precipitationTotal: Math.round(acc.precipitation * 10) / 10,
                isThunderstorm: symbolText.includes('thunder'),
                isSnow: symbolText.includes('snow'),
            };
        });
}

function toDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
}

/** Icelandic label for a severity reason, used to build alert copy. */
export const SEVERE_WEATHER_LABELS_IS: Record<SevereWeatherReason, string> = {
    thunderstorm: 'þrumuveður',
    snow: 'snjókoma',
    extreme_cold: 'mikið frost',
    heavy_rain: 'mikil rigning',
    high_wind: 'hvassviðri',
};
