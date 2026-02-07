import { initializeFirebaseAdmin, getDb, getLastError } from './utils/firebaseAdmin.js';

export default async function handler(req, res) {
    try {
        initializeFirebaseAdmin();
        const db = getDb();
        const error = getLastError();

        return res.status(200).json({
            status: 'ok',
            version: 'v28-fixed',
            node: process.version,
            firebase: {
                initialized: !!db,
                error: error
            }
        });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
