
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

            if (!response.ok) {
                const errorText = await response.text();
                // Log the detailed error from server so we can debug the 500
                console.error('Analytics API Error:', response.status, response.statusText, errorText);
                throw new Error(`Failed to fetch analytics: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            return data as AnalyticsData;
        } catch (error) {
            console.warn("Error fetching analytics:", error);
            // Return empty data on failure so UI doesn't crash
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
