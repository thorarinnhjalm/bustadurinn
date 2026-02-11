
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const auth = admin.auth();

async function findUserAndHouses() {
    const email = 'thorarinnhjalmarsson@gmail.com';
    console.log(`Searching for user with email: ${email}`);

    try {
        const userRecord = await auth.getUserByEmail(email);
        const uid = userRecord.uid;
        console.log(`Found user! UID: ${uid}`);
        console.log(`User Name: ${userRecord.displayName}`);

        // Check user document in Firestore
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            console.log('User Document Data:', JSON.stringify(userData, null, 2));

            if (userData.house_ids && userData.house_ids.length > 0) {
                console.log(`User has ${userData.house_ids.length} house IDs listed in profile.`);
                for (const houseId of userData.house_ids) {
                    const houseDoc = await db.collection('houses').doc(houseId).get();
                    if (houseDoc.exists) {
                        console.log(`✅ House found: ${houseId} - ${houseDoc.data().name}`);
                    } else {
                        console.log(`❌ House ID in profile but NOT found in houses collection: ${houseId}`);
                    }
                }
            } else {
                console.log('User has NO house IDs in profile.');
            }
        } else {
            console.log('User document not found in Firestore!');
        }

        // Search in houses collection by owner_id field (just in case)
        console.log('Searching houses collection where owner_ids contains UID...');
        const housesSnapshot = await db.collection('houses').where('owner_ids', 'array-contains', uid).get();

        if (housesSnapshot.empty) {
            console.log('No houses found with this user as owner in houses collection.');
        } else {
            console.log(`Found ${housesSnapshot.size} houses via owner_ids query:`);
            housesSnapshot.forEach(doc => {
                console.log(`- ${doc.id}: ${doc.data().name}`);
                if (doc.id === 'Valo0aHTRx5RaC6YbNwH') {
                    console.log('FULL DATA FOR Valo0aHTRx5RaC6YbNwH:');
                    console.log(JSON.stringify(doc.data(), null, 2));
                }
            });
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

findUserAndHouses();
