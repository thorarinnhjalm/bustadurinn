import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import { getDb, initializeFirebaseAdmin } from './firebaseAdmin.js';
import { isAdminIdentity } from './apiAuth.js';

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

        // Role doc OR verified allow-listed email OR allow-listed uid
        const db = getDb();
        const roleDoc = db ? await db.collection('user_roles').doc(decodedToken.uid).get() : null;
        if (isAdminIdentity(decodedToken, roleDoc?.exists ? roleDoc.data() : undefined)) {
            return decodedToken;
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
