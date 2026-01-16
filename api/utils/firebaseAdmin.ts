/**
 * Centralized Firebase Admin SDK Initialization
 * Ensures firebase-admin is initialized exactly once across all API routes
 */

import admin from 'firebase-admin';

let isInitialized = false;

export function initializeFirebaseAdmin() {
    if (isInitialized) {
        return;
    }

    try {
        if (admin.apps.length > 0) {
            isInitialized = true;
            return;
        }

        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id
            });
        } else {
            // Fallback to application default credentials (for local dev)
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: 'bustadurinn-is'
            });
        }

        isInitialized = true;
        console.log('✅ Firebase Admin initialized successfully');
    } catch (error) {
        console.error('❌ Firebase Admin initialization error:', error);
        throw new Error(`Firebase Admin initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Auto-initialize on import
initializeFirebaseAdmin();

// Export admin and commonly used services
export { admin };
export const db = admin.firestore();
export const auth = admin.auth();
