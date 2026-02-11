
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function deleteFreeHouses() {
    try {
        const housesSnapshot = await db.collection('houses').where('subscription_status', '==', 'free').get();

        if (housesSnapshot.empty) {
            console.log('No free houses found to delete.');
            return;
        }

        const batch = db.batch();
        let count = 0;

        housesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
            count++;
        });

        await batch.commit();
        console.log(`Successfully deleted ${count} houses with status 'free'.`);

    } catch (error) {
        console.error('Error deleting houses:', error);
    }
}

deleteFreeHouses();
