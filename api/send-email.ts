/**
 * Unified Email Service
 * Fetches templates from Firestore and sends via Resend
 */

import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import DOMPurify from 'isomorphic-dompurify';

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
        // 🔒 SECURITY: Sanitize HTML to prevent XSS injection
        const sanitized = DOMPurify.sanitize(value, {
            ALLOWED_TAGS: [],  // Strip all HTML tags
            ALLOWED_ATTR: []   // Strip all attributes
        });
        const regex = new RegExp(`{${key}}`, 'g');
        result = result.replace(regex, sanitized);
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
        initServices();

        // 🔒 SECURITY: Require authentication to send emails
        try {
            const { requireAuth, getAuthErrorResponse } = await import('./utils/apiAuth');
            await requireAuth(req);
        } catch (authError: any) {
            const { getAuthErrorResponse } = await import('./utils/apiAuth');
            const errorResponse = getAuthErrorResponse(authError);
            return res.status(errorResponse.status).json(errorResponse.body);
        }

        if (!db || !resend) {
            throw new Error('Internal services failed to initialize');
        }

        const { templateId, to, variables } = req.body;

        if (!templateId || !to) {
            return res.status(400).json({ error: 'Missing templateId or recipient' });
        }

        // Fetch template from Firestore
        const templateDoc = await db.collection('email_templates').doc(templateId).get();
        let template: EmailTemplate;

        if (templateDoc.exists) {
            template = templateDoc.data() as EmailTemplate;
            if (!template.active) {
                return res.status(400).json({ error: `Template '${templateId}' is inactive` });
            }
        } else {
            // Fallback for system templates that haven't been seeded yet
            const systemTemplates: Record<string, EmailTemplate> = {
                'general_notification': {
                    id: 'general_notification',
                    subject: '{title} - Bústaðurinn.is',
                    html_content: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #4a4642;">{title}</h2>
                            <p style="font-size: 16px; color: #1c1917; line-height: 1.6;">{message}</p>
                            <div style="margin-top: 24px; text-align: center;">
                                <a href="{actionUrl}" style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Skoða nánar</a>
                            </div>
                        </div>
                    `,
                    active: true,
                    variables: ['title', 'message', 'actionUrl'],
                    description: 'System fallback for general notifications'
                }
            };

            if (systemTemplates[templateId]) {
                template = systemTemplates[templateId];
                console.log(`ℹ️ Using system fallback for template '${templateId}'`);
            } else {
                return res.status(404).json({ error: `Template '${templateId}' not found` });
            }
        }

        // Replace variables in subject and content
        const subject = replaceVariables(template.subject, variables || {});
        const html = replaceVariables(template.html_content, variables || {});

        // Send email via Resend
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not configured on the server');
        }

        const response = await resend.emails.send({
            from: 'Bústaðurinn <no-reply@bustadurinn.is>',
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

        // Don't expose stack traces in production
        const errorResponse = process.env.NODE_ENV === 'production'
            ? { error: 'Internal server error' }
            : { error: error.message, code: error.code || 'internal_server_error' };

        return res.status(500).json(errorResponse);
    }
}
