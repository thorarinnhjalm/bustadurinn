/**
 * Weather Types
 * Type definitions for weather forecasts, road conditions, and packing suggestions
 */

export interface WeatherDay {
    date: Date;
    tempHigh: number;
    tempLow: number;
    condition: WeatherCondition;
    description: string; // "Partly cloudy", "Light rain"
    windSpeed: number; // m/s
    precipitation: number; // mm
    humidity?: number; // %
    icon: string; // Weather icon identifier
}

export type WeatherCondition =
    | 'sunny'
    | 'partly-cloudy'
    | 'cloudy'
    | 'rain'
    | 'snow'
    | 'sleet'
    | 'thunderstorm'
    | 'fog'
    | 'wind';

export interface WeatherForecast {
    location: string;
    latitude: number;
    longitude: number;
    fetchedAt: Date;
    days: WeatherDay[];
    source: 'vedur.is' | 'met.no' | 'openweathermap';
}

export interface RoadCondition {
    route: string; // "Þjóðvegur 1", "Vegur 36"
    routeNumber: number;
    condition: RoadStatus;
    warning?: string;
    description: string;
    lastUpdated: Date;
}

export type RoadStatus =
    | 'clear'
    | 'wet'
    | 'icy'
    | 'snow'
    | 'slippery'
    | 'closed';

export interface PackingSuggestion {
    category: 'clothing' | 'gear' | 'vehicle' | 'comfort';
    item: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    icon: string;
}

export interface BookingWeatherData {
    forecast: WeatherForecast | null;
    roadConditions: RoadCondition[];
    packingSuggestions: PackingSuggestion[];
    loading: boolean;
    error: string | null;
}

// Weather icon mapping for conditions
export const WEATHER_ICONS: Record<WeatherCondition, string> = {
    'sunny': '☀️',
    'partly-cloudy': '⛅',
    'cloudy': '☁️',
    'rain': '🌧️',
    'snow': '❄️',
    'sleet': '🌨️',
    'thunderstorm': '⛈️',
    'fog': '🌫️',
    'wind': '💨'
};

// Icelandic translations
export const WEATHER_LABELS_IS: Record<WeatherCondition, string> = {
    'sunny': 'Sólskin',
    'partly-cloudy': 'Hvassbært',
    'cloudy': 'Skýjað',
    'rain': 'Rigning',
    'snow': 'Snjókoma',
    'sleet': 'Slydda',
    'thunderstorm': 'Þruma',
    'fog': 'Þoka',
    'wind': 'Vindasamt'
};

export const ROAD_STATUS_LABELS_IS: Record<RoadStatus, string> = {
    'clear': 'Góð akstursskilyrði',
    'wet': 'Blautur',
    'icy': 'Hálka',
    'snow': 'Snjór á vegum',
    'slippery': 'Hálka á köflum',
    'closed': 'Vegur lokaður'
};

// Weather Warning Types
export type WarningLevel = 'yellow' | 'orange' | 'red';

export type WeatherPhenomenon =
    | 'wind'
    | 'snow'
    | 'rain'
    | 'ice'
    | 'fog'
    | 'thunderstorm'
    | 'avalanche'
    | 'coastal';

export interface WeatherWarning {
    id: string;
    level: WarningLevel;
    title: string;
    description: string;
    regions: string[];
    validFrom: Date;
    validTo: Date;
    phenomenon: WeatherPhenomenon;
    isActive: boolean;
}

export const WARNING_LABELS_IS: Record<WarningLevel, string> = {
    red: 'Rauð viðvörun',
    orange: 'Appelsínugul viðvörun',
    yellow: 'Gul viðvörun'
};

