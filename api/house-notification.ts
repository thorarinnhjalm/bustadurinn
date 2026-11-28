import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeFirebaseAdmin, getDb, admin } from './utils/firebaseAdmin.js';
import { requireAuth, getAuthErrorResponse } from './utils/apiAuth.js';
import { checkRateLimit, getHouseNotificationRateLimit, tryGetRateLimit } from './utils/ratelimit.js';

const SITE_ORIGIN = 'https://www.bustadurinn.is';
const MAX_STR = 200;
const MAX_ASSIGNEES = 50;

function isValidId(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0 && value.length <= 128 && !value.includes('/');
}

function cleanStr(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const s = value.trim();
    if (!s || s.length > MAX_STR) return null;
    return s;
}

interface Payload {
    title: string;
    message: string;
    type: 'task' | 'shopping';
    data?: Record<string, string>;
    /** Setting key under notification_settings.in_app */
    settingKey: 'task_assignments' | 'shopping_list_updates';
    path: string;
    pushTitle: string;
}

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

        const limiter = tryGetRateLimit(getHouseNotificationRateLimit);
        if (limiter) {
            const rl = await checkRateLimit(limiter, callerUid, { failOpen: true });
            if (!rl.allowed) {
                return res.status(rl.error.status).json(rl.error.body);
            }
        }

        const body = req.body || {};
        const { houseId, kind } = body;
        if (!isValidId(houseId)) {
            return res.status(400).json({ error: 'Missing or invalid houseId' });
        }
        if (kind !== 'task_assigned' && kind !== 'shopping_added') {
            return res.status(400).json({ error: 'Invalid kind' });
        }

        // Kind-specific validation
        let taskId = '';
        let taskTitle = '';
        let itemName = '';
        let assigneeUids: string[] = [];
        if (kind === 'task_assigned') {
            if (!isValidId(body.taskId)) return res.status(400).json({ error: 'Missing or invalid taskId' });
            const t = cleanStr(body.taskTitle);
            if (!t) return res.status(400).json({ error: 'Missing or invalid taskTitle' });
            if (!Array.isArray(body.assigneeUids) || body.assigneeUids.length > MAX_ASSIGNEES
                || !body.assigneeUids.every(isValidId)) {
                return res.status(400).json({ error: 'Missing or invalid assigneeUids' });
            }
            taskId = body.taskId;
            taskTitle = t;
            assigneeUids = body.assigneeUids;
        } else {
            const n = cleanStr(body.itemName);
            if (!n) return res.status(400).json({ error: 'Missing or invalid itemName' });
            itemName = n;
        }

        const db = getDb();
        if (!db) {
            console.error('house-notification: Firestore not available');
            return res.status(500).json({ error: 'Internal server error' });
        }

        const houseSnap = await db.collection('houses').doc(houseId).get();
        if (!houseSnap.exists) {
            return res.status(404).json({ error: 'House not found' });
        }
        const ownerIds: string[] = Array.isArray(houseSnap.data()?.owner_ids)
            ? (houseSnap.data()!.owner_ids as unknown[]).filter((x): x is string => typeof x === 'string')
            : [];
        if (!ownerIds.includes(callerUid)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Actor name comes from the caller's own profile, never from the request
        let actorName = 'Meðeigandi';
        try {
            const actorData = (await db.collection('users').doc(callerUid).get()).data();
            const n = typeof actorData?.name === 'string' ? actorData.name.trim() : '';
            if (n) actorName = n.slice(0, MAX_STR);
        } catch {
            // keep fallback
        }

        let payload: Payload;
        let candidates: string[];
        if (kind === 'task_assigned') {
            candidates = assigneeUids;
            payload = {
                title: 'Nýtt verkefni á þig',
                message: `${actorName} úthlutaði þér verkefninu „${taskTitle}“`,
                type: 'task',
                data: { task_id: taskId },
                settingKey: 'task_assignments',
                path: '/tasks',
                pushTitle: 'Nýtt verkefni á þig',
            };
        } else {
            // Shopping updates go to every other house member
            candidates = ownerIds;
            payload = {
                title: 'Ný vara á innkaupalistann',
                message: `${actorName} bætti „${itemName}“ á innkaupalistann`,
                type: 'shopping',
                settingKey: 'shopping_list_updates',
                path: '/settings',
                pushTitle: 'Ný vara á innkaupalistann',
            };
        }

        const recipients = Array.from(new Set(candidates)).filter(
            (uid) => uid !== callerUid && ownerIds.includes(uid)
        );

        let inAppCount = 0;
        let pushCount = 0;
        let failCount = 0;

        for (const uid of recipients) {
            try {
                const userData = (await db.collection('users').doc(uid).get()).data();
                if (!userData) continue;

                const enabled = userData.notification_settings?.in_app?.[payload.settingKey] ?? true;
                if (!enabled) continue;

                const doc: Record<string, unknown> = {
                    user_id: uid,
                    house_id: houseId,
                    title: payload.title,
                    message: payload.message,
                    type: payload.type,
                    read: false,
                };
                if (payload.data) doc.data = payload.data;
                doc.created_at = admin.firestore.FieldValue.serverTimestamp();
                await db.collection('notifications').add(doc);
                inAppCount++;

                const tokens: string[] = Array.isArray(userData.fcm_tokens)
                    ? Array.from(new Set((userData.fcm_tokens as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0)))
                    : [];
                if (tokens.length > 0) {
                    try {
                        const link = `${SITE_ORIGIN}${payload.path}`;
                        const response = await admin.messaging().sendEachForMulticast({
                            tokens,
                            notification: {
                                title: payload.pushTitle,
                                body: payload.message.slice(0, 500),
                            },
                            data: { link, house_id: houseId, ...(payload.data || {}) },
                            webpush: {
                                notification: {
                                    icon: `${SITE_ORIGIN}/logo.png`,
                                    badge: `${SITE_ORIGIN}/badge-96.png`,
                                },
                                fcmOptions: { link },
                            },
                        });
                        pushCount += response.successCount;
                    } catch (pushError) {
                        failCount++;
                        console.error('house-notification: push failed for a recipient', pushError);
                    }
                }
            } catch (recipientError) {
                failCount++;
                console.error('house-notification: recipient failed', recipientError);
            }
        }

        return res.status(200).json({
            success: true,
            recipients: recipients.length,
            inAppCount,
            pushCount,
            failCount,
        });
    } catch (error) {
        console.error('Error sending house notification:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
