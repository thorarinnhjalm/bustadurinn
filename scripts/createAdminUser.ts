/**
 * Create Admin User
 * Run this script once to create the admin user for testing the super-admin dashboard
 */

import { auth, db } from '../src/lib/firebase.ts';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const ADMIN_EMAIL = 'thorarinnhjalmarsson@gmail.com';
const ADMIN_PASSWORD = 'Admin123!!';  // Change after first login
const ADMIN_NAME = 'Thorarinn (Admin)';

async function createAdminUser() {
    console.log('Creating admin user...');

    try {
        // Create auth user
        const userCred = await createUserWithEmailAndPassword(
            auth,
            ADMIN_EMAIL,
            ADMIN_PASSWORD
        );

        console.log(`✅ Created admin auth user: ${ADMIN_EMAIL}`);

        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCred.user.uid), {
            uid: userCred.user.uid,
            email: ADMIN_EMAIL,
            name: ADMIN_NAME,
            house_ids: [],
            created_at: serverTimestamp()
        });

        console.log(`✅ Created admin user document in Firestore`);
        console.log(`\n🎉 Admin user created successfully!`);
        console.log(`\n📧 Login Credentials:`);
        console.log(`   Email: ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);
        console.log(`\nYou can now access /super-admin with these credentials.`);

        process.exit(0);
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            console.log(`ℹ️  Admin user already exists: ${ADMIN_EMAIL}`);
            console.log(`   If you forgot the password, reset it via Firebase Console.`);
            process.exit(0);
        } else {
            console.error('❌ Error creating admin user:', error);
            process.exit(1);
        }
    }
}

createAdminUser();
