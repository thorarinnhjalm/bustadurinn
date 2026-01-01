

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
            const response = await fetch(`/api/analytics?period=${period}`);
            if (!response.ok) throw new Error('Failed to fetch analytics');
            const data = await response.json();
            return data as AnalyticsData;
        } catch (error) {
            console.error("Error fetching analytics:", error);
            // Fallback mock data if fetch fails
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
