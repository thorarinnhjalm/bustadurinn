/**
 * Weather Service
 * Fetches weather forecasts from Veður.is and met.no APIs
 */

import type { WeatherForecast, WeatherDay, WeatherCondition } from '@/types/weather';

// Cache weather data for 30 minutes to avoid excessive API calls
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const weatherCache = new Map<string, { data: WeatherForecast; timestamp: number }>();

/**
 * Get weather forecast for a location
 * Uses met.no API (Norwegian Meteorological Institute) which covers Iceland
 */
export async function getWeatherForecast(
    latitude: number,
    longitude: number,
    startDate: Date
): Promise<WeatherForecast | null> {
    const cacheKey = `${latitude},${longitude}`;

    // Check cache first
    const cached = weatherCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }

    try {
        // Use met.no LocationForecast API (free, covers Iceland)
        const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${latitude}&lon=${longitude}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Bustadurinn.is/1.0 contact@bustadurinn.is'
            }
        });

        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }

        const data = await response.json();
        const forecast = parseMetNoForecast(data, latitude, longitude);

        // Cache the result
        weatherCache.set(cacheKey, {
            data: forecast,
            timestamp: Date.now()
        });

        return forecast;
    } catch (error) {
        console.error('Failed to fetch weather:', error);
        return null;
    }
}

/**
 * Parse met.no API response to our WeatherForecast format
 */
function parseMetNoForecast(data: any, lat: number, lon: number): WeatherForecast {
    const timeseries = data.properties.timeseries || [];
    const dailyData = groupByDay(timeseries);

    const days: WeatherDay[] = dailyData.slice(0, 5).map(dayData => ({
        date: new Date(dayData.date),
        tempHigh: Math.round(dayData.tempHigh),
        tempLow: Math.round(dayData.tempLow),
        condition: determineCondition(dayData),
        description: getWeatherDescription(dayData),
        windSpeed: Math.round(dayData.windSpeed),
        precipitation: Math.round(dayData.precipitation * 10) / 10,
        humidity: dayData.humidity,
        icon: getWeatherIcon(dayData)
    }));

    return {
        location: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
        latitude: lat,
        longitude: lon,
        fetchedAt: new Date(),
        days,
        source: 'met.no'
    };
}

/**
 * Group hourly data into days and calculate min/max temps
 */
function groupByDay(timeseries: any[]): any[] {
    const days = new Map<string, any>();

    timeseries.forEach(entry => {
        const time = new Date(entry.time);
        const dateKey = time.toISOString().split('T')[0];

        if (!days.has(dateKey)) {
            days.set(dateKey, {
                date: dateKey,
                temps: [],
                precipitation: 0,
                windSpeeds: [],
                symbols: [],
                humidity: []
            });
        }

        const day = days.get(dateKey)!;
        const instant = entry.data.instant.details;
        const next1h = entry.data.next_1_hours;

        if (instant.air_temperature !== undefined) {
            day.temps.push(instant.air_temperature);
        }
        if (instant.wind_speed !== undefined) {
            day.windSpeeds.push(instant.wind_speed);
        }
        if (instant.relative_humidity !== undefined) {
            day.humidity.push(instant.relative_humidity);
        }
        if (next1h?.details?.precipitation_amount !== undefined) {
            day.precipitation += next1h.details.precipitation_amount;
        }
        if (next1h?.summary?.symbol_code) {
            day.symbols.push(next1h.summary.symbol_code);
        }
    });

    return Array.from(days.values()).map(day => ({
        date: day.date,
        tempHigh: Math.max(...day.temps),
        tempLow: Math.min(...day.temps),
        precipitation: day.precipitation,
        windSpeed: day.windSpeeds.length > 0
            ? day.windSpeeds.reduce((a: number, b: number) => a + b, 0) / day.windSpeeds.length
            : 0,
        humidity: day.humidity.length > 0
            ? day.humidity.reduce((a: number, b: number) => a + b, 0) / day.humidity.length
            : undefined,
        dominantSymbol: getMostCommon(day.symbols)
    }));
}

/**
 * Determine weather condition from met.no symbol code
 */
function determineCondition(dayData: any): WeatherCondition {
    const symbol = dayData.dominantSymbol || '';

    if (symbol.includes('snow')) return 'snow';
    if (symbol.includes('sleet')) return 'sleet';
    if (symbol.includes('rain') || symbol.includes('shower')) return 'rain';
    if (symbol.includes('thunder')) return 'thunderstorm';
    if (symbol.includes('fog')) return 'fog';
    if (symbol.includes('cloudy')) return 'cloudy';
    if (symbol.includes('partlycloudy')) return 'partly-cloudy';
    if (symbol.includes('clearsky') || symbol.includes('fair')) return 'sunny';

    // Default based on precipitation and clouds
    if (dayData.precipitation > 5) return 'rain';
    if (dayData.tempHigh < 0 && dayData.precipitation > 0) return 'snow';

    return 'partly-cloudy';
}

/**
 * Get human-readable weather description
 */
function getWeatherDescription(dayData: any): string {
    const condition = determineCondition(dayData);
    const temp = Math.round((dayData.tempHigh + dayData.tempLow) / 2);

    const descriptions: Record<WeatherCondition, string> = {
        'sunny': `Bjart veður, ${temp}°C`,
        'partly-cloudy': `Léttskyjaður, ${temp}°C`,
        'cloudy': `Skýjað, ${temp}°C`,
        'rain': `Rigning, ${temp}°C`,
        'snow': `Snjókoma, ${temp}°C`,
        'sleet': `Slydda, ${temp}°C`,
        'thunderstorm': `Þruma, ${temp}°C`,
        'fog': `Þokukennt, ${temp}°C`,
        'wind': `Vindasamt, ${temp}°C`
    };

    return descriptions[condition];
}

/**
 * Get icon identifier for weather condition
 */
function getWeatherIcon(dayData: any): string {
    const symbol = dayData.dominantSymbol || '';
    // Return the symbol code for potential icon mapping
    return symbol;
}

/**
 * Helper: Get most common item in array
 */
function getMostCommon(arr: string[]): string {
    if (arr.length === 0) return '';

    const counts = arr.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Check if we should show weather for a booking
 * Only show if booking starts within 7 days
 */
export function shouldShowWeather(bookingStartDate: Date): boolean {
    const now = new Date();
    const daysUntil = Math.ceil((bookingStartDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 7;
}

/**
 * Get forecast reliability message based on days until booking
 */
export function getForecastReliability(bookingStartDate: Date): string {
    const now = new Date();
    const daysUntil = Math.ceil((bookingStartDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil > 7) return 'Of langt í burtu fyrir veðurspá';
    if (daysUntil >= 5) return 'Frumleg veðurspá';
    if (daysUntil >= 3) return 'Áreiðanleg veðurspá';
    if (daysUntil >= 1) return 'Nákvæm veðurspá';
    return 'Veður fyrir ferðina';
}
