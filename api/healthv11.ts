import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeFirebaseAdmin, getDb } from './utils/firebaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    let firebase_status = 'not_attempted';
    let firebase_error = null;

    try {
        initializeFirebaseAdmin();
        const db = getDb();
        firebase_status = db ? 'initialized (v11)' : 'failed_to_get_db';
    } catch (e: any) {
        firebase_status = 'error';
        firebase_error = e.message;
    }

    return res.status(200).json({
        status: 'ok',
        version: 'v11',
        timestamp: new Date().toISOString(),
        firebase: {
            status: firebase_status,
            error: firebase_error
        }
    });
}
