/**
 * Facebook Data Deletion Callback
 * Required by Facebook App Review
 * Handles user data deletion requests from Facebook
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { initializeFirebaseAdmin, auth, db } from '../utils/firebaseAdmin';

// Initialize Firebase Admin
initializeFirebaseAdmin();

interface FacebookSignedRequest {
    user_id: string;
    algorithm: string;
    issued_at: number;
}

/**
 * Parse and verify Facebook signed request
 */
function parseSignedRequest(signedRequest: string, appSecret: string): FacebookSignedRequest | null {
    try {
        const [encodedSig, payload] = signedRequest.split('.');

        // Decode the data
        const sig = Buffer.from(encodedSig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
        const data = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());

        // Verify signature
        const expectedSig = crypto.createHmac('sha256', appSecret).update(payload).digest();

        if (!crypto.timingSafeEqual(sig, expectedSig)) {
            console.error('Bad signed request signature');
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error parsing signed request:', error);
        return null;
    }
}

/**
 * Delete user data from Firebase
 */
async function deleteUserData(facebookUserId: string): Promise<string> {
    try {
        // Find user by Facebook ID
        // First, we need to query users to find the one with this Facebook ID
        const usersSnapshot = await db.collection('users').get();
        let userUid: string | null = null;

        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();
            // Check if user has Facebook provider
            const user = await auth.getUser(doc.id);
            const facebookProvider = user.providerData.find(p => p.providerId === 'facebook.com');

            if (facebookProvider && facebookProvider.uid === facebookUserId) {
                userUid = doc.id;
                break;
            }
        }

        if (!userUid) {
            console.log(`No user found with Facebook ID: ${facebookUserId}`);
            // Generate confirmation code anyway (Facebook requires this)
            return generateConfirmationCode(facebookUserId);
        }

        // Delete user from Firebase Auth
        await auth.deleteUser(userUid);

        // Delete user document from Firestore
        await db.collection('users').doc(userUid).delete();

        // Delete other user-related data (tasks, bookings, etc.)
        // You may want to add more collections here based on your data model
        const collections = ['bookings', 'tasks', 'notifications'];

        for (const collectionName of collections) {
            const snapshot = await db.collection(collectionName)
                .where('user_id', '==', userUid)
                .get();

            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }

        console.log(`Successfully deleted user data for Facebook ID: ${facebookUserId}`);

        // Generate confirmation code
        return generateConfirmationCode(facebookUserId);
    } catch (error) {
        console.error('Error deleting user data:', error);
        throw error;
    }
}

/**
 * Generate a confirmation code for Facebook
 */
function generateConfirmationCode(facebookUserId: string): string {
    const timestamp = Date.now();
    const hash = crypto.createHash('sha256')
        .update(`${facebookUserId}_${timestamp}`)
        .digest('hex')
        .substring(0, 16);

    return `${hash}_${timestamp}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { signed_request } = req.body;

        if (!signed_request) {
            return res.status(400).json({ error: 'Missing signed_request parameter' });
        }

        const appSecret = process.env.VITE_FACEBOOK_APP_SECRET || process.env.FACEBOOK_APP_SECRET;

        if (!appSecret) {
            console.error('Facebook App Secret not configured');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Parse and verify the signed request
        const data = parseSignedRequest(signed_request, appSecret);

        if (!data) {
            return res.status(400).json({ error: 'Invalid signed request' });
        }

        // Delete user data
        const confirmationCode = await deleteUserData(data.user_id);

        // Return confirmation code to Facebook
        return res.status(200).json({
            url: `https://bustadurinn.is/data-deletion?code=${confirmationCode}`,
            confirmation_code: confirmationCode
        });

    } catch (error) {
        console.error('Error in data deletion callback:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
