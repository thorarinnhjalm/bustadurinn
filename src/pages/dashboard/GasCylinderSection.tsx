import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { House, User } from '@/types/models';
import GasCylinderCard from '@/components/dashboard/GasCylinderCard';
import { logger } from '@/utils/logger';

interface GasCylinderSectionProps {
    currentHouse: House;
    currentUser: User | null;
}

/** Gas cylinder — renders only when configured in settings. */
export default function GasCylinderSection({ currentHouse, currentUser }: GasCylinderSectionProps) {
    // Stamps the replacement on the house doc and drops a log line, so the
    // "who last changed it" question has an answer beyond the current value.
    const handleGasCylinderChanged = async () => {
        if (!currentHouse?.gas_cylinder || !currentUser) return;
        try {
            await updateDoc(doc(db, 'houses', currentHouse.id), {
                gas_cylinder: {
                    ...currentHouse.gas_cylinder,
                    last_changed_at: new Date(),
                    last_changed_by: currentUser.uid,
                    last_changed_by_name: currentUser.name
                },
                updated_at: new Date()
            });

            await addDoc(collection(db, 'houses', currentHouse.id, 'internal_logs'), {
                house_id: currentHouse.id,
                user_id: currentUser.uid,
                user_name: currentUser.name,
                text: `${currentUser.name} skipti um gaskút.`,
                kind: 'gas_cylinder_changed',
                created_at: serverTimestamp()
            });
        } catch (error) {
            // Production builds drop raw console output, so a failure here
            // was previously invisible — the button simply did nothing. Rethrow
            // so the card can tell the user something went wrong.
            logger.error('Error recording gas cylinder change:', error);
            throw error;
        }
    };

    return (
        <GasCylinderCard
            gasCylinder={currentHouse.gas_cylinder}
            onRecordChange={handleGasCylinderChanged}
        />
    );
}
