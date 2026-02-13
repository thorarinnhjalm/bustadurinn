
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, runTransaction, collection, arrayUnion, serverTimestamp } from 'firebase/firestore';
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';

// Load Service Account
const serviceAccount = JSON.parse(
    await readFile(new URL('../serviceAccountKey.json', import.meta.url))
);

// Initialize Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

// Load Client Config (simulated)
// In a real app this comes from vite env, but we can read firebase.json or hardcode/guess based on service account or just use projectId
// Actually we need the client config (API Key etc) to use Client SDK.
// I'll try to read .env.local or similar if available, or just use the projectId from serviceAccount
// But Client SDK needs API Key.

// Let's try to parse .env.local
let apiKey = '';
try {
    const envLocal = await readFile(new URL('../.env.local', import.meta.url), 'utf-8');
    const match = envLocal.match(/VITE_FIREBASE_API_KEY=(.*)/);
    if (match) apiKey = match[1];
} catch (e) {
    console.log("Could not read .env.local");
}

if (!apiKey) {
    console.error("VITE_FIREBASE_API_KEY not found in .env.local. Cannot run client SDK.");
    process.exit(1);
}

const clientConfig = {
    apiKey: apiKey,
    projectId: serviceAccount.project_id,
    // other fields are less critical for Firestore/Auth usually, but let's see
};

const clientApp = initializeApp(clientConfig);
const clientAuth = getAuth(clientApp);
const db = getFirestore(clientApp);

async function main() {
    console.log("🚀 Starting House Creation Reproduction...");

    // 1. Create a Test User
    const testEmail = `test-repro-${Date.now()}@example.com`;
    const testUid = `test-repro-${Date.now()}`;

    console.log(`Creating test user: ${testEmail} (${testUid})`);

    // Create in Auth (Admin)
    await admin.auth().createUser({
        uid: testUid,
        email: testEmail,
        displayName: 'Test Repro User'
    });

    // Create Profile in Firestore (Admin - simulating SignupPage)
    await admin.firestore().collection('users').doc(testUid).set({
        uid: testUid,
        email: testEmail,
        name: 'Test Repro User',
        house_ids: [],
        created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Mint Token & Sign In (Client)
    const token = await admin.auth().createCustomToken(testUid);
    await signInWithCustomToken(clientAuth, token);
    console.log("✅ Signed in as test user");

    // 3. Attempt to Create House (Client Transaction)
    // Logic copied from OnboardingPage.tsx
    const houseData = {
        name: "Test House Repro",
        address: "Test Street 1"
    };
    const currentUser = { uid: testUid, email: testEmail, name: 'Test Repro User', house_ids: [] };

    try {
        console.log("Starting transaction...");

        await runTransaction(db, async (transaction) => {
            // Check promotion status
            const promoRef = doc(db, 'system', 'promotions');
            const userRef = doc(db, 'users', currentUser.uid);

            const promoDoc = await transaction.get(promoRef);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
                throw new Error("User does not exist");
            }

            let currentCount = 0;
            if (promoDoc.exists()) {
                console.log("Promo doc exists:", promoDoc.data());
                currentCount = promoDoc.data().launch_offer_count || 0;
            } else {
                console.log("Promo doc does NOT exist");
            }

            const isFree = (currentCount + 20) < 50;
            console.log(`Is Free? ${isFree} (Count: ${currentCount})`);

            // Prepare House Data
            const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const houseRef = doc(collection(db, 'houses'));
            const houseId = houseRef.id;

            const startDate = new Date();
            const endDate = new Date(startDate);
            if (isFree) {
                endDate.setFullYear(endDate.getFullYear() + 1);
                // Increment counter
                transaction.set(promoRef, { launch_offer_count: currentCount + 1 }, { merge: true });
            } else {
                endDate.setDate(endDate.getDate() + 30);
            }

            const newHouseData = {
                name: houseData.name,
                address: houseData.address,
                destination: { lat: 0, lng: 0 }, // Assuming OnboardingPage uses 'location' but maybe I should check exactly
                // OnboardingPage uses 'location': { lat, lng }
                location: { lat: 0, lng: 0 },
                manager_id: currentUser.uid,
                owner_ids: [currentUser.uid],
                invite_code: inviteCode,
                holiday_mode: 'fairness',
                seo_slug: houseData.name.toLowerCase().replace(/\s+/g, '-'),
                subscription_status: isFree ? 'active' : 'trial',
                subscription_end: endDate,
                created_at: new Date(),
                updated_at: new Date()
            };

            // Commit House
            transaction.set(houseRef, newHouseData);

            // Link to User
            transaction.update(userRef, {
                house_ids: arrayUnion(houseId)
            });

            console.log(`Transaction planned for House ID: ${houseId}`);
        });

        console.log("✅ Transaction committed successfully!");

    } catch (e) {
        console.error("❌ Transaction FAILED:", e);
        // Clean up user
        await admin.auth().deleteUser(testUid);
        process.exit(1);
    }

    // Clean up
    console.log("Cleaning up...");
    await admin.auth().deleteUser(testUid);
    // Could delete house too but leaving it might be useful for debug or manual delete
    console.log("Done.");
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
