import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeFirebaseAdmin, getDb } from './utils/firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    let firebase_status = 'not_attempted';
    let firebase_error = null;

    try {
        initializeFirebaseAdmin();
        const db = getDb();
        firebase_status = db ? 'initialized' : 'failed_to_get_db';
    } catch (e: any) {
        firebase_status = 'error';
        firebase_error = e.message;
    }

    return res.status(200).json({
        status: 'ok',
        version: 'v20',
        timestamp: new Date().toISOString(),
        node_version: process.version,
        firebase: {
            status: firebase_status,
            error: firebase_error
        }
    });
}
