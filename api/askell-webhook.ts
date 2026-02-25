import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './utils/firebaseAdmin';

/**
 * Áskell Webhook Handler
 * Updates house subscription status when payment is successful.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Áskell headers
        const eventType = req.headers['hook-event'];
        const hmac = req.headers['hook-hmac'];
        const body = req.body;

        console.log(`Áskell Webhook received: ${eventType}`, JSON.stringify(body, null, 2));

        // 1. Verification (Optional but recommended)
        // Note: For now we focus on functionality. In a strictly secure production, 
        // we would verify the HMAC signature with a secret from environment variables.
        // if (!verifyAskellSignature(hmac, body)) { return res.status(401).send('Unauthorized'); }

        // 2. Handle Events
        // We look for payment success or subscription creation
        if (eventType === 'payment.settled' || eventType === 'subscription.created') {
            const houseId = body.customer_reference || body.subscription_reference || (body.metadata && body.metadata.subscription_reference);

            if (!houseId) {
                console.warn('Webhook received but no houseId (subscription_reference) found in payload');
                return res.status(200).json({ success: true, message: 'No reference found' });
            }

            const db = getDb();
            if (!db) {
                throw new Error('Firestore not available');
            }

            const houseRef = db.collection('houses').doc(houseId);
            const houseDoc = await houseRef.get();

            if (!houseDoc.exists) {
                console.error(`House ${houseId} not found for payment activation`);
                return res.status(404).json({ error: 'House not found' });
            }

            // Update house status
            await houseRef.update({
                subscription_status: 'active',
                subscription_id: body.subscription_id || body.id || null,
                updated_at: new Date()
            });

            console.log(`✅ House ${houseId} activated successfully via Áskell webhook`);

            return res.status(200).json({ success: true, activated: houseId });
        }

        // Acknowledge other events
        return res.status(200).json({ success: true, message: 'Event received' });

    } catch (error: any) {
        console.error('Áskell Webhook Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
