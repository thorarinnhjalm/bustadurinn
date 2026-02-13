import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// List of admin emails from current codebase
const ADMIN_EMAILS = [
    'thorarinnhjalmarsson@gmail.com',
    'thorarinnhjalm@gmail.com'
];

async function migrateAdminRoles() {
    try {
        // Initialize Firebase Admin (reuse existing serviceAccountKey)
        const serviceAccount = JSON.parse(
            readFileSync('./serviceAccountKey.json', 'utf8')
        );

        if (admin.apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }

        const auth = admin.auth();
        const db = admin.firestore();

        console.log('🚀 Starting RBAC Admin Migration...\n');

        for (const email of ADMIN_EMAILS) {
            try {
                // Get user by email
                const userRecord = await auth.getUserByEmail(email);
                const uid = userRecord.uid;

                console.log(`📧 Found user: ${email}`);
                console.log(`   UID: ${uid}`);

                // Check if role already exists
                const roleDoc = await db.collection('user_roles').doc(uid).get();

                if (roleDoc.exists) {
                    console.log(`   ⚠️  Role already exists:`, roleDoc.data());
                } else {
                    // Create super_admin role
                    await db.collection('user_roles').doc(uid).set({
                        system_role: 'super_admin',
                        created_at: admin.firestore.FieldValue.serverTimestamp(),
                        updated_at: admin.firestore.FieldValue.serverTimestamp()
                    });
                    console.log(`   ✅ Created super_admin role`);
                }

                console.log('');
            } catch (error) {
                console.error(`   ❌ Error processing ${email}:`, error.message);
                console.log('');
            }
        }

        // Verify all roles created
        console.log('🔍 Verification:');
        const rolesSnapshot = await db.collection('user_roles')
            .where('system_role', '==', 'super_admin')
            .get();

        console.log(`   Found ${rolesSnapshot.size} super_admin role(s)`);
        rolesSnapshot.forEach(doc => {
            console.log(`   - ${doc.id}: ${doc.data().system_role}`);
        });

        console.log('\n✨ Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    }
}

migrateAdminRoles();
