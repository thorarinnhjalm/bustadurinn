import { Resend } from 'resend';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeFirebaseAdmin, getDb, admin } from '../utils/firebaseAdmin.js';

initializeFirebaseAdmin();
const db = getDb()!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Validate Cron Secret (Optional but recommended if provided by env)
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = req.headers.authorization;
        if (authHeader !== `Bearer ${cronSecret}`) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }

    try {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is missing');
        }

        const resend = new Resend(process.env.RESEND_API_KEY);

        // 2. Query Orphans
        // Users created > 24 hours ago AND house_ids is empty AND recovery_email_sent is not true
        const now = new Date();
        const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
        // To be safe, let's also put an upper bound of 72 hours so we don't spam ancient users
        const ancientCutoff = new Date(now.getTime() - 72 * 60 * 60 * 1000);

        // Note: Firestore text search/complex inequalities are limited.
        // We can query users created before cutoff.
        // Then filter in memory for 'house_ids' is empty.
        // Firestore composite indexes might be needed for 'created_at' < cutoff AND 'recovery_email_sent' != true.
        // Simpler: Query 'recovery_email_sent' == null/false (if possible) or just created_at range and filter.

        console.log(`🔍 Searching for orphans created between ${ancientCutoff.toISOString()} and ${cutoff.toISOString()}`);

        const usersRef = db.collection('users');
        const snapshot = await usersRef
            .where('created_at', '<=', cutoff)
            .where('created_at', '>=', ancientCutoff)
            .get();

        const orphans = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();

            // Filter: No houses
            if (data.house_ids && data.house_ids.length > 0) continue;

            // Filter: Already sent
            if (data.recovery_email_sent) continue;

            // Filter: Email exists
            if (!data.email) continue;

            orphans.push({ id: doc.id, ...data });
        }

        console.log(`Found ${orphans.length} potential orphans.`);

        // 3. Process Batch (Limit to 20 to avoid timeouts)
        const batchSize = 20;
        const toProcess = orphans.slice(0, batchSize);
        let sentCount = 0;

        for (const user of toProcess) {
            try {
                // Determine name
                const userName = user.name || user.email.split('@')[0];

                // Send Email
                const { error } = await resend.emails.send({
                    from: 'Bústaðurinn <hallo@bustadurinn.is>',
                    to: user.email,
                    subject: 'Kláraðu uppsetninguna á Bústaðurinn.is 🏡',
                    html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f0; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { font-size: 32px; margin-bottom: 10px; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
        .button { display: inline-block; background: #e8b058; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; text-align: center; width: 100%; box-sizing: border-box; }
        .footer { background: #f5f5f0; padding: 30px; text-align: center; font-size: 13px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><div class="logo">🏡</div><h1>Eitt skref í viðbót...</h1></div>
        <div class="content">
            <p class="greeting">Hæ ${userName},</p>
            <p>Við tókum eftir því að þú byrjaðir að skrá þig en kláraðir ekki að stofna húsið þitt.</p>
            <p>Engar áhyggjur, aðgangurinn þinn er tilbúinn. Þú þarft bara að skrá inn upplýsingar um bústaðinn til að byrja.</p>
            <a href="https://bustadurinn.is/onboarding" class="button">Klára uppsetningu</a>
            <p style="margin-top: 20px; font-size: 14px; color: #666;">Ef þú lendir í vandræðum, svaraðu þessum pósti og við hjálpum þér.</p>
        </div>
        <div class="footer"><p><strong>Bústaðurinn.is</strong></p></div>
    </div>
</body>
</html>`
                });

                if (error) {
                    console.error(`Failed to send to ${user.email}:`, error);
                } else {
                    // Update User
                    await db.collection('users').doc(user.id).update({
                        recovery_email_sent: true,
                        recovery_email_at: admin.firestore.FieldValue.serverTimestamp()
                    });
                    console.log(`✅ Sent recovery email to ${user.email}`);
                    sentCount++;
                }

            } catch (err) {
                console.error(`Error processing user ${user.id}:`, err);
            }
        }

        return res.status(200).json({
            success: true,
            processed: sentCount,
            total_orphans_found: orphans.length
        });

    } catch (error: any) {
        console.error('Cron job error:', error);
        return res.status(500).json({ error: error.message });
    }
}
