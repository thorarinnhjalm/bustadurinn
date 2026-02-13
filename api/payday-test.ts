import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const clientId = process.env.VITE_PAYDAY_CLIENT_ID;
    const clientSecret = process.env.PAYDAY_SECRET_KEY;
    const tokenUrl = process.env.PAYDAY_TOKEN_URL || 'https://api.payday.is/auth/token';

    if (!clientId || !clientSecret) {
        return res.status(500).json({ error: 'Missing Payday credentials in environment' });
    }

    try {
        // Payday uses a custom API authentication (not standard OAuth2)
        // Requires JSON body with Api-Version header
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Api-Version': 'alpha',  // Required by Payday API
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                clientId: clientId,
                clientSecret: clientSecret
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to connect to Payday', details: data });
        }

        // Extract token info (Payday uses camelCase)
        const expiresIn = data.expiresIn || data.expires_in || 86400; // 24 hours default

        // Return success (don't expose full token to frontend in production, but for test it's ok)
        return res.status(200).json({
            success: true,
            message: 'Connection successful',
            expires_in: expiresIn,
            token_type: data.tokenType || data.token_type || 'bearer'
        });

    } catch (error: any) {
        console.error('Payday connection error:', error);
        return res.status(500).json({ error: error.message });
    }
}
