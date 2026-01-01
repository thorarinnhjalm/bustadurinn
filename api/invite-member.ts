
import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import * as crypto from 'crypto';

// Lazy init variables
let db: admin.firestore.Firestore | null = null;
let resend: Resend | null = null;

function initServices() {
    // Initialize Resend
    if (!resend) {
        if (!process.env.RESEND_API_KEY) {
            console.warn('⚠️ RESEND_API_KEY is not set');
        }
        resend = new Resend(process.env.RESEND_API_KEY);
    }

    // Initialize Firebase Admin
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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        initServices();

        if (!db || !resend) {
            throw new Error('Internal services failed to initialize');
        }

        const { email, houseId, houseName, senderName, senderUid } = req.body;

        if (!email || !houseId || !senderUid) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const targetEmail = email.trim().toLowerCase();

        // 1. Check if user exists
        const userSnapshot = await db.collection('users').where('email', '==', targetEmail).limit(1).get();
        const userExists = !userSnapshot.empty;

        if (userExists) {
            // --- EXISTING USER FLOW ---
            const userDoc = userSnapshot.docs[0];
            const userId = userDoc.id;
            const userData = userDoc.data();

            // Check if already in house
            if (userData.house_ids?.includes(houseId)) {
                return res.status(400).json({ error: 'User is already a member of this house.' });
            }

            // Transaction to update both House and User
            await db.runTransaction(async (t) => {
                const houseRef = db!.collection('houses').doc(houseId);
                const userRef = db!.collection('users').doc(userId);

                t.update(houseRef, {
                    owner_ids: admin.firestore.FieldValue.arrayUnion(userId)
                });
                t.update(userRef, {
                    house_ids: admin.firestore.FieldValue.arrayUnion(houseId)
                });
            });

            // Send "Added" Email
            const subject = `Þér hefur verið bætt við ${houseName || 'sumarbústað'}`;
            const html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333;">Hæ ${userData.name || 'vinur'}!</h2>
                    <p style="font-size: 16px; color: #555;">
                        <strong>${senderName || 'Eigandi'}</strong> hefur bætt þér við sem meðeiganda í <strong>${houseName}</strong> á Bústaðurinn.is.
                    </p>
                    <p style="font-size: 16px; color: #555;">
                        Þú getur nú skráð þig inn og séð húsið í yfirlitinu þínu.
                    </p>
                    <div style="margin: 30px 0;">
                        <a href="https://bustadurinn.is/dashboard" style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Fara í Bústaðurinn.is
                        </a>
                    </div>
                </div>
            `;

            await resend.emails.send({
                from: 'Bústaðurinn <no-reply@bustadurinn.is>',
                to: targetEmail,
                subject,
                html,
            });

            return res.status(200).json({ success: true, message: 'Existing user added and notified.' });

        } else {
            // --- NEW USER FLOW ---

            // Check if invite already exists
            const existingInvite = await db.collection('invitations')
                .where('email', '==', targetEmail)
                .where('house_id', '==', houseId)
                .where('status', '==', 'pending')
                .limit(1)
                .get();

            if (!existingInvite.empty) {
                return res.status(400).json({ error: 'Invite already pending for this user.' });
            }

            // Create Invitation Token
            const token = crypto.randomBytes(32).toString('hex');

            await db.collection('invitations').add({
                email: targetEmail,
                house_id: houseId,
                house_name: houseName,
                invited_by_uid: senderUid,
                invited_by_name: senderName,
                status: 'pending',
                token: token,
                created_at: admin.firestore.FieldValue.serverTimestamp()
            });

            // Send "Invite" Email
            // We direct them to a signup/claim URL. 
            // Assuming /join-house or just /login?invite_token=... logic exists or will be created.
            const inviteUrl = `https://bustadurinn.is/join?token=${token}`; // Utilizing generic join page, might need to implement token logic there.

            const subject = `Boð í ${houseName || 'sumarbústað'}`;
            const html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333;">Hæ!</h2>
                    <p style="font-size: 16px; color: #555;">
                        <strong>${senderName}</strong> hefur boðið þér að gerast meðeigandi í <strong>${houseName}</strong> á Bústaðurinn.is.
                    </p>
                    <p style="font-size: 16px; color: #555;">
                        Bústaðurinn.is er einfalt kerfi til að halda utan um sumarbústaðinn, bókanir, verkefni og fjármál.
                    </p>
                    <div style="margin: 30px 0;">
                        <a href="${inviteUrl}" style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Samþykkja boð & Stofna aðgang
                        </a>
                    </div>
                    <p style="font-size: 12px; color: #999;">
                        Ef þú átt nú þegar aðgang mun boðið bætast við prófílinn þinn við innskráningu.
                    </p>
                </div>
            `;

            await resend.emails.send({
                from: 'Bústaðurinn <no-reply@bustadurinn.is>',
                to: targetEmail,
                subject,
                html,
            });

            return res.status(200).json({ success: true, message: 'Invitation sent to new user.' });
        }

    } catch (error: any) {
        console.error('❌ Error inviting member:', error);
        return res.status(500).json({
            error: error.message,
            code: error.code || 'internal_server_error'
        });
    }
}
