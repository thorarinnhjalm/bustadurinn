/**
 * Test endpoint to verify Upstash Redis connection
 * DELETE THIS FILE after verification
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const { getContactRateLimit, checkRateLimit, getIdentifier } = await import('./utils/ratelimit');

        // Get test identifier
        const identifier = getIdentifier(req);

        // Try to check rate limit
        const rateLimitResult = await checkRateLimit(getContactRateLimit(), `test-${identifier}`);

        if (rateLimitResult.allowed) {
            return res.status(200).json({
                status: '✅ SUCCESS',
                message: 'Upstash Redis is connected and working!',
                rateLimit: {
                    active: true,
                    identifier: `test-${identifier}`,
                    note: 'Rate limiting is fully operational'
                },
                timestamp: new Date().toISOString()
            });
        } else {
            return res.status(200).json({
                status: '✅ SUCCESS (Rate Limited)',
                message: 'Upstash is working - you hit the rate limit!',
                rateLimit: {
                    active: true,
                    exceeded: true,
                    note: 'This means rate limiting is working perfectly'
                },
                timestamp: new Date().toISOString()
            });
        }

    } catch (error: any) {
        // If error contains "Rate limiting not configured", Upstash is not set up
        if (error.message?.includes('Rate limiting not configured')) {
            return res.status(200).json({
                status: '⚠️ NOT CONFIGURED',
                message: 'Upstash credentials not found in environment variables',
                error: error.message,
                required: {
                    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? '✅ Set' : '❌ Missing',
                    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ? '✅ Set' : '❌ Missing'
                },
                timestamp: new Date().toISOString()
            });
        }

        return res.status(500).json({
            status: '❌ ERROR',
            message: 'Error testing Upstash connection',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
