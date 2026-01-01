

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

// Mock data for development and fallback


export const analyticsService = {
    getWebAnalytics: async (period: '7d' | '30d' | '90d' = '30d'): Promise<AnalyticsData> => {
        try {
            const response = await fetch(`/api/analytics?period=${period}`);
            if (!response.ok) throw new Error('Failed to fetch analytics');
            const data = await response.json();
            return data as AnalyticsData;
        } catch (error) {
            console.warn("Error fetching analytics:", error);
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
