import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, timingSafeEqual } from 'crypto';
import { getDb } from './utils/firebaseAdmin';

function verifyAskellSignature(hmacHeader: string | string[] | undefined, body: any): boolean {
    const secret = process.env.ASKELL_WEBHOOK_SECRET;
    if (!secret) {
        console.warn('⚠️ ASKELL_WEBHOOK_SECRET not set — skipping signature verification');
        return true;
    }
    if (!hmacHeader || Array.isArray(hmacHeader)) return false;
    const expected = createHmac('sha256', secret)
        .update(JSON.stringify(body))
        .digest('hex');
    try {
        return timingSafeEqual(Buffer.from(hmacHeader), Buffer.from(expected));
    } catch {
        return false;
    }
}

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

        // 1. Verify HMAC signature — enforced when ASKELL_WEBHOOK_SECRET is set
        if (!verifyAskellSignature(hmac, body)) {
            console.warn('Áskell Webhook: invalid HMAC signature');
            return res.status(401).json({ error: 'Unauthorized' });
        }

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
