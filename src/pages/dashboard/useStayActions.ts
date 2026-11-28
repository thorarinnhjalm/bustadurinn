import { useState } from 'react';
import { collection, query, where, addDoc, getDocs, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { House, User } from '@/types/models';
import { logger } from '@/utils/logger';

/**
 * Check-in / checkout state and handlers (internal_logs, guestbook entry on
 * checkout, shopping-list + inventory sync). `setIsCheckedIn` comes from the
 * internal_logs listener (useActivityLogs).
 */
export function useStayActions(
    currentHouse: House | null,
    currentUser: User | null,
    isCheckedIn: boolean,
    setIsCheckedIn: (checkedIn: boolean) => void
) {
    // Checkout State
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [checkoutMessage, setCheckoutMessage] = useState('');
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    // Check-in State
    const [showCheckInModal, setShowCheckInModal] = useState(false);
    const [checkInLoading, setCheckInLoading] = useState(false);

    const handleCheckout = async (checklist: Record<string, boolean>, suppliesOut: string[]) => {
        if (!currentHouse || !currentUser) return;
        setCheckoutLoading(true);
        try {
            // 1. Create Guestbook Entry if message provided
            if (checkoutMessage.trim()) {
                await addDoc(collection(db, 'guestbook'), {
                    house_id: currentHouse.id,
                    author: currentUser.name || currentUser.email || 'Óþekktur',
                    author_id: currentUser.uid,
                    user_id: currentUser.uid,
                    message: checkoutMessage.trim(),
                    created_at: serverTimestamp()
                });
            }

            // 2. Add any "Á þrotum" supplies to the shopping list, skipping
            // items that already have a matching unchecked entry (case-
            // insensitive match, queried fresh here rather than reused from
            // the dashboard's own listener since that one is limited/sorted
            // for display purposes only).
            let addedSuppliesCount = 0;
            if (suppliesOut.length > 0) {
                const qUnchecked = query(
                    collection(db, 'houses', currentHouse.id, 'shopping_list'),
                    where('checked', '==', false)
                );
                const existingSnapshot = await getDocs(qUnchecked);
                const existingNames = new Set(
                    existingSnapshot.docs.map(d => String(d.data().item || '').trim().toLowerCase())
                );
                for (const item of suppliesOut) {
                    if (existingNames.has(item.trim().toLowerCase())) continue;
                    await addDoc(collection(db, 'houses', currentHouse.id, 'shopping_list'), {
                        house_id: currentHouse.id,
                        item,
                        checked: false,
                        created_at: serverTimestamp(),
                        added_by: currentUser.uid,
                        added_by_name: currentUser.name
                    });
                    addedSuppliesCount++;
                }

                // Sync status with inventory subcollection
                const qInv = query(collection(db, 'houses', currentHouse.id, 'inventory'));
                const invSnapshot = await getDocs(qInv);
                for (const docSnap of invSnapshot.docs) {
                    const data = docSnap.data();
                    if (suppliesOut.includes(data.name)) {
                        await updateDoc(doc(db, 'houses', currentHouse.id, 'inventory', docSnap.id), {
                            status: 'out',
                            updated_at: serverTimestamp(),
                            updated_by: currentUser.uid,
                            updated_by_name: currentUser.name
                        });
                    }
                }
            }

            // 3. Log Internal Check-out
            let text = `${currentUser.name} skráði brottför`;
            text += addedSuppliesCount > 0
                ? ` og skráði ${addedSuppliesCount} vörur á innkaupalistann.`
                : '.';
            const hasChecklist = !!currentHouse.checkout_checklist && currentHouse.checkout_checklist.length > 0;
            const newLog: Record<string, unknown> = {
                house_id: currentHouse.id,
                user_id: currentUser.uid,
                user_name: currentUser.name,
                text,
                kind: 'check_out' as const,
                created_at: serverTimestamp()
            };
            if (hasChecklist) {
                newLog.checklist = checklist;
            }
            await addDoc(collection(db, 'houses', currentHouse.id, 'internal_logs'), newLog);

            setShowCheckoutModal(false);
            setCheckoutMessage('');
            setIsCheckedIn(false);

        } catch (error) {
            logger.error('Error during checkout:', error);
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handleCheckIn = async (checklist: Record<string, boolean>) => {
        if (!currentHouse || !currentUser) return;
        setCheckInLoading(true);
        try {
            const text = `${currentUser.name} skráði komu sína.`;
            const hasChecklist = !!currentHouse.arrival_checklist && currentHouse.arrival_checklist.length > 0;
            const newLog: Record<string, unknown> = {
                house_id: currentHouse.id,
                user_id: currentUser.uid,
                user_name: currentUser.name,
                text,
                kind: 'check_in' as const,
                created_at: serverTimestamp()
            };
            if (hasChecklist) {
                newLog.checklist = checklist;
            }
            await addDoc(collection(db, 'houses', currentHouse.id, 'internal_logs'), newLog);

            setShowCheckInModal(false);
            setIsCheckedIn(true);
        } catch (error) {
            logger.error('Error during check-in:', error);
        } finally {
            setCheckInLoading(false);
        }
    };

    /** Click on the primary "Skrá komu" / "Skrá brottför" button. */
    const onStayButtonClick = async () => {
        if (!currentHouse || !currentUser) return;
        if (isCheckedIn) {
            setShowCheckoutModal(true);
            return;
        }

        // Use the richer CheckInModal when the house has configured
        // an arrival checklist; otherwise fall back to the plain
        // confirm dialog that existed before that feature.
        const hasArrivalChecklist = !!currentHouse.arrival_checklist && currentHouse.arrival_checklist.length > 0;
        if (hasArrivalChecklist) {
            setShowCheckInModal(true);
            return;
        }

        const confirmCheckIn = window.confirm("Viltu skrá komu þína í gestabókina?");
        if (!confirmCheckIn) return;
        try {
            const text = `${currentUser.name} skráði komu sína.`;
            const newLog = {
                house_id: currentHouse.id,
                user_id: currentUser.uid,
                user_name: currentUser.name,
                text,
                kind: 'check_in' as const,
                created_at: serverTimestamp()
            };
            await addDoc(collection(db, 'houses', currentHouse.id, 'internal_logs'), newLog);
            setIsCheckedIn(true);
        } catch (error) {
            logger.error('Error logging check-in:', error);
        }
    };

    return {
        showCheckoutModal,
        setShowCheckoutModal,
        checkoutMessage,
        setCheckoutMessage,
        checkoutLoading,
        showCheckInModal,
        setShowCheckInModal,
        checkInLoading,
        handleCheckout,
        handleCheckIn,
        onStayButtonClick
    };
}
