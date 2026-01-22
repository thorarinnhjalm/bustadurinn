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
        console.error('❌ Firebase Admin initialization error:', error);
        // Do NOT throw here, or the entire function crashes (FUNCTION_INVOCATION_FAILED)
        // We let it continue so the API handler can return a proper 500 error.
    }
}

// Auto-initialize on import
initializeFirebaseAdmin();

// Export admin and commonly used services
export { admin };

// Safe exports that won't crash the module if init failed
export const db = (() => {
    try {
        return admin.firestore();
    } catch (e) {
        console.warn('⚠️ Failed to export db (likely init failed):', e);
        return null as any;
    }
})();

export const auth = (() => {
    try {
        return admin.auth();
    } catch (e) {
        console.warn('⚠️ Failed to export auth (likely init failed):', e);
        return null as any;
    }
})();
