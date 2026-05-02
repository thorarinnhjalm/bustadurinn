import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import { getDb, initializeFirebaseAdmin } from './firebaseAdmin';

const ADMIN_EMAILS = [
    'thorarinnhjalmarsson@gmail.com',
    'thorarinnhjalm@gmail.com'
];

const ADMIN_UIDS = [
    'sxcToczAAwT3Fmh8FPXa1P6hMHB3'
];

export async function verifyAdminToken(req: VercelRequest, res: VercelResponse): Promise<admin.auth.DecodedIdToken | null> {
    // Ensure services are ready
    initializeFirebaseAdmin();

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized: Missing token' });
        return null;
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const auth = admin.auth();
        if (!auth) throw new Error('Auth service not initialized');
        const decodedToken = await auth.verifyIdToken(token);

        // 1. Hardcoded Super Admin Check (Recovery/Master)
        const isEmailAdmin = decodedToken.email && ADMIN_EMAILS.includes(decodedToken.email);
        const isUidAdmin = ADMIN_UIDS.includes(decodedToken.uid);

        if (isEmailAdmin || isUidAdmin) {
            return decodedToken;
        }

        // 2. RBAC Check (Database)
        const db = getDb();
        if (db) {
            const roleDoc = await db.collection('user_roles').doc(decodedToken.uid).get();
            if (roleDoc.exists && roleDoc.data()?.system_role === 'super_admin') {
                return decodedToken;
            }
        }

        console.warn(`Blocked unauthorized access attempt by: ${decodedToken.email} (${decodedToken.uid})`);
        res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        return null;

    } catch (e) {
        console.error('Token verification failed:', e);
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
        return null;
    }
}
