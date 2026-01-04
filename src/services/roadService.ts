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
        // For development: Use a CORS proxy
        // For production: Use serverless function
        const isDev = window.location.hostname === 'localhost';

        // Vegagerðin API endpoint
        const apiUrl = 'https://api.vegagerdin.is/v1/conditions';
        const url = isDev
            ? `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`
            : `/api/road-conditions`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Road API error: ${response.status}`);
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
 * Filter to routes relevant to the location
 */
function parseRoadConditions(data: any, lat: number, lon: number): RoadCondition[] {
    if (!data || !Array.isArray(data)) {
        return [];
    }

    // Get major routes that might be relevant
    // In a real implementation, we'd use geographic filtering
    const relevantRoutes = data
        .filter((item: any) => item.roadNumber && item.roadNumber <= 100) // Major routes only
        .slice(0, 3) // Top 3 most relevant
        .map((item: any) => ({
            route: `Þjóðvegur ${item.roadNumber}`,
            routeNumber: item.roadNumber,
            condition: mapRoadCondition(item),
            description: getConditionDescription(item),
            severity: getSeverity(item)
        }));

    return relevantRoutes;
}

/**
 * Map API condition to our simplified types
 */
function mapRoadCondition(item: any): RoadCondition['condition'] {
    const condition = item.condition?.toLowerCase() || '';
    const text = item.text?.toLowerCase() || '';

    if (text.includes('loka') || condition.includes('closed')) return 'closed';
    if (text.includes('hálka') || condition.includes('icy')) return 'icy';
    if (text.includes('snjó') || condition.includes('snow')) return 'snow';
    if (text.includes('bleytu') || text.includes('slydda')) return 'slippery';
    if (text.includes('blautur') || condition.includes('wet')) return 'wet';

    return 'clear';
}

/**
 * Get Icelandic description
 */
function getConditionDescription(item: any): string {
    const condition = mapRoadCondition(item);

    const descriptions: Record<RoadCondition['condition'], string> = {
        'clear': 'Góð akstursskilyrði',
        'wet': 'Blautur vegur',
        'icy': 'Hálka',
        'snow': 'Snjór á vegum',
        'slippery': 'Hált á köflum',
        'closed': 'Vegur lokaður'
    };

    return descriptions[condition];
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

    return 'Góð veð';
}
