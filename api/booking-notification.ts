import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeFirebaseAdmin, getDb, admin } from './utils/firebaseAdmin.js';
import { requireAuth, getAuthErrorResponse } from './utils/apiAuth.js';
import { checkRateLimit, getBookingNotificationRateLimit, tryGetRateLimit } from './utils/ratelimit.js';

const SITE_ORIGIN = 'https://www.bustadurinn.is';

function escapeHtml(str: string): string {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function isValidId(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0 && value.length <= 128 && !value.includes('/');
}

const translations: Record<'is' | 'en', Record<string, string>> = {
    is: {
        subject: 'Ný bókun í {house}',
        title: 'Ný bókun hefur verið gerð',
        house: 'Hús',
        bookedBy: 'Bókað af',
        date: 'Dags.',
        type: 'Tegund',
        personal: 'Persónuleg',
        guest: 'Gestur',
        rental: 'Leiga',
        maintenance: 'Viðhald',
        footerPrefix: 'Sjá allar bókanir á',
    },
    en: {
        subject: 'New booking in {house}',
        title: 'A new booking has been made',
        house: 'House',
        bookedBy: 'Booked by',
        date: 'Date',
        type: 'Type',
        personal: 'Personal',
        guest: 'Guest',
        rental: 'Rental',
        maintenance: 'Maintenance',
        footerPrefix: 'View all bookings on',
    },
};

function toDate(value: any): Date | null {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate();
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

/** Valid 'yyyy-MM-dd' calendar day or null. */
function parseDay(v: unknown): string | null {
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
    const [y, m, d] = v.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? v : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        initializeFirebaseAdmin();

        // Authentication
        let decoded;
        try {
            decoded = await requireAuth(req);
        } catch (authError: any) {
            const errorResponse = getAuthErrorResponse(authError);
            return res.status(errorResponse.status).json(errorResponse.body);
        }
        const callerUid = decoded.uid;

        // Rate limit per uid (fail open: the caller is already authenticated)
        const limiter = tryGetRateLimit(getBookingNotificationRateLimit);
        if (limiter) {
            const rl = await checkRateLimit(limiter, callerUid, { failOpen: true });
            if (!rl.allowed) {
                return res.status(rl.error.status).json(rl.error.body);
            }
        }

        const { houseId, bookingId } = req.body || {};
        if (!isValidId(houseId) || !isValidId(bookingId)) {
            return res.status(400).json({ error: 'Missing or invalid houseId/bookingId' });
        }
        const language: 'is' | 'en' = req.body.language === 'en' ? 'en' : 'is';

        const db = getDb();
        if (!db) {
            console.error('booking-notification: Firestore not available');
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Caller must be a member of the house
        const houseRef = db.collection('houses').doc(houseId);
        const houseSnap = await houseRef.get();
        if (!houseSnap.exists) {
            return res.status(404).json({ error: 'House not found' });
        }
        const house = houseSnap.data() || {};
        const ownerIds: string[] = Array.isArray(house.owner_ids) ? house.owner_ids : [];
        if (!ownerIds.includes(callerUid)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Booking must exist in this house. Membership (checked above) is the
        // authorisation; user_id may legitimately differ from the caller.
        const bookingRef = houseRef.collection('bookings').doc(bookingId);
        const bookingSnap = await bookingRef.get();
        if (!bookingSnap.exists) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        const booking = bookingSnap.data() || {};
        const bookerUid: string = typeof booking.user_id === 'string' ? booking.user_id : '';

        // Claim the booking so notifications are sent at most once
        const claimed = await db.runTransaction(async (t) => {
            const fresh = await t.get(bookingRef);
            if (!fresh.exists || fresh.data()?.notification_sent_at) return false;
            t.update(bookingRef, {
                notification_sent_at: admin.firestore.FieldValue.serverTimestamp(),
            });
            return true;
        });
        if (!claimed) {
            return res.status(409).json({ error: 'Notifications already sent for this booking' });
        }

        const t = translations[language];
        const houseName: string = typeof house.name === 'string' && house.name ? house.name : 'Sumarhús';
        const bookerName: string = typeof booking.user_name === 'string' && booking.user_name
            ? booking.user_name
            : 'Einhver';
        const bookingType: string = typeof booking.type === 'string' ? booking.type : 'personal';
        const typeLabel = ['personal', 'guest', 'rental', 'maintenance'].includes(bookingType)
            ? t[bookingType]
            : t.personal;

        const locale = language === 'is' ? 'is-IS' : 'en-GB';
        const fmt: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const startDate = toDate(booking.start);
        const endDate = toDate(booking.end);
        // Prefer the zone-independent 'yyyy-MM-dd' strings (start_date/end_date);
        // fall back to the stored instants for bookings created before they existed.
        const fmtDay = (day: string | null, instant: Date | null): string => {
            if (day) {
                const [y, m, d] = day.split('-').map(Number);
                return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(locale, { ...fmt, timeZone: 'UTC' });
            }
            return instant ? instant.toLocaleDateString(locale, fmt) : '';
        };
        const startStr = fmtDay(parseDay(booking.start_date), startDate);
        const endStr = fmtDay(parseDay(booking.end_date), endDate);

        const html = `
            <h2>${escapeHtml(t.title)}</h2>
            <p><strong>${escapeHtml(t.house)}:</strong> ${escapeHtml(houseName)}</p>
            <p><strong>${escapeHtml(t.bookedBy)}:</strong> ${escapeHtml(bookerName)}</p>
            <p><strong>${escapeHtml(t.date)}:</strong> ${escapeHtml(startStr)} - ${escapeHtml(endStr)}</p>
            <p><strong>${escapeHtml(t.type)}:</strong> ${escapeHtml(typeLabel)}</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e5e5;">
            <p style="color: #666; font-size: 14px;">
                ${escapeHtml(t.footerPrefix)} <a href="${SITE_ORIGIN}/dashboard">bustadurinn.is</a>
            </p>
        `;
        const subject = t.subject.replace('{house}', houseName).replace(/[\r\n]+/g, ' ');

        const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

        let inAppCount = 0;
        let emailCount = 0;
        let pushCount = 0;
        let failCount = 0;

        const recipients = ownerIds.filter((uid) => typeof uid === 'string' && uid !== bookerUid);

        for (const ownerId of recipients) {
            try {
                const userSnap = await db.collection('users').doc(ownerId).get();
                const userData = userSnap.data();
                if (!userData) continue;

                const settings = userData.notification_settings;

                // 1. In-app notification (+ push, which follows the in-app setting)
                const inAppEnabled = settings?.in_app?.new_bookings ?? true;
                if (inAppEnabled) {
                    await db.collection('notifications').add({
                        user_id: ownerId,
                        house_id: houseId,
                        title: 'Ný bókun',
                        message: `${bookerName} bókaði ${houseName}`,
                        type: 'booking',
                        read: false,
                        data: { booking_id: bookingId },
                        created_at: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    inAppCount++;

                    const tokens: string[] = Array.isArray(userData.fcm_tokens)
                        ? Array.from(new Set((userData.fcm_tokens as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0)))
                        : [];
                    if (tokens.length > 0) {
                        try {
                            const response = await admin.messaging().sendEachForMulticast({
                                tokens,
                                notification: {
                                    title: 'Ný bókun 🏠',
                                    body: `${bookerName} bókaði ${houseName} (${startStr} - ${endStr})`.slice(0, 500),
                                },
                                data: { link: `${SITE_ORIGIN}/calendar`, booking_id: bookingId },
                                webpush: {
                                    notification: {
                                        icon: `${SITE_ORIGIN}/logo.png`,
                                        badge: `${SITE_ORIGIN}/icon-192x192.png`,
                                    },
                                    fcmOptions: { link: `${SITE_ORIGIN}/calendar` },
                                },
                            });
                            pushCount += response.successCount;
                        } catch (pushError) {
                            failCount++;
                            console.error('booking-notification: push failed for a recipient', pushError);
                        }
                    }
                }

                // 2. Email notification
                const emailEnabled = settings?.emails?.new_bookings ?? true;
                if (emailEnabled && typeof userData.email === 'string' && userData.email && resend) {
                    try {
                        const result = await resend.emails.send({
                            from: 'Bústaðurinn <hallo@bustadurinn.is>',
                            to: userData.email,
                            subject,
                            html,
                        });
                        if (result.error) {
                            failCount++;
                            console.error('booking-notification: email rejected by Resend', result.error);
                        } else {
                            emailCount++;
                        }
                    } catch (emailError) {
                        failCount++;
                        console.error('booking-notification: email failed for a recipient', emailError);
                    }
                }
            } catch (recipientError) {
                failCount++;
                console.error('booking-notification: recipient failed', recipientError);
            }
        }

        return res.status(200).json({
            success: true,
            recipients: recipients.length,
            inAppCount,
            emailCount,
            pushCount,
            failCount,
        });
    } catch (error) {
        console.error('Error sending booking notification:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
