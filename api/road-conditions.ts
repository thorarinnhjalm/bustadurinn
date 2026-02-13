/**
 * Road Conditions API Proxy
 * Proxies requests to gagnaveita.vegagerdin.is to avoid CORS issues
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Fetch from Vegagerðin
        const url = 'https://gagnaveita.vegagerdin.is/api/faerd2017_1';

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Vegagerðin API error: ${response.status}`);
        }

        const data = await response.json();

        // Cache for 10 minutes
        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');

        return res.status(200).json(data);
    } catch (error: any) {
        console.error('Road API proxy error:', error);
        return res.status(500).json({ error: error.message || 'Failed to fetch road conditions' });
    }
}
