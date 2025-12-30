/**
 * Seed Email Templates using Firebase Admin SDK
 * 
 * SETUP (ONE TIME):
 * 1. Download service account key:
 *    - Go to https://console.firebase.google.com/project/bustadurinn-is/settings/serviceaccounts/adminsdk
 *    - Click "Generate new private key"
 *    - Save as serviceAccountKey.json in project root
 * 
 * 2. Run: npm run seed-email-templates
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin with service account
try {
    const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (error) {
    console.error('❌ Could not load serviceAccountKey.json');
    console.error('');
    console.error('Please download it from:');
    console.error('https://console.firebase.google.com/project/bustadurinn-is/settings/serviceaccounts/adminsdk');
    console.error('');
    console.error('Click "Generate new private key" and save as serviceAccountKey.json in project root');
    process.exit(1);
}

const db = admin.firestore();

// Read HTML templates
const welcomeHtml = readFileSync(join(__dirname, 'email-templates/welcome.html'), 'utf8');
const inviteHtml = readFileSync(join(__dirname, 'email-templates/invite.html'), 'utf8');
const trialEndingHtml = readFileSync(join(__dirname, 'email-templates/trial_ending.html'), 'utf8');

const templates = [
    {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Velkomin í Bústaðurinn.is! 🏡',
        html_content: welcomeHtml,
        active: true,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        id: 'invite',
        name: 'Co-owner Invitation',
        subject: 'Þér hefur verið boðið í {houseName}',
        html_content: inviteHtml,
        active: true,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
    },
    {
        id: 'trial_ending',
        name: 'Trial Ending Reminder',
        subject: 'Prufutíminn þinn rennur út eftir 7 daga',
        html_content: trialEndingHtml,
        active: true,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
    }
];

async function seedTemplates() {
    console.log('🌱 Seeding email templates with Admin SDK...');

    try {
        for (const template of templates) {
            const { id, ...data } = template;
            await db.collection('email_templates').doc(id).set(data);
            console.log(`✅ Created template: ${data.name}`);
        }

        console.log('✨ All email templates seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding templates:', error);
        process.exit(1);
    }
}

seedTemplates();
