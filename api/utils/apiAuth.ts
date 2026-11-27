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

// Recovery/master identities. The single source of truth for the allowlists:
// requireAdmin, verifyAdminToken, send-email and delete-account all go
// through isAdminIdentity(). (firestore.rules isSuperAdmin() mirrors the
// verified-email fallback.)
const ADMIN_EMAILS = [
    'thorarinnhjalmarsson@gmail.com',
    'thorarinnhjalm@gmail.com'
];

const ADMIN_UIDS = [
    'sxcToczAAwT3Fmh8FPXa1P6hMHB3'
];

/**
 * True if the identity is a super admin: a user_roles grant, OR an
 * allow-listed email that Firebase has verified, OR an allow-listed uid.
 */
export function isAdminIdentity(
    decodedToken: { uid: string; email?: string | null; email_verified?: boolean | null },
    roleData?: FirebaseFirestore.DocumentData | null
): boolean {
    if (isSuperAdminRole(roleData)) return true;
    if (ADMIN_UIDS.includes(decodedToken.uid)) return true;
    return decodedToken.email_verified === true
        && !!decodedToken.email
        && ADMIN_EMAILS.includes(decodedToken.email.toLowerCase());
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

        if (!isAdminIdentity(decodedToken, roleDoc.exists ? roleDoc.data() : undefined)) {
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
