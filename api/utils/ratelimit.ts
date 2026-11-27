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
 * Rate limiter for booking notification fan-out
 * Limit: 30 requests per hour per user
 */
let _bookingNotificationRateLimit: Ratelimit | null = null;
export function getBookingNotificationRateLimit(): Ratelimit {
    if (!_bookingNotificationRateLimit) {
        _bookingNotificationRateLimit = new Ratelimit({
            redis: getRedis(),
            limiter: Ratelimit.slidingWindow(30, '1 h'),
            analytics: true,
            prefix: 'ratelimit:booking-notification',
        });
    }
    return _bookingNotificationRateLimit;
}

/**
 * Rate limiter for push notifications
 * Limit: 30 requests per hour per user
 */
let _pushRateLimit: Ratelimit | null = null;
export function getPushRateLimit(): Ratelimit {
    if (!_pushRateLimit) {
        _pushRateLimit = new Ratelimit({
            redis: getRedis(),
            limiter: Ratelimit.slidingWindow(30, '1 h'),
            analytics: true,
            prefix: 'ratelimit:push',
        });
    }
    return _pushRateLimit;
}

/**
 * Resolve a limiter without throwing when Upstash is not configured.
 * Returns null if the limiter cannot be created (use with failOpen routes).
 */
export function tryGetRateLimit(getter: () => Ratelimit): Ratelimit | null {
    try {
        return getter();
    } catch (error) {
        console.warn('Rate limiter unavailable:', error instanceof Error ? error.message : error);
        return null;
    }
}

/**
 * Helper to check rate limit and return appropriate response.
 * By default fails CLOSED (503) if the limiter backend errors. Pass
 * `{ failOpen: true }` for already-authenticated routes where a Redis outage
 * should not take the feature down: the failure is logged and the request allowed.
 */
export async function checkRateLimit(
    ratelimit: Ratelimit,
    identifier: string,
    options: { failOpen?: boolean } = {}
): Promise<{ allowed: boolean; error?: any }> {
    try {
        const { success } = await ratelimit.limit(identifier);

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
        if (options.failOpen) {
            console.warn('Rate limit check failed, allowing request (fail-open):', error);
            return { allowed: true };
        }
        // If rate limiting fails (e.g., Redis down), fail closed for security
        console.error('Rate limit check failed:', error);
        return {
            allowed: false,
            error: {
                status: 503,
                body: {
                    error: 'Service temporarily unavailable',
                    message: 'Rate limiting service temporarily unavailable. Please try again shortly.'
                }
            }
        };
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

/**
 * Rate limiter for unauthenticated invitation lookups (api/invite-info.ts)
 * Limit: 30 requests per hour per IP
 */
let _inviteLookupRateLimit: Ratelimit | null = null;
export function getInviteLookupRateLimit(): Ratelimit {
    if (!_inviteLookupRateLimit) {
        _inviteLookupRateLimit = new Ratelimit({
            redis: getRedis(),
            limiter: Ratelimit.slidingWindow(30, '1 h'),
            analytics: true,
            prefix: 'ratelimit:invite-lookup',
        });
    }
    return _inviteLookupRateLimit;
}

/**
 * Rate limiter for joining a house (api/join-house.ts)
 * Limit: 20 requests per hour per user
 */
let _joinHouseRateLimit: Ratelimit | null = null;
export function getJoinHouseRateLimit(): Ratelimit {
    if (!_joinHouseRateLimit) {
        _joinHouseRateLimit = new Ratelimit({
            redis: getRedis(),
            limiter: Ratelimit.slidingWindow(20, '1 h'),
            analytics: true,
            prefix: 'ratelimit:join-house',
        });
    }
    return _joinHouseRateLimit;
}
