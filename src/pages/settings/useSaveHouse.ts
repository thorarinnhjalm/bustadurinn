import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { House } from '@/types/models';
import { logger } from '@/utils/logger';
import type { SettingsFeedback } from './types';

interface UseSaveHouseArgs extends SettingsFeedback {
    house: House | null;
    setHouse: Dispatch<SetStateAction<House | null>>;
    isManager: boolean;
}

/**
 * Saves (a subset of) the house document and mirrors the guest-facing fields into the
 * guest view. Shared by the Hús tab (full form) and the Gestir tab (guest fields only).
 */
export function useSaveHouse({ house, setHouse, isManager, setSuccess, setError }: UseSaveHouseArgs) {
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveHouse = async (formData: any) => {
        if (!house || !isManager) return;

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const updates: Record<string, any> = {
                name: formData.name,
                address: formData.address,
                wifi_ssid: formData.wifi_ssid,
                wifi_password: formData.wifi_password,
                no_wifi: formData.no_wifi,
                holiday_mode: formData.holiday_mode as any,
                house_rules: formData.house_rules,
                house_rules_en: formData.house_rules_en,
                check_in_time: formData.check_in_time,
                check_out_time: formData.check_out_time,
                directions: formData.directions,
                directions_en: formData.directions_en,
                access_instructions: formData.access_instructions,
                access_instructions_en: formData.access_instructions_en,

                emergency_contact: formData.emergency_contact,
                guest_instructions: formData.guest_instructions,
                guest_instructions_en: formData.guest_instructions_en,
                amenities: formData.amenities,
                privacy_hide_finances: formData.privacy_hide_finances,
                finance_viewer_ids: formData.finance_viewer_ids,
                checkout_checklist: formData.checkout_checklist,
                arrival_checklist: formData.arrival_checklist,
                supply_checklist: formData.supply_checklist,
                seasonal_checklists: formData.seasonal_checklists,
                updated_at: new Date()
            };

            // Only write the fields this form actually supplied. Defaulting a
            // missing field to ''/[]/0 would wipe data a partial form (e.g. the
            // Gestir tab) doesn't edit — that is how house locations got reset
            // to 0,0 and the dashboard weather went blank.
            for (const key of Object.keys(updates)) {
                if (updates[key] === undefined) delete updates[key];
            }

            // Skip 0,0 too: it's the "no location" placeholder, never a real house.
            const lat = Number(formData.lat);
            const lng = Number(formData.lng);
            if (lat && lng) {
                updates.location = { lat, lng };
            }

            // Gas cylinder: the settings form only owns size/connection/notes.
            // last_changed_* is stamped from the dashboard, so merge rather than
            // overwrite or a save here would wipe the replacement date.
            if (formData.gas_cylinder_size && formData.gas_cylinder_connection) {
                updates.gas_cylinder = {
                    ...(house.gas_cylinder || {}),
                    size: formData.gas_cylinder_size,
                    connection: formData.gas_cylinder_connection,
                    notes: formData.gas_cylinder_notes || ''
                };
            }

            await updateDoc(doc(db, 'houses', house.id), updates);

            // Sync Guest View
            if (house.guest_token) {
                await setDoc(doc(db, 'guest_views', house.guest_token), {
                    houseId: house.id,
                    name: formData.name,
                    address: formData.address,
                    wifi_ssid: formData.wifi_ssid,
                    wifi_password: formData.wifi_password,
                    no_wifi: formData.no_wifi,
                    house_rules: formData.house_rules,
                    house_rules_en: formData.house_rules_en,
                    check_in_time: formData.check_in_time,
                    check_out_time: formData.check_out_time,
                    directions: formData.directions,
                    directions_en: formData.directions_en,
                    access_instructions: formData.access_instructions,
                    access_instructions_en: formData.access_instructions_en,
                    emergency_contact: formData.emergency_contact,
                    guest_instructions: formData.guest_instructions,
                    guest_instructions_en: formData.guest_instructions_en,
                    amenities: formData.amenities,
                    ...(updates.location && { location: updates.location }),
                    image_url: house.image_url || '',
                    gallery_urls: house.gallery_urls || [],
                    updated_at: new Date()
                }, { merge: true });
            }

            const updatedHouse = { ...house, ...updates } as House;
            setHouse(updatedHouse);

            // Also need to update the app store's currentHouse but we need to find it first in list
            // For now, simple success message
            setSuccess('Breytingar vistaðar!');

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            logger.error('Error updating house:', err);
            setError('Villa kom upp við að vista breytingar.');
        } finally {
            setIsSaving(false);
        }
    };

    return { isSaving, handleSaveHouse };
}
