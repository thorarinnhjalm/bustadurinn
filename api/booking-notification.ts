import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { houseName, userName, startDate, endDate, bookingType, ownerEmails } = req.body;

        // Validation
        if (!houseName || !userName || !startDate || !endDate || !ownerEmails) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Format dates
        const start = new Date(startDate).toLocaleDateString('is-IS', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const end = new Date(endDate).toLocaleDateString('is-IS', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Send email to all house owners
        const data = await resend.emails.send({
            from: 'Bústaðurinn.is <onboarding@resend.dev>',
            to: ownerEmails,
            subject: `Ný bókun í ${houseName}`,
            html: `
                <h2>🏠 Ný bókun hefur verið gerð</h2>
                <p><strong>Hús:</strong> ${houseName}</p>
                <p><strong>Bókað af:</strong> ${userName}</p>
                <p><strong>Dags.:</strong> ${start} - ${end}</p>
                <p><strong>Tegund:</strong> ${bookingType || 'Persónuleg'}</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e5e5;">
                <p style="color: #666; font-size: 14px;">
                    Sjá allar bókanir á <a href="https://bustadurinn.is/dashboard">bústaðurinn.is</a>
                </p>
            `,
        });

        return res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('Error sending booking notification:', error);
        return res.status(500).json({ error: error.message });
    }
}
