import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeFirebaseAdmin, getDb, admin } from './utils/firebaseAdmin.js';
import { requireAuth, getAuthErrorResponse } from './utils/apiAuth.js';
import { checkRateLimit, getPushRateLimit, tryGetRateLimit } from './utils/ratelimit.js';

const SITE_ORIGIN = 'https://www.bustadurinn.is';
const MAX_TITLE = 120;
const MAX_BODY = 500;

/**
 * Send a push notification from the caller to the OTHER owners of a house.
 * Body: { houseId, title, body, link? }. Recipient tokens are resolved server-side.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        initializeFirebaseAdmin();

        let decoded;
        try {
            decoded = await requireAuth(req);
        } catch (authError: any) {
            const errorResponse = getAuthErrorResponse(authError);
            return res.status(errorResponse.status).json(errorResponse.body);
        }
        const callerUid = decoded.uid;

        const limiter = tryGetRateLimit(getPushRateLimit);
        if (limiter) {
            const rl = await checkRateLimit(limiter, callerUid, { failOpen: true });
            if (!rl.allowed) {
                return res.status(rl.error.status).json(rl.error.body);
            }
        }

        const { houseId, title, body, link } = req.body || {};
        if (
            typeof houseId !== 'string' || !houseId || houseId.length > 128 || houseId.includes('/') ||
            typeof title !== 'string' || !title.trim() ||
            typeof body !== 'string' || !body.trim()
        ) {
            return res.status(400).json({ error: 'Missing or invalid houseId, title or body' });
        }

        const safeTitle = title.trim().slice(0, MAX_TITLE);
        const safeBody = body.trim().slice(0, MAX_BODY);

        // Only a relative path with a single leading slash is accepted
        const safeLink =
            typeof link === 'string' && link.startsWith('/') && !link.startsWith('//') && !link.includes('\\') && !/[\r\n]/.test(link)
                ? `${SITE_ORIGIN}${link}`
                : `${SITE_ORIGIN}/dashboard`;

        const db = getDb();
        if (!db) {
            console.error('push-notification: Firestore not available');
            return res.status(500).json({ error: 'Internal server error' });
        }

        const houseSnap = await db.collection('houses').doc(houseId).get();
        if (!houseSnap.exists) {
            return res.status(404).json({ error: 'House not found' });
        }
        const ownerIds: string[] = Array.isArray(houseSnap.data()?.owner_ids) ? houseSnap.data()!.owner_ids : [];
        if (!ownerIds.includes(callerUid)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Resolve recipient tokens: other owners only
        const tokenSet = new Set<string>();
        for (const ownerId of ownerIds) {
            if (ownerId === callerUid) continue;
            try {
                const userSnap = await db.collection('users').doc(ownerId).get();
                const tokens = userSnap.data()?.fcm_tokens;
                if (Array.isArray(tokens)) {
                    for (const tok of tokens) {
                        if (typeof tok === 'string' && tok) tokenSet.add(tok);
                    }
                }
            } catch (e) {
                console.error('push-notification: failed to read a recipient', e);
            }
        }

        if (tokenSet.size === 0) {
            return res.status(200).json({ success: true, successCount: 0, failureCount: 0 });
        }

        const response = await admin.messaging().sendEachForMulticast({
            tokens: Array.from(tokenSet),
            notification: { title: safeTitle, body: safeBody },
            data: { link: safeLink },
            webpush: {
                notification: {
                    icon: `${SITE_ORIGIN}/logo.png`,
                    badge: `${SITE_ORIGIN}/badge-96.png`,
                },
                fcmOptions: { link: safeLink },
            },
        });

        return res.status(200).json({
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount,
        });
    } catch (error) {
        console.error('Error sending push notification:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
