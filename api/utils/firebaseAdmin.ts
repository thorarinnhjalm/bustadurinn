import * as admin from 'firebase-admin';

let isInitialized = false;

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
                const serviceAccount = JSON.parse(sa.trim());
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: serviceAccount.project_id
                });
                console.log('Firebase Admin: Initialized via Service Account');
            } catch (jsonErr: any) {
                console.error('Firebase Admin: JSON Parse Error:', jsonErr.message);
            }
        } else {
            // Fallback or missing
            console.log('Firebase Admin: No valid credentials found');
        }

        isInitialized = true;
    } catch (e: any) {
        console.error('Firebase Admin: Initialization crash:', e.message);
    }
}

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
