
import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, name, subject, html } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Missing email' });
        }

        const safeName = name || 'vinur';

        // Default content if not provided (Legacy fallback)
        const defaultSubject = 'Velkomin í Bústaðurinn.is! 🏠';
        const defaultHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1c1917;">
                <div style="background-color: #f5f5f4; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #d97706; margin: 0; font-family: serif;">Bústaðurinn.is</h1>
                </div>
                <div style="padding: 32px; border: 1px solid #e7e5e4; border-top: none; border-radius: 0 0 8px 8px;">
                    <h2 style="margin-top: 0; color: #1c1917;">Velkomin/n, ${safeName}! 👋</h2>
                    <p>Gaman að sjá þig.</p>
                    <a href="https://bustadurinn.is/dashboard">Fara á stjórnborð</a>
                </div>
            </div>
        `;

        const data = await resend.emails.send({
            from: 'Bústaðurinn.is <onboarding@resend.dev>',
            to: email,
            subject: subject || defaultSubject,
            html: html || defaultHtml,
        });

        return res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('Error sending welcome email:', error);
        return res.status(500).json({ error: error.message });
    }
}
