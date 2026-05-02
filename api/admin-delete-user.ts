import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, getAuth, initializeFirebaseAdmin } from './utils/firebaseAdmin.js';
import admin from 'firebase-admin';
import { verifyAdminToken } from './utils/admin-auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        initializeFirebaseAdmin();
        const db = getDb();
        const auth = getAuth();

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

        // 4. Cleanup memberships and orphan houses
        const housesSnap = await db.collection('houses').where('owner_ids', 'array-contains', uid).get();

        const batch = db.batch();
        let deletedHousesCount = 0;

        housesSnap.docs.forEach((doc: any) => {
            const houseData = doc.data();
            const houseRef = db!.collection('houses').doc(doc.id);
            
            // If the user is the ONLY owner (and manager), delete the house entirely
            if (houseData.owner_ids.length === 1 && houseData.owner_ids[0] === uid) {
                batch.delete(houseRef);
                deletedHousesCount++;
            } else {
                // Otherwise, just remove them from the owner list
                batch.update(houseRef, {
                    owner_ids: admin.firestore.FieldValue.arrayRemove(uid)
                });
                
                // If they were the manager, we should ideally reassign, but setting to null is acceptable for a force delete
                if (houseData.manager_id === uid) {
                    batch.update(houseRef, {
                        manager_id: null
                    });
                }
            }
        });

        if (!housesSnap.empty) {
            await batch.commit();
            console.log(`✅ Removed user ${uid} from ${housesSnap.size - deletedHousesCount} houses and deleted ${deletedHousesCount} orphan houses`);
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
