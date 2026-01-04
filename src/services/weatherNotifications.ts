/**
 * Weather Notifications Service
 * Sends thoughtful, actionable push notifications about weather conditions
 * Only sends when there's genuinely valuable information to share
 */

import type { WeatherForecast } from '@/types/weather';
import { generatePackingSuggestions } from '@/utils/packingSuggestions';

interface BookingNotificationData {
    bookingId: string;
    bookingStart: Date;
    bookingEnd: Date;
    houseName: string;
    forecast: WeatherForecast;
}

/**
 * Determine if a notification should be sent
 * Only send if there's something actionable or important
 */
function shouldSendNotification(forecast: WeatherForecast): boolean {
    if (!forecast || forecast.days.length === 0) return false;

    const days = forecast.days;
    const minTemp = Math.min(...days.map(d => d.tempLow));
    const maxWind = Math.max(...days.map(d => d.windSpeed));
    const totalPrecip = days.reduce((sum, d) => sum + d.precipitation, 0);
    const hasSnow = days.some(d => d.condition === 'snow');
    const hasThunderstorm = days.some(d => d.condition === 'thunderstorm');

    // Send if:
    // - Severe weather (thunderstorm, heavy wind)
    // - Snow (needs prep)
    // - Very cold (< -5°C)
    // - Heavy rain (> 15mm total)
    // - Strong wind (> 15 m/s)

    return (
        hasThunderstorm ||
        hasSnow ||
        minTemp < -5 ||
        totalPrecip > 15 ||
        maxWind > 15
    );
}

/**
 * Generate a thoughtful, personalized notification message
 * This is what appears on the user's phone - make it count!
 */
export function generateWeatherNotification(data: BookingNotificationData): {
    title: string;
    body: string;
    priority: 'high' | 'medium' | 'low';
    actionable: boolean;
} | null {
    const { forecast, houseName, bookingStart } = data;

    if (!shouldSendNotification(forecast)) {
        return null; // Don't spam - only send valuable notifications
    }

    const days = forecast.days;
    const minTemp = Math.min(...days.map(d => d.tempLow));
    const maxWind = Math.max(...days.map(d => d.windSpeed));
    const totalPrecip = days.reduce((sum, d => sum + d.precipitation, 0);
    const hasSnow = days.some(d => d.condition === 'snow');
    const hasIce = hasSnow || minTemp < 0;
    const daysUntil = Math.ceil((bookingStart.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    // Thunderstorm warning (HIGH PRIORITY)
    if (days.some(d => d.condition === 'thunderstorm')) {
        return {
            title: '⛈️ Þruma spáð!',
            body: `Athugaðu að tryggja lausamuni og útirétti fyrir ferð til ${houseName}. Öryggisráðleggingar í appinu.`,
            priority: 'high',
            actionable: true
        };
    }

    // Snow + ice warning (HIGH PRIORITY)
    if (hasSnow && hasIce) {
        const dayWord = daysUntil === 1 ? 'á morgun' : daysUntil === 0 ? 'í dag' : `eftir ${daysUntil} daga`;
        return {
            title: '❄️ Snjókoma og hálka!',
            body: `Það verður hált á leið til ${houseName} ${dayWord}. Nagladekkjum sleppur ekki og gefðu þér 30 mín auka á ferðinni 🚗`,
            priority: 'high',
            actionable: true
        };
    }

    // Extreme cold (HIGH PRIORITY)
    if (minTemp < -10) {
        return {
            title: `🥶 Mikill kuldi spáður (${Math.round(minTemp)}°C)`,
            body: `Mælt með að setja hitann í gang fyrir komu í ${houseName}. Mundu eftir hlýjum teppum og sokkabuxum!`,
            priority: 'high',
            actionable: true
        };
    }

    // Moderate cold (MEDIUM PRIORITY)
    if (minTemp < -5) {
        const suggestions = generatePackingSuggestions(forecast);
        const essentials = suggestions.filter(s => s.priority === 'high').slice(0, 2);
        const items = essentials.map(s => s.item).join(' og ');

        return {
            title: `🌡️ Kuldaviðvörun (${Math.round(minTemp)}°C)`,
            body: `Það verður kalt í ${houseName} um helgina. Ekki gleyma: ${items} 🧣`,
            priority: 'medium',
            actionable: true
        };
    }

    // Heavy rain (MEDIUM PRIORITY)
    if (totalPrecip > 20) {
        return {
            title: '☔ Mikil rigning á dagskrá',
            body: `${Math.round(totalPrecip)}mm rigning spáð fyrir helgina. Fullkomin afsökun til að taka með góða bók og heitta kaffi ☕📚`,
            priority: 'medium',
            actionable: false
        };
    }

    // Strong wind (MEDIUM PRIORITY)
    if (maxWind > 18) {
        return {
            title: `💨 Hvasst! (allt að ${Math.round(maxWind)} m/s)`,
            body: `Munum að tryggja útigripi og grilltæki. Kannski betra að láta veröndina bíða? 🏠`,
            priority: 'medium',
            actionable: true
        };
    }

    // Snow but not severe (LOW PRIORITY - mostly FYI)
    if (hasSnow) {
        return {
            title: '❄️ Snjór á leiðinni',
            body: `Léttsnjókoma spáð á leið til ${houseName}. Fallegur vetrarmorgunn í vændum! ⛷️`,
            priority: 'low',
            actionable: false
        };
    }

    return null;
}

/**
 * Schedule when notifications should be sent
 * Returns array of timestamps when to send notifications
 */
export function getNotificationSchedule(bookingStart: Date, forecast: WeatherForecast): Date[] {
    const now = new Date();
    const daysUntil = Math.ceil((bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const schedule: Date[] = [];

    // Don't send if booking is too far away or already started
    if (daysUntil < 0 || daysUntil > 7) {
        return [];
    }

    const isSevere = shouldSendNotification(forecast);

    if (isSevere) {
        // Severe weather: Send 3 days before and 1 day before
        if (daysUntil >= 3) {
            const threeDaysBefore = new Date(bookingStart);
            threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
            threeDaysBefore.setHours(19, 0, 0, 0); // 7 PM
            schedule.push(threeDaysBefore);
        }

        if (daysUntil >= 1) {
            const oneDayBefore = new Date(bookingStart);
            oneDayBefore.setDate(oneDayBefore.getDate() - 1);
            oneDayBefore.setHours(18, 0, 0, 0); // 6 PM
            schedule.push(oneDayBefore);
        }

        // Morning of departure for severe conditions
        const morningOf = new Date(bookingStart);
        morningOf.setHours(8, 0, 0, 0); // 8 AM
        schedule.push(morningOf);
    } else {
        // Normal weather: Just send 1 day before if there's useful info
        if (daysUntil >= 1 && daysUntil <= 2) {
            const oneDayBefore = new Date(bookingStart);
            oneDayBefore.setDate(oneDayBefore.getDate() - 1);
            oneDayBefore.setHours(19, 0, 0, 0); // 7 PM
            schedule.push(oneDayBefore);
        }
    }

    return schedule.filter(date => date > now);
}

/**
 * Example notification texts for different scenarios
 * These are what users will see on their lock screen - make them delightful!
 */
export const NOTIFICATION_EXAMPLES = {
    severe_snow: {
        title: '❄️ Mikil snjókoma spáð!',
        body: 'Það verður mikið veður á leið til Bústaðarins á föstudaginn. Nagladekkjum sleppur ekki og gefðu þér 30-45 mín auka. Sjáum þig á áfangastað! 🚗❄️'
    },
    extreme_cold: {
        title: '🥶 Frost og mínushiti (-12°C)',
        body: 'Mælt með að kveikja á hita fyrir komu. Mundu eftir hlýjum sokkabuxum og fersku bragði fyrir kakóið! ☕🧣'
    },
    heavy_rain: {
        title: '☔ Mikil rigning um helgina',
        body: '25mm rigning spáð. Fullkomin afsökun til að taka þér pásustund með bók, bretti og bjór. Njóttu inniverunnar! 📚🍺'
    },
    perfect_weather: {
        title: '☀️ Frábært veður fram undan!',
        body: '15°C og sólskin alla helgina. Ekki gleyma sólgleraugum, grilli og plastmottu fyrir stæðið á verönd! 😎🌭'
    },
    wind_warning: {
        title: '💨 Hvasst! (22 m/s spáð)',
        body: 'Tryggðu útirétti og grilltæki. Kannski betra að halda veröndardrykkjunni inni við arinn í þetta sinn? 🏠'
    },
    road_alert: {
        title: '⚠️ Athugið vegaastand',
        body: 'Hálka á köflum á þjóðvegi 1 fyrir norðan. Aktu varlega og fylgstu með road.is. Öruggari ferð! 🚙'
    }
};
