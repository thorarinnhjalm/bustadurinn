import type { VercelRequest, VercelResponse } from '@vercel/node';
import { timingSafeEqual } from 'node:crypto';
import { initializeFirebaseAdmin, getDb } from './utils/firebaseAdmin.js';

/**
 * Public invitation lookup used by the join screen (src/pages/JoinPage.tsx).
 *
 * Invitees may not have an account yet, so this endpoint is unauthenticated.
 * It returns only what the join screen needs to render and answers every
 * failure with the same generic 404 so it cannot be used to probe which
 * house ids exist.
 *
 * Body: { token } or { houseId, code }
 * 200:  { houseId, houseName, inviterName, email? }   (email only for token invites)
 * 404:  { error: 'Invalid or expired invitation' }
 */

const INVITE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_TOKEN_LENGTH = 128;
const MAX_CODE_LENGTH = 32;
const MAX_HOUSE_ID_LENGTH = 64;

const NOT_FOUND = { error: 'Invalid or expired invitation' };

function safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
}

function clientIp(req: VercelRequest): string {
    const raw = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
    const first = (Array.isArray(raw) ? raw[0] : String(raw)).split(',')[0].trim();
    return first || 'unknown';
}

function isFreshInvitation(data: FirebaseFirestore.DocumentData): boolean {
    if (data.status !== 'pending') return false;
    const createdAt = typeof data.created_at?.toMillis === 'function' ? data.created_at.toMillis() : NaN;
    if (!Number.isFinite(createdAt)) return false;
    return Date.now() - createdAt <= INVITE_MAX_AGE_MS;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Validate input shape first (cheap), before touching Redis or Firestore.
        const body = (req.body && typeof req.body === 'object') ? req.body : {};
        const { token, houseId, code } = body as Record<string, unknown>;

        const hasToken = token !== undefined && token !== null;
        const hasCode = (houseId !== undefined && houseId !== null) || (code !== undefined && code !== null);

        if (hasToken === hasCode) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        if (hasToken) {
            if (typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
                return res.status(400).json({ error: 'Invalid request' });
            }
        } else if (
            typeof houseId !== 'string' || houseId.length === 0 || houseId.length > MAX_HOUSE_ID_LENGTH ||
            typeof code !== 'string' || code.length === 0 || code.length > MAX_CODE_LENGTH
        ) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        // Rate limit by IP. If the limiter is unavailable the lookup still runs:
        // tokens and house ids are unguessable, and failing closed here would
        // lock every invitee out of joining during a Redis outage.
        const { checkRateLimit, getInviteLookupRateLimit, tryGetRateLimit } = await import('./utils/ratelimit.js');
        const limiter = tryGetRateLimit(getInviteLookupRateLimit);
        if (limiter) {
            const rateLimitResult = await checkRateLimit(limiter, clientIp(req), { failOpen: true });
            if (!rateLimitResult.allowed) {
                return res.status(rateLimitResult.error.status).json(rateLimitResult.error.body);
            }
        }

        initializeFirebaseAdmin();
        const db = getDb()!;

        if (hasToken) {
            const snap = await db.collection('invitations').where('token', '==', token as string).limit(1).get();
            if (snap.empty) {
                return res.status(404).json(NOT_FOUND);
            }

            const invite = snap.docs[0].data();
            if (!isFreshInvitation(invite) || typeof invite.house_id !== 'string' || !invite.house_id) {
                return res.status(404).json(NOT_FOUND);
            }

            const houseSnap = await db.collection('houses').doc(invite.house_id).get();
            if (!houseSnap.exists) {
                return res.status(404).json(NOT_FOUND);
            }

            return res.status(200).json({
                houseId: houseSnap.id,
                houseName: String(houseSnap.data()?.name ?? invite.house_name ?? ''),
                inviterName: typeof invite.invited_by_name === 'string' ? invite.invited_by_name : '',
                email: typeof invite.email === 'string' ? invite.email : ''
            });
        }

        // houseId + invite code path
        const houseSnap = await db.collection('houses').doc(houseId as string).get();
        const house = houseSnap.exists ? houseSnap.data() : undefined;
        const storedCode = house?.invite_code;
        if (!house || typeof storedCode !== 'string' || storedCode.length === 0 || !safeEqual(storedCode, code as string)) {
            return res.status(404).json(NOT_FOUND);
        }

        let inviterName = '';
        if (typeof house.manager_id === 'string' && house.manager_id) {
            try {
                const managerSnap = await db.collection('users').doc(house.manager_id).get();
                const name = managerSnap.exists ? managerSnap.data()?.name : '';
                inviterName = typeof name === 'string' ? name : '';
            } catch (managerError) {
                console.warn('Could not load inviter name:', managerError);
            }
        }

        return res.status(200).json({
            houseId: houseSnap.id,
            houseName: String(house.name ?? ''),
            inviterName
        });
    } catch (error) {
        console.error('Error looking up invitation:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
