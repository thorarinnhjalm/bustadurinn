
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

async function checkHouses() {
    const houseIds = ['Valo0aHTRx5RaC6YbNwH', 'lnnZcTI9OYcl3giFL4QS'];

    for (const id of houseIds) {
        console.log(`\n--- Checking House: ${id} ---`);
        const doc = await db.collection('houses').doc(id).get();
        if (!doc.exists) {
            console.log(`House ${id} DOES NOT EXIST!`);
            continue;
        }
        const data = doc.data();
        console.log(`Name: ${data.name}`);
        console.log(`Manager: ${data.manager_id}`);
        console.log(`Owners: ${data.owner_ids?.join(', ')}`);

        const budgetCount = (await db.collection('houses').doc(id).collection('budget_plans').get()).size;
        const shoppingCount = (await db.collection('houses').doc(id).collection('shopping_list').get()).size;

        console.log(`Budget Plans: ${budgetCount}`);
        console.log(`Shopping Items: ${shoppingCount}`);
    }
    process.exit(0);
}

checkHouses().catch(err => {
    console.error(err);
    process.exit(1);
});
