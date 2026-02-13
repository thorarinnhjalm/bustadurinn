import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BookOpen, Heart, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { is } from 'date-fns/locale';
import type { GuestbookEntry } from '@/types/models';

interface GuestbookViewerProps {
    houseId: string;
    isManager?: boolean;
    onDeleteEntry?: (entry: GuestbookEntry) => void;
}

export default function GuestbookViewer({ houseId, isManager, onDeleteEntry }: GuestbookViewerProps) {
    const [entries, setEntries] = useState<GuestbookEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEntries = async () => {
            try {
                const q = query(
                    collection(db, 'guestbook'),
                    where('house_id', '==', houseId),
                    orderBy('created_at', 'desc')
                );
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    created_at: doc.data().created_at?.toDate() || new Date()
                })) as GuestbookEntry[];
                setEntries(data);
            } catch (error) {
                console.error('Error fetching guestbook:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEntries();
    }, [houseId]);

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-grey-mid" />
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <p className="text-grey-mid">Engar færslur í gestabókinni ennþá.</p>
                <p className="text-sm text-stone-400 mt-2">Gestir geta skrifað í gestabókina í gegnum gestahlekk.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {entries.map((entry) => (
                <div key={entry.id} className="bg-white p-6 rounded-lg shadow-sm border border-stone-100 group relative">
                    {/* Delete Button (Manager Only) */}
                    {isManager && onDeleteEntry && (
                        <button
                            onClick={() => onDeleteEntry(entry)}
                            className="absolute top-4 right-4 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                            title="Eyða færslu"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-amber/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Heart className="w-5 h-5 text-amber" />
                        </div>
                        <div className="flex-1 pr-8">
                            <div className="flex items-baseline justify-between mb-2">
                                <h4 className="font-semibold text-charcoal">{entry.author}</h4>
                                <time className="text-xs text-grey-mid">
                                    {format(entry.created_at, 'd. MMMM yyyy', { locale: is })}
                                </time>
                            </div>
                            <p className="text-grey-dark leading-relaxed whitespace-pre-wrap">{entry.message}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
