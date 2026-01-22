import { useState, useEffect } from 'react';
import { collection, query, where, limit, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppNotification } from '@/types/models';
import { useAppStore } from '@/store/appStore';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';

export const useNotifications = () => {
    const { currentHouse } = useAppStore();
    const { user: currentUser } = useEffectiveUser();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    const currentHouseId = currentHouse?.id;
    const currentUserId = currentUser?.uid;

    useEffect(() => {
        // Clear notifications immediately when house or user changes
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNotifications([]);

        if (!currentHouseId || !currentUserId) {
            return;
        }

        let unsubscribe: (() => void) | undefined;

        try {
            const notifsRef = collection(db, 'notifications');
            const qNotifs = query(
                notifsRef,
                where('house_id', '==', currentHouseId),
                where('user_id', '==', currentUserId),
                limit(40)
            );

            unsubscribe = onSnapshot(qNotifs, (snapshot) => {
                const notifsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    created_at: doc.data().created_at?.toDate() || new Date()
                } as AppNotification))
                    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
                    .slice(0, 20);
                setNotifications(notifsData);
            }, (error) => {
                console.error("Error setting up notification listener:", error);
            });
        } catch (e) {
            console.error("Error in useNotifications:", e);
        }

        // Cleanup function that always runs
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [currentHouseId, currentUserId]);

    const markAsRead = async (id: string) => {
        try {
            await updateDoc(doc(db, 'notifications', id), { read: true });
        } catch (e) {
            console.error("Error marking notification as read:", e);
        }
    };

    const markAllAsRead = async () => {
        const unread = notifications.filter(n => !n.read);
        try {
            await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
        } catch (e) {
            console.error("Error marking all as read:", e);
        }
    };

    return { notifications, markAsRead, markAllAsRead };
};
