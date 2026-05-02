
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeFirebaseAdmin, admin, getDb } from './utils/firebaseAdmin.js';

// Initialize Firebase Admin
initializeFirebaseAdmin();
const db = getDb()!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 🔒 SECURITY: Require authentication
        let authenticatedUser;
        try {
            const { requireAuth } = await import('./utils/apiAuth.js');
            authenticatedUser = await requireAuth(req);
        } catch (authError: any) {
            const { getAuthErrorResponse } = await import('./utils/apiAuth.js');
            const errorResponse = getAuthErrorResponse(authError);
            return res.status(errorResponse.status).json(errorResponse.body);
        }

        const { houseId, inviteCode, token } = req.body;
        const userId = authenticatedUser.uid;

        if (!houseId) {
            return res.status(400).json({ error: 'Missing houseId' });
        }

        if (!inviteCode && !token) {
            return res.status(400).json({ error: 'Missing invite code or token' });
        }

        // If using token, query invitation document BEFORE transaction
        let inviteRef: admin.firestore.DocumentReference | null = null;
        if (token) {
            const inviteQ = db.collection('invitations').where('token', '==', token).limit(1);
            const inviteSnap = await inviteQ.get();

            if (inviteSnap.empty) {
                return res.status(404).json({ error: 'Invalid or expired token' });
            }

            const inviteDoc = inviteSnap.docs[0];
            const inviteData = inviteDoc.data();

            // Verify token matches house
            if (inviteData.house_id !== houseId) {
                return res.status(400).json({ error: 'Token does not match this house' });
            }

            inviteRef = inviteDoc.ref;
        }

        // Now run transaction with document references only
        await db.runTransaction(async (t: FirebaseFirestore.Transaction) => {
            const houseRef = db!.collection('houses').doc(houseId);
            const userRef = db!.collection('users').doc(userId);

            const houseDoc = await t.get(houseRef);
            if (!houseDoc.exists) {
                throw new Error('House not found');
            }

            const houseData = houseDoc.data();

            // Check Validation Logic
            let isValid = false;

            // Method A: Invite Code
            if (inviteCode) {
                if (houseData?.invite_code === inviteCode) {
                    isValid = true;
                } else {
                    throw new Error('Invalid invite code');
                }
            }

            // Method B: Token (already validated above, just mark as valid)
            if (token && inviteRef) {
                isValid = true;
                // Cleanup invitation within transaction
                t.delete(inviteRef);
            }

            if (!isValid) {
                throw new Error('Validation failed');
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
        console.error('❌ Error joining house:', error);

        const errorMessage = error.message || 'Internal server error';
        const statusCode = errorMessage.includes('Invalid') || errorMessage.includes('Missing') ? 400 : 500;

        return res.status(statusCode).json({ error: errorMessage });
    }
}
