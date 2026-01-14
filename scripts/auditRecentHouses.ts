
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config();

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require('../serviceAccountKey.json');

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkRecentHouses() {
    console.log('Fetching recent houses...');
    try {
        const collections = await db.listCollections();
        console.log('Collections in database:', collections.map(c => c.id).join(', '));

        const snapshot = await db.collection('houses')
            .limit(5)
            .get();

        if (snapshot.empty) {
            console.log('No houses found.');
            return;
        }

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log('------------------------------------------------');
            console.log(`ID: ${doc.id}`);
            console.log(`Name: ${data.name}`);
            console.log(`Address: ${data.address}`);
            console.log(`Location:`, data.location);
            let createdAtStr = 'undefined';
            // Check for snake_case field which is what Firestore uses
            const timestamp = data.created_at || data.createdAt;

            if (timestamp) {
                if (typeof timestamp.toDate === 'function') {
                    createdAtStr = timestamp.toDate().toISOString();
                } else {
                    createdAtStr = JSON.stringify(timestamp);
                }
            }
            console.log(`Created At:`, createdAtStr);
        });

    } catch (error) {
        console.error('Error fetching houses:', error);
    }
}

checkRecentHouses();
