/**
 * Packing Suggestions Utility
 * Generates smart packing recommendations based on weather forecast
 */

import type { WeatherForecast, PackingSuggestion } from '@/types/weather';

/**
 * Generate packing suggestions based on weather forecast
 */
export function generatePackingSuggestions(forecast: WeatherForecast | null): PackingSuggestion[] {
    if (!forecast || forecast.days.length === 0) {
        return [];
    }

    const suggestions: PackingSuggestion[] = [];
    const days = forecast.days;

    // Analyze temperature range
    const minTemp = Math.min(...days.map(d => d.tempLow));
    const maxTemp = Math.max(...days.map(d => d.tempHigh));

    // Cold weather gear
    if (minTemp < 0) {
        suggestions.push({
            category: 'clothing',
            item: 'Klæðstu hlýlega',
            reason: `Kuldi spáður, niður í ${Math.round(minTemp)}°C`,
            priority: 'high',
            icon: '🧥'
        });

    } else if (minTemp < 5) {
        suggestions.push({
            category: 'clothing',
            item: 'Hlý föt',
            reason: 'Kalt veður',
            priority: 'medium',
            icon: '🧥'
        });
    }

    // Rain gear
    const totalPrecipitation = days.reduce((sum, d) => sum + d.precipitation, 0);
    if (totalPrecipitation > 10) {
        suggestions.push({
            category: 'clothing',
            item: 'Rigningarfatnaður',
            reason: 'Mikil rigning spáð',
            priority: 'high',
            icon: '☔'
        });

        suggestions.push({
            category: 'gear',
            item: 'Aukahandklæði',
            reason: 'Blautt veður',
            priority: 'medium',
            icon: '🧺'
        });
    } else if (totalPrecipitation > 3) {
        suggestions.push({
            category: 'clothing',
            item: 'Regnhlíf eða regnfrakki',
            reason: 'Létt rigning möguleg',
            priority: 'medium',
            icon: '🌂'
        });
    }

    // Snow conditions
    const hasSnow = days.some(d => d.condition === 'snow' || (d.tempHigh < 0 && d.precipitation > 0));
    if (hasSnow) {
        suggestions.push({
            category: 'vehicle',
            item: 'Nagladekkjum sleppur ekki',
            reason: 'Snjókoma/hálka spáð',
            priority: 'high',
            icon: '❄️'
        });

        suggestions.push({
            category: 'gear',
            item: 'Snjósópari og skafa',
            reason: 'Snjór á leiðinni',
            priority: 'high',
            icon: '⛏️'
        });
    }

    // Wind warnings
    const maxWind = Math.max(...days.map(d => d.windSpeed));
    if (maxWind > 15) {
        suggestions.push({
            category: 'gear',
            item: 'Festa lausamuni',
            reason: `Hvasst, allt að ${Math.round(maxWind)} m/s`,
            priority: 'high',
            icon: '💨'
        });
    }

    // Sunny weather
    if (days.some(d => d.condition === 'sunny' || d.condition === 'partly-cloudy') && maxTemp > 15) {
        suggestions.push({
            category: 'clothing',
            item: 'Sólgleraugu og sólarvörn',
            reason: 'Bjarkt veður spáð',
            priority: 'low',
            icon: '😎'
        });
    }

    // Temperature swing
    if (maxTemp - minTemp > 15) {
        suggestions.push({
            category: 'clothing',
            item: 'Lög af fötum',
            reason: `Mikill hitamunur (${Math.round(minTemp)}°C - ${Math.round(maxTemp)}°C)`,
            priority: 'medium',
            icon: '👕'
        });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Get a summary message about the weather
 */
export function getWeatherSummary(forecast: WeatherForecast | null): string {
    if (!forecast || forecast.days.length === 0) {
        return 'Engin veðurspá í boði';
    }

    const days = forecast.days;
    const hasRain = days.some(d => d.condition === 'rain');
    const hasSnow = days.some(d => d.condition === 'snow');
    const hasSun = days.some(d => d.condition === 'sunny' || d.condition === 'partly-cloudy');
    const minTemp = Math.min(...days.map(d => d.tempLow));
    const maxTemp = Math.max(...days.map(d => d.tempHigh));

    if (hasSnow && minTemp < -5) {
        return 'Kalt og snjókoma - búðu þig vel undir kuldann! ❄️';
    }

    if (hasRain && hasSnow) {
        return 'Blendingur úrkomu - hús, teppi og bók? 📚';
    }

    if (hasRain) {
        return 'Rigning fram undan - hugsaðu vel um rigningarfatnað! ☔';
    }

    if (hasSun && maxTemp > 10) {
        return 'Fínt veður! Njóttu ferðarinnar ☀️';
    }

    if (minTemp < 0) {
        return `Kalt, niður í ${Math.round(minTemp)}°C - pakkaðu hlýju! 🧥`;
    }

    return `${Math.round(minTemp)}°C - ${Math.round(maxTemp)}°C, blandað veður 🌤️`;
}
