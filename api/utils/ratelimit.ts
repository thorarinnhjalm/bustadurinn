/**
 * Rate Limiting Utilities
 * Prevents API abuse and DoS attacks using Upstash Redis
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client (only if env vars are set)
let redis: Redis | null = null;

function getRedis(): Redis {
    if (!redis) {
        const url = process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;

        if (!url || !token) {
            console.warn('⚠️ UPSTASH_REDIS credentials not set. Rate limiting disabled.');
            throw new Error('Rate limiting not configured');
        }

        redis = new Redis({ url, token });
    }
    return redis;
}

/**
 * Rate limiter for contact form submissions
 * Limit: 5 requests per hour per IP
 */
let _contactRateLimit: Ratelimit | null = null;
export function getContactRateLimit(): Ratelimit {
    if (!_contactRateLimit) {
        _contactRateLimit = new Ratelimit({
            redis: getRedis(),
            limiter: Ratelimit.slidingWindow(5, '1 h'),
            analytics: true,
            prefix: 'ratelimit:contact',
        });
    }
    return _contactRateLimit;
}

/**
 * Rate limiter for email sending
 * Limit: 10 requests per hour per user
 */
let _emailRateLimit: Ratelimit | null = null;
export function getEmailRateLimit(): Ratelimit {
    if (!_emailRateLimit) {
        _emailRateLimit = new Ratelimit({
            redis: getRedis(),
            limiter: Ratelimit.slidingWindow(10, '1 h'),
            analytics: true,
            prefix: 'ratelimit:email',
        });
    }
    return _emailRateLimit;
}

/**
 * Rate limiter for invoice creation
 * Limit: 5 requests per hour per user
 */
let _invoiceRateLimit: Ratelimit | null = null;
export function getInvoiceRateLimit(): Ratelimit {
    if (!_invoiceRateLimit) {
        _invoiceRateLimit = new Ratelimit({
            redis: getRedis(),
            limiter: Ratelimit.slidingWindow(5, '1 h'),
            analytics: true,
            prefix: 'ratelimit:invoice',
        });
    }
    return _invoiceRateLimit;
}

/**
 * Helper to check rate limit and return appropriate response
 * Returns null if allowed, or an error object if rate limited
 */
export async function checkRateLimit(
    ratelimit: Ratelimit,
    identifier: string
): Promise<{ allowed: boolean; error?: any }> {
    try {
        const { success, remaining } = await ratelimit.limit(identifier);

        if (!success) {
            return {
                allowed: false,
                error: {
                    status: 429,
                    body: {
                        error: 'Too many requests',
                        message: 'Rate limit exceeded. Please try again later.',
                        remaining: 0
                    }
                }
            };
        }

        return { allowed: true };
    } catch (error) {
        // If rate limiting fails (e.g., Redis down), allow the request
        console.warn('Rate limit check failed:', error);
        return { allowed: true };
    }
}

/**
 * Get identifier from request (IP address)
 */
export function getIdentifier(req: any): string {
    return (
        req.headers['x-forwarded-for'] ||
        req.headers['x-real-ip'] ||
        req.socket?.remoteAddress ||
        'unknown'
    );
}
