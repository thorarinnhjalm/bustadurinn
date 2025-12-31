
import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

import admin from 'firebase-admin';

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

    if (!db) {
        db = admin.firestore();
    }
}

/**
 * Replace template variables
 */
function replaceVariables(content: string, variables: Record<string, string>): string {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{${key}}`, 'g');
        result = result.replace(regex, value);
    }
    return result;
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

        const { emails, houseName, houseId, inviteCode, senderName } = req.body;

        if (!emails || !houseId || !inviteCode) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const emailList = emails.split(',').map((e: string) => e.trim()).filter((e: string) => e.includes('@'));

        if (emailList.length === 0) {
            return res.status(400).json({ error: 'No valid emails provided' });
        }

        const inviteUrl = `https://bustadurinn.is/join?houseId=${houseId}&code=${inviteCode}`;

        // Fetch template from Firestore
        const templateDoc = await db.collection('email_templates').doc('invite').get();

        let subject = `Boð í húsfélagið ${houseName || 'sumarhúsið'}`;
        let html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto">
                <h2>Hæ!</h2>
                <p>${senderName || 'Vinur þinn'} hefur boðið þér að gerast meðeigandi í <strong>${houseName || 'sumarhúsi'}</strong>.</p>
                <a href="${inviteUrl}">Samþykkja boð</a>
            </div>
        `;

        if (templateDoc.exists) {
            const template = templateDoc.data();
            if (template && template.active) {
                const variables = {
                    senderName: senderName || 'Vinur þinn',
                    houseName: houseName || 'sumarhúsið',
                    inviteLink: inviteUrl
                };
                subject = replaceVariables(template.subject, variables);
                html = replaceVariables(template.html_content, variables);
            }
        }

        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not configured on the server');
        }

        const response = await resend.emails.send({
            from: 'Bústaðurinn.is <onboarding@resend.dev>',
            to: emailList,
            subject,
            html,
        });

        if (response.error) {
            console.error(`❌ Resend Invite API Error:`, response.error);
            return res.status(400).json({
                error: response.error.message,
                code: (response.error as any).code || 'resend_error'
            });
        }

        console.log(`✅ Successfully sent invite emails to ${emailList.length} recipients. ID: ${response.data?.id}`);

        return res.status(200).json({ success: true, data: response.data });
    } catch (error: any) {
        console.error('❌ Server Error sending invites:', error);
        return res.status(500).json({
            error: error.message,
            code: error.code || 'internal_server_error'
        });
    }
}
