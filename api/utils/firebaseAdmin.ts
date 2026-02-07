import * as admin from 'firebase-admin';

let isInitialized = false;
let lastError: string | null = null;

export function initializeFirebaseAdmin() {
    if (isInitialized) return;

    try {
        if (admin.apps.length > 0) {
            isInitialized = true;
            return;
        }

        const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (sa && sa.trim().length > 10) {
            try {
                // Remove potential quotes if the whole JSON was wrapped
                let saString = sa.trim();
                if (saString.startsWith('"') && saString.endsWith('"')) {
                    saString = saString.substring(1, saString.length - 1);
                }

                const serviceAccount = JSON.parse(saString);

                // Ensure private key newlines are handled correctly
                if (serviceAccount.private_key) {
                    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
                }

                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: serviceAccount.project_id
                });
                console.log('Firebase Admin: Initialized successfully');
                isInitialized = true;
            } catch (jsonErr: any) {
                lastError = `JSON/Init Error: ${jsonErr.message}`;
                console.error('Firebase Admin: Initialization failure:', jsonErr.message);
            }
        } else {
            lastError = `Env var missing or too short. Length: ${sa?.length || 0}`;
            isInitialized = true; // Mark as attempted so we don't spam
        }
    } catch (e: any) {
        lastError = `Outer Crash: ${e.message}`;
        console.error('Firebase Admin: Outer initialization crash:', e.message);
    }
}

export const getLastError = () => lastError;

export const getDb = () => {
    initializeFirebaseAdmin();
    try {
        return admin.apps.length > 0 ? admin.firestore() : null;
    } catch (e) {
        return null;
    }
};

export const getAuth = () => {
    initializeFirebaseAdmin();
    try {
        return admin.apps.length > 0 ? admin.auth() : null;
    } catch (e) {
        return null;
    }
};
