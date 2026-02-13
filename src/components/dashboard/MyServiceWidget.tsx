import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAppStore } from '@/store/appStore';
import type { ServiceProvider } from '@/types/models';
import { Wrench, Star, Eye, Edit2 } from 'lucide-react';

export default function MyServiceWidget() {
    const { currentUser } = useAppStore();
    const [provider, setProvider] = useState<ServiceProvider | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProvider = async () => {
            if (!currentUser) return;
            try {
                const q = query(
                    collection(db, 'service_providers'),
                    where('owner_uid', '==', currentUser.uid)
                );
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const data = snapshot.docs[0].data() as ServiceProvider;
                    setProvider({ ...data, id: snapshot.docs[0].id });
                }
            } catch (error) {
                console.error('Error fetching my service:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProvider();
    }, [currentUser]);

    if (loading) return null; // Or a skeleton
    if (!provider) return null; // Don't show if user isn't a provider

    return (
        <div className="card p-6 border-amber/30 border">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber/10 rounded-lg text-amber">
                        <Wrench size={20} />
                    </div>
                    <div>
                        <h3 className="font-serif font-bold text-lg text-charcoal">Mín Þjónusta</h3>
                        <p className="text-xs text-grey-mid uppercase tracking-wider font-bold">Verktakaskráning</p>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold ${provider.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {provider.status === 'active' ? 'Virkt' : 'Óvirkt'}
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <h4 className="font-bold text-charcoal">{provider.name}</h4>
                    <p className="text-sm text-grey-mid line-clamp-2">{provider.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-stone-50 p-3 rounded-lg flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-1 text-amber font-bold text-lg">
                            <Star size={16} fill="currentColor" /> {provider.rating_avg.toFixed(1)}
                        </div>
                        <span className="text-xs text-grey-mid">{provider.rating_count} umsagnir</span>
                    </div>
                    <div className="bg-stone-50 p-3 rounded-lg flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-1 text-charcoal font-bold text-lg">
                            <Eye size={16} />
                        </div>
                        <span className="text-xs text-grey-mid">Sýnileiki</span>
                    </div>
                </div>

                <button
                    onClick={() => {
                        // For MVP, just redirect to a simple edit mode or alert
                        alert('Breytingar á skráningu koma bráðum!');
                    }}
                    className="btn btn-outline w-full text-sm flex items-center justify-center gap-2"
                >
                    <Edit2 size={14} /> Breyta skráningu
                </button>
            </div>
        </div>
    );
}
