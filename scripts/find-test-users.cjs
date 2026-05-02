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
            const isRealAdmin = email.includes('thorarinnhjalmarsson') || email.includes('bustadurinn.is');

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

        console.log('\n--- GREINING Á PRUFUAÐGÖNGUM ---');
        console.log(`Fjöldi prufuaðganga fundnir: ${testUsers.length}\n`);

        testUsers.forEach((u, i) => {
            console.log(`${i+1}. [${u.uid}] ${u.name} (${u.email})`);
            console.log(`   Stofnaður: ${u.created}`);
            if (u.houses_managed.length > 0) {
                console.log(`   🚨 Á ${u.houses_managed.length} hús sem verður eytt:`);
                u.houses_managed.forEach(h => console.log(`      - ${h.name} (${h.id})`));
            } else {
                console.log(`   ✓ Á engin hús.`);
            }
            console.log('');
        });

        console.log(`Samtals: ${testUsers.length} aðgangar sem verður eytt.`);
        process.exit(0);

    } catch (error) {
        console.error('Error analyzing test users:', error);
        process.exit(1);
    }
}

analyzeTestUsers();
