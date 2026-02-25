
import admin from 'firebase-admin';
import { Resend } from 'resend';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// 1. Setup paths and env
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY missing in .env.local");
    process.exit(1);
}

// 2. Initialize Firebase Admin
const serviceAccount = JSON.parse(
    await readFile(join(__dirname, '../serviceAccountKey.json'), 'utf-8')
);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const auth = admin.auth();
const resend = new Resend(process.env.RESEND_API_KEY);

// 3. Email Template (Copied from api/send-email.ts to be safe/stand-alone)
const FINISH_SETUP_TEMPLATE = (name) => `
<!DOCTYPE html>
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
        .button { display: inline-block; background: #e8b058; color: white !important; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; text-align: center; width: 100%; box-sizing: border-box; }
        .footer { background: #f5f5f0; padding: 30px; text-align: center; font-size: 13px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><div class="logo">🏡</div><h1>Eitt skref í viðbót...</h1></div>
        <div class="content">
            <p class="greeting">Hæ ${name},</p>
            <p>Við tókum eftir því að þú byrjaðir að skrá þig en kláraðir ekki að stofna húsið þitt.</p>
            <p>Engar áhyggjur, aðgangurinn þinn er tilbúinn. Þú þarft bara að skrá inn upplýsingar um bústaðinn til að byrja.</p>
            <a href="https://bustadurinn.is/onboarding" class="button">Klára uppsetningu</a>
            <p style="margin-top: 20px; font-size: 14px; color: #666;">Ef þú lendir í vandræðum, svaraðu þessum pósti og við hjálpum þér.</p>
        </div>
        <div class="footer"><p><strong>Bústaðurinn.is</strong></p></div>
    </div>
</body>
</html>
`;

async function recoverOrphans() {
    console.log('🚀 Starting Orphaned User Recovery...');

    try {
        // 1. Fetch all Auth Users
        const authUsers = [];
        let nextPageToken;
        do {
            const result = await auth.listUsers(1000, nextPageToken);
            authUsers.push(...result.users);
            nextPageToken = result.pageToken;
        } while (nextPageToken);

        console.log(`✅ Found ${authUsers.length} users in Auth.`);

        // 2. Fetch all Firestore Users
        const usersSnap = await db.collection('users').get();
        const firestoreUids = new Set();
        usersSnap.forEach(doc => firestoreUids.add(doc.id));

        // 3. Identify and Fix
        let recoveredCount = 0;
        let emailCount = 0;

        for (const authUser of authUsers) {
            if (!firestoreUids.has(authUser.uid)) {
                console.log(`🔧 Recovering user: ${authUser.email} (${authUser.uid})`);

                const firstName = authUser.displayName ? authUser.displayName.split(' ')[0] : (authUser.email ? authUser.email.split('@')[0] : 'þarna');

                // Create Firestore Profile
                await db.collection('users').doc(authUser.uid).set({
                    uid: authUser.uid,
                    email: authUser.email || '',
                    name: authUser.displayName || '',
                    house_ids: [],
                    trial_ends_at: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
                    created_at: admin.firestore.FieldValue.serverTimestamp(),
                    last_login: admin.firestore.FieldValue.serverTimestamp(),
                    recovered: true // Mark for internal reference
                });

                recoveredCount++;

                // Send Recovery Email
                if (authUser.email) {
                    try {
                        const { data, error } = await resend.emails.send({
                            from: 'Bústaðurinn <hallo@bustadurinn.is>',
                            to: [authUser.email],
                            subject: 'Kláraðu uppsetningu á Bústaðurinn.is 🏡',
                            html: FINISH_SETUP_TEMPLATE(firstName),
                        });

                        if (error) {
                            console.error(`❌ Failed to send email to ${authUser.email}:`, error);
                        } else {
                            console.log(`📧 Email sent to ${authUser.email}. ID: ${data.id}`);
                            emailCount++;
                        }
                    } catch (emailErr) {
                        console.error(`❌ Email error for ${authUser.email}:`, emailErr);
                    }
                }
            }
        }

        console.log('\n--- 🎉 RECOVERY COMPLETE ---');
        console.log(`Total Auth Users:   ${authUsers.length}`);
        console.log(`Profiles Created:   ${recoveredCount}`);
        console.log(`Emails Sent:        ${emailCount}`);

    } catch (error) {
        console.error('❌ STATA ERROR:', error);
    }
}

recoverOrphans();
