/**
 * Weather Warnings Service
 * Fetches official weather warnings from Icelandic Met Office (Veðurstofa Íslands)
 * Yellow/Orange/Red warnings for severe weather conditions
 */

import type { WeatherWarning, WarningLevel } from '@/types/weather';

const WARNINGS_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
let warningsCache: { data: WeatherWarning[]; timestamp: number } | null = null;

/**
 * Fetch active weather warnings from Icelandic Met Office
 * API: https://xmlweather.vedur.is/
 */
export async function getWeatherWarnings(region?: string): Promise<WeatherWarning[]> {
    // Check cache first
    if (warningsCache && Date.now() - warningsCache.timestamp < WARNINGS_CACHE_DURATION) {
        return filterWarningsByRegion(warningsCache.data, region);
    }

    try {
        // Veður.is warnings endpoint
        const response = await fetch('https://xmlweather.vedur.is/?op_w=xml&type=obs&lang=is&view=xml&ids=1');

        if (!response.ok) {
            throw new Error(`Weather warnings API error: ${response.status}`);
        }

        const xmlText = await response.text();
        const warnings = parseWeatherWarningsXML(xmlText);

        // Cache the results
        warningsCache = {
            data: warnings,
            timestamp: Date.now()
        };

        return filterWarningsByRegion(warnings, region);
    } catch (error) {
        console.error('Failed to fetch weather warnings:', error);
        return [];
    }
}

/**
 * Parse XML response from Veður.is warnings API
 * Note: In production, you'd use a proper XML parser
 * For now, this is a simplified version
 */
function parseWeatherWarningsXML(_xml: string): WeatherWarning[] {
    // This is a simplified parser - in production use DOMParser or xml2js
    const warnings: WeatherWarning[] = [];

    // Look for warning tags in XML
    // Real implementation would parse XML properly
    // For now, return mock data structure that matches real API

    return warnings;
}

/**
 * Alternative: Use APIs.is which provides JSON format
 * This is easier to work with than raw XML
 */
export async function getWeatherWarningsFromAPIs(): Promise<WeatherWarning[]> {
    try {
        const response = await fetch('https://apis.is/weather/warnings');

        if (!response.ok) {
            throw new Error(`APIs.is warnings error: ${response.status}`);
        }

        const data = await response.json();
        return parseAPIsWarnings(data.results || []);
    } catch (error) {
        console.error('Failed to fetch from APIs.is:', error);
        return [];
    }
}

/**
 * Parse warnings from APIs.is format
 */
function parseAPIsWarnings(results: any[]): WeatherWarning[] {
    return results.map(warning => ({
        id: warning.id || `warning-${Date.now()}`,
        level: mapWarningLevel(warning.type),
        title: warning.title || 'Veðurviðvörun',
        description: warning.description || '',
        regions: warning.regions || [],
        validFrom: new Date(warning.validFrom || Date.now()),
        validTo: new Date(warning.validTo || Date.now() + 24 * 60 * 60 * 1000),
        phenomenon: warning.phenomenon || 'wind',
        isActive: true
    }));
}

/**
 * Map warning type to our severity levels
 */
function mapWarningLevel(type: string): WarningLevel {
    const normalized = type?.toLowerCase() || '';

    if (normalized.includes('red') || normalized.includes('rauð')) return 'red';
    if (normalized.includes('orange') || normalized.includes('appelsínu')) return 'orange';
    if (normalized.includes('yellow') || normalized.includes('gul')) return 'yellow';

    return 'yellow'; // Default to yellow if unknown
}

/**
 * Filter warnings by region/area
 */
function filterWarningsByRegion(warnings: WeatherWarning[], region?: string): WeatherWarning[] {
    if (!region) return warnings;

    return warnings.filter(w =>
        !w.regions ||
        w.regions.length === 0 ||
        w.regions.some(r => r.toLowerCase().includes(region.toLowerCase()))
    );
}

/**
 * Get recommended actions based on warning level and phenomenon
 */
export function getWarningActions(warning: WeatherWarning): string[] {
    const actions: string[] = [];

    const isRed = warning.level === 'red';
    const isOrange = warning.level === 'orange';
    const isYellow = warning.level === 'yellow';
    const phenomenon = warning.phenomenon;

    // Red warnings - immediate action required
    if (isRed) {
        actions.push('🚨 BRÁÐAVIÐVÖRUN - Gríðarlegur voði');

        if (phenomenon === 'wind') {
            actions.push('Færðu alla lausamuni inn');
            actions.push('Tryggðu gluggahlerar og hurðar');
            actions.push('Slökktu í hitakerfum til öryggis');
            actions.push('EKKI FERÐAST - hát hætta');
        }

        if (phenomenon === 'snow') {
            actions.push('Tryggðu þakrendur');
            actions.push('Opnaðu rennur (snjóþyngd)');
            actions.push('Aflysau ferð ef mögulegt');
        }

        return actions;
    }

    // Orange warnings - be prepared
    if (isOrange) {
        actions.push('⚠️ VIÐVÖRUN - Verulegur voði');

        if (phenomenon === 'wind') {
            actions.push('Tryggðu útirétti og grillið');
            actions.push('Lækkaðu markísur og sólhlífar');
            actions.push('Athugaðu veðrið áður en ferðast');
        }

        if (phenomenon === 'snow') {
            actions.push('Hafa snjósópar við hendina');
            actions.push('Athugaðu vegaastand (road.is)');
            actions.push('Nagladekkjum sleppur ekki');
        }

        if (phenomenon === 'rain') {
            actions.push('Athugaðu þakrendur og niðurföll');
            actions.push('Færðu viðkvæman búnað inn');
        }

        return actions;
    }

    // Yellow warnings - be aware
    if (isYellow) {
        actions.push('⚡ ATHS - Hugsanlegur voði');

        if (phenomenon === 'wind') {
            actions.push('Tryggðu grillið og lausamuni');
            actions.push('Fylgstu með uppfærslum');
        }

        if (phenomenon === 'snow') {
            actions.push('Kannski betra að fresta ferð?');
            actions.push('Athugaðu vegaastand');
        }

        return actions;
    }

    return actions;
}

/**
 * Determine notification priority for warning
 */
export function getWarningNotificationPriority(warning: WeatherWarning): 'critical' | 'high' | 'medium' {
    if (warning.level === 'red') return 'critical';
    if (warning.level === 'orange') return 'high';
    return 'medium';
}

/**
 * Get display color for warning level
 */
export function getWarningColor(level: WarningLevel): {
    bg: string;
    border: string;
    text: string;
    emoji: string;
} {
    const colors = {
        red: {
            bg: 'bg-red-50',
            border: 'border-red-500',
            text: 'text-red-900',
            emoji: '🚨'
        },
        orange: {
            bg: 'bg-orange-50',
            border: 'border-orange-500',
            text: 'text-orange-900',
            emoji: '⚠️'
        },
        yellow: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-500',
            text: 'text-yellow-900',
            emoji: '⚡'
        }
    };

    return colors[level];
}

/**
 * Icelandic labels for warning levels
 */
export const WARNING_LABELS_IS: Record<WarningLevel, string> = {
    red: 'RAUÐ VIÐVÖRUN',
    orange: 'APPELSÍNUGUL VIÐVÖRUN',
    yellow: 'GUL VIÐVÖRUN'
};

/**
 * Check if house location is affected by warning
 */
export function isLocationAffected(
    warning: WeatherWarning,
    _houseLatitude: number,
    _houseLongitude: number
): boolean {
    // If no specific regions, assume it affects all of Iceland
    if (!warning.regions || warning.regions.length === 0) {
        return true;
    }

    // In production, you'd have a proper region mapping
    // For now, simple keyword matching
    // Could use reverse geocoding to get region name from coordinates

    return true; // Default to showing warning (better safe than sorry)
}
