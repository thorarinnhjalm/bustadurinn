/**
 * Weather Alerts Cron
 *
 * Daily job (see vercel.json, 07:00) that scans upcoming bookings across all
 * houses and warns the booking owner when severe weather is forecast for
 * their stay. Mirrors the auth + resilience pattern of
 * api/cron/recover-orphans.ts (CRON_SECRET bearer check, per-item try/catch,
 * JSON summary response).
 *
 * Flow:
 *  1. Load all houses (small collection) that have a `location.lat/lng`.
 *  2. For each house, query its `bookings` subcollection for bookings whose
 *     `start` falls within the next ALERT_HORIZON_DAYS days. The
 *     `weather_alert_sent` flag is filtered in memory (not in the query) so
 *     no composite Firestore index is required.
 *  3. For each not-yet-alerted booking, fetch a met.no forecast for the
 *     house's coordinates and evaluate it against the severity thresholds in
 *     ../utils/weatherThresholds.ts.
 *  4. If severe: write an in-app notification + push (FCM) to the booking's
 *     user, respecting their `notification_settings.in_app.weather_alerts`
 *     preference (same settings-gating pattern as
 *     src/services/bookingService.ts#sendBookingNotifications), then mark
 *     the booking `weather_alert_sent: true` so it isn't re-alerted.
 *     Bookings that stay fine-weather (or whose owner opted out) are left
 *     unflagged and simply re-evaluated on the next run.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeFirebaseAdmin, getDb, admin } from '../utils/firebaseAdmin.js';
import {
    evaluateSevereWeather,
    parseMetNoCompactToDailySummaries,
    SEVERE_WEATHER_LABELS_IS,
} from '../utils/weatherThresholds.js';

initializeFirebaseAdmin();

// met.no requires a descriptive, contactable User-Agent per their ToS:
// https://api.met.no/doc/TermsOfService
const MET_NO_USER_AGENT = 'Bustadurinn.is weather-alerts (hallo@bustadurinn.is)';
const ALERT_HORIZON_DAYS = 3;

interface AlertError {
    houseId?: string;
    bookingId?: string;
    message: string;
}

interface RunSummary {
    housesChecked: number;
    bookingsEvaluated: number;
    alertsSent: number;
    errors: AlertError[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = req.headers.authorization;
        if (authHeader !== `Bearer ${cronSecret}`) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }

    const db = getDb();
    if (!db) {
        return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    const summary: RunSummary = {
        housesChecked: 0,
        bookingsEvaluated: 0,
        alertsSent: 0,
        errors: [],
    };

    try {
        const now = new Date();
        const horizon = new Date(now.getTime() + ALERT_HORIZON_DAYS * 24 * 60 * 60 * 1000);
        const nowTs = admin.firestore.Timestamp.fromDate(now);
        const horizonTs = admin.firestore.Timestamp.fromDate(horizon);

        const housesSnap = await db.collection('houses').get();

        for (const houseDoc of housesSnap.docs) {
            summary.housesChecked++;
            const house = houseDoc.data() || {};
            const lat = house.location?.lat;
            const lng = house.location?.lng;
            if (typeof lat !== 'number' || typeof lng !== 'number') continue;

            try {
                const bookingsSnap = await db
                    .collection('houses')
                    .doc(houseDoc.id)
                    .collection('bookings')
                    .where('start', '>=', nowTs)
                    .where('start', '<=', horizonTs)
                    .get();

                for (const bookingDoc of bookingsSnap.docs) {
                    const booking = bookingDoc.data();

                    // Filtered client-side (not in the query) to avoid needing a
                    // composite index on (start, weather_alert_sent).
                    if (booking.weather_alert_sent === true) continue;
                    if (!booking.start || !booking.user_id) continue;

                    summary.bookingsEvaluated++;

                    try {
                        const bookingStart: Date = booking.start.toDate();
                        const bookingEnd: Date = booking.end ? booking.end.toDate() : bookingStart;

                        const forecastResponse = await fetch(
                            `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lng}`,
                            { headers: { 'User-Agent': MET_NO_USER_AGENT } }
                        );

                        if (!forecastResponse.ok) {
                            throw new Error(`met.no API error ${forecastResponse.status}`);
                        }

                        const forecastData = await forecastResponse.json();
                        const days = parseMetNoCompactToDailySummaries(forecastData, bookingStart, bookingEnd);
                        const severity = evaluateSevereWeather(days);

                        if (!severity.isSevere) continue;

                        const userDoc = await db.collection('users').doc(booking.user_id).get();
                        const userData = userDoc.data();
                        if (!userData) continue;

                        // Respect the user's weather-alert preference. If disabled,
                        // leave weather_alert_sent unset so the booking is simply
                        // re-checked (and re-skipped) on the next run rather than
                        // being treated as "handled".
                        const inAppEnabled = userData.notification_settings?.in_app?.weather_alerts ?? true;
                        if (!inAppEnabled) continue;

                        const houseName = house.name || 'sumarhúsið';
                        const reasonLabels = severity.reasons
                            .map((reason) => SEVERE_WEATHER_LABELS_IS[reason])
                            .join(', ');
                        const dateLabel = formatDateRangeIS(bookingStart, bookingEnd);

                        const title = '⚠️ Veðurviðvörun';
                        const message = `Spáð er ${reasonLabels} við ${houseName} ${dateLabel}. Kíktu á veðurspána áður en þú leggur af stað.`;

                        await db.collection('notifications').add({
                            user_id: booking.user_id,
                            house_id: houseDoc.id,
                            title,
                            message,
                            type: 'system',
                            read: false,
                            data: { booking_id: bookingDoc.id },
                            created_at: admin.firestore.FieldValue.serverTimestamp(),
                        });

                        const tokens: string[] = Array.isArray(userData.fcm_tokens) ? userData.fcm_tokens : [];
                        if (tokens.length > 0) {
                            try {
                                await admin.messaging().sendEachForMulticast({
                                    tokens: Array.from(new Set(tokens)),
                                    notification: { title, body: message },
                                    data: { link: '/calendar' },
                                    webpush: {
                                        notification: {
                                            icon: 'https://bustadurinn.is/logo.png',
                                            badge: 'https://bustadurinn.is/icon-192x192.png',
                                        },
                                        fcmOptions: { link: 'https://bustadurinn.is/calendar' },
                                    },
                                });
                            } catch (pushError: any) {
                                // Push is best-effort — the in-app notification above
                                // already landed, so don't fail the whole booking.
                                summary.errors.push({
                                    houseId: houseDoc.id,
                                    bookingId: bookingDoc.id,
                                    message: `push failed: ${pushError?.message || pushError}`,
                                });
                            }
                        }

                        await bookingDoc.ref.update({ weather_alert_sent: true });
                        summary.alertsSent++;
                    } catch (bookingError: any) {
                        summary.errors.push({
                            houseId: houseDoc.id,
                            bookingId: bookingDoc.id,
                            message: bookingError?.message || String(bookingError),
                        });
                    }
                }
            } catch (houseError: any) {
                summary.errors.push({
                    houseId: houseDoc.id,
                    message: houseError?.message || String(houseError),
                });
            }
        }

        return res.status(200).json({ success: true, ...summary });
    } catch (error: any) {
        console.error('weather-alerts cron error:', error);
        return res.status(500).json({ error: error.message || String(error), ...summary });
    }
}

function formatDateRangeIS(start: Date, end: Date): string {
    const fmt = (d: Date) => d.toLocaleDateString('is-IS', { day: 'numeric', month: 'long' });
    if (start.toDateString() === end.toDateString()) return fmt(start);
    return `${fmt(start)} – ${fmt(end)}`;
}
