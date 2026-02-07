import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let isInitialized = false;
let lastError: string | null = null;
let app: App | null = null;

export function initializeFirebaseAdmin() {
    if (isInitialized) return;

    try {
        const existingApps = getApps();
        if (existingApps.length > 0) {
            app = existingApps[0];
            isInitialized = true;
            return;
        }

        const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (sa && sa.trim().length > 10) {
            try {
                let saString = sa.trim();
                if (saString.startsWith('"') && saString.endsWith('"')) {
                    saString = saString.substring(1, saString.length - 1);
                }

                const serviceAccount = JSON.parse(saString);

                if (serviceAccount.private_key) {
                    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
                }

                app = initializeApp({
                    credential: cert(serviceAccount),
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
            isInitialized = true;
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
        const apps = getApps();
        return apps.length > 0 ? getFirestore() : null;
    } catch (e) {
        console.error('getDb Error:', e);
        return null;
    }
};

export const getAuth = () => {
    initializeFirebaseAdmin();
    try {
        const apps = getApps();
        return apps.length > 0 ? getAuthService() : null;
    } catch (e) {
        console.error('getAuth Error:', e);
        return null;
    }
};

// Internal helper to avoid name collision with the import
function getAuthService() {
    return getAuth();
}
