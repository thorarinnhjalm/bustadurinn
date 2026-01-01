/**
 * Migration Script for Budget Items
 * Run this once to add 'type' field to existing budget items
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// This script adds the 'type' field to all existing budget items
// All existing items are assumed to be expenses

async function migrateBudgetItems() {
    console.log('Starting budget items migration...');

    const db = getFirestore();
    const budgetPlansRef = collection(db, 'budget_plans');
    const snapshot = await getDocs(budgetPlansRef);

    let migratedCount = 0;
    let alreadyMigratedCount = 0;

    for (const planDoc of snapshot.docs) {
        const data = planDoc.data();
        const items = data.items || [];

        // Check if any items need migration
        const needsMigration = items.some((item: any) => !item.type);

        if (needsMigration) {
            // Add 'type: expense' to all items that don't have it
            const migratedItems = items.map((item: any) => ({
                ...item,
                type: item.type || 'expense' // Default to expense if not set
            }));

            // Update the document
            await updateDoc(doc(db, 'budget_plans', planDoc.id), {
                items: migratedItems
            });

            migratedCount++;
            console.log(`✅ Migrated budget plan: ${planDoc.id}`);
        } else {
            alreadyMigratedCount++;
            console.log(`⏭️  Already migrated: ${planDoc.id}`);
        }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Migrated: ${migratedCount}`);
    console.log(`   Already migrated: ${alreadyMigratedCount}`);
    console.log(`   Total: ${snapshot.docs.length}`);
    console.log('\n✨ Migration complete!');
}

// Usage:
// 1. Ensure Firebase config is set up
// 2. Run: npx tsx scripts/migrateBudgetItems.ts

export { migrateBudgetItems };
