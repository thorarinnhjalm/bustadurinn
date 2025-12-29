import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name, email, message } = req.body;

        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Send email via Resend
        const data = await resend.emails.send({
            from: 'Bústaðurinn.is <onboarding@resend.dev>', // Use your verified domain later
            to: ['thorarinnhjalmarsson@gmail.com'], // Your email
            subject: `Ný skilaboð frá ${name}`,
            html: `
                <h2>Ný skilaboð frá bústaðurinn.is</h2>
                <p><strong>Nafn:</strong> ${name}</p>
                <p><strong>Netfang:</strong> ${email}</p>
                <p><strong>Skilaboð:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `,
        });

        return res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.error('Error sending contact email:', error);
        return res.status(500).json({ error: error.message });
    }
}
