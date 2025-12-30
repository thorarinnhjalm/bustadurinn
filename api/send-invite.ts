
import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Firebase Admin
import admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'bustadurinn-is'
    });
}

const db = admin.firestore();

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

        const data = await resend.emails.send({
            from: 'Bústaðurinn.is <onboarding@resend.dev>',
            to: emailList,
            subject,
            html,
        });

        console.log(`✅ Sent invite emails to ${emailList.length} recipients`);

        return res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('Error sending invites:', error);
        return res.status(500).json({ error: error.message });
    }
}
