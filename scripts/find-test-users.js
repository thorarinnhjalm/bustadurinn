import admin from 'firebase-admin';
import { readFileSync } from 'fs';

async function findTestUsers() {
    try {
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

        console.log('Fetching users from auth and firestore...\n');

        let testUsers = [];
        let pageToken;

        // Fetch all users from Auth
        do {
            const listUsersResult = await auth.listUsers(1000, pageToken);
            for (const userRecord of listUsersResult.users) {
                const email = userRecord.email?.toLowerCase() || '';
                const name = userRecord.displayName?.toLowerCase() || '';
                
                const isTest = 
                    email.includes('test') || 
                    email.includes('demo') || 
                    email.includes('prufa') || 
                    email.includes('example.com') ||
                    email.includes('sumarhus.is') || // maybe demo?
                    name.includes('test') ||
                    name.includes('prufa') ||
                    name.includes('demo');

                if (isTest && !email.includes('thorarinnhjalmarsson')) {
                    // Fetch firestore data
                    const doc = await db.collection('users').doc(userRecord.uid).get();
                    const data = doc.exists ? doc.data() : null;
                    
                    testUsers.push({
                        uid: userRecord.uid,
                        email: userRecord.email,
                        name: userRecord.displayName,
                        house_ids: data?.house_ids || [],
                        lastSignIn: userRecord.metadata.lastSignInTime,
                        creationTime: userRecord.metadata.creationTime
                    });
                }
            }
            pageToken = listUsersResult.pageToken;
        } while (pageToken);

        console.log(`Found ${testUsers.length} potential test accounts:\n`);
        
        testUsers.forEach(u => {
            console.log(`UID: ${u.uid}`);
            console.log(`Email: ${u.email}`);
            console.log(`Name: ${u.name}`);
            console.log(`Houses: ${u.house_ids.length}`);
            console.log(`Created: ${u.creationTime}`);
            console.log(`Last Sign In: ${u.lastSignIn}`);
            console.log('---');
        });

        console.log(`\nTotal test accounts found: ${testUsers.length}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

findTestUsers();
