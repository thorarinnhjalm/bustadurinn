
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function debugAccess() {
    const houseId = 'lnnZcTI9OYcl3giFL4QS';
    console.log(`Checking House: ${houseId}`);

    const houseDoc = await db.collection('houses').doc(houseId).get();
    if (!houseDoc.exists) {
        console.log('❌ House does not exist!');
        return;
    }

    const houseData = houseDoc.data();
    const ownerIds = houseData.owner_ids || [];
    console.log(`House Name: ${houseData.name}`);
    console.log(`Owner IDs in House:`, ownerIds);

    if (ownerIds.length === 0) {
        console.log('⚠️ No owners found in house document!');
    }

    // Check each owner
    for (const uid of ownerIds) {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            console.log(`❌ User ${uid} does not exist!`);
            continue;
        }
        const userData = userDoc.data();
        const userHouses = userData.house_ids || [];
        const hasAccess = userHouses.includes(houseId);

        console.log(`\nUser: ${userData.email} (${uid})`);
        console.log(`   - House IDs:`, userHouses);
        console.log(`   - Has Access to Restored House: ${hasAccess ? '✅ YES' : '❌ NO'}`);
    }

    // Check for invitations
    const invitesSnap = await db.collection('invitations').where('house_id', '==', houseId).get();
    console.log(`\nInvitations for House ${houseId}: ${invitesSnap.size}`);
    invitesSnap.forEach(doc => {
        console.log(` - Invite to: ${doc.data().email} (Status: ${doc.data().status || 'pending'})`);
    });
}

debugAccess().catch(console.error);
