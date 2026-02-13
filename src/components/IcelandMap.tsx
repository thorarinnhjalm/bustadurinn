import { Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface IcelandMapProps {
    showStats?: boolean;
}

export default function IcelandMap({ showStats = true }: IcelandMapProps) {
    const [houseCount, setHouseCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    // Fetch real house count from Firestore
    useEffect(() => {
        const fetchHouseCount = async () => {
            try {
                const housesSnapshot = await getDocs(collection(db, 'houses'));
                // Filter out any test/invalid houses
                const validHouses = housesSnapshot.docs.filter(doc => {
                    const data = doc.data();
                    return data.location && data.location.lat && data.location.lng;
                });
                setHouseCount(validHouses.length);
            } catch (error) {
                console.error('Error fetching house count:', error);
                setHouseCount(0);
            } finally {
                setLoading(false);
            }
        };

        fetchHouseCount();
    }, []);

    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    return (
        <div className="relative w-full max-w-5xl mx-auto">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                {/* Google Maps Embed - Iceland view, no zoom controls */}
                <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-2xl shadow-xl border-2 border-stone-200"
                    style={{ minHeight: '450px' }}
                    loading="lazy"
                    allowFullScreen={false}
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/view?key=${googleMapsApiKey}&center=64.9631,-19.0208&zoom=6&maptype=roadmap`}
                ></iframe>

                {/* Overlay to prevent interaction */}
                <div className="absolute inset-0 pointer-events-none rounded-2xl"></div>
            </div>

            {/* Stats Overlay */}
            {showStats && (
                <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm border-2 border-stone-200 rounded-2xl px-5 py-4 shadow-xl z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber/15 rounded-xl">
                            <Home className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            {loading ? (
                                <p className="text-xl font-serif text-charcoal">Hleð...</p>
                            ) : (
                                <>
                                    <p className="text-3xl font-serif font-bold text-charcoal leading-none">{houseCount}</p>
                                    <p className="text-xs text-stone-600 leading-tight mt-1.5 font-medium">
                                        {houseCount === 1 ? 'sumarhús' : 'sumarhús'} í kerfinu
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Subtle info note */}
            <p className="text-xs text-stone-500 text-center mt-4 italic">
                Kort sýnir svæði þar sem sumarhús í kerfinu eru staðsett
            </p>
        </div>
    );
}
