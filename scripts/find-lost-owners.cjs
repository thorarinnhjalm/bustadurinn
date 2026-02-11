
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function findRestorableOwners() {
    const houseId = 'lnnZcTI9OYcl3giFL4QS';
    console.log(`Scanning for lost owners of house: ${houseId}`);

    // Get current house owners
    const houseDoc = await db.collection('houses').doc(houseId).get();
    if (!houseDoc.exists) {
        console.log('House not found');
        return;
    }
    const currentOwners = new Set(houseDoc.data().owner_ids || []);
    console.log(`Current owners in house doc (${currentOwners.size}):`, [...currentOwners]);

    // Find all users who claim to be in this house
    const snapshot = await db.collection('users').where('house_ids', 'array-contains', houseId).get();

    console.log(`Found ${snapshot.size} users with this house in their profile.`);

    const missingOwners = [];
    snapshot.forEach(doc => {
        if (!currentOwners.has(doc.id)) {
            missingOwners.push({ id: doc.id, email: doc.data().email, name: doc.data().name });
        }
    });

    if (missingOwners.length > 0) {
        console.log('\nFound missing owners (Users with house_id but not in house.owner_ids):');
        missingOwners.forEach(u => console.log(` - ${u.name || 'No Name'} (${u.email}) [${u.id}]`));

        // Add them back?
        console.log('\nAdding them back to the house...');
        const newOwnerIds = [...currentOwners, ...missingOwners.map(u => u.id)];

        await db.collection('houses').doc(houseId).update({
            owner_ids: newOwnerIds
        });
        console.log('✅ Updated house owner_ids!');
    } else {
        console.log('\n✅ All users with this house ID are already in the owner list.');
    }
}

findRestorableOwners().catch(console.error);
