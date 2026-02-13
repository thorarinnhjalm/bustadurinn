/**
 * Weather API Proxy
 * Proxies requests to met.no to avoid CORS issues in development
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { lat, lon } = req.query;

    // Validation
    if (!lat || !lon) {
        return res.status(400).json({ error: 'Missing lat or lon parameters' });
    }

    try {
        // Fetch from met.no with proper User-Agent
        const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Bustadurinn.is/1.0 contact@bustadurinn.is'
            }
        });

        if (!response.ok) {
            throw new Error(`met.no API error: ${response.status}`);
        }

        const data = await response.json();

        // Cache for 30 minutes
        res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');

        return res.status(200).json(data);
    } catch (error: any) {
        console.error('Weather API proxy error:', error);
        return res.status(500).json({ error: error.message || 'Failed to fetch weather' });
    }
}
