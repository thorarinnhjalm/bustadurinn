import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore } from '@/store/appStore';
import type { House, User } from '@/types/models';
import { generateInviteCode } from '@/utils/secureToken';
import { logger } from '@/utils/logger';
import { INITIAL_HOUSE_FORM } from './types';
import type { HouseFormState } from './types';

/**
 * Loads the house the settings page works on (the globally selected house, else the
 * user's first) plus the form state derived from it. `loading` is the page-wide
 * "busy" flag that several tabs also toggle.
 */
export function useSettingsHouse(currentUser: User | null | undefined, setError: (message: string) => void) {
    const [loading, setLoading] = useState(false);
    const [house, setHouse] = useState<House | null>(null);
    const [houseForm, setHouseForm] = useState<HouseFormState>(INITIAL_HOUSE_FORM);

    const currentHouse = useAppStore((state) => state.currentHouse);

    const userHouseIds = currentUser?.house_ids;
    const currentUserId = currentUser?.uid;
    const currentStoredHouseId = currentHouse?.id;

    useEffect(() => {
        if (!userHouseIds?.[0]) return;

        const loadHouse = async () => {
            setLoading(true);
            try {
                // Prioritize the globally selected house, otherwise default to first available
                const houseId = currentStoredHouseId || userHouseIds[0];
                if (!houseId) return;

                const houseSnap = await getDoc(doc(db, 'houses', houseId));

                if (houseSnap.exists()) {
                    const houseData = { id: houseSnap.id, ...houseSnap.data() } as House;

                    // Auto-generate invite code if missing (for legacy houses)
                    if (currentUserId && !houseData.invite_code && houseData.manager_id === currentUserId) {
                        logger.info('Auto-generating invite code for house:', houseId);
                        const newCode = generateInviteCode();
                        try {
                            await updateDoc(doc(db, 'houses', houseId), {
                                invite_code: newCode
                            });
                            houseData.invite_code = newCode;
                            logger.info('Invite code generated for house:', houseId);
                        } catch (err) {
                            logger.error('Failed to generate invite code:', err);
                        }
                    }

                    setHouse(houseData);
                    // The Gestir tab edits and saves houseForm, so it must start
                    // from the stored values or a save would blank them out.
                    setHouseForm(prev => ({
                        ...prev,
                        name: houseData.name || '',
                        address: houseData.address || '',
                        lat: houseData.location?.lat || 0,
                        lng: houseData.location?.lng || 0,
                        invite_code: houseData.invite_code || '',
                        wifi_ssid: houseData.wifi_ssid || '',
                        wifi_password: houseData.wifi_password || '',
                        no_wifi: houseData.no_wifi || false,
                        holiday_mode: (houseData.holiday_mode as any) || 'first_come',
                        house_rules: houseData.house_rules || '',
                        house_rules_en: houseData.house_rules_en || '',
                        check_in_time: houseData.check_in_time || '',
                        check_out_time: houseData.check_out_time || '',
                        directions: houseData.directions || '',
                        directions_en: houseData.directions_en || '',
                        access_instructions: houseData.access_instructions || '',
                        access_instructions_en: houseData.access_instructions_en || '',
                        emergency_contact: houseData.emergency_contact || '',
                        guest_instructions: houseData.guest_instructions || '',
                        guest_instructions_en: houseData.guest_instructions_en || '',
                        amenities: houseData.amenities || [],
                        privacy_hide_finances: houseData.privacy_hide_finances || false,
                        finance_viewer_ids: houseData.finance_viewer_ids || []
                    }));
                }
            } catch (err) {
                logger.error('Error loading house:', err);
                setError('Gat ekki sótt upplýsingar um sumarhúsið.');
            } finally {
                setLoading(false);
            }
        };

        loadHouse();
    }, [userHouseIds, currentStoredHouseId, currentUserId, setError]);

    return { house, setHouse, houseForm, setHouseForm, loading, setLoading };
}
