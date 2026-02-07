import { initializeFirebaseAdmin, getDb } from './utils/firebaseAdmin.js';

export default async function handler(req, res) {
    let firebase_status = 'not_attempted';
    let firebase_info = {};

    try {
        initializeFirebaseAdmin();
        const db = getDb();
        firebase_status = db ? 'initialized' : 'failed_to_get_db';

        firebase_info = {
            sa_exists: !!process.env.FIREBASE_SERVICE_ACCOUNT,
            sa_length: process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0,
            project_id: process.env.VITE_FIREBASE_PROJECT_ID || 'missing'
        };
    } catch (e) {
        firebase_status = 'error';
        firebase_info.error = e.message;
    }

    return res.status(200).json({
        status: 'ok',
        version: 'v25-diag',
        timestamp: new Date().toISOString(),
        node_version: process.version,
        firebase: {
            status: firebase_status,
            info: firebase_info
        }
    });
}
