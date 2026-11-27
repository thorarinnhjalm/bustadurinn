
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = join(__dirname, '../serviceAccountKey.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkHouseData() {
    const houseId = 'Valo0aHTRx5RaC6YbNwH'; // Vörðás
    console.log(`Checking data for house: ${houseId}`);

    const houseDoc = await db.collection('houses').doc(houseId).get();
    if (!houseDoc.exists) {
        console.log("House document does not exist!");
        return;
    }

    const houseData = houseDoc.data();
    console.log("House Data Summary:", {
        id: houseDoc.id,
        name: houseData.name,
        manager_id: houseData.manager_id,
        owner_ids: houseData.owner_ids,
        subscription_status: houseData.subscription_status
    });

    const owners = houseData.owner_ids || [];
    for (const uid of owners) {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            console.log(`User Profile Found: ${uid} (${userDoc.data().email}) - houses: ${userDoc.data().house_ids}`);
        } else {
            console.log(`User profile for ${uid} MISSING in Firestore!`);
        }
    }

    // Check Budget Plans
    const budgetPlans = await db.collection('houses').doc(houseId).collection('budget_plans').get();
    console.log(`Budget Plans count: ${budgetPlans.size}`);
    budgetPlans.forEach(doc => {
        console.log(`- Plan ${doc.id} (Year: ${doc.data().year}): ${doc.data().items?.length || 0} items`);
    });

    // Check Shopping List
    const shoppingList = await db.collection('houses').doc(houseId).collection('shopping_list').get();
    console.log(`Shopping List count: ${shoppingList.size}`);
    shoppingList.forEach(doc => {
        console.log(`- Item ${doc.id}: ${doc.data().item} (Checked: ${doc.data().checked})`);
    });

    process.exit(0);
}

checkHouseData().catch(err => {
    console.error(err);
    process.exit(1);
});
