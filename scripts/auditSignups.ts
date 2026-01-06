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
const auth = admin.auth();

async function auditSignups() {
    console.log('🔍 Auditing recent signups...');

    try {
        // 1. Get recent users from Auth
        const listUsersResult = await auth.listUsers(20); // Get last 20 users
        const users = listUsersResult.users.sort((a, b) =>
            new Date(b.metadata.creationTime).getTime() - new Date(a.metadata.creationTime).getTime()
        );

        console.log(`\nFound ${users.length} recent users in Auth:`);
        console.log('-------------------------------------------');

        for (const user of users) {
            const creationTime = new Date(user.metadata.creationTime);
            const creationTimeStr = creationTime.toLocaleString('is-IS');

            // Check Firestore
            const userDoc = await db.collection('users').doc(user.uid).get();
            const hasFirestoreProfile = userDoc.exists;
            const firestoreData = hasFirestoreProfile ? userDoc.data() : null;

            // Check House membership
            let houses = [];
            if (hasFirestoreProfile && firestoreData.house_ids && firestoreData.house_ids.length > 0) {
                // Check if they are actually in these houses
                houses = firestoreData.house_ids;
            }

            console.log(`User: ${user.email} (${user.displayName || 'No Name'})`);
            console.log(`  UID: ${user.uid}`);
            console.log(`  Created: ${creationTimeStr}`);
            console.log(`  Firestore Profile: ${hasFirestoreProfile ? '✅ Yes' : '❌ MISSING'}`);

            if (hasFirestoreProfile) {
                console.log(`  Houses: ${houses.length > 0 ? '✅ ' + houses.join(', ') : '⚠️ No houses'}`);

                // Check if profile creation time matches auth creation effectively
                if (firestoreData.created_at) {
                    // console.log(`  Firestore Created: ${firestoreData.created_at.toDate().toLocaleString('is-IS')}`);
                }
            } else {
                console.log(`  ⚠️ CRITICAL: User exists in Auth but not in Firestore! Signup flow might be broken.`);
            }
            console.log('-------------------------------------------');
        }

    } catch (error) {
        console.error('Error auditing signups:', error);
    }
}

auditSignups();
