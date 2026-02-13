import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { logger } from '@/utils/logger';
import type { BudgetPlan } from '@/types/models';

/**
 * Updates the user's name across all relevant collections in Firestore.
 * This ensures data consistency when a user changes their name.
 */
export const updateUserNameInAllCollections = async (userId: string, newName: string, houseIds: string[]) => {
    logger.info(`Starting global name update for user ${userId} to "${newName}"...`);

    // We will use batches to perform updates. specific limit is 500 ops per batch.
    // simpler approach: create a new batch for each collection or group of updates to avoid complexity of tracking size.

    try {
        const promises = [];

        // 1. Bookings
        promises.push(updateCollection(
            'bookings',
            'user_id',
            userId,
            { user_name: newName }
        ));

        // 2. Tasks
        promises.push(updateCollection(
            'tasks',
            'assigned_to',
            userId,
            { assigned_to_name: newName }
        ));

        // 3. Shopping List (Added By)
        promises.push(updateCollection(
            'shopping_list',
            'added_by',
            userId,
            { added_by_name: newName }
        ));

        // 4. Shopping List (Checked By)
        promises.push(updateCollection(
            'shopping_list',
            'checked_by',
            userId,
            { checked_by_name: newName }
        ));

        // 5. Internal Logs
        promises.push(updateCollection(
            'internal_logs',
            'user_id',
            userId,
            { user_name: newName }
        ));

        // 6. Finance Entries (Ledger)
        promises.push(updateCollection(
            'finance_entries',
            'paid_by_user_id',
            userId,
            { paid_by_name: newName }
        ));

        // 7. Budget Plans (Complex Array Update)
        if (houseIds && houseIds.length > 0) {
            promises.push(updateBudgetPlans(houseIds, userId, newName));
        }

        await Promise.all(promises);
        logger.info('Global name update complete.');
        return true;
    } catch (error) {
        console.error('Error updating user name globally:', error);
        throw error;
    }
};

const updateCollection = async (collectionName: string, whereField: string, userId: string, updateData: any) => {
    try {
        const q = query(
            collection(db, collectionName),
            where(whereField, '==', userId)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) return;

        const batch = writeBatch(db);
        let count = 0;

        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, updateData);
            count++;
        });

        await batch.commit();
        logger.debug(`Updated ${count} documents in ${collectionName} where ${whereField} matched.`);
    } catch (error) {
        console.error(`Error updating collection ${collectionName}:`, error);
        // We don't throw here to ensure other collections proceed, but might want to rethink for strict consistency
    }
};

const updateBudgetPlans = async (houseIds: string[], userId: string, newName: string) => {
    try {
        // Budget plans are disjoint by house_id.
        // We need to check all plans for these houses.
        // optimize: query 'budget_plans' where house_id in houseIds
        // Note: 'in' query supports up to 10 values.

        const chunks = [];
        for (let i = 0; i < houseIds.length; i += 10) {
            chunks.push(houseIds.slice(i, i + 10));
        }

        for (const chunk of chunks) {
            const q = query(
                collection(db, 'budget_plans'),
                where('house_id', 'in', chunk)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) continue;

            const batch = writeBatch(db);
            let updatesCount = 0;

            snapshot.docs.forEach((docSnap) => {
                const data = docSnap.data() as BudgetPlan;
                let changed = false;

                if (!data.items) return;

                const newItems = data.items.map(item => {
                    if (item.assigned_owner_id === userId) {
                        changed = true;
                        return { ...item, assigned_owner_name: newName };
                    }
                    return item;
                });

                if (changed) {
                    batch.update(docSnap.ref, { items: newItems });
                    updatesCount++;
                }
            });

            if (updatesCount > 0) {
                await batch.commit();
                logger.debug(`Updated ${updatesCount} budget plans.`);
            }
        }
    } catch (error) {
        console.error('Error updating budget plans:', error);
    }
};
