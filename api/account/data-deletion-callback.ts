/**
 * Facebook Data Deletion Callback
 * Required by Facebook App Review
 * Handles user data deletion requests from Facebook
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { initializeFirebaseAdmin, getDb, getAuth, admin } from '../utils/firebaseAdmin.js';

// Initialize Firebase Admin
initializeFirebaseAdmin();

interface FacebookSignedRequest {
    user_id: string;
    algorithm: string;
    issued_at: number;
}

function decodeBase64Url(input: string): Buffer {
    return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

/**
 * Parse and verify Facebook signed request
 */
function parseSignedRequest(signedRequest: string, appSecret: string): FacebookSignedRequest | null {
    try {
        const parts = signedRequest.split('.');
        if (parts.length !== 2) return null;
        const [encodedSig, payload] = parts;

        const sig = decodeBase64Url(encodedSig);
        const data = JSON.parse(decodeBase64Url(payload).toString());

        // Verify signature (timingSafeEqual throws on length mismatch, so guard first)
        const expectedSig = crypto.createHmac('sha256', appSecret).update(payload).digest();

        if (sig.length !== expectedSig.length || !crypto.timingSafeEqual(sig, expectedSig)) {
            console.error('Bad signed request signature');
            return null;
        }

        if (!data || typeof data.user_id !== 'string' || !data.user_id) {
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
    const db = getDb();
    const auth = getAuth();

    if (!db || !auth) {
        throw new Error('Firebase Admin not initialized');
    }

    // Find user by Facebook provider uid
    let userUid: string | null = null;
    try {
        const userRecord = await auth.getUserByProviderUid('facebook.com', facebookUserId);
        userUid = userRecord.uid;
    } catch (error: any) {
        if (error?.code !== 'auth/user-not-found') {
            throw error;
        }
    }

    if (!userUid) {
        console.log('No user found for the given Facebook ID');
        // Generate confirmation code anyway (Facebook requires this)
        return generateConfirmationCode(facebookUserId);
    }

    // Delete user from Firebase Auth
    await auth.deleteUser(userUid);

    // Delete user document and RBAC roles document
    await db.collection('users').doc(userUid).delete();
    try {
        await db.collection('user_roles').doc(userUid).delete();
    } catch {
        // Non-critical
    }

    // Remove the user from houses they belong to; delete houses with no other owners
    const housesSnap = await db.collection('houses').where('owner_ids', 'array-contains', userUid).get();
    if (!housesSnap.empty) {
        const batch = db.batch();
        housesSnap.docs.forEach((houseDoc) => {
            const houseData = houseDoc.data();
            const owners: string[] = Array.isArray(houseData.owner_ids) ? houseData.owner_ids : [];
            const otherOwners = owners.filter((id) => id !== userUid);

            if (otherOwners.length === 0) {
                batch.delete(houseDoc.ref);
            } else {
                batch.update(houseDoc.ref, {
                    owner_ids: admin.firestore.FieldValue.arrayRemove(userUid),
                });
                if (houseData.manager_id === userUid) {
                    batch.update(houseDoc.ref, { manager_id: null });
                }
            }
        });
        await batch.commit();
    }

    // Delete other user-related data
    const collections = ['bookings', 'tasks', 'notifications'];

    for (const collectionName of collections) {
        const snapshot = await db.collection(collectionName)
            .where('user_id', '==', userUid)
            .get();

        if (snapshot.empty) continue;
        // Firestore batches are limited to 500 writes
        for (let i = 0; i < snapshot.docs.length; i += 400) {
            const batch = db.batch();
            snapshot.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
            await batch.commit();
        }
    }

    console.log('Successfully deleted user data for a Facebook data-deletion request');

    return generateConfirmationCode(facebookUserId);
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
        const signed_request = req.body?.signed_request;

        if (!signed_request || typeof signed_request !== 'string') {
            return res.status(400).json({ error: 'Missing signed_request parameter' });
        }

        // Server-only secret: never read from a VITE_-prefixed variable (those are bundled into the client)
        const appSecret = process.env.FACEBOOK_APP_SECRET;

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
            url: `https://www.bustadurinn.is/data-deletion?code=${confirmationCode}`,
            confirmation_code: confirmationCode
        });

    } catch (error) {
        console.error('Error in data deletion callback:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
