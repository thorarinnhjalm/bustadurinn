import { useState } from 'react';
import HouseSettings from '@/components/settings/HouseSettings';
import type { House, User } from '@/types/models';
import { searchHMSAddresses, formatHMSAddress } from '@/utils/hmsSearch';
import { logger } from '@/utils/logger';
import type { SetHouseForm } from './types';

interface HouseTabProps {
    house: House;
    isManager: boolean;
    members: User[];
    loadingMembers: boolean;
    isSaving: boolean;
    onSave: (formData: any) => Promise<void>;
    onImageSelect: (e: React.ChangeEvent<HTMLInputElement>, mode: 'main' | 'gallery') => void;
    onRemoveGalleryImage: (url: string) => void;
    setHouseForm: SetHouseForm;
}

/** Hús tab: the read-only note for non-managers plus the house form (HouseSettings) and its address search. */
export default function HouseTab({
    house,
    isManager,
    members,
    loadingMembers,
    isSaving,
    onSave,
    onImageSelect,
    onRemoveGalleryImage,
    setHouseForm,
}: HouseTabProps) {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [debounceTimer, setDebounceTimer] = useState<any>(null);

    const handleAddressChange = (val: string) => {
        setHouseForm(prev => ({ ...prev, address: val }));
        if (!isManager) return;

        if (debounceTimer) clearTimeout(debounceTimer);

        if (val.length >= 2) {
            const timer = setTimeout(async () => {
                try {
                    const hms = await searchHMSAddresses(val);
                    setSuggestions(hms.map(item => ({
                        id: `hms-${item.lat}-${item.lng}-${Math.random()}`,
                        description: formatHMSAddress(item),
                        location: { lat: item.lat, lng: item.lng },
                        source: 'hms'
                    })));
                } catch (e) {
                    logger.error("HMS search error in settings", e);
                }
            }, 400);
            setDebounceTimer(timer);
        } else {
            setSuggestions([]);
        }
    };

    const handleSelectPrediction = (suggestion: any) => {
        setSuggestions([]);
        setHouseForm(prev => ({
            ...prev,
            address: suggestion.description,
            lat: suggestion.location.lat,
            lng: suggestion.location.lng
        }));
    };

    return (
        <>
            {!isManager && (
                <div id="house-readonly-note" className="mb-4 bg-amber/10 border border-amber/30 text-charcoal px-4 py-3 rounded text-sm">
                    Aðeins umsjónarmaður hússins getur breytt húsupplýsingum. Þú getur skoðað þær hér.
                </div>
            )}
            <HouseSettings
                house={house}
                isManager={!!isManager}
                members={members}
                loadingMembers={loadingMembers}
                isSaving={isSaving}
                onSave={onSave}
                onImageSelect={onImageSelect}
                onRemoveGalleryImage={onRemoveGalleryImage}
                suggestions={suggestions}
                handleAddressChange={handleAddressChange}
                handleSelectPrediction={handleSelectPrediction}
            />
        </>
    );
}
