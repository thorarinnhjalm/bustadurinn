
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { timingSafeEqual } from 'node:crypto';
import { initializeFirebaseAdmin, admin, getDb } from './utils/firebaseAdmin.js';

// Initialize Firebase Admin
initializeFirebaseAdmin();
const db = getDb()!;

const INVITE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_TOKEN_LENGTH = 128;
const MAX_CODE_LENGTH = 32;
const MAX_HOUSE_ID_LENGTH = 64;

/** Error that is safe to show the client: carries its own HTTP status and generic message. */
class JoinError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

const INVALID_INVITATION = 'Invalid or expired invitation';

function safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
}

/** Pending and not older than 30 days. */
function isFreshInvitation(data: FirebaseFirestore.DocumentData | undefined): boolean {
    if (!data || data.status !== 'pending') return false;
    const createdAt = typeof data.created_at?.toMillis === 'function' ? data.created_at.toMillis() : NaN;
    if (!Number.isFinite(createdAt)) return false;
    return Date.now() - createdAt <= INVITE_MAX_AGE_MS;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // SECURITY: Require authentication
        let authenticatedUser;
        try {
            const { requireAuth } = await import('./utils/apiAuth.js');
            authenticatedUser = await requireAuth(req);
        } catch (authError: any) {
            const { getAuthErrorResponse } = await import('./utils/apiAuth.js');
            const errorResponse = getAuthErrorResponse(authError);
            return res.status(errorResponse.status).json(errorResponse.body);
        }

        const userId = authenticatedUser.uid;

        // Per-user rate limit. The route is authenticated, so if the limiter
        // itself is unavailable we log and let the request through.
        try {
            const { checkRateLimit, getJoinHouseRateLimit, tryGetRateLimit } = await import('./utils/ratelimit.js');
            const limiter = tryGetRateLimit(getJoinHouseRateLimit);
            if (limiter) {
                const rateLimitResult = await checkRateLimit(limiter, userId, { failOpen: true });
                if (!rateLimitResult.allowed) {
                    return res.status(rateLimitResult.error.status).json(rateLimitResult.error.body);
                }
            }
        } catch (limiterError) {
            console.warn('Rate limit check skipped:', limiterError);
        }

        const body = (req.body && typeof req.body === 'object') ? req.body : {};
        const { houseId, inviteCode, token } = body as Record<string, unknown>;

        if (typeof houseId !== 'string' || !houseId || houseId.length > MAX_HOUSE_ID_LENGTH) {
            return res.status(400).json({ error: 'Missing houseId' });
        }

        const hasToken = typeof token === 'string' && token.length > 0;
        const hasCode = typeof inviteCode === 'string' && inviteCode.length > 0;

        if (!hasToken && !hasCode) {
            return res.status(400).json({ error: 'Missing invite code or token' });
        }
        if ((hasToken && (token as string).length > MAX_TOKEN_LENGTH) ||
            (hasCode && (inviteCode as string).length > MAX_CODE_LENGTH)) {
            return res.status(400).json({ error: INVALID_INVITATION });
        }

        // Token path: locate the invitation doc reference BEFORE the transaction.
        // Its contents are re-read and validated INSIDE the transaction.
        let inviteRef: FirebaseFirestore.DocumentReference | null = null;
        if (hasToken) {
            const inviteSnap = await db.collection('invitations').where('token', '==', token as string).limit(1).get();
            if (inviteSnap.empty) {
                throw new JoinError(404, INVALID_INVITATION);
            }
            inviteRef = inviteSnap.docs[0].ref;
        }

        await db.runTransaction(async (t: FirebaseFirestore.Transaction) => {
            const houseRef = db.collection('houses').doc(houseId);
            const userRef = db.collection('users').doc(userId);

            // All reads first
            const houseDoc = await t.get(houseRef);
            const userDoc = await t.get(userRef);
            const inviteDoc = inviteRef ? await t.get(inviteRef) : null;

            if (!houseDoc.exists) {
                throw new JoinError(400, INVALID_INVITATION);
            }
            const houseData = houseDoc.data();

            if (hasToken) {
                // Invitation must still exist (not consumed by a concurrent request),
                // be pending, fresh, and belong to this house.
                const inviteData = inviteDoc?.exists ? inviteDoc.data() : undefined;
                if (!inviteDoc || !inviteData ||
                    typeof inviteData.token !== 'string' ||
                    !safeEqual(inviteData.token, token as string) ||
                    !isFreshInvitation(inviteData) ||
                    inviteData.house_id !== houseId) {
                    throw new JoinError(400, INVALID_INVITATION);
                }
            } else {
                const storedCode = houseData?.invite_code;
                if (typeof storedCode !== 'string' || storedCode.length === 0 ||
                    !safeEqual(storedCode, inviteCode as string)) {
                    throw new JoinError(400, INVALID_INVITATION);
                }
            }

            if (!userDoc.exists) {
                throw new JoinError(400, 'User profile not found');
            }

            // Consume the invitation (token path)
            if (hasToken && inviteRef) {
                t.delete(inviteRef);
            }

            // Add user to house
            t.update(houseRef, {
                owner_ids: admin.firestore.FieldValue.arrayUnion(userId)
            });

            // Add house to user
            t.update(userRef, {
                house_ids: admin.firestore.FieldValue.arrayUnion(houseId)
            });
        });

        return res.status(200).json({ success: true, message: 'Joined house successfully' });

    } catch (error: any) {
        if (error instanceof JoinError) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error('Error joining house:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
