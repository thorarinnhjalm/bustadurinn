import { initializeFirebaseAdmin, getDb } from './utils/firebaseAdmin.js';

export default async function handler(req, res) {
    console.log('Health Check v26 START');
    let info = {
        version: 'v26-forced-push',
        time: new Date().toISOString(),
        node: process.version,
        env: {
            NODE_ENV: process.env.NODE_ENV,
            FB_SA_LEN: process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0,
            FB_PROJ: process.env.VITE_FIREBASE_PROJECT_ID || 'missing'
        }
    };

    try {
        console.log('Attempting Firebase Init...');
        initializeFirebaseAdmin();
        const db = getDb();
        info.firebase = db ? 'initialized' : 'failed';
    } catch (e) {
        info.firebase_error = e.message;
    }

    return res.status(200).json(info);
}
