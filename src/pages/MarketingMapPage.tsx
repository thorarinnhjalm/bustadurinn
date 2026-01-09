import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, Home } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

declare const google: any;

interface MapHouse {
    id: string;
    location: {
        lat: number;
        lng: number;
    };
    address?: string; // Optional for privacy? keeping it in for internal map marketing
}

export default function MarketingMapPage() {
    const [loading, setLoading] = useState(true);
    const [houses, setHouses] = useState<MapHouse[]>([]);
    const mapRef = useRef<HTMLDivElement>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    useEffect(() => {
        const fetchHouses = async () => {
            try {
                // Fetch all houses that have location data
                const q = query(collection(db, 'houses'));
                const snapshot = await getDocs(q);

                const validHouses: MapHouse[] = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.location && data.location.lat && data.location.lng) {
                        // Filter out obviously invalid coordinates (e.g. 0,0) if desired, 
                        // though 0,0 is technically valid (off Africa), unlikely for Iceland.
                        if (data.location.lat !== 0 || data.location.lng !== 0) {
                            validHouses.push({
                                id: doc.id,
                                location: data.location,
                                address: data.address
                            });
                        }
                    }
                });

                setHouses(validHouses);
            } catch (error) {
                console.error("Error fetching houses for map:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHouses();
    }, []);

    // Load Google Maps Script
    useEffect(() => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) return;

        if (typeof google === 'undefined' || !google.maps) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&v=weekly`;
            script.async = true;
            script.defer = true;
            script.onload = () => setScriptLoaded(true);
            document.head.appendChild(script);
        } else {
            setScriptLoaded(true);
        }
    }, []);

    // Initialize Map
    useEffect(() => {
        if (scriptLoaded && mapRef.current && houses.length > 0) {
            initMap();
        }
    }, [scriptLoaded, houses]);

    const initMap = async () => {
        if (!mapRef.current) return;

        // Default to Iceland center
        const icelandCenter = { lat: 64.9631, lng: -19.0208 };
        // Create map
        const map = new google.maps.Map(mapRef.current, {
            center: icelandCenter,
            zoom: 6,
            mapId: '4504f8b37365c3d0', // Use a Map ID if you have one, or remove this line for default style
            disableDefaultUI: false,
            styles: [
                {
                    "featureType": "poi",
                    "stylers": [{ "visibility": "off" }]
                }
            ]
        });

        // Add Markers
        // Using AdvancedMarkerElement if available (new API) or generic Marker
        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker") as any;

        houses.forEach(house => {
            // Create a custom pin content
            const pin = new PinElement({
                background: '#D97706', // Amber-600
                borderColor: '#92400E', // Amber-800
                glyphColor: '#FFF',
                scale: 0.8
            });

            new AdvancedMarkerElement({
                map,
                position: house.location,
                title: 'Sumarhús',
                content: pin.element
            });
        });
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Helmet>
                <title>Kort af bústöðum | Bústaðurinn.is</title>
            </Helmet>

            <div className="flex-1 relative bg-stone-100">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/80 backdrop-blur-sm">
                        <div className="text-center">
                            <Loader2 className="w-10 h-10 animate-spin text-amber mx-auto mb-2" />
                            <p className="text-stone-500 font-serif">Hleð korti...</p>
                        </div>
                    </div>
                )}

                <div ref={mapRef} className="w-full h-full min-h-screen" />

                {/* Overlay Card */}
                <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-md border border-stone-200 p-6 rounded-2xl shadow-xl max-w-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-amber p-2 rounded-lg">
                            <Home className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="font-serif text-2xl font-bold text-charcoal m-0">Útbreiðsla</h1>
                    </div>
                    <p className="text-stone-600 mb-4 leading-relaxed">
                        Sjáðu hvar sumarhúsin í kerfinu eru staðsett. Við erum að stækka hratt um allt land!
                    </p>

                    <div className="flex items-center gap-4 text-sm font-medium text-charcoal bg-stone-50 rounded-lg p-3 border border-stone-100">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber animate-pulse"></span>
                            <span>{houses.length} hús skráð</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
