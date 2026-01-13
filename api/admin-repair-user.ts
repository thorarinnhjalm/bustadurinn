import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

const ADMIN_EMAILS = [
    'thorarinnhjalmarsson@gmail.com',
    'thorarinnhjalm@gmail.com',
];

async function requireAdmin(req: VercelRequest): Promise<admin.auth.DecodedIdToken> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('UNAUTHORIZED');
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        if (!decodedToken.email || !ADMIN_EMAILS.includes(decodedToken.email)) {
            throw new Error('FORBIDDEN');
        }
        return decodedToken;
    } catch (error: any) {
        if (error.message === 'FORBIDDEN') throw error;
        throw new Error('UNAUTHORIZED');
    }
}

let db: admin.firestore.Firestore | null = null;
let auth: admin.auth.Auth | null = null;

function initServices() {
    if (admin.apps.length > 0) {
        db = admin.firestore();
        auth = admin.auth();
        return;
    }
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id
            });
        } else {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: 'bustadurinn-is'
            });
        }
        db = admin.firestore();
        auth = admin.auth();
    } catch (error: any) {
        throw new Error('FIREBASE_INIT_FAILED');
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        initServices();
        await requireAdmin(req);

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
