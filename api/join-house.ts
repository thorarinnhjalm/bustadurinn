
import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

// Lazy init variables
let db: admin.firestore.Firestore | null = null;

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

    if (!db) {
        db = admin.firestore();
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        initServices();

        // 🔒 SECURITY: Require authentication
        let authenticatedUser;
        try {
            const { requireAuth } = await import('./utils/apiAuth');
            authenticatedUser = await requireAuth(req);
        } catch (authError: any) {
            const { getAuthErrorResponse } = await import('./utils/apiAuth');
            const errorResponse = getAuthErrorResponse(authError);
            return res.status(errorResponse.status).json(errorResponse.body);
        }

        if (!db) {
            throw new Error('Internal services failed to initialize');
        }

        const { houseId, inviteCode, token } = req.body;
        const userId = authenticatedUser.uid;

        if (!houseId) {
            return res.status(400).json({ error: 'Missing houseId' });
        }

        if (!inviteCode && !token) {
            return res.status(400).json({ error: 'Missing invite code or token' });
        }

        await db.runTransaction(async (t) => {
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

            // Method B: Token
            if (token && !isValid) {
                const inviteQ = db!.collection('invitations').where('token', '==', token).limit(1);
                const inviteSnap = await t.get(inviteQ);

                if (!inviteSnap.empty) {
                    const inviteDoc = inviteSnap.docs[0];
                    if (inviteDoc.data().house_id === houseId) {
                        isValid = true;
                        // Cleanup invitation
                        t.delete(inviteDoc.ref);
                    } else {
                        throw new Error('Token does not match this house');
                    }
                } else {
                    throw new Error('Invalid or expired token');
                }
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
