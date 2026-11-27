
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load service account
// Assuming running from root, so file is at ./serviceAccountKey.json
const serviceAccountPath = join(__dirname, '../serviceAccountKey.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

async function analyzeFailures() {
    console.log('🔍 Starting Analysis of Failed Signups...');

    try {
        // 1. Fetch all Auth Users
        const authUsers = [];
        let nextPageToken;
        do {
            const result = await auth.listUsers(1000, nextPageToken);
            authUsers.push(...result.users);
            nextPageToken = result.pageToken;
        } while (nextPageToken);

        console.log(`✅ Found ${authUsers.length} total users in Authentication.`);

        // 2. Fetch all Firestore Users
        const usersSnap = await db.collection('users').get();
        const firestoreUsers = new Map();
        usersSnap.forEach(doc => {
            firestoreUsers.set(doc.id, doc.data());
        });
        console.log(`✅ Found ${firestoreUsers.size} user profiles in Firestore.`);

        // 3. Analysis
        const orphans = [];
        const stuckUsers = [];
        const completedUsers = [];

        for (const authUser of authUsers) {
            if (!firestoreUsers.has(authUser.uid)) {
                orphans.push({
                    uid: authUser.uid,
                    email: authUser.email,
                    created: authUser.metadata.creationTime,
                    lastSignIn: authUser.metadata.lastSignInTime
                });
            } else {
                const data = firestoreUsers.get(authUser.uid);
                // Check for stuck users (no houses)
                if (!data.house_ids || data.house_ids.length === 0) {
                    stuckUsers.push({
                        uid: authUser.uid,
                        email: authUser.email,
                        name: data.name || 'Unknown',
                        created: authUser.metadata.creationTime
                    });
                } else {
                    completedUsers.push(authUser.uid);
                }
            }
        }

        // 4. Report
        console.log('\n--- 📊 SUMMARY ---');
        console.log(`Total Signups (Auth): ${authUsers.length}`);
        console.log(`Completed Onboarding: ${completedUsers.length} (${((completedUsers.length / authUsers.length) * 100).toFixed(1)}%)`);
        console.log(`Failed/Stuck:         ${orphans.length + stuckUsers.length} (${(((orphans.length + stuckUsers.length) / authUsers.length) * 100).toFixed(1)}%)`);

        console.log('\n--- 🚨 FAILED STEP 1 (Orphan Users) ---');
        console.log('Users who created an account but have NO profile in database (failed synchronization):');
        if (orphans.length === 0) console.log('None! 🎉');
        orphans.forEach(u => console.log(`- ${u.email} (Created: ${u.created}, Last Seen: ${u.lastSignIn})`));

        console.log('\n--- ⚠️ FAILED STEP 2 (Stuck in Onboarding) ---');
        console.log('Users who have a profile but NO house (failed house creation/joining):');
        if (stuckUsers.length === 0) console.log('None! 🎉');
        stuckUsers.forEach(u => console.log(`- ${u.email} (Created: ${u.created})`));

    } catch (error) {
        console.error('❌ Error during analysis:', error);
    }
}

analyzeFailures();
