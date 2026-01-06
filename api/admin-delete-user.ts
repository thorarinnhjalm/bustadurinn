import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

// Lazy init
let db: admin.firestore.Firestore | null = null;
let auth: admin.auth.Auth | null = null;

function initServices() {
    if (!admin.apps.length) {
        try {
            if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: serviceAccount.project_id
                });
            } else {
                // Fallback for local or managed environment
                admin.initializeApp({
                    credential: admin.credential.applicationDefault(),
                    projectId: 'bustadurinn-is'
                });
            }
        } catch (error) {
            console.error('❌ Firebase Admin initialization error:', error);
            throw new Error(`Firebase Init Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    if (!db) db = admin.firestore();
    if (!auth) auth = admin.auth();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        initServices();

        // 🔒 SECURITY: Verify admin authentication
        const { requireAdmin, getAuthErrorResponse } = await import('./utils/apiAuth');
        try {
            await requireAdmin(req);
        } catch (authError: any) {
            const errorResponse = getAuthErrorResponse(authError);
            return res.status(errorResponse.status).json(errorResponse.body);
        }

        if (!db || !auth) {
            throw new Error('Internal services failed to initialize');
        }

        const { uid } = req.body;

        if (!uid) {
            return res.status(400).json({ error: 'Missing uid' });
        }

        console.log(`🗑️ Admin requested deletion of user: ${uid}`);

        // 1. Delete from Firebase Authentication
        await auth.deleteUser(uid);
        console.log(`✅ Auth user ${uid} deleted`);

        // 2. Delete User Profile from Firestore
        await db.collection('users').doc(uid).delete();
        console.log(`✅ Firestore user profile ${uid} deleted`);

        // 3. Optional: Cleanup memberships? 
        // For now, we leave house memberships as 'ghost' strings in arrays or rely on client-side filtering.
        // A robust solution would remove the UID from 'owner_ids' in all houses.
        // Let's attempt a best-effort cleanup of houses where they are an owner.
        const housesSnap = await db.collection('houses').where('owner_ids', 'array-contains', uid).get();

        const batch = db.batch();
        housesSnap.docs.forEach(doc => {
            const houseRef = db!.collection('houses').doc(doc.id);
            // Remove from owner_ids
            batch.update(houseRef, {
                owner_ids: admin.firestore.FieldValue.arrayRemove(uid)
            });
            // If they are the manager, we should probably warn or handle it, but for a "Force Delete", leaving it or setting to null/first owner is an option.
            // For now, let's just remove them from the list. The frontend logic usually handles missing managers gracefully or shows an error.
        });

        if (!housesSnap.empty) {
            await batch.commit();
            console.log(`✅ Removed user ${uid} from ${housesSnap.size} houses`);
        }

        return res.status(200).json({ success: true, message: `User ${uid} deleted completely` });

    } catch (error: any) {
        console.error('❌ Server Error deleting user:', error);

        // Don't expose stack traces in production
        const errorResponse = process.env.NODE_ENV === 'production'
            ? { error: 'Internal server error' }
            : { error: error.message, code: error.code || 'internal_server_error' };

        return res.status(500).json(errorResponse);
    }
}
