/**
 * API Authentication & Authorization Utilities
 * Ensures only authenticated and authorized users can access sensitive endpoints
 */

import type { VercelRequest } from '@vercel/node';
import { admin, initializeFirebaseAdmin } from './firebaseAdmin.js';

/**
 * True if a user_roles document grants super admin. Accepts the legacy
 * `is_super_admin` flag as well (firestore.rules treats both as super admin).
 */
export function isSuperAdminRole(roleData: FirebaseFirestore.DocumentData | undefined | null): boolean {
    return roleData?.system_role === 'super_admin' || roleData?.is_super_admin === true;
}

/**
 * Verify Firebase ID token and check if user is a super admin via RBAC
 * @throws Error if unauthorized or forbidden
 */
export async function requireAdmin(req: VercelRequest): Promise<admin.auth.DecodedIdToken> {
    initializeFirebaseAdmin();
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('UNAUTHORIZED: Missing or invalid authorization header');
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        // Verify Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Check if user has super_admin role in user_roles collection
        const roleDoc = await admin.firestore()
            .collection('user_roles')
            .doc(decodedToken.uid)
            .get();

        if (!isSuperAdminRole(roleDoc.exists ? roleDoc.data() : undefined)) {
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
    initializeFirebaseAdmin();
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('UNAUTHORIZED: Missing or invalid authorization header');
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        return decodedToken;
    } catch {
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
