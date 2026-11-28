import { doc, deleteDoc } from 'firebase/firestore';
import { Heart } from 'lucide-react';
import { db } from '@/lib/firebase';
import GuestbookViewer from '@/components/GuestbookViewer';
import type { House, User } from '@/types/models';
import { logger } from '@/utils/logger';
import type { SettingsFeedback } from './types';

interface GuestbookTabProps extends SettingsFeedback {
    house: House;
    currentUser: User | null | undefined;
    /** The page-level success banner text; GuestbookViewer is re-keyed with it so it reloads after a delete. */
    success: string;
}

export default function GuestbookTab({ house, currentUser, success, setSuccess, setError }: GuestbookTabProps) {
    const handleDeleteGuestbookEntry = async (entry: any) => {
        if (!confirm('Ertu viss um að þú viljir eyða þessari færslu úr gestabókinni?')) return;
        try {
            await deleteDoc(doc(db, 'guestbook', entry.id));
            // Force refresh of guestbook viewer?
            // Since GuestbookViewer fetches its own data on mount/update, we might need a way to trigger refresh.
            // For now, simple approach: The component manages its own state? No, it fetches on mount.
            // We can pass a key to force re-render or let it handle its own update if we passed the list.
            // Actually, GuestbookViewer manages its own state.
            // We should probably move the state up OR make GuestbookViewer listen to changes.
            // OR simpler: Just reload the page or show success and let user refresh.
            // BETTER: Pass a "refreshTrigger" prop to GuestbookViewer?
            setSuccess('Færslu eytt');
            setTimeout(() => setSuccess(''), 2000);

            // To make the UI update immediately without refresh, we would need to lift state up.
            // Given the complexity constraints, I'll trigger a re-mount by changing key or similar.
            // But let's look at how GuestbookViewer is implemented.
            // It fetches data in useEffect.
        } catch (e) {
            logger.error('Error deleting guestbook entry:', e);
            setError('Gat ekki eytt færslu');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Heart className="w-6 h-6 text-amber-ink" aria-hidden="true" />
                    <h2 className="text-xl font-serif">Gestabók</h2>
                </div>
                <p className="text-grey-dark mb-6">
                    Hér geta gestir og fjölskyldumeðlimir skrifað minningar og upplifanir af dvöl sinni í húsinu.
                    Fagurt skjalasafn til að líta til baka.
                </p>
                <GuestbookViewer
                    houseId={house.id}
                    // Force re-render on delete/success? Simple key change
                    key={success}
                    isManager={house.manager_id === currentUser?.uid}
                    onDeleteEntry={handleDeleteGuestbookEntry}
                />
            </div>
        </div>
    );
}
