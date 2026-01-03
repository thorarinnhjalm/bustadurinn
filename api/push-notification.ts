import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.VITE_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { tokens, title, body, data } = req.body;

    if (!tokens || tokens.length === 0) {
        return res.status(200).json({ success: true, message: 'No tokens provided' });
    }

    try {
        const response = await admin.messaging().sendEachForMulticast({
            tokens: Array.from(new Set(tokens as string[])), // Unique tokens
            notification: {
                title,
                body,
            },
            data: data || {},
            webpush: {
                notification: {
                    icon: 'https://bustadurinn.is/logo.png',
                    badge: 'https://bustadurinn.is/icon-192x192.png',
                },
                fcmOptions: {
                    link: data?.link || 'https://bustadurinn.is/dashboard'
                }
            }
        });

        console.log(`Successfully sent ${response.successCount} messages; ${response.failureCount} messages failed.`);

        return res.status(200).json({
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount
        });
    } catch (error: any) {
        console.error('Error sending push notification:', error);
        return res.status(500).json({ error: 'Failed to send notification', details: error.message });
    }
}
