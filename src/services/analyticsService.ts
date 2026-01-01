import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

export interface AnalyticsData {
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

export const analyticsService = {
    getWebAnalytics: async (period: '7d' | '30d' | '90d' = '30d'): Promise<AnalyticsData> => {
        try {
            const getAnalytics = httpsCallable(functions, 'getWebAnalytics');
            const result = await getAnalytics({ period, forceRefresh: true }); // We can cache, but 'forceRefresh' ensures fresh data for Admin
            return result.data as AnalyticsData;
        } catch (error) {
            console.error("Error fetching analytics:", error);
            // Fallback mock data if function fails (for development/demo)
            return {
                activeUsers: 0,
                sessions: 0,
                engagementRate: 0,
                screenPageViews: 0,
                trafficSources: [],
                topPages: []
            };
        }
    }
};
