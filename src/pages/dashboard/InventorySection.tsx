import { collection, serverTimestamp, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { House, User, InventoryItem } from '@/types/models';
import InventoryCard from '@/components/dashboard/InventoryCard';
import { logger } from '@/utils/logger';

interface InventorySectionProps {
    currentHouse: House;
    currentUser: User | null;
    inventoryItems: InventoryItem[];
}

/** HVAÐ ER TIL (INVENTORY & EQUIPMENT) plus the one-time migration from the legacy supply checklist. */
export default function InventorySection({ currentHouse, currentUser, inventoryItems }: InventorySectionProps) {
    const handleInitializeInventory = async () => {
        if (!currentHouse || !currentUser) return;
        try {
            const batch = writeBatch(db);
            const inventoryColRef = collection(db, 'houses', currentHouse.id, 'inventory');
            const hasLegacy = currentHouse.supply_checklist && currentHouse.supply_checklist.length > 0;

            if (hasLegacy && currentHouse.supply_checklist) {
                currentHouse.supply_checklist.forEach((item: string) => {
                    const docRef = doc(inventoryColRef);
                    const isCleaning = [
                        'uppþvottalögur', 'klósettpappír', 'eldhúsrúllur', 
                        'álpappír', 'bökunarpappír', 'kerti', 'sápa', 'tuska',
                        'tuskur', 'svampur', 'svampar', 'ruslapokar', 'ruslapoki'
                    ].some(keyword => item.toLowerCase().includes(keyword));

                    const isOut = currentHouse.supplies_out?.includes(item);

                    batch.set(docRef, {
                        house_id: currentHouse.id,
                        name: item,
                        category: isCleaning ? 'cleaning' : 'pantry',
                        status: isOut ? 'out' : 'ok',
                        quantity: '',
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp(),
                        updated_by: currentUser.uid,
                        updated_by_name: currentUser.name
                    });
                });

                const kitchenItems = [
                    { name: 'Diskar', quantity: '12 stk' },
                    { name: 'Glös', quantity: '12 stk' },
                    { name: 'Bollar', quantity: '12 stk' },
                    { name: 'Hnífapör', quantity: '12 pör' }
                ];
                const beddingItems = [
                    { name: 'Sængur', quantity: '6 stk' },
                    { name: 'Koddar', quantity: '6 stk' }
                ];

                kitchenItems.forEach((item) => {
                    const docRef = doc(inventoryColRef);
                    batch.set(docRef, {
                        house_id: currentHouse.id,
                        name: item.name,
                        category: 'kitchen',
                        status: 'ok',
                        quantity: item.quantity,
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp(),
                        updated_by: currentUser.uid,
                        updated_by_name: currentUser.name
                    });
                });

                beddingItems.forEach((item) => {
                    const docRef = doc(inventoryColRef);
                    batch.set(docRef, {
                        house_id: currentHouse.id,
                        name: item.name,
                        category: 'bedding',
                        status: 'ok',
                        quantity: item.quantity,
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp(),
                        updated_by: currentUser.uid,
                        updated_by_name: currentUser.name
                    });
                });
            } else {
                const pantryItems = [
                    'Salt', 'Pipar', 'Grillkrydd', 'Oregano', 'Ólífuolía',
                    'Matarolía', 'Sykur', 'Kaffi'
                ];
                const cleaningItems = [
                    'Uppþvottalögur', 'Klósettpappír', 'Eldhúsrúllur', 
                    'Álpappír', 'Bökunarpappír', 'Kerti'
                ];
                const kitchenItems = [
                    { name: 'Diskar', quantity: '12 stk' },
                    { name: 'Glös', quantity: '12 stk' },
                    { name: 'Bollar', quantity: '12 stk' },
                    { name: 'Hnífapör', quantity: '12 pör' }
                ];
                const beddingItems = [
                    { name: 'Sængur', quantity: '6 stk' },
                    { name: 'Koddar', quantity: '6 stk' }
                ];

                pantryItems.forEach((item) => {
                    const docRef = doc(inventoryColRef);
                    batch.set(docRef, {
                        house_id: currentHouse.id,
                        name: item,
                        category: 'pantry',
                        status: 'ok',
                        quantity: '',
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp(),
                        updated_by: currentUser.uid,
                        updated_by_name: currentUser.name
                    });
                });

                cleaningItems.forEach((item) => {
                    const docRef = doc(inventoryColRef);
                    batch.set(docRef, {
                        house_id: currentHouse.id,
                        name: item,
                        category: 'cleaning',
                        status: 'ok',
                        quantity: '',
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp(),
                        updated_by: currentUser.uid,
                        updated_by_name: currentUser.name
                    });
                });

                kitchenItems.forEach((item) => {
                    const docRef = doc(inventoryColRef);
                    batch.set(docRef, {
                        house_id: currentHouse.id,
                        name: item.name,
                        category: 'kitchen',
                        status: 'ok',
                        quantity: item.quantity,
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp(),
                        updated_by: currentUser.uid,
                        updated_by_name: currentUser.name
                    });
                });

                beddingItems.forEach((item) => {
                    const docRef = doc(inventoryColRef);
                    batch.set(docRef, {
                        house_id: currentHouse.id,
                        name: item.name,
                        category: 'bedding',
                        status: 'ok',
                        quantity: item.quantity,
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp(),
                        updated_by: currentUser.uid,
                        updated_by_name: currentUser.name
                    });
                });
            }

            await batch.commit();

            // Clear legacy supply_checklist from house doc
            // Only the manager may change supply_checklist (firestore.rules);
            // other members may only reset supplies_out.
            await updateDoc(doc(db, 'houses', currentHouse.id), currentHouse.manager_id === currentUser.uid
                ? { supply_checklist: [], supplies_out: [] }
                : { supplies_out: [] });
        } catch (error) {
            logger.error('Error initializing inventory:', error);
        }
    };

    return (
        <InventoryCard
            houseId={currentHouse.id}
            currentUserId={currentUser?.uid || ''}
            currentUserName={currentUser?.name || currentUser?.email || ''}
            inventoryItems={inventoryItems}
            onInitialize={handleInitializeInventory}
            canManage={currentHouse.manager_id === currentUser?.uid}
        />
    );
}
