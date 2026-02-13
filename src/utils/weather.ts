/**
 * Weather utility using Open-Meteo (Free, No API Key)
 */

interface WeatherData {
    temp: number;
    condition: string;
    windSpeed: number;
    code: number;
}

const WMO_CODES: Record<number, string> = {
    0: 'Heiðskírt',
    1: 'Léttskýjað',
    2: 'Hálfskýjað',
    3: 'Skýjað',
    45: 'Þoka',
    48: 'Hrímþoka',
    51: 'Lítil súld',
    53: 'Súld',
    55: 'Þétt súld',
    56: 'Lítil frostrigning',
    57: 'Frostrigning',
    61: 'Lítil rigning',
    63: 'Rigning',
    65: 'Mikil rigning',
    66: 'Lítil frostrigning',
    67: 'Mikil frostrigning',
    71: 'Lítil snjókoma',
    73: 'Snjókoma',
    75: 'Mikil snjókoma',
    77: 'Snjókorn',
    80: 'Lítil skúrir',
    81: 'Skúrir',
    82: 'Miklar skúrir',
    85: 'Lítil élin',
    86: 'Mikil élin',
    95: 'Þrumuveður',
    96: 'Þrumuveður með hagli',
    99: 'Þrumuveður með miklu hagli'
};

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData | null> {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`
        );
        const data = await response.json();

        if (!data.current) return null;

        return {
            temp: Math.round(data.current.temperature_2m),
            condition: WMO_CODES[data.current.weather_code] || 'Óþekkt',
            windSpeed: Math.round(data.current.wind_speed_10m / 3.6), // Convert km/h to m/s
            code: data.current.weather_code
        };
    } catch (err) {
        console.error('Error fetching weather:', err);
        return null;
    }
}
