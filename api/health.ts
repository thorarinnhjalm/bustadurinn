import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    return res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        node_version: process.version,
        env: {
            has_service_account: !!process.env.FIREBASE_SERVICE_ACCOUNT,
            has_client_email: !!process.env.FIREBASE_CLIENT_EMAIL,
            has_private_key: !!process.env.FIREBASE_PRIVATE_KEY
        }
    });
}
