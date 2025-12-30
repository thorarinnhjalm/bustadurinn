/**
 * Unified Email Service
 * Fetches templates from Firestore and sends via Resend
 */

import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const resend = new Resend(process.env.RESEND_API_KEY);

import admin from 'firebase-admin';

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
        console.error('Firebase Admin initialization error:', error);
    }
}

const db = admin.firestore();

interface EmailTemplate {
    id: string;
    subject: string;
    html_content: string;
    active: boolean;
    variables: string[];
    description: string;
}

/**
 * Replace template variables with actual values
 */
function replaceVariables(content: string, variables: Record<string, string>): string {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{${key}}`, 'g');
        result = result.replace(regex, value);
    }
    return result;
}

/**
 * Send email using a Firestore template
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { templateId, to, variables } = req.body;

        if (!templateId || !to) {
            return res.status(400).json({ error: 'Missing templateId or recipient' });
        }

        // Fetch template from Firestore
        const templateDoc = await db.collection('email_templates').doc(templateId).get();

        if (!templateDoc.exists) {
            return res.status(404).json({ error: `Template '${templateId}' not found` });
        }

        const template = templateDoc.data() as EmailTemplate;

        if (!template.active) {
            return res.status(400).json({ error: `Template '${templateId}' is inactive` });
        }

        // Replace variables in subject and content
        const subject = replaceVariables(template.subject, variables || {});
        const html = replaceVariables(template.html_content, variables || {});

        // Send email via Resend
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not configured on the server');
        }

        const response = await resend.emails.send({
            from: 'Bústaðurinn.is <onboarding@resend.dev>',
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
        });

        if (response.error) {
            console.error(`❌ Resend API Error for '${templateId}':`, response.error);
            return res.status(400).json({
                error: response.error.message,
                code: (response.error as any).code || 'resend_error'
            });
        }

        console.log(`✅ Successfully sent email '${templateId}' to ${to}. ID: ${response.data?.id}`);

        return res.status(200).json({ success: true, data: response.data });
    } catch (error: any) {
        console.error('❌ Server Error sending email:', error);
        return res.status(500).json({
            error: error.message,
            code: error.code || 'internal_server_error'
        });
    }
}
