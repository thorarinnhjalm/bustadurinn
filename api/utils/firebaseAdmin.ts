let isInitialized = false;
let lastError: string | null = null;
let _admin: any = null;

export function initializeFirebaseAdmin() {
    if (isInitialized) return;

    try {
        // Dynamic require to avoid top-level load weight
        _admin = require('firebase-admin');

        if (_admin.apps.length > 0) {
            isInitialized = true;
            return;
        }

        const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (sa && sa.trim().length > 10) {
            try {
                let saString = sa.trim();
                // Strip wrapper quotes if they exist
                if (saString.startsWith('"') && saString.endsWith('"')) {
                    saString = saString.substring(1, saString.length - 1);
                }

                const serviceAccount = JSON.parse(saString);

                // Handle newlines in private key
                if (serviceAccount.private_key) {
                    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
                }

                _admin.initializeApp({
                    credential: _admin.credential.cert(serviceAccount),
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
        return _admin && _admin.apps.length > 0 ? _admin.firestore() : null;
    } catch (e) {
        console.error('getDb Error:', e);
        return null;
    }
};

export const getAuth = () => {
    initializeFirebaseAdmin();
    try {
        return _admin && _admin.apps.length > 0 ? _admin.auth() : null;
    } catch (e) {
        console.error('getAuth Error:', e);
        return null;
    }
};
