import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require('../serviceAccountKey.json');

dotenv.config();

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function repairUserProfile() {
    const uid = 'NcPkDMruQ1fSqddnI4PImD1o3N43'; // Based on previous script output
    console.log(`Repairing profile for UID: ${uid}`);

    const userRef = db.collection('users').doc(uid);

    // Set created_at to a date in the past (e.g., Jan 1, 2024) to stop it showing as "new"
    const pastDate = new Date('2024-01-01T00:00:00Z');

    await userRef.update({
        created_at: pastDate,
        repaired_by_script: true
    });

    console.log(`✅ Updated created_at to ${pastDate.toISOString()}`);
}

repairUserProfile();
