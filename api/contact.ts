import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const resend = new Resend(process.env.RESEND_API_KEY);

// Firestore REST API helper (no SDK needed in serverless)
async function saveToFirestore(data: any) {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'bustadurinn-is';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/contact_submissions`;

    const doc = {
        fields: {
            name: { stringValue: data.name },
            email: { stringValue: data.email },
            message: { stringValue: data.message },
            created_at: { timestampValue: new Date().toISOString() },
            status: { stringValue: 'new' }
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(doc)
        });
        return response.ok;
    } catch (error) {
        console.error('Failed to save to Firestore:', error);
        return false;
    }
}

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

        // Save to Firestore (don't block on this)
        saveToFirestore({ name, email, message }).catch(console.error);

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
