import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { requireAdmin, getAuthErrorResponse } from './utils/apiAuth.js';
import { initializeFirebaseAdmin, getDb, admin } from './utils/firebaseAdmin.js';

/**
 * POST /api/admin-send-reply
 * Body: { to, subject, text, submissionId? }   (`message` accepted as alias of `text`)
 * Super admin only. Sends a plain-text reply to a contact submission.
 */

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let adminUid: string;
    try {
        const decoded = await requireAdmin(req);
        adminUid = decoded.uid;
    } catch (authError: any) {
        const errorResponse = getAuthErrorResponse(authError);
        return res.status(errorResponse.status).json(errorResponse.body);
    }

    const { to, subject, submissionId } = req.body || {};
    const message = req.body?.text ?? req.body?.message;

    if (typeof to !== 'string' || to.length > 254 || !EMAIL_RE.test(to)) {
        return res.status(400).json({ error: 'Invalid recipient email' });
    }
    if (typeof subject !== 'string' || subject.trim().length === 0 || subject.length > 200 || /[\r\n]/.test(subject)) {
        return res.status(400).json({ error: 'Invalid subject' });
    }
    if (typeof message !== 'string' || message.trim().length === 0 || message.length > 10000) {
        return res.status(400).json({ error: 'Invalid message' });
    }
    if (submissionId !== undefined && (typeof submissionId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(submissionId))) {
        return res.status(400).json({ error: 'Invalid submissionId' });
    }
    if (!process.env.RESEND_API_KEY) {
        return res.status(500).json({ error: 'Email service not configured' });
    }

    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const html = `<div style="font-family: sans-serif; line-height: 1.6; color: #1a1a1a;">${escapeHtml(message).replace(/\r?\n/g, '<br>')}</div>`;

        const result = await resend.emails.send({
            from: 'Bústaðurinn <hallo@bustadurinn.is>',
            to: [to],
            replyTo: 'hallo@bustadurinn.is',
            subject,
            html,
            text: message,
        });
        if (result.error) {
            console.error('admin-send-reply: Resend error:', result.error);
            return res.status(502).json({ error: 'Failed to send email' });
        }

        if (submissionId) {
            try {
                initializeFirebaseAdmin();
                await getDb().collection('contact_submissions').doc(submissionId).update({
                    status: 'replied',
                    replied_at: admin.firestore.FieldValue.serverTimestamp(),
                    replied_by: adminUid,
                });
            } catch (err) {
                // Email already left; do not report failure for the bookkeeping step.
                console.error('admin-send-reply: failed to mark submission replied:', err);
            }
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('admin-send-reply failed:', error);
        return res.status(500).json({ error: 'Failed to send email' });
    }
}
