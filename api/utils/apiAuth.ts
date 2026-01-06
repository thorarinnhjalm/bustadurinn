/**
 * API Authentication & Authorization Utilities
 * Ensures only authenticated and authorized users can access sensitive endpoints
 */

import type { VercelRequest } from '@vercel/node';
import admin from 'firebase-admin';

// Super Admin email whitelist
const ADMIN_EMAILS = [
    'thorarinnhjalmarsson@gmail.com',
    'thorarinnhjalm@gmail.com',
];

/**
 * Verify Firebase ID token and check if user is a super admin
 * @throws Error if unauthorized or forbidden
 */
export async function requireAdmin(req: VercelRequest): Promise<admin.auth.DecodedIdToken> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('UNAUTHORIZED: Missing or invalid authorization header');
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        // Verify Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Check if user is in admin whitelist
        if (!decodedToken.email || !ADMIN_EMAILS.includes(decodedToken.email)) {
            throw new Error('FORBIDDEN: Admin access required');
        }

        return decodedToken;
    } catch (error: any) {
        if (error.message?.startsWith('FORBIDDEN')) {
            throw error;
        }
        // Firebase token verification failed
        throw new Error('UNAUTHORIZED: Invalid or expired token');
    }
}

/**
 * Verify Firebase ID token (any authenticated user)
 * @throws Error if unauthorized
 */
export async function requireAuth(req: VercelRequest): Promise<admin.auth.DecodedIdToken> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('UNAUTHORIZED: Missing or invalid authorization header');
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        throw new Error('UNAUTHORIZED: Invalid or expired token');
    }
}

/**
 * Handle authentication errors in API routes
 */
export function getAuthErrorResponse(error: Error): { status: number; body: any } {
    if (error.message.startsWith('UNAUTHORIZED')) {
        return {
            status: 401,
            body: { error: 'Unauthorized', message: 'Authentication required' }
        };
    }

    if (error.message.startsWith('FORBIDDEN')) {
        return {
            status: 403,
            body: { error: 'Forbidden', message: 'Insufficient permissions' }
        };
    }

    console.error('Auth error:', error);
    return {
        status: 500,
        body: { error: 'Internal server error' }
    };
}
