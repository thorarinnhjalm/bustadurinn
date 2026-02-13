
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkDeletedHouseData() {
    const houseId = 'lnnZcTI9OYcl3giFL4QS';
    console.log(`Checking for leftover data for deleted house ID: ${houseId}`);

    const subcollections = [
        'bookings',
        'tasks',
        'shopping_list',
        'internal_logs',
        'finance_entries',
        'guestbook' // listed in DashboardPage.tsx
    ];

    let foundData = false;

    for (const subcol of subcollections) {
        const snapshot = await db.collection('houses').doc(houseId).collection(subcol).limit(5).get();
        if (!snapshot.empty) {
            console.log(`✅ Found ${snapshot.size} documents in subcollection: '${subcol}'`);
            foundData = true;

            // Try to find clues about the house name
            if (subcol === 'internal_logs') {
                snapshot.forEach(doc => {
                    console.log(`   Log: ${doc.data().text} (${doc.data().created_at?.toDate()})`);
                });
            } else if (subcol === 'bookings') {
                snapshot.forEach(doc => {
                    console.log(`   Booking: ${doc.data().user_name} (${doc.data().start?.toDate()} - ${doc.data().end?.toDate()})`);
                });
            } else if (subcol === 'tasks') {
                snapshot.forEach(doc => {
                    console.log(`   Task: ${doc.data().title}`);
                });
            } else if (subcol === 'shopping_list') {
                snapshot.forEach(doc => {
                    console.log(`   Item: ${doc.data().item}`);
                });
            } else if (subcol === 'finance_entries') {
                snapshot.forEach(doc => {
                    console.log(`   Finance: ${doc.data().title || doc.data().description} (${doc.data().amount})`);
                });
            }
        } else {
            console.log(`❌ No documents in '${subcol}'`);
        }
    }

    // Also check invites collection if it exists
    console.log("Checking global invites collection...");
    const invitesSnapshot = await db.collection('invites').where('houseId', '==', houseId).get();
    if (!invitesSnapshot.empty) {
        console.log("✅ Found linked invites:");
        invitesSnapshot.forEach(doc => {
            console.log(`   Invite: ${doc.data().email || 'No Email'} - House Name in Invite: ${doc.data().houseName || 'N/A'}`);
        });
    }

    if (foundData) {
        console.log("\nGOOD NEWS: Subcollections exist! We can restore the house document shell.");
    } else {
        console.log("\nBAD NEWS: No subcollection data found. Restoration might be impossible without backup.");
    }
}

checkDeletedHouseData();

