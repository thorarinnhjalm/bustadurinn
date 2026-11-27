
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function restoreHouse() {
    const deletedHouseId = 'lnnZcTI9OYcl3giFL4QS';
    const existingHouseId = 'Valo0aHTRx5RaC6YbNwH'; // Vörðásinn

    console.log(`Starting restoration for house: ${deletedHouseId}`);

    try {
        // 1. Fetch existing house to get owners/managers
        console.log(`Fetching owner data from sibling house: ${existingHouseId}`);
        const existingHouseDoc = await db.collection('houses').doc(existingHouseId).get();

        let ownerIds = [];
        let managerId = '';

        if (existingHouseDoc.exists) {
            const data = existingHouseDoc.data();
            ownerIds = data.owner_ids || [];
            managerId = data.manager_id || '';
            console.log(`Found owners: ${ownerIds.join(', ')}`);
        } else {
            console.log("Could not find sibling house. Using default user as owner.");
            // Fallback to the user we know
            ownerIds = ['sxcToczAAwT3Fmh8FPXa1P6hMHB3'];
            managerId = 'sxcToczAAwT3Fmh8FPXa1P6hMHB3';
        }

        // 2. Prepare Restoration Data
        // We use a safe past date to avoid it looking "brand new" in UI logic if that matters
        const restorationDate = new Date('2024-01-01T12:00:00Z');

        const restoredData = {
            id: deletedHouseId,
            name: "Restored House (Please Rename)",
            address: "", // User to fill
            location: {
                lat: 64.1353, // Reykjavik approx center default
                lng: -21.8952
            },
            owner_ids: ownerIds,
            manager_id: managerId,
            subscription_status: 'free',
            holiday_mode: 'fairness',
            created_at: restorationDate,
            updated_at: new Date(), // Now
            amenities: [],
            privacy_hide_finances: false,
            restored_by_script: true
        };

        // 3. Write to Firestore
        console.log(`Restoring document ${deletedHouseId}...`);
        await db.collection('houses').doc(deletedHouseId).set(restoredData, { merge: true });
        console.log("✅ House document restored.");

        // 4. Ensure Users have this ID in their profile
        console.log("Ensuring users have this house ID...");
        for (const uid of ownerIds) {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await userRef.get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const currentHouses = userData.house_ids || [];
                if (!currentHouses.includes(deletedHouseId)) {
                    console.log(`Adding house ID to user ${uid}...`);
                    await userRef.update({
                        house_ids: admin.firestore.FieldValue.arrayUnion(deletedHouseId)
                    });
                } else {
                    console.log(`User ${uid} already has house ID.`);
                }
            }
        }

        console.log("🎉 Restoration Complete! The user should see 'Restored House (Please Rename)' in their list.");

    } catch (error) {
        console.error("❌ Restoration failed:", error);
    }
}

restoreHouse();
