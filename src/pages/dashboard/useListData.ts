import { useEffect, useState } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task, ShoppingItem, InventoryItem } from '@/types/models';
import { logger } from '@/utils/logger';
import type { SetDashboardLoading } from './types';

/** Open tasks (pending / in progress), newest first, at most five. */
export function useTasksData(houseId: string | undefined, uid: string | undefined, setDashboardLoading: SetDashboardLoading) {
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        if (!houseId || !uid) return;
        const unsubscribes: (() => void)[] = [];
        try {
            // 2. Tasks (Subcollection)
            const qTasks = query(
                collection(db, 'houses', houseId, 'tasks')
            );
            unsubscribes.push(onSnapshot(qTasks, (snapshot) => {
                const tasksData = snapshot.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        ...d,
                        created_at: d.created_at?.toDate(),
                        due_date: d.due_date?.toDate()
                    } as Task;
                });

                // Client-side Filter & Sort
                const activeTasks = tasksData
                    .filter(t => ['pending', 'in_progress'].includes(t.status))
                    .sort((a, b) => (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0))
                    .slice(0, 5);

                setTasks(activeTasks);
            }, (error) => {
                logger.error("Tasks listener error:", error);
                setDashboardLoading(false);
            }));
        } catch (err) {
            logger.error("Setup listeners error:", err);
            setDashboardLoading(false);
        }
        return () => {
            unsubscribes.forEach(u => u());
        };
    }, [houseId, uid, setDashboardLoading]);

    return tasks;
}

/** Unchecked shopping-list items, newest first, at most five. */
export function useShoppingData(houseId: string | undefined, uid: string | undefined, setDashboardLoading: SetDashboardLoading) {
    const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);

    useEffect(() => {
        if (!houseId || !uid) return;
        const unsubscribes: (() => void)[] = [];
        try {
            // 3. Shopping List (Subcollection)
            const qShopping = query(
                collection(db, 'houses', houseId, 'shopping_list')
            );
            unsubscribes.push(onSnapshot(qShopping, (snapshot) => {
                const items = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    created_at: doc.data().created_at?.toDate() || new Date(),
                    checked_at: doc.data().checked_at?.toDate()
                })) as ShoppingItem[];

                // Client-side Filter & Sort
                const unchecked = items
                    .filter(i => !i.checked)
                    .sort((a, b) => (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0))
                    .slice(0, 5);

                setShoppingItems(unchecked);
            }, (error) => {
                logger.error("Shopping listener error:", error);
                setDashboardLoading(false);
            }));
        } catch (err) {
            logger.error("Setup listeners error:", err);
            setDashboardLoading(false);
        }
        return () => {
            unsubscribes.forEach(u => u());
        };
    }, [houseId, uid, setDashboardLoading]);

    return shoppingItems;
}

/** Inventory subcollection ("Hvað er til"). */
export function useInventoryData(houseId: string | undefined, uid: string | undefined, setDashboardLoading: SetDashboardLoading) {
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

    useEffect(() => {
        if (!houseId || !uid) return;
        const unsubscribes: (() => void)[] = [];
        try {
            // 6. Inventory Subcollection ("Hvað er til")
            const qInventory = query(
                collection(db, 'houses', houseId, 'inventory')
            );
            unsubscribes.push(onSnapshot(qInventory, (snapshot) => {
                const items = snapshot.docs.map(docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                    created_at: docSnap.data().created_at?.toDate(),
                    updated_at: docSnap.data().updated_at?.toDate()
                })) as InventoryItem[];
                setInventoryItems(items);
            }, (error) => {
                logger.error("Inventory listener error:", error);
                setDashboardLoading(false);
            }));
        } catch (err) {
            logger.error("Setup listeners error:", err);
            setDashboardLoading(false);
        }
        return () => {
            unsubscribes.forEach(u => u());
        };
    }, [houseId, uid, setDashboardLoading]);

    return inventoryItems;
}
