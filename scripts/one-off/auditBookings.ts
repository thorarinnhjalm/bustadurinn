/**
 * Quick script to audit booking permissions
 * Run with: npx tsx scripts/auditBookings.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, '../serviceAccountKey.json'), 'utf-8')
);

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function auditBookings() {
    console.log('🔍 Auditing booking documents...\n');

    try {
        // Get all houses
        const housesSnapshot = await db.collection('houses').limit(5).get();

        for (const houseDoc of housesSnapshot.docs) {
            const houseData = houseDoc.data();
            console.log(`\n📦 House: ${houseData.name || houseDoc.id}`);
            console.log(`   Manager ID: ${houseData.manager_id}`);
            console.log(`   Owner IDs: ${houseData.owner_ids?.join(', ') || 'NONE'}`);

            // Get bookings for this house
            const bookingsSnapshot = await db
                .collection('houses')
                .doc(houseDoc.id)
                .collection('bookings')
                .limit(3)
                .get();

            if (bookingsSnapshot.empty) {
                console.log('   No bookings found.');
                continue;
            }

            console.log(`\n   📅 Bookings (showing first 3):`);
            bookingsSnapshot.forEach(bookingDoc => {
                const booking = bookingDoc.data();
                console.log(`\n   - Booking ID: ${bookingDoc.id}`);
                console.log(`     user_id: ${booking.user_id || '❌ MISSING'}`);
                console.log(`     user_name: ${booking.user_name}`);
                console.log(`     type: ${booking.type}`);
                console.log(`     start: ${booking.start?.toDate?.()?.toISOString() || booking.start}`);

                // Check if user_id matches any owner
                const isOwner = houseData.owner_ids?.includes(booking.user_id);
                const isManager = houseData.manager_id === booking.user_id;
                console.log(`     ✅ User is owner: ${isOwner}`);
                console.log(`     ✅ User is manager: ${isManager}`);
                console.log(`     ⚠️  Can delete (owner or manager): ${isOwner || isManager}`);
            });
        }

        console.log('\n\n✅ Audit complete!');
    } catch (error) {
        console.error('Error auditing bookings:', error);
    }
}

auditBookings();
