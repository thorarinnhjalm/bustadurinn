/**
 * Seed Email Templates into Firestore
 * Run with: npm run seed-email-templates
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase config from environment
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const templates = [
    {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Velkomin í Bústaðurinn.is! 🏡',
        html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1a1a1a; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { background: #1a1a1a; color: #fdfcf8; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-family: 'Fraunces', serif; font-size: 28px; }
        .content { background: white; padding: 40px; border: 1px solid #e8e4df; border-top: none; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #e8b058; color: #1a1a1a; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #8a8580; font-size: 14px; }
        .feature { margin: 20px 0; padding: 16px; background: #fdfcf8; border-left: 3px solid #e8b058; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Velkomin í Bústaðurinn.is</h1>
        </div>
        <div class="content">
            <p>Hæ {name},</p>
            
            <p>Takk fyrir að skrá þig! Við erum spennt að fá þig um borð í Bústaðurinn.is.</p>
            
            <p><strong>Næstu skref:</strong></p>
            
            <div class="feature">
                <strong>📅 Bókaðu fyrstu dvölina</strong><br>
                Farðu á kalendar og veldu dagsetningar fyrir næstu helgi.
            </div>
            
            <div class="feature">
                <strong>✅ Bættu við verkefnum</strong><br>
                Haldið kerfisbundið utan um viðhald og verkefni.
            </div>
            
            <div class="feature">
                <strong>💰 Skráðu útgjöld</strong><br>
                Haltu utan um kostnað og deildu fjármagni sanngjarnt.
            </div>
            
            <p style="margin-top: 30px;">Þú hefur <strong>30 daga ókeypis prufutíma</strong> til að prófa öll eiginleikar kerfisins.</p>
            
            <a href="https://bustadurinn.is/dashboard" class="button">Fara á stjórnborð</a>
            
            <p style="margin-top: 40px; font-size: 14px; color: #4a4642;">
                Ef þú hefur spurningar, ekki hika við að hafa samband við okkur á 
                <a href="mailto:hjalp@bustadurinn.is" style="color: #e8b058;">hjalp@bustadurinn.is</a>
            </p>
        </div>
        <div class="footer">
            <p>© 2025 Bústaðurinn.is - Neðri Hóll Hugmyndahús ehf.</p>
            <p>Þetta tölvupóstfang er ekki vaktað - svaraðu ekki beint.</p>
        </div>
    </div>
</body>
</html>
        `,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        id: 'invite',
        name: 'Co-owner Invitation',
        subject: 'Þér hefur verið boðið í {houseName}',
        html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1a1a1a; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { background: #1a1a1a; color: #fdfcf8; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-family: 'Fraunces', serif; font-size: 28px; }
        .content { background: white; padding: 40px; border: 1px solid #e8e4df; border-top: none; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #e8b058; color: #1a1a1a; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #8a8580; font-size: 14px; }
        .house-info { background: #fdfcf8; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e8e4df; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Boð frá {senderName}</h1>
        </div>
        <div class="content">
            <p>Hæ,</p>
            
            <p><strong>{senderName}</strong> hefur boðið þér að gerast meðeigandi í sumarhúsinu.</p>
            
            <div class="house-info">
                <h2 style="margin-top: 0; font-family: 'Fraunces', serif; color: #1a1a1a;">{houseName}</h2>
                <p style="margin: 0; color: #4a4642;">Smelltu á hlekkinn hér að neðan til að samþykkja boðið.</p>
            </div>
            
            <p><strong>Sem meðeigandi getur þú:</strong></p>
            <ul>
                <li>Bókað helgar og dvalir</li>
                <li>Skráð útgjöld og séð fjármál</li>
                <li>Bætt við verkefnum og listum</li>
                <li>Séð allar upplýsingar um húsið</li>
            </ul>
            
            <a href="{inviteLink}" class="button">Samþykkja boð</a>
            
            <p style="margin-top: 40px; font-size: 14px; color: #8a8580;">
                Ef þú fékkst þetta tölvupóst fyrir mistök, geturðu hunsað það.
            </p>
        </div>
        <div class="footer">
            <p>© 2025 Bústaðurinn.is - Neðri Hóll Hugmyndahús ehf.</p>
        </div>
    </div>
</body>
</html>
        `,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        id: 'trial_ending',
        name: 'Trial Ending Reminder',
        subject: 'Prufutíminn þinn rennur út eftir 7 daga',
        html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1a1a1a; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { background: #e8b058; color: #1a1a1a; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-family: 'Fraunces', serif; font-size: 28px; }
        .content { background: white; padding: 40px; border: 1px solid #e8e4df; border-top: none; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #1a1a1a; color: #fdfcf8; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #8a8580; font-size: 14px; }
        .pricing { background: #fdfcf8; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }
        .price { font-size: 32px; font-weight: bold; color: #1a1a1a; font-family: 'Fraunces', serif; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Prufutíminn þinn rennur út</h1>
        </div>
        <div class="content">
            <p>Hæ {name},</p>
            
            <p>30 daga prufutíminn þinn í Bústaðurinn.is rennur út <strong>{expiryDate}</strong>.</p>
            
            <p>Við vonum að þú hafir notið þess að nota kerfið til að halda utan um sumarhúsið.</p>
            
            <div class="pricing">
                <p style="margin-top: 0; color: #4a4642;">Haltu áfram með:</p>
                <div class="price">9.900 kr / ári</div>
                <p style="color: #8a8580; font-size: 14px; margin-bottom: 0;">Jafngildir 825 kr á mánuði</p>
            </div>
            
            <a href="https://bustadurinn.is/dashboard" class="button">Velja áskrift</a>
            
            <p style="margin-top: 30px; font-size: 14px; color: #4a4642;">
                <strong>Engar skuldbindingar.</strong> Segðu upp hvenær sem er.
            </p>
        </div>
        <div class="footer">
            <p>© 2025 Bústaðurinn.is - Neðri Hóll Hugmyndahús ehf.</p>
        </div>
    </div>
</body>
</html>
        `,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
    }
];

async function seedTemplates() {
    console.log('🌱 Seeding email templates...');

    try {
        for (const template of templates) {
            await setDoc(doc(db, 'email_templates', template.id), template);
            console.log(`✅ Created template: ${template.name}`);
        }

        console.log('✨ All email templates seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding templates:', error);
        process.exit(1);
    }
}

seedTemplates();
