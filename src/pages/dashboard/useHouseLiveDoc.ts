import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore } from '@/store/appStore';
import type { House } from '@/types/models';
import { logger } from '@/utils/logger';
import type { SetDashboardLoading } from './types';

/** Listens to the house document itself (for live house updates) and mirrors it into the store. */
export function useHouseLiveDoc(houseId: string | undefined, uid: string | undefined, setDashboardLoading: SetDashboardLoading) {
    useEffect(() => {
        if (!houseId || !uid) return;
        const unsubscribes: (() => void)[] = [];
        try {
            // 0. Listen to the House itself (for live house updates)
            const houseRef = doc(db, 'houses', houseId);
            unsubscribes.push(onSnapshot(houseRef, (snap) => {
                if (snap.exists()) {
                    const newData = { id: snap.id, ...snap.data() } as House;
                    useAppStore.getState().setCurrentHouse(newData);
                }
            }, (error) => {
                logger.error('House listener error:', error);
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
}
