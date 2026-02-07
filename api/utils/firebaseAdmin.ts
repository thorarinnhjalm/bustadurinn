/**
 * Centralized Firebase Admin SDK Initialization
 * Ensures firebase-admin is initialized exactly once across all API routes
 */

import * as admin from 'firebase-admin';

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
            let config = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
            // Handle cases where Vercel might add extra quotes or escaping
            if (config.startsWith("'") && config.endsWith("'")) config = config.slice(1, -1);
            if (config.startsWith('"') && config.endsWith('"')) config = config.slice(1, -1);

            const serviceAccount = JSON.parse(config);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id
            });
            console.log('✅ Firebase Admin initialized with Service Account JSON');
        } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
            // Support for direct env vars (Vercel / .env.local)
            const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'bustadurinn-599f2',
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey,
                }),
                projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'bustadurinn-599f2'
            });
            console.log('✅ Firebase Admin initialized with Individual Env Vars');
        } else {
            // Fallback to application default credentials (for local dev)
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: 'bustadurinn-is'
            });
            console.log('ℹ️ Firebase Admin initialized with Application Default Credentials');
        }

        isInitialized = true;
    } catch (error: any) {
        console.error('❌ Firebase Admin initialization error:', error.message);
        if (error.stack) console.error(error.stack);
        // Do NOT set isInitialized = true here
    }
}

// Auto-initialize on import
initializeFirebaseAdmin();

// Export admin directly
export { admin };

/**
 * Defensive database accessor
 */
export const db = (() => {
    try {
        // Only attempt to access firestore if there's at least one app
        if (admin.apps.length === 0) {
            console.warn('⚠️ db accessed before Firebase Admin was initialized.');
            return null as any;
        }
        return admin.firestore();
    } catch (e: any) {
        console.warn('⚠️ Failed to export db:', e.message);
        return null as any;
    }
})();

/**
 * Defensive auth accessor
 */
export const auth = (() => {
    try {
        if (admin.apps.length === 0) {
            console.warn('⚠️ auth accessed before Firebase Admin was initialized.');
            return null as any;
        }
        return admin.auth();
    } catch (e: any) {
        console.warn('⚠️ Failed to export auth:', e.message);
        return null as any;
    }
})();
