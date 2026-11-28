import { useState, useEffect } from 'react';
import {
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    collection,
    query,
    orderBy,
    getDocs,
    addDoc,
    onSnapshot,
    limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ShoppingList from '@/components/ShoppingList';
import { notifyShoppingListAdded } from '@/services/inAppNotifications';
import type { House, User, ShoppingItem } from '@/types/models';
import { logger } from '@/utils/logger';

interface ShoppingTabProps {
    house: House | null;
    currentUser: User | null | undefined;
}

export default function ShoppingTab({ house, currentUser }: ShoppingTabProps) {
    // Shopping State
    const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);

    // Fetch Shopping List (this tab is only mounted while it is the active tab)
    useEffect(() => {
        if (house?.id) {
            const q = query(
                collection(db, 'houses', house.id, 'shopping_list'),
                orderBy('created_at', 'desc'),
                limit(100)
            );
            // Use onSnapshot for realtime updates
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShoppingItem));
                setShoppingItems(items);
            });
            return () => unsubscribe();
        }
    }, [house?.id]);

    // Shopping handlers
    const handleToggleShoppingItem = async (item: ShoppingItem) => {
        if (!house) return;
        const newCheckedState = !item.checked;
        await updateDoc(doc(db, 'houses', house.id, 'shopping_list', item.id), {
            checked: newCheckedState,
            ...(newCheckedState ? { checked_by: currentUser?.uid, checked_at: serverTimestamp() } : {})
        });

        // Bi-directional sync with "Hvað er til" (Inventory)
        if (newCheckedState && item.item) {
            try {
                const qInv = query(collection(db, 'houses', house.id, 'inventory'));
                const invSnap = await getDocs(qInv);
                for (const docSnap of invSnap.docs) {
                    const invData = docSnap.data();
                    if (invData.name?.trim().toLowerCase() === item.item.trim().toLowerCase() && invData.status === 'out') {
                        await updateDoc(doc(db, 'houses', house.id, 'inventory', docSnap.id), {
                            status: 'ok',
                            updated_at: serverTimestamp(),
                            updated_by: currentUser?.uid || '',
                            updated_by_name: currentUser?.name || ''
                        });
                    }
                }
            } catch (err) {
                logger.error("Error syncing inventory from shopping list check:", err);
            }
        }
    };

    const handleDeleteShoppingItem = async (item: ShoppingItem) => {
        if (!house) return;
        await deleteDoc(doc(db, 'houses', house.id, 'shopping_list', item.id));
    };

    const handleAddShoppingItem = async (text: string) => {
        if (!house || !currentUser) return;
        await addDoc(collection(db, 'houses', house.id, 'shopping_list'), {
            house_id: house.id,
            item: text,
            checked: false,
            created_at: new Date(),
            added_by: currentUser.uid,
            added_by_name: currentUser.name
        });

        // Fire-and-forget: notify other house members (in-app only). Never
        // blocks the shopping list update — failures are logged inside the service.
        if (house.owner_ids && house.owner_ids.length > 0) {
            notifyShoppingListAdded({
                houseId: house.id,
                itemName: text,
                ownerIds: house.owner_ids,
                actorUid: currentUser.uid,
                actorName: currentUser.name,
            }).catch((error) => logger.error('Failed to notify house members of shopping list update:', error));
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-serif font-bold mb-4">Innkaupalisti</h2>
            <p className="text-stone-500 mb-6">Hvað vantar í bústaðinn?</p>
            <ShoppingList
                items={shoppingItems}
                onToggle={handleToggleShoppingItem}
                onDelete={handleDeleteShoppingItem}
                onAdd={handleAddShoppingItem}
            />
        </div>
    );
}
