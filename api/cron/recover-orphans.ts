import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeFirebaseAdmin, admin, db } from '../utils/firebaseAdmin.js';

// Initialize Firebase Admin
initializeFirebaseAdmin();

function replaceVariables(content: string, variables: Record<string, string>): string {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        result = result.replace(regex, value);
    }
    return result;
}

// Fallback template in case Firestore template is missing
const FALLBACK_SUBJECT = 'Kláraðu uppsetninguna á Bústaðurinn.is 🏡';
const FALLBACK_HTML = `<!DOCTYPE html>
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
            <p class="greeting">Hæ {name},</p>
            <p>Við tókum eftir því að þú byrjaðir að skrá þig en kláraðir ekki að stofna húsið þitt.</p>
            <p>Engar áhyggjur, aðgangurinn þinn er tilbúinn. Þú þarft bara að skrá inn upplýsingar um bústaðinn til að byrja.</p>
            <a href="https://bustadurinn.is/onboarding" class="button">Klára uppsetningu</a>
            <p style="margin-top: 20px; font-size: 14px; color: #666;">Ef þú lendir í vandræðum, svaraðu þessum pósti og við hjálpum þér.</p>
        </div>
        <div class="footer"><p><strong>Bústaðurinn.is</strong></p></div>
    </div>
</body>
</html>`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Validate Cron Secret
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

        // 2. Load finish_setup email template from Firestore
        const templateDoc = await db.collection('email_templates').doc('finish_setup').get();
        let subjectTemplate = FALLBACK_SUBJECT;
        let htmlTemplate = FALLBACK_HTML;

        if (templateDoc.exists) {
            const templateData = templateDoc.data();
            if (templateData?.active === false) {
                console.log('⚠️ finish_setup template is inactive, skipping');
                return res.status(200).json({ success: true, message: 'Template inactive', processed: 0 });
            }
            if (templateData?.subject) subjectTemplate = templateData.subject;
            if (templateData?.html_content) htmlTemplate = templateData.html_content;
            console.log('📧 Using finish_setup template from Firestore');
        } else {
            console.log('⚠️ finish_setup template not in Firestore, using fallback');
        }

        // 3. Query users without houses created between 24h and 72h ago
        const now = new Date();
        const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);    // 24 hours ago
        const ancientCutoff = new Date(now.getTime() - 72 * 60 * 60 * 1000); // 72 hours ago

        console.log(`🔍 Searching for orphans created between ${ancientCutoff.toISOString()} and ${cutoff.toISOString()}`);

        const snapshot = await db.collection('users')
            .where('created_at', '<=', admin.firestore.Timestamp.fromDate(cutoff))
            .where('created_at', '>=', admin.firestore.Timestamp.fromDate(ancientCutoff))
            .get();

        const orphans: any[] = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            if (data.house_ids && data.house_ids.length > 0) continue;
            if (data.recovery_email_sent) continue;
            if (!data.email) continue;
            orphans.push({ id: doc.id, ...data });
        }

        console.log(`Found ${orphans.length} users without a house.`);

        // 4. Send emails (max 20 per run to avoid timeouts)
        const toProcess = orphans.slice(0, 20);
        let sentCount = 0;

        for (const user of toProcess) {
            try {
                const name = user.name || user.email.split('@')[0];
                const variables = { name };

                const subject = replaceVariables(subjectTemplate, variables);
                const html = replaceVariables(htmlTemplate, variables);

                const { error } = await resend.emails.send({
                    from: 'Bústaðurinn <hallo@bustadurinn.is>',
                    to: user.email,
                    subject,
                    html,
                });

                if (error) {
                    console.error(`Failed to send to ${user.email}:`, error);
                } else {
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
