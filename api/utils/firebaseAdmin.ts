import admin from 'firebase-admin';
export { admin };

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
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;
        const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

        if (sa && sa.trim().length > 10) {
            // Option 1: JSON String format
            let saString = sa.trim();
            if (saString.startsWith('"') && saString.endsWith('"')) {
                saString = saString.substring(1, saString.length - 1);
            }

            const serviceAccount = JSON.parse(saString);
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id
            });
            console.log('Firebase Admin: Initialized with JSON string');
            isInitialized = true;
        } else if (clientEmail && privateKey && projectId) {
            // Option 2: Individual variables
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey: privateKey.replace(/\\n/g, '\n')
                }),
                projectId
            });
            console.log('Firebase Admin: Initialized with individual variables');
            isInitialized = true;
        } else {
            lastError = `Missing credentials. SA: ${!!sa}, Email: ${!!clientEmail}, Key: ${!!privateKey}, Project: ${!!projectId}`;
            console.error('Firebase Admin: Initialization failure - Missing environment variables');
            isInitialized = true; // Mark as "tried"
        }
    } catch (e: any) {
        lastError = `Initialization Crash: ${e.message}`;
        console.error('Firebase Admin: Initialization crash:', e.message);
    }
}

export const getLastError = () => lastError;

export const getDb = () => {
    initializeFirebaseAdmin();
    try {
        return admin.apps.length > 0 ? admin.firestore() : null;
    } catch (e) {
        console.error('getDb Error:', e);
        return null;
    }
};

export const getAuth = () => {
    initializeFirebaseAdmin();
    try {
        return admin.apps.length > 0 ? admin.auth() : null;
    } catch (e) {
        console.error('getAuth Error:', e);
        return null;
    }
};
