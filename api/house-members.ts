import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeFirebaseAdmin, getDb } from './utils/firebaseAdmin.js';
import { requireAuth, getAuthErrorResponse, isSuperAdminRole } from './utils/apiAuth.js';
import { checkRateLimit, getHouseMembersRateLimit, tryGetRateLimit } from './utils/ratelimit.js';

function isValidId(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0 && value.length <= 128 && !value.includes('/');
}

/**
 * Returns the display data (uid, name, email, avatar_url) of every owner of a
 * house. Users can only read their own `users/{uid}` doc under the Firestore
 * rules, so co-owner lookups go through the Admin SDK here.
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

        const limiter = tryGetRateLimit(getHouseMembersRateLimit);
        if (limiter) {
            const rl = await checkRateLimit(limiter, callerUid, { failOpen: true });
            if (!rl.allowed) {
                return res.status(rl.error.status).json(rl.error.body);
            }
        }

        const { houseId } = req.body || {};
        if (!isValidId(houseId)) {
            return res.status(400).json({ error: 'Missing or invalid houseId' });
        }

        const db = getDb();
        if (!db) {
            console.error('house-members: Firestore not available');
            return res.status(500).json({ error: 'Internal server error' });
        }

        const houseSnap = await db.collection('houses').doc(houseId).get();
        if (!houseSnap.exists) {
            return res.status(404).json({ error: 'House not found' });
        }
        const house = houseSnap.data() || {};
        const ownerIds: string[] = Array.isArray(house.owner_ids)
            ? (house.owner_ids as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0)
            : [];

        if (!ownerIds.includes(callerUid)) {
            const roleSnap = await db.collection('user_roles').doc(callerUid).get();
            if (!isSuperAdminRole(roleSnap.data())) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        }

        const members = await Promise.all(
            ownerIds.map(async (uid) => {
                let data: FirebaseFirestore.DocumentData | undefined;
                try {
                    data = (await db.collection('users').doc(uid).get()).data();
                } catch (err) {
                    console.error('house-members: failed to read a member', err);
                }
                const email = typeof data?.email === 'string' ? data.email : '';
                const rawName = typeof data?.name === 'string' ? data.name.trim() : '';
                const name = rawName || (email.includes('@') ? email.split('@')[0] : '') || 'Meðeigandi';
                const avatar_url = typeof data?.avatar === 'string' && data.avatar ? data.avatar : null;
                return { uid, name, email, avatar_url };
            })
        );

        const managerId = typeof house.manager_id === 'string' ? house.manager_id : '';
        return res.status(200).json({ members, managerId });
    } catch (error) {
        console.error('Error loading house members:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
