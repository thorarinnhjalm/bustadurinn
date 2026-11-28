import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeFirebaseAdmin, getDb, admin } from './utils/firebaseAdmin.js';

/**
 * Guestbook entry from a guest link (src/pages/GuestPage.tsx).
 *
 * Guests are not signed in, so the client cannot write to Firestore. The guest
 * link token (the id of guest_views/{token}) is the credential. The house id is
 * always taken from that document, never from the request.
 *
 * Body: { token, name, message }
 * 200:  { success: true }
 * 400:  { error: 'Invalid request' }
 * 404:  { error: 'Invalid or expired guest link' }
 */

const SITE_ORIGIN = 'https://www.bustadurinn.is';
const MAX_TOKEN_LENGTH = 128;
const MAX_NAME_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 2000;

const FLOOD_WINDOW_MS = 10 * 60 * 1000;
const MAX_GUEST_ENTRIES_PER_WINDOW = 10;

const NOT_FOUND = { error: 'Invalid or expired guest link' };
const BAD_REQUEST = { error: 'Invalid request' };

function clientIp(req: VercelRequest): string {
    const raw = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
    const first = (Array.isArray(raw) ? raw[0] : String(raw)).split(',')[0].trim();
    return first || 'unknown';
}

/** Strip ASCII control characters, keeping newline (and normalising CRLF). */
function cleanText(value: string): string {
    return value
        .replace(/\r\n?/g, '\n')
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '')
        .trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body = (req.body && typeof req.body === 'object') ? req.body : {};
        const { token, name, message } = body as Record<string, unknown>;

        if (
            typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_LENGTH || token.includes('/') ||
            typeof name !== 'string' || typeof message !== 'string'
        ) {
            return res.status(400).json(BAD_REQUEST);
        }
        const author = cleanText(name);
        const text = cleanText(message);
        if (
            author.length < 1 || author.length > MAX_NAME_LENGTH ||
            text.length < 1 || text.length > MAX_MESSAGE_LENGTH
        ) {
            return res.status(400).json(BAD_REQUEST);
        }

        // Rate limit by IP; fail open so a Redis outage does not kill the feature
        // (the token is an unguessable secret).
        const { checkRateLimit, getGuestbookRateLimit, tryGetRateLimit } = await import('./utils/ratelimit.js');
        const limiter = tryGetRateLimit(getGuestbookRateLimit);
        if (limiter) {
            const rl = await checkRateLimit(limiter, clientIp(req), { failOpen: true });
            if (!rl.allowed) {
                return res.status(rl.error.status).json(rl.error.body);
            }
        }

        initializeFirebaseAdmin();
        const db = getDb();
        if (!db) {
            console.error('guestbook-entry: Firestore not available');
            return res.status(500).json({ error: 'Internal server error' });
        }

        const viewSnap = await db.collection('guest_views').doc(token).get();
        if (!viewSnap.exists) {
            return res.status(404).json(NOT_FOUND);
        }
        const view = viewSnap.data() || {};
        const validUntilMs = typeof view.valid_until?.toMillis === 'function' ? view.valid_until.toMillis() : NaN;
        if (view.active === false || (Number.isFinite(validUntilMs) && validUntilMs < Date.now())) {
            return res.status(404).json(NOT_FOUND);
        }
        const houseId = view.houseId;
        if (typeof houseId !== 'string' || !houseId || houseId.includes('/')) {
            return res.status(404).json(NOT_FOUND);
        }

        const houseRef = db.collection('houses').doc(houseId);
        const houseSnap = await houseRef.get();
        if (!houseSnap.exists) {
            return res.status(404).json(NOT_FOUND);
        }
        const house = houseSnap.data() || {};

        // Flood guard without Redis: at most MAX_GUEST_ENTRIES_PER_WINDOW guest-link
        // entries per house per window. Uses the (house_id, created_at) index;
        // `source` is filtered in memory so no extra index is needed. Each entry
        // also triggers owner notifications, so this bounds notification spam.
        const windowStart = admin.firestore.Timestamp.fromMillis(Date.now() - FLOOD_WINDOW_MS);
        const recentSnap = await db.collection('guestbook')
            .where('house_id', '==', houseId)
            .where('created_at', '>=', windowStart)
            .limit(100)
            .get();
        const recentGuestEntries = recentSnap.docs.filter((d) => d.data().source === 'guest_link').length;
        if (recentGuestEntries >= MAX_GUEST_ENTRIES_PER_WINDOW) {
            return res.status(429).json({ error: 'Too many entries, try again later' });
        }

        await db.collection('guestbook').add({
            house_id: houseId,
            author,
            message: text,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            source: 'guest_link',
        });

        // Notify owners. Failures here must not fail the (already saved) entry.
        const houseName: string = typeof house.name === 'string' && house.name ? house.name : 'Sumarhús';
        const ownerIds: string[] = Array.isArray(house.owner_ids)
            ? house.owner_ids.filter((u: unknown): u is string => typeof u === 'string' && u.length > 0)
            : [];
        const link = `${SITE_ORIGIN}/settings?tab=guestbook`;

        for (const ownerId of ownerIds) {
            try {
                const userSnap = await db.collection('users').doc(ownerId).get();
                const userData = userSnap.data();
                if (!userData) continue;

                const inAppEnabled = userData.notification_settings?.in_app?.guestbook_entries ?? true;
                if (!inAppEnabled) continue;

                await db.collection('notifications').add({
                    user_id: ownerId,
                    house_id: houseId,
                    title: 'Ný gestabókarfærsla',
                    message: `${author} skráði í gestabókina í ${houseName}`,
                    type: 'guestbook',
                    read: false,
                    created_at: admin.firestore.FieldValue.serverTimestamp(),
                });

                const tokens: string[] = Array.isArray(userData.fcm_tokens)
                    ? Array.from(new Set((userData.fcm_tokens as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0)))
                    : [];
                if (tokens.length > 0) {
                    try {
                        await admin.messaging().sendEachForMulticast({
                            tokens,
                            notification: {
                                title: 'Ný gestabókarfærsla',
                                body: `${author} skráði í gestabókina í ${houseName}`.slice(0, 500),
                            },
                            data: { link },
                            webpush: {
                                notification: {
                                    icon: `${SITE_ORIGIN}/logo.png`,
                                    badge: `${SITE_ORIGIN}/icon-192x192.png`,
                                },
                                fcmOptions: { link },
                            },
                        });
                    } catch (pushError) {
                        console.error('guestbook-entry: push failed for a recipient', pushError);
                    }
                }
            } catch (recipientError) {
                console.error('guestbook-entry: recipient failed', recipientError);
            }
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error saving guestbook entry:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
