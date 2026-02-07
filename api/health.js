import { initializeFirebaseAdmin, getDb } from './utils/firebaseAdmin.js';

export default async function handler(req, res) {
    let firebase_status = 'not_attempted';
    let firebase_error = null;

    try {
        initializeFirebaseAdmin();
        const db = getDb();
        firebase_status = db ? 'initialized' : 'failed_to_get_db';
    } catch (e) {
        firebase_status = 'error';
        firebase_error = e.message;
    }

    return res.status(200).json({
        status: 'ok',
        version: 'v22',
        timestamp: new Date().toISOString(),
        node_version: process.version,
        firebase: {
            status: firebase_status,
            error: firebase_error
        }
    });
}
