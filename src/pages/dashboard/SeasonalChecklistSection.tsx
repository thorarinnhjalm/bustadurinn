import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { House, User } from '@/types/models';
import SeasonalChecklistCard from '@/components/dashboard/SeasonalChecklistCard';
import { logger } from '@/utils/logger';

interface SeasonalChecklistSectionProps {
    currentHouse: House;
    currentUser: User | null;
    seasonalLogged: { spring: boolean; autumn: boolean };
}

/** Seasonal checklist nudge (spring-opening / winter-closing) and the log write on confirm. */
export default function SeasonalChecklistSection({ currentHouse, currentUser, seasonalLogged }: SeasonalChecklistSectionProps) {
    const handleSeasonalChecklistConfirm = async (season: 'spring' | 'autumn', checklist: Record<string, boolean>) => {
        if (!currentHouse || !currentUser) return;
        const kind = season === 'spring' ? 'seasonal_spring' as const : 'seasonal_autumn' as const;
        const label = season === 'spring' ? 'vor-opnun' : 'vetrarfrágang';
        const text = `${currentUser.name} skráði ${label} bústaðarins.`;
        try {
            await addDoc(collection(db, 'houses', currentHouse.id, 'internal_logs'), {
                house_id: currentHouse.id,
                user_id: currentUser.uid,
                user_name: currentUser.name,
                text,
                kind,
                checklist,
                created_at: serverTimestamp()
            });
        } catch (error) {
            logger.error('Error logging seasonal checklist:', error);
            throw error;
        }
    };

    return (
        <SeasonalChecklistCard
            house={currentHouse}
            seasonalLogged={seasonalLogged}
            onConfirm={handleSeasonalChecklistConfirm}
        />
    );
}
