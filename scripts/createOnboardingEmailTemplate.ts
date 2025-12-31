import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../serviceAccountKey.json'), 'utf8')
);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
}

const db = admin.firestore();

const onboardingEmailTemplate = {
    id: 'onboarding_complete',
    subject: 'Velkomin í Bústaðurinn.is! 🏡 - Komdu í gang',
    html_content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background-color: #f5f5f0;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .logo {
            font-size: 32px;
            margin-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }
        .feature-box {
            background: #f5f5f0;
            border-left: 4px solid #e8b058;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .feature-box h3 {
            margin: 0 0 10px 0;
            color: #1a1a1a;
            font-size: 16px;
        }
        .feature-box p {
            margin: 0;
            color: #666;
            font-size: 14px;
        }
        .cta-button {
            display: inline-block;
            background: #e8b058;
            color: white;
            padding: 14px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 10px 0;
            text-align: center;
        }
        .footer {
            background: #f5f5f0;
            padding: 30px;
            text-align: center;
            font-size: 13px;
            color: #666;
        }
        .divider {
            height: 1px;
            background: #e0e0e0;
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏡</div>
            <h1>Velkomin í Bústaðurinn!</h1>
        </div>
        
        <div class="content">
            <p class="greeting">Hæ {name}! 👋</p>
            
            <p>Til hamingju með að setja upp <strong>{house_name}</strong> í kerfinu okkar! Þú ert núna tilbúin/n að byrja að skipuleggja dvalir, halda utan um fjármál og verkefni.</p>
            
            <div class="divider"></div>
            
            <h2 style="color: #1a1a1a; margin-bottom: 20px;">Komdu í gang með þessum eiginleikum:</h2>
            
            <div class="feature-box">
                <h3>📅 Bókunardagatal</h3>
                <p>Skipuleggðu dvalir fyrir fjölskylduna. Kerfið passar upp á að engir rekist á og að allir fái sanngjarna deild á helgum.</p>
            </div>
            
            <div class="feature-box">
                <h3>💰 Fjármál</h3>
                <p>Haltu utan um útgjöld, búðu til áætlun og sjáðu hvernig hússjóðurinn stendur. Allir meðeigendur geta skráð útgjöld.</p>
            </div>
            
            <div class="feature-box">
                <h3>✅ Verkefni</h3>
                <p>Búðu til lista yfir viðhaldsverkefni. Úthlutaðu verkum til meðeigenda og fylgstu með framvindu.</p>
            </div>

            <div class="feature-box">
                <h3>👥 Gestir</h3>
                <p>Búðu til gesta-hlekk með WiFi kóðum og upplýsingum. Enginn þarf að hringja og spyrja!</p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
                <a href="https://bustadurinn.is/dashboard" class="cta-button">
                    Opna stjórnborð →
                </a>
            </div>
            
            <div class="divider"></div>
            
            <h3 style="color: #1a1a1a;">💡 Ábendingar:</h3>
            <ul style="color: #666; line-height: 1.8;">
                <li><strong>Bjóða við meðeigendum:</strong> Í stillingum geturðu búið til boðshlekk til að senda öðrum</li>
                <li><strong>Bóka fyrstu dvölina:</strong> Farðu á dagatalið og smelltu á dagatali til að búa til bókun</li>
                <li><strong>Setja upp fjárhagsáætlun:</strong> Útbúðu rekstraráætlun svo allir sjái hversu miklu þarf að safna</li>
                <li><strong>Á símanum?</strong> Bættu bústaðurinn við heimaskjáinn fyrir skjótari aðgang</li>
            </ul>
            
            <div class="divider"></div>
            
            <p style="color: #666; font-size: 14px;">
                <strong>Spurningar?</strong><br>
                Svarum fúslega - sendu póst á <a href="mailto:hjalp@bustadurinn.is" style="color: #e8b058;">hjalp@bustadurinn.is</a>
            </p>
        </div>
        
        <div class="footer">
            <p><strong>Bústaðurinn.is</strong> - Sumarhúsastjórnun án vesens</p>
            <p style="margin-top: 10px;">
                <a href="https://bustadurinn.is" style="color: #e8b058; text-decoration: none;">bustadurinn.is</a>
            </p>
        </div>
    </div>
</body>
</html>`,
    active: true,
    variables: ['name', 'house_name'],
    description: 'Sent after user completes onboarding with their first house',
};

async function createOnboardingEmailTemplate() {
    try {
        console.log('Creating onboarding email template...');

        await db.collection('email_templates').doc('onboarding_complete').set({
            ...onboardingEmailTemplate,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log('✅ Successfully created onboarding_complete email template');
        console.log('Template ID:', onboardingEmailTemplate.id);
        console.log('Subject:', onboardingEmailTemplate.subject);
        console.log('Variables:', onboardingEmailTemplate.variables);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating template:', error);
        process.exit(1);
    }
}

createOnboardingEmailTemplate();
