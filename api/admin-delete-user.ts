import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, auth, admin, initializeFirebaseAdmin } from './utils/firebaseAdmin';
import { verifyAdminToken } from './utils/admin-auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        initializeFirebaseAdmin();

        if (!db || !auth) {
            throw new Error('Internal services failed to initialize');
        }

        // 🔒 SECURITY: Verify admin authentication
        const decodedToken = await verifyAdminToken(req, res);
        if (!decodedToken) return;

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

        // 3. Delete user_roles document (RBAC cleanup)
        try {
            await db.collection('user_roles').doc(uid).delete();
            console.log(`✅ User roles ${uid} deleted`);
        } catch {
            // Non-critical if role document doesn't exist
            console.log(`ℹ️ No user_roles document for ${uid}`);
        }

        // 4. Optional: Cleanup memberships
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

        // Only expose stack traces in development, not production
        const errorResponse = process.env.NODE_ENV === 'production'
            ? {
                error: 'Internal server error',
                code: error.code || 'internal_server_error'
            }
            : {
                error: error.message,
                code: error.code || 'internal_server_error',
                details: error.stack
            };

        return res.status(500).json(errorResponse);
    }
}
