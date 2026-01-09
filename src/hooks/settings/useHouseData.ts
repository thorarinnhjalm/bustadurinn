/**
 * useHouseData Hook
 * Manages house data loading and updates for settings pages
 */

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { logger } from '@/utils/logger';
import type { House } from '@/types/models';

export function useHouseData(houseId: string | undefined, userId: string | undefined) {
    const [house, setHouse] = useState<House | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!houseId || !userId) return;

        const loadHouse = async () => {
            setLoading(true);
            setError('');

            try {
                const houseSnap = await getDoc(doc(db, 'houses', houseId));

                if (houseSnap.exists()) {
                    const houseData = { id: houseSnap.id, ...houseSnap.data() } as House;

                    // Auto-generate invite code if missing (for legacy houses)
                    if (!houseData.invite_code && houseData.manager_id === userId) {
                        logger.info('Auto-generating invite code for house:', houseId);
                        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

                        try {
                            await updateDoc(doc(db, 'houses', houseId), {
                                invite_code: newCode,
                            });
                            houseData.invite_code = newCode;
                            logger.info('Invite code generated:', newCode);
                        } catch (err) {
                            logger.error('Failed to generate invite code:', err);
                        }
                    }

                    setHouse(houseData);
                } else {
                    setError('Hús fannst ekki');
                }
            } catch (err) {
                logger.error('Error loading house:', err);
                setError('Gat ekki sótt upplýsingar um sumarhúsið.');
            } finally {
                setLoading(false);
            }
        };

        loadHouse();
    }, [houseId, userId]);

    const updateHouse = async (updates: Partial<House>) => {
        if (!house?.id) return false;

        try {
            await updateDoc(doc(db, 'houses', house.id), {
                ...updates,
                updated_at: serverTimestamp(),
            });

            setHouse({ ...house, ...updates } as House);
            return true;
        } catch (err) {
            logger.error('Error updating house:', err);
            return false;
        }
    };

    return { house, setHouse, loading, error, updateHouse };
}
