const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

async function analyzeTestUsers() {
    try {
        console.log('Loading Firebase Admin...');
        const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
        
        if (!fs.existsSync(serviceAccountPath)) {
            console.error('ERROR: serviceAccountKey.json not found at', serviceAccountPath);
            process.exit(1);
        }

        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

        if (admin.apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }

        const auth = admin.auth();
        const db = admin.firestore();

        console.log('Fetching users...');

        let testUsers = [];
        let pageToken = undefined;

        const usersSnapshot = await db.collection('users').get();
        console.log(`Fetched ${usersSnapshot.size} user documents.`);

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const email = (userData.email || '').toLowerCase();
            const name = (userData.name || '').toLowerCase();
            const uid = userDoc.id;
            
            // Identify test accounts
            const isTest = 
                email.includes('test') || 
                email.includes('prufa') || 
                email.includes('demo') || 
                email.endsWith('@example.com') ||
                name.includes('test') ||
                name.includes('prufa') ||
                name.includes('demo');

            // Don't flag real admins
            const isRealAdmin = (email.includes('thorarinnhjalmarsson') || email.includes('bustadurinn.is')) && !email.includes('test-playwright');

            if (isTest && !isRealAdmin) {
                const houseIds = userData.house_ids || [];
                let isOnlyManagerFor = [];
                
                // Check if they are the manager (sole owner) of these houses
                for (const houseId of houseIds) {
                    const houseDoc = await db.collection('houses').doc(houseId).get();
                    if (houseDoc.exists) {
                        const houseData = houseDoc.data();
                        if (houseData.manager_id === uid) {
                            isOnlyManagerFor.push({
                                id: houseId,
                                name: houseData.name
                            });
                        }
                    }
                }

                testUsers.push({
                    uid: uid,
                    email: userData.email,
                    name: userData.name || 'No Name',
                    created: userData.created_at ? userData.created_at.toDate() : 'Unknown',
                    houses_managed: isOnlyManagerFor
                });
            }
        }

        console.log('\n--- EYÐING Á PRUFUAÐGÖNGUM ---');
        console.log(`Fjöldi prufuaðganga fundnir: ${testUsers.length}\n`);

        for (const u of testUsers) {
            console.log(`Eyði notanda: [${u.uid}] ${u.name} (${u.email})`);
            
            // Delete houses
            for (const h of u.houses_managed) {
                await db.collection('houses').doc(h.id).delete();
                console.log(`   - Eyddi húsi: ${h.name} (${h.id})`);
            }
            
            // Delete user doc
            await db.collection('users').doc(u.uid).delete();
            console.log(`   - Eyddi Firestore user doc`);
            
            // Delete auth user
            try {
                await auth.deleteUser(u.uid);
                console.log(`   - Eyddi úr Firebase Auth`);
            } catch(e) {
                console.log(`   - Gat ekki eytt úr Auth (kannski þegar farinn): ${e.message}`);
            }
        }

        console.log(`\nSamtals: ${testUsers.length} aðgöngum eytt.`);
        process.exit(0);

    } catch (error) {
        console.error('Error analyzing test users:', error);
        process.exit(1);
    }
}

analyzeTestUsers();
