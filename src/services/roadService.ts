/**
 * Road Conditions Service
 * Fetches real-time road conditions from Vegagerðin (Icelandic Road Administration)
 */

export interface RoadCondition {
    route: string;
    routeNumber: number;
    condition: 'clear' | 'wet' | 'icy' | 'snow' | 'slippery' | 'closed';
    description: string;
    severity: 'none' | 'low' | 'medium' | 'high';
}

const ROAD_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
let roadCache: { data: RoadCondition[]; timestamp: number } | null = null;

/**
 * Get road conditions for a general area
 * Returns simplified status for routes near the house location
 */
export async function getRoadConditions(
    latitude: number,
    longitude: number
): Promise<RoadCondition[]> {
    // Check cache
    if (roadCache && Date.now() - roadCache.timestamp < ROAD_CACHE_DURATION) {
        return roadCache.data;
    }

    try {
        // Use our internal proxy (stable, bypassed CORS)
        // Fallback to public proxy only if internal proxy is not yet deployed/available (locally)
        let response;
        try {
            response = await fetch('/api/road-conditions');
            if (!response.ok) throw new Error('Internal proxy not available');
        } catch (e) {
            const apiUrl = 'https://gagnaveita.vegagerdin.is/api/faerd2017_1';
            // Use .get instead of .raw for better stability on allorigins
            const fallbackUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;
            const fallbackRes = await fetch(fallbackUrl);
            const fallbackData = await fallbackRes.json();

            // Re-wrap to match Expected format (allorigins returns {contents: "..."})
            const data = JSON.parse(fallbackData.contents);
            const conditions = parseRoadConditions(data, latitude, longitude);

            roadCache = { data: conditions, timestamp: Date.now() };
            return conditions;
        }

        const data = await response.json();
        const conditions = parseRoadConditions(data, latitude, longitude);

        // Cache results
        roadCache = {
            data: conditions,
            timestamp: Date.now()
        };

        return conditions;
    } catch (error) {
        console.error('Failed to fetch road conditions:', error);
        return [];
    }
}

/**
 * Parse Vegagerðin API response
 * Data uses Icelandic keys: NAFN (name), ASTAND (status), LYSING (description)
 */
function parseRoadConditions(data: any, _lat: number, _lon: number): RoadCondition[] {
    if (!data || !Array.isArray(data)) {
        return [];
    }

    // Filter to major routes or those with actual warnings
    // For now, let's take roads with identifiers (usually shorter numbers are main roads)
    const relevantRoutes = data
        .filter((item: any) => item.NAFN && !item.NAFN.includes('Stofnvegur'))
        .sort((a: any, b: any) => {
            // Sort by severity (put warnings first)
            const sevA = getSeverity(a);
            const sevB = getSeverity(b);
            if (sevA === 'high') return -1;
            if (sevB === 'high') return 1;
            return 0;
        })
        .slice(0, 4) // Show top 4
        .map((item: any) => ({
            route: item.NAFN,
            routeNumber: 0, // Not always provided in this API
            condition: mapRoadCondition(item),
            description: item.LYSING || item.ASTAND || 'Óþekktarástand',
            severity: getSeverity(item)
        }));

    return relevantRoutes;
}

/**
 * Map API condition to our simplified types
 */
function mapRoadCondition(item: any): RoadCondition['condition'] {
    const astand = (item.ASTAND || '').toLowerCase();
    const lysing = (item.LYSING || '').toLowerCase();

    if (astand.includes('loka') || lysing.includes('loka')) return 'closed';
    if (astand.includes('hálka') || lysing.includes('hálka')) return 'icy';
    if (astand.includes('snjó') || lysing.includes('snjó')) return 'snow';
    if (astand.includes('hált') || lysing.includes('hált')) return 'slippery';
    if (astand.includes('blaut') || lysing.includes('blaut')) return 'wet';

    return 'clear';
}



/**
 * Determine severity level
 */
function getSeverity(item: any): RoadCondition['severity'] {
    const condition = mapRoadCondition(item);

    if (condition === 'closed') return 'high';
    if (condition === 'icy' || condition === 'snow') return 'medium';
    if (condition === 'slippery' || condition === 'wet') return 'low';

    return 'none';
}

/**
 * Get summary text for road conditions
 */
export function getRoadSummary(conditions: RoadCondition[]): string {
    if (conditions.length === 0) {
        return 'Engar viðvaranir';
    }

    const hasHigh = conditions.some(c => c.severity === 'high');
    const hasMedium = conditions.some(c => c.severity === 'medium');

    if (hasHigh) return 'Erfiðar aðstæður';
    if (hasMedium) return 'Varúð á vegum';

    return 'Greiðfært';
}
