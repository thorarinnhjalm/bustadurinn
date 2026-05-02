import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeFirebaseAdmin, admin, getDb, getAuth } from './utils/firebaseAdmin.js';

import { verifyAdminToken } from './utils/admin-auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        initializeFirebaseAdmin();
        const db = getDb();
        const auth = getAuth();

        const decodedToken = await verifyAdminToken(req, res);
        if (!decodedToken) return;

        if (!auth || !db) throw new Error('Services not initialized');

        const { uid } = req.body;
        if (!uid) return res.status(400).json({ error: 'Missing uid' });

        // 1. Get user from Auth to populate profile
        const authUser = await auth.getUser(uid);

        // 2. Create Firestore Profile
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            return res.status(400).json({ error: 'User already has a Firestore profile' });
        }

        await userRef.set({
            uid: authUser.uid,
            email: authUser.email,
            name: authUser.displayName || authUser.email?.split('@')[0] || 'Unknown',
            house_ids: [],
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            last_login: admin.firestore.FieldValue.serverTimestamp(),
            repaired_by_admin: true,
            repaired_at: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Repaired orphan user: ${uid}`);

        return res.status(200).json({ success: true, message: `Profile created for ${authUser.email}` });

    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') return res.status(401).json({ error: 'Unauthorized' });
        if (error.message === 'FORBIDDEN') return res.status(403).json({ error: 'Forbidden' });

        console.error('Repair Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
