/**
 * RBAC Migration Script
 * Migrates existing admin emails and house roles to user_roles collection
 * 
 * Run with: node --loader ts-node/esm scripts/migrate-to-rbac.ts
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.VITE_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const db = admin.firestore();

// Hardcoded admin emails to migrate
const ADMIN_EMAILS = [
    'thorarinn@gmail.com',
    'thorarinn.hjalmarsson@gmail.com',
    'hello@thorarinn.com',
    'thth@visir.is',
];

async function migrateToRBAC() {
    console.log('🚀 Starting RBAC migration...\n');

    try {
        // Step 1: Migrate super admins
        console.log('📧 Migrating super admins...');
        const usersSnapshot = await db.collection('users').get();
        let adminCount = 0;

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const email = userData.email;

            if (email && ADMIN_EMAILS.includes(email)) {
                await db.collection('user_roles').doc(userDoc.id).set({
                    user_id: userDoc.id,
                    email: email,
                    system_role: 'super_admin',
                    house_roles: {},
                    created_at: admin.firestore.FieldValue.serverTimestamp(),
                    updated_at: admin.firestore.FieldValue.serverTimestamp(),
                });
                console.log(`  ✅ Migrated super admin: ${email}`);
                adminCount++;
            }
        }
        console.log(`  Total super admins migrated: ${adminCount}\n`);

        // Step 2: Migrate house roles
        console.log('🏠 Migrating house roles...');
        const housesSnapshot = await db.collection('houses').get();
        let ownerCount = 0;
        let memberCount = 0;

        for (const houseDoc of housesSnapshot.docs) {
            const houseData = houseDoc.data();
            const houseId = houseDoc.id;
            const managerId = houseData.manager_id;
            const ownerIds = houseData.owner_ids || [];

            // Migrate house manager (owner role)
            if (managerId) {
                const roleDocRef = db.collection('user_roles').doc(managerId);
                const roleDoc = await roleDocRef.get();

                if (roleDoc.exists()) {
                    await roleDocRef.update({
                        [`house_roles.${houseId}`]: {
                            role: 'owner',
                            granted_at: admin.firestore.FieldValue.serverTimestamp(),
                            granted_by: 'system', // Migration script
                        },
                        updated_at: admin.firestore.FieldValue.serverTimestamp(),
                    });
                } else {
                    await roleDocRef.set({
                        user_id: managerId,
                        email: '', // Will be populated from users collection if needed
                        system_role: 'regular_user',
                        house_roles: {
                            [houseId]: {
                                role: 'owner',
                                granted_at: admin.firestore.FieldValue.serverTimestamp(),
                                granted_by: 'system',
                            },
                        },
                        created_at: admin.firestore.FieldValue.serverTimestamp(),
                        updated_at: admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
                ownerCount++;
            }

            // Migrate house members (member role)
            for (const ownerId of ownerIds) {
                if (ownerId === managerId) continue; // Skip manager (already added as owner)

                const roleDocRef = db.collection('user_roles').doc(ownerId);
                const roleDoc = await roleDocRef.get();

                if (roleDoc.exists()) {
                    await roleDocRef.update({
                        [`house_roles.${houseId}`]: {
                            role: 'member',
                            granted_at: admin.firestore.FieldValue.serverTimestamp(),
                            granted_by: managerId || 'system',
                        },
                        updated_at: admin.firestore.FieldValue.serverTimestamp(),
                    });
                } else {
                    await roleDocRef.set({
                        user_id: ownerId,
                        email: '',
                        system_role: 'regular_user',
                        house_roles: {
                            [houseId]: {
                                role: 'member',
                                granted_at: admin.firestore.FieldValue.serverTimestamp(),
                                granted_by: managerId || 'system',
                            },
                        },
                        created_at: admin.firestore.FieldValue.serverTimestamp(),
                        updated_at: admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
                memberCount++;
            }
        }

        console.log(`  Total owners migrated: ${ownerCount}`);
        console.log(`  Total members migrated: ${memberCount}\n`);

        // Step 3: Verification
        console.log('✅ Verifying migration...');
        const rolesSnapshot = await db.collection('user_roles').get();
        console.log(`  Total user_roles documents: ${rolesSnapshot.size}`);

        const superAdmins = rolesSnapshot.docs.filter(
            (doc) => doc.data().system_role === 'super_admin'
        ).length;
        console.log(`  Super admins: ${superAdmins}`);

        console.log('\n🎉 Migration complete!');
        console.log('\n⚠️  IMPORTANT: Update Firestore security rules to use user_roles');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run migration
migrateToRBAC()
    .then(() => {
        console.log('\n✨ All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Error:', error);
        process.exit(1);
    });
