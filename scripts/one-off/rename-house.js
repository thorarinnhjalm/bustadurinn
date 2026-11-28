
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const HOUSE_ID = 'Valo0aHTRx5RaC6YbNwH';

async function renameHouse() {
    try {
        await db.collection('houses').doc(HOUSE_ID).update({
            name: 'Vörðásinn'
        });
        console.log(`House ${HOUSE_ID} renamed to "Vörðásinn".`);
    } catch (error) {
        console.error('Error renaming house:', error);
    }
}

renameHouse();
