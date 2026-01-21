import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';


// Helper functions inlined to prevent module resolution issues in Vercel
async function requireAdmin(req: VercelRequest, db: admin.firestore.Firestore): Promise<admin.auth.DecodedIdToken> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('UNAUTHORIZED: Missing or invalid authorization header');
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Check if user has super_admin role via RBAC
        const roleDoc = await db.collection('user_roles').doc(decodedToken.uid).get();

        if (!roleDoc.exists || roleDoc.data()?.system_role !== 'super_admin') {
            throw new Error('FORBIDDEN: Admin access required');
        }

        return decodedToken;
    } catch (error: any) {
        if (error.message?.startsWith('FORBIDDEN')) {
            throw error;
        }
        throw new Error('UNAUTHORIZED: Invalid or expired token');
    }
}

function getAuthErrorResponse(error: Error): { status: number; body: any } {
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

// Lazy init
let db: admin.firestore.Firestore | null = null;
let auth: admin.auth.Auth | null = null;

function initServices() {
    console.log('Testing InitServices...');
    if (admin.apps.length > 0) {
        console.log('Firebase Admin already initialized');
        db = admin.firestore();
        auth = admin.auth();
        return;
    }

    try {
        console.log('Initializing Firebase Admin...');
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            console.log('Found FIREBASE_SERVICE_ACCOUNT env var');
            try {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: serviceAccount.project_id
                });
                console.log('Initialized with Service Account');
            } catch (jsonError: any) {
                console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', jsonError.message);
                throw new Error(`Service Account JSON Parse Error: ${jsonError.message}`);
            }
        } else {
            console.log('No FIREBASE_SERVICE_ACCOUNT, trying applicationDefault');
            // Fallback for local or managed environment
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: 'bustadurinn-is'
            });
        }
    } catch (error: any) {
        console.error('❌ Firebase Admin initialization error:', error);
        throw new Error(`Firebase Init Failed: ${error.message}`);
    }

    if (!db) db = admin.firestore();
    if (!auth) auth = admin.auth();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        initServices();

        if (!db || !auth) {
            throw new Error('Internal services failed to initialize');
        }

        // 🔒 SECURITY: Verify admin authentication
        try {
            await requireAdmin(req, db);
        } catch (authError: any) {
            const errorResponse = getAuthErrorResponse(authError);
            return res.status(errorResponse.status).json(errorResponse.body);
        }

        const { uid } = req.body;

        if (!uid) {
            return res.status(400).json({ error: 'Missing uid' });
        }

        console.log(`🗑️ Admin requested deletion of user: ${uid}`);

        // 1. Delete from Firebase Authentication
        await auth.deleteUser(uid);
        console.log(`✅ Auth user ${uid} deleted`);

        // 2. Delete User Profile from Firestore
        await db.collection('users').doc(uid).delete();
        console.log(`✅ Firestore user profile ${uid} deleted`);

        // 3. Delete user_roles document (RBAC cleanup)
        try {
            await db.collection('user_roles').doc(uid).delete();
            console.log(`✅ User roles ${uid} deleted`);
        } catch (roleError) {
            // Non-critical if role document doesn't exist
            console.log(`ℹ️ No user_roles document for ${uid}`);
        }

        // 4. Optional: Cleanup memberships
        // For now, we leave house memberships as 'ghost' strings in arrays or rely on client-side filtering.
        // A robust solution would remove the UID from 'owner_ids' in all houses.
        // Let's attempt a best-effort cleanup of houses where they are an owner.
        const housesSnap = await db.collection('houses').where('owner_ids', 'array-contains', uid).get();

        const batch = db.batch();
        housesSnap.docs.forEach(doc => {
            const houseRef = db!.collection('houses').doc(doc.id);
            // Remove from owner_ids
            batch.update(houseRef, {
                owner_ids: admin.firestore.FieldValue.arrayRemove(uid)
            });
            // If they are the manager, we should probably warn or handle it, but for a "Force Delete", leaving it or setting to null/first owner is an option.
            // For now, let's just remove them from the list. The frontend logic usually handles missing managers gracefully or shows an error.
        });

        if (!housesSnap.empty) {
            await batch.commit();
            console.log(`✅ Removed user ${uid} from ${housesSnap.size} houses`);
        }

        return res.status(200).json({ success: true, message: `User ${uid} deleted completely` });

    } catch (error: any) {
        console.error('❌ Server Error deleting user:', error);

        // Only expose stack traces in development, not production
        const errorResponse = process.env.NODE_ENV === 'production'
            ? {
                error: 'Internal server error',
                code: error.code || 'internal_server_error'
              }
            : {
                error: error.message,
                code: error.code || 'internal_server_error',
                details: error.stack
              };

        return res.status(500).json(errorResponse);
    }
}
