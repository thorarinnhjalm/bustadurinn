
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

async function checkFinanceInfo() {
    const houseIds = ['Valo0aHTRx5RaC6YbNwH', 'lnnZcTI9OYcl3giFL4QS'];

    for (const id of houseIds) {
        console.log(`\n--- House: ${id} ---`);
        const doc = await db.collection('houses').doc(id).get();
        const data = doc.data();
        console.log(`Name: ${data.name}`);
        console.log(`Privacy Hide Finances: ${data.privacy_hide_finances}`);
        console.log(`Finance Viewer IDs: ${data.finance_viewer_ids?.join(', ')}`);

        const entriesCount = (await db.collection('houses').doc(id).collection('finance_entries').get()).size;
        console.log(`Total Finance Entries: ${entriesCount}`);

        const budgetCount = (await db.collection('houses').doc(id).collection('budget_plans').get()).size;
        console.log(`Total Budget Plans: ${budgetCount}`);
        if (budgetCount > 0) {
            const budget = await db.collection('houses').doc(id).collection('budget_plans').get();
            budget.docs.forEach(b => {
                console.log(`- Budget Year: ${b.data().year}, Items: ${b.data().items?.length}`);
            });
        }
    }
    process.exit(0);
}

checkFinanceInfo().catch(err => {
    console.error(err);
    process.exit(1);
});
