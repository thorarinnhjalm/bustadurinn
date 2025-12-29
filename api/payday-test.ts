import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const clientId = process.env.VITE_PAYDAY_CLIENT_ID;
    const clientSecret = process.env.PAYDAY_SECRET_KEY;
    const tokenUrl = process.env.PAYDAY_TOKEN_URL || 'https://api.payday.is/oauth/token';

    if (!clientId || !clientSecret) {
        return res.status(500).json({ error: 'Missing Payday credentials in environment' });
    }

    try {
        // Exchange credentials for token (Client Credentials Flow)
        // If this fails, it might require Authorization Code flow (User Login)
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        params.append('scope', 'invoices'); // Adjust scope as needed

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to connect to Payday', details: data });
        }

        // Return success (don't expose full token to frontend in production, but for test it's ok)
        return res.status(200).json({ success: true, message: 'Connection successful', expires_in: data.expires_in });

    } catch (error: any) {
        console.error('Payday connection error:', error);
        return res.status(500).json({ error: error.message });
    }
}
