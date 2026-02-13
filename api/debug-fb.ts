import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

export default function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const appCount = admin.apps.length;
        res.status(200).json({
            status: 'ok',
            msg: 'direct-import-success',
            appCount: appCount,
            node: process.version
        });
    } catch (e: any) {
        res.status(500).json({
            status: 'error',
            msg: 'direct-import-failed',
            error: e.message
        });
    }
}
