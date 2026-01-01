import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default function handler(req: VercelRequest, res: VercelResponse) {
    // In a real implementation, we would use the Google Analytics Data API here.
    // For now, we simulate data for demonstration purposes or fallback.

    // We can simulate slightly different data based on 'period' param if we want.
    const { period } = req.query;

    const multiplier = period === '90d' ? 3 : period === '7d' ? 0.25 : 1;

    const data: AnalyticsData = {
        activeUsers: Math.round(1243 * multiplier),
        sessions: Math.round(5432 * multiplier),
        engagementRate: 0.65,
        screenPageViews: Math.round(12403 * multiplier),
        trafficSources: [
            { source: 'direct', users: Math.round(500 * multiplier) },
            { source: 'google', users: Math.round(350 * multiplier) },
            { source: 'facebook', users: Math.round(200 * multiplier) },
            { source: 'instagram', users: Math.round(150 * multiplier) },
            { source: 'referral', users: Math.round(43 * multiplier) }
        ],
        topPages: [
            { pagePath: '/dashboard', screenPageViews: Math.round(4500 * multiplier) },
            { pagePath: '/calendar', screenPageViews: Math.round(3200 * multiplier) },
            { pagePath: '/', screenPageViews: Math.round(2100 * multiplier) },
            { pagePath: '/tasks', screenPageViews: Math.round(1500 * multiplier) },
            { pagePath: '/settings', screenPageViews: Math.round(800 * multiplier) },
            { pagePath: '/guest', screenPageViews: Math.round(300 * multiplier) }
        ]
    };

    res.status(200).json(data);
}
