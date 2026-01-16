import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as crypto from 'crypto';
import { admin, db } from './utils/firebaseAdmin';

// Inline auth functions to avoid module resolution issues in Vercel
async function requireAuth(req: VercelRequest) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('UNAUTHORIZED: Missing or invalid authorization header');
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        throw new Error('UNAUTHORIZED: Invalid or expired token');
    }
}

function getAuthErrorResponse(error: Error): { status: number; body: any } {
    if (error.message.startsWith('UNAUTHORIZED')) {
        return {
            status: 401,
            body: { error: 'Unauthorized', message: 'Authentication required' }
        };
    }
    if (error.message.startsWith('FORBIDDEN')) {
        return {
            status: 403,
            body: { error: 'Forbidden', message: 'Insufficient permissions' }
        };
    }
    console.error('Auth error:', error);
    return {
        status: 500,
        body: { error: 'Internal server error' }
    };
}

// Lazy init Resend
let resend: Resend | null = null;

function initResend() {
    if (!resend) {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('Missing RESEND_API_KEY environment variable');
        }
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        console.log('🔍 invite-member - Start', { method: req.method, hasAuth: !!req.headers.authorization });

        // Handle Preflight (CORS)
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // Initialize Resend
        console.log('🔍 Initializing Resend...');
        const resendClient = initResend();
        console.log('✅ Resend initialized');

        // 🔒 SECURITY: Require authentication
        console.log('🔍 Authenticating request...');
        let authenticatedUser;
        try {
            authenticatedUser = await requireAuth(req);
            console.log('✅ Auth success:', authenticatedUser.uid);
        } catch (authError: any) {
            console.error('❌ Auth Error:', authError);
            const errorResponse = getAuthErrorResponse(authError);
            return res.status(errorResponse.status).json(errorResponse.body);
        }

        const { email, houseId, houseName, senderName, senderUid } = req.body;
        console.log('🔍 Request body:', { email, houseId, houseName, senderName, senderUid });

        if (!email || !houseId || !senderUid) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 🔒 SECURITY: Verify the authenticated user is the one sending the invite
        if (authenticatedUser.uid !== senderUid) {
            console.warn(`Forbidden: Token UID ${authenticatedUser.uid} !== Sender UID ${senderUid}`);
            return res.status(403).json({ error: 'Forbidden: Cannot send invites on behalf of another user' });
        }

        // 🔒 SECURITY: Verify user has permission to invite to this house
        const houseDoc = await db.collection('houses').doc(houseId).get();
        if (!houseDoc.exists) {
            return res.status(404).json({ error: 'House not found' });
        }

        const houseData = houseDoc.data();
        const owners = houseData?.owner_ids || [];
        const isOwner = owners.includes(senderUid);
        const isManager = houseData?.manager_id === senderUid;

        if (!isOwner && !isManager) {
            console.warn(`Forbidden: User ${senderUid} is not owner/manager of ${houseId}.`);
            return res.status(403).json({ error: 'Forbidden: Only house owners/managers can invite members' });
        }

        const targetEmail = email.trim().toLowerCase();

        // 1. Check if user exists
        const userSnapshot = await db.collection('users').where('email', '==', targetEmail).limit(1).get();
        const userExists = !userSnapshot.empty;

        if (userExists) {
            const userDoc = userSnapshot.docs[0];
            const userId = userDoc.id;
            const userData = userDoc.data();

            if (userData.house_ids?.includes(houseId)) {
                return res.status(400).json({ error: 'User is already a member of this house.' });
            }

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
            // Use a simpler template for "Added" or the same one? Using simple for now to focus on Invite.
            const html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333;">Hæ ${userData.name || 'vinur'}!</h2>
                    <p style="font-size: 16px; color: #555;">
                        <strong>${senderName || 'Eigandi'}</strong> hefur bætt þér við sem meðeiganda í <strong>${houseName}</strong> á Bústaðurinn.is.
                    </p>
                    <div style="margin: 30px 0;">
                        <a href="https://bustadurinn.is/dashboard" style="background-color: #e8b058; color: #1a1a1a; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Fara í Bústaðurinn.is
                        </a>
                    </div>
                </div>
            `;

            await resendClient.emails.send({
                from: 'Bústaðurinn <hallo@bustadurinn.is>',
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

            const inviteUrl = `https://bustadurinn.is/join?token=${token}`;
            const subject = `Boð frá ${senderName}`;

            // New HTML Template based on user request
            const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { background: #1a1a1a; color: #fdfcf8; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-family: 'Fraunces', serif; font-size: 28px; }
    .content { background: white; padding: 40px; border: 1px solid #e8e4df; border-top: none; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #e8b058; color: #1a1a1a; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #8a8580; font-size: 14px; }
    .house-info { background: #fdfcf8; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e8e4df; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Boð frá ${senderName}</h1>
    </div>
    <div class="content">
      <p>Hæ,</p>

      <p><strong>${senderName}</strong> hefur boðið þér að gerast meðeigandi í sumarhúsinu.</p>

      <div class="house-info">
        <h2 style="margin-top: 0; font-family: 'Fraunces', serif; color: #1a1a1a;">${houseName}</h2>
        <p style="margin: 0; color: #4a4642;">Smelltu á hlekkinn hér að neðan til að samþykkja boðið.</p>
      </div>

      <p><strong>Sem meðeigandi getur þú:</strong></p>
      <ul>
        <li>Bóka helgar og dvalir</li>
        <li>Skrá útgjöld og sjá fjármál</li>
        <li>Bæta við verkefnum og listum</li>
        <li>Séð allar upplýsingar um húsið</li>
      </ul>

      <a href="${inviteUrl}" class="button">Samþykkja boð</a>

      <p style="margin-top: 40px; font-size: 14px; color: #8a8580;">
        Ef þú fékkst þennan tölvupóst fyrir mistök, getur þú hunsað hann.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Bústaðurinn.is - Neðri Hóll Hugmyndahús ehf.</p>
    </div>
  </div>
</body>
</html>
            `;

            await resendClient.emails.send({
                from: 'Bústaðurinn <hallo@bustadurinn.is>',
                to: targetEmail,
                subject,
                html,
            });

            return res.status(200).json({ success: true, message: 'Invitation sent to new user.' });
        }

    } catch (error: any) {
        console.error('❌ ERROR in invite-member:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code
        });

        console.log('Environment check:', {
            hasResendKey: !!process.env.RESEND_API_KEY,
            hasFirebaseAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
            nodeEnv: process.env.NODE_ENV
        });

        return res.status(500).json({
            error: error.message || 'Internal server error',
            code: error.code,
            type: error.name
        });
    }
}
