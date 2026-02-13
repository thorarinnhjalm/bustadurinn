/**
 * Grant Super Admin Role to User
 * Usage: npx tsx scripts/grantSuperAdmin.ts
 */

import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin using environment variables
const serviceAccount: ServiceAccount = {
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function grantSuperAdmin(userId: string) {
    try {
        console.log(`Granting super_admin role to user: ${userId}`);

        await db.collection('user_roles').doc(userId).set({
            system_role: 'super_admin',
            house_roles: {},
            created_at: new Date(),
            updated_at: new Date()
        }, { merge: true });

        console.log('✅ Successfully granted super_admin role!');
        console.log('The user can now access /super-admin and /admin/migrate');
    } catch (error) {
        console.error('❌ Error granting super_admin role:', error);
        process.exit(1);
    }
}

// Your UID
const YOUR_UID = 'sxcToczAAwT3Fmh8FPXa1P6hMHB3';

grantSuperAdmin(YOUR_UID)
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
