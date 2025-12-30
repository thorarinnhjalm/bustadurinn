/**
 * Seed Email Templates using Firebase Admin SDK
 * Run with: node scripts/seedEmailTemplatesAdmin.js
 * 
 * This uses Admin SDK which bypasses security rules
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
// Option 1: Use service account key (download from Firebase Console)
// const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// });

// Option 2: Use Application Default Credentials (simpler)
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'bustadurinn-is'
});

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
