import type { VercelRequest, VercelResponse } from '@vercel/node';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

interface AnalyticsData {
    activeUsers: number;
    sessions: number;
    engagementRate: number;
    screenPageViews: number;
    trafficSources: {
        source: string;
        users: number;
    }[];
    topPages: {
        pagePath: string;
        screenPageViews: number;
    }[];
}

// Fallback data if API is not configured
const MOCK_DATA: AnalyticsData = {
    activeUsers: 0,
    sessions: 0,
    engagementRate: 0,
    screenPageViews: 0,
    trafficSources: [],
    topPages: []
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { period = '30d' } = req.query;

    // 1. Check for configuration
    const propertyId = process.env.GA4_PROPERTY_ID;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL; // From service account
    let privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!propertyId || !clientEmail || !privateKey) {
        console.warn('⚠️ Missing GA4 Environment Variables (GA4_PROPERTY_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY). Returning empty data.');
        return res.status(200).json(MOCK_DATA);
    }

    // 🕵️‍♀️ Helpful Error Handling for Common Key Issues
    if (privateKey.startsWith('"') || privateKey.endsWith('"')) {
        console.error('❌ GOOGLE_PRIVATE_KEY has surrounding quotes. Please remove them in Vercel.');
        return res.status(500).json({ error: 'CONFIGURATION ERROR: The GOOGLE_PRIVATE_KEY Env Var has surrounding quotes ("). Please remove them in Vercel Settings.' });
    }
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
        console.error('❌ GOOGLE_PRIVATE_KEY is missing the "-----BEGIN PRIVATE KEY-----" header.');
        return res.status(500).json({ error: 'CONFIGURATION ERROR: The GOOGLE_PRIVATE_KEY is missing the "-----BEGIN PRIVATE KEY-----" header. Please check your copy-paste.' });
    }


    try {
        const analyticsDataClient = new BetaAnalyticsDataClient({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
        });

        // Calculate date range
        let startDate = '30daysAgo';
        if (period === '7d') startDate = '7daysAgo';
        if (period === '90d') startDate = '90daysAgo';

        // 2. Parallel Request: Get Totals (Accurate)
        const [totalsResponse] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate, endDate: 'today' }],
            metrics: [
                { name: 'activeUsers' },
                { name: 'sessions' },
                { name: 'screenPageViews' },
                { name: 'engagementRate' },
            ]
        });

        // 3. Parallel Request: Get Top Pages
        const [pagesResponse] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate, endDate: 'today' }],
            dimensions: [{ name: 'pagePath' }],
            metrics: [{ name: 'screenPageViews' }],
            limit: 10,
            orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }]
        });

        // 4. Parallel Request: Get Traffic Sources
        const [sourcesResponse] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate, endDate: 'today' }],
            dimensions: [{ name: 'sessionSource' }],
            metrics: [{ name: 'totalUsers' }], // 'activeUsers' per source
            limit: 10,
            orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }]
        });


        // Construct final data
        const totalRow = totalsResponse.rows?.[0];

        const finalData: AnalyticsData = {
            activeUsers: parseInt(totalRow?.metricValues?.[0]?.value || '0'),
            sessions: parseInt(totalRow?.metricValues?.[1]?.value || '0'),
            screenPageViews: parseInt(totalRow?.metricValues?.[2]?.value || '0'),
            engagementRate: parseFloat(totalRow?.metricValues?.[3]?.value || '0'),

            topPages: pagesResponse.rows?.map(row => ({
                pagePath: row.dimensionValues?.[0]?.value || '',
                screenPageViews: parseInt(row.metricValues?.[0]?.value || '0')
            })) || [],

            trafficSources: sourcesResponse.rows?.map(row => ({
                source: row.dimensionValues?.[0]?.value || '',
                users: parseInt(row.metricValues?.[0]?.value || '0')
            })) || []
        };

        return res.status(200).json(finalData);

    } catch (e: any) {
        console.error('❌ GA4 Data API Error:', e);
        // Returning empty "real" data structure rather than fake data if it fails,
        // so the user knows something is wrong rather than seeing fake numbers.
        return res.status(500).json({ error: e.message });
    }
}
