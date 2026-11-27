import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require('../serviceAccountKey.json');

dotenv.config();

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkUserProfile() {
    const email = 'thorarinnhj@icloud.com';
    console.log(`Checking profile for: ${email}`);

    // 1. Search by email to find UID
    const usersSnap = await db.collection('users').where('email', '==', email).get();

    if (usersSnap.empty) {
        console.log('No user found with this email in Firestore.');
    } else {
        usersSnap.forEach(doc => {
            console.log('------------------------------------------------');
            console.log(`UID: ${doc.id}`);
            const data = doc.data();
            console.log('Data:', JSON.stringify(data, null, 2));

            // Explicitly check timestamp
            const createdAt = data.created_at || data.createdAt;
            let createdAtStr = 'undefined';
            if (createdAt) {
                if (typeof createdAt.toDate === 'function') {
                    createdAtStr = createdAt.toDate().toISOString();
                } else {
                    createdAtStr = JSON.stringify(createdAt);
                }
            }
            console.log(`Created At Readable: ${createdAtStr}`);
        });
    }
}

checkUserProfile();
