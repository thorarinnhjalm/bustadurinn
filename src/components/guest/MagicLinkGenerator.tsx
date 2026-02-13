import { useState, useEffect } from 'react';
import { format, addDays, subDays, isPast, isFuture } from 'date-fns';
import { is } from 'date-fns/locale';
import {
    Link as LinkIcon,
    Calendar,
    Copy,
    Check,
    Plus,
    Trash2
} from 'lucide-react';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    deleteDoc,
    doc,
    serverTimestamp,
    setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Booking, House } from '@/types/models';

interface MagicLinkGeneratorProps {
    house: House;
}

interface GuestLink {
    id: string; // The token
    booking_id?: string;
    guest_name?: string;
    valid_from?: Date;
    valid_until?: Date;
    created_at: Date;
    page_views?: number;
}

export default function MagicLinkGenerator({ house }: MagicLinkGeneratorProps) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [activeLinks, setActiveLinks] = useState<GuestLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState<string | null>(null); // bookingId
    const [copied, setCopied] = useState<string | null>(null);

    // Load data
    useEffect(() => {
        const fetchData = async () => {
            if (!house.id) return;

            try {
                // 1. Fetch upcoming bookings
                const bookingsRef = collection(db, 'bookings');
                const qBookings = query(
                    bookingsRef,
                    where('house_id', '==', house.id),
                    // We ideally want only future/recent bookings.
                    // Firestore limitation: cannot filter by 'end' > now AND sort by 'start' easily without index
                    // So we fetch a reasonable amount and filter client side
                    orderBy('start', 'asc')
                );

                const bookingsSnap = await getDocs(qBookings);
                const recentBookings = bookingsSnap.docs
                    .map(d => ({
                        id: d.id,
                        ...d.data(),
                        start: d.data().start.toDate(),
                        end: d.data().end.toDate()
                    } as Booking))
                    .filter(b => isFuture(addDays(b.end, 2))); // Filter out bookings older than 2 days past checkout

                setBookings(recentBookings);

                // 2. Fetch existing guest links for this house
                // Note: We need to query 'guest_views' where houseId == house.id
                // This requires an index usually, or we can just keep track effectively.
                // Assuming 'guest_views' has 'houseId' field.
                const linksRef = collection(db, 'guest_views');
                const qLinks = query(linksRef, where('houseId', '==', house.id));
                const linksSnap = await getDocs(qLinks);

                const links = linksSnap.docs.map(d => ({
                    id: d.id,
                    ...d.data(),
                    valid_from: d.data().valid_from?.toDate(),
                    valid_until: d.data().valid_until?.toDate(),
                    created_at: d.data().created_at?.toDate() || new Date()
                })) as GuestLink[];

                setActiveLinks(links);

            } catch (error) {
                console.error("Error fetching guest links data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [house.id]);

    const handleCreateLink = async (booking: Booking) => {
        setGenerating(booking.id);
        try {
            // Generate distinct token
            const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

            // Logic: Valid from 24h before check-in until 24 hours after check-out
            const validFrom = subDays(booking.start, 1);
            const validUntil = addDays(booking.end, 1);

            // Create the view document (Copying house data for security isolation)
            await setDoc(doc(db, 'guest_views', token), {
                houseId: house.id,
                booking_id: booking.id,
                guest_name: booking.user_name || 'Gestur',

                // House Info Snapshot
                house_name: house.name,
                address: house.address,
                wifi_ssid: house.wifi_ssid,
                wifi_password: house.wifi_password,
                house_rules: house.house_rules,
                check_in_time: house.check_in_time,
                check_out_time: house.check_out_time,
                directions: house.directions,
                access_instructions: house.access_instructions,
                emergency_contact: house.emergency_contact,
                location: userLocationFromHouse(house),
                image_url: house.image_url,

                // Validity
                valid_from: validFrom,
                valid_until: validUntil,
                created_at: serverTimestamp(),
                active: true
            });

            // Update local state
            const newLink: GuestLink = {
                id: token,
                booking_id: booking.id,
                guest_name: booking.user_name,
                valid_from: validFrom,
                valid_until: validUntil,
                created_at: new Date()
            };

            setActiveLinks([...activeLinks, newLink]);

        } catch (error) {
            console.error("Error creating link:", error);
            alert("Villa við að búa til hlekk");
        } finally {
            setGenerating(null);
        }
    };

    const handleDeleteLink = async (token: string) => {
        if (!confirm('Ertu viss um að þú viljir eyða þessum hlekk? Gesturinn missir aðgang strax.')) return;

        try {
            await deleteDoc(doc(db, 'guest_views', token));
            setActiveLinks(activeLinks.filter(l => l.id !== token));
        } catch (error) {
            console.error("Error deleting link:", error);
        }
    };

    const copyLink = (token: string) => {
        const url = `${window.location.origin}/guest/${token}`;
        navigator.clipboard.writeText(url);
        setCopied(token);
        setTimeout(() => setCopied(null), 2000);
    };

    const userLocationFromHouse = (h: House) => {
        if (h.location?.lat && h.location?.lng) {
            return { lat: h.location.lat, lng: h.location.lng };
        }
        return { lat: 0, lng: 0 };
    };

    if (loading) return <div className="p-4 text-center text-grey-mid">Hleð bókunum...</div>;

    return (
        <div className="space-y-8">

            {/* Intro */}
            <div className="bg-amber/10 p-6 rounded-lg border border-amber/20">
                <h3 className="text-lg font-serif font-bold text-charcoal mb-2 flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-amber" />
                    Tímabundnir Gestahlekkir
                </h3>
                <p className="text-sm text-charcoal/80 leading-relaxed">
                    Hér getur þú búið til sérstaka hlekki fyrir hverja bókun.
                    Hlekkurinn virkar sjálfkrafa frá <strong>24 klst fyrir komu</strong> þar til <strong>24 klst eftir brottför</strong>.
                    Gesturinn þarf engan aðgang, bara hlekkinn.
                </p>
            </div>

            {/* Bookings List */}
            <div className="space-y-4">
                <h4 className="font-serif font-bold text-charcoal">Næstu Bókanir</h4>

                {bookings.length === 0 ? (
                    <div className="text-center p-8 border-2 border-dashed border-stone-200 rounded-lg text-stone-500">
                        Engar framtíðarbókanir fundust.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {bookings.map(booking => {
                            const existingLink = activeLinks.find(l => l.booking_id === booking.id);
                            const isPastBooking = isPast(booking.end);

                            return (
                                <div key={booking.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-amber/30">

                                    {/* Booking Info */}
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${existingLink ? 'bg-green-100 text-green-600' : 'bg-stone-100 text-stone-400'
                                            }`}>
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-charcoal">
                                                {booking.user_name || 'Óþekktur gestur'}
                                            </h5>
                                            <div className="text-sm text-stone-500 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {format(booking.start, 'd. MMM', { locale: is })} - {format(booking.end, 'd. MMM', { locale: is })}
                                                </span>
                                                {isPastBooking && (
                                                    <span className="text-amber-600 font-medium text-xs bg-amber/10 px-2 py-0.5 rounded-full">
                                                        Liðin bókun
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div>
                                        {existingLink ? (
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col items-end mr-2">
                                                    <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                                                        <Check className="w-3 h-3" /> Hlekkur virkur
                                                    </span>
                                                    <span className="text-[10px] text-stone-400">
                                                        Renner út: {existingLink.valid_until ? format(existingLink.valid_until, 'd. MMM HH:mm') : 'Aldrei'}
                                                    </span>
                                                </div>

                                                <button
                                                    onClick={() => copyLink(existingLink.id)}
                                                    className="btn btn-secondary p-2 h-10 w-10 flex items-center justify-center rounded-lg"
                                                    title="Afrita hlekk"
                                                >
                                                    {copied === existingLink.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteLink(existingLink.id)}
                                                    className="btn btn-ghost p-2 h-10 w-10 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                                                    title="Eyða hlekk"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleCreateLink(booking)}
                                                disabled={generating === booking.id}
                                                className="btn btn-primary bg-stone-900 text-white w-full md:w-auto px-4 py-2 text-sm flex items-center justify-center gap-2"
                                            >
                                                {generating === booking.id ? (
                                                    <span className="animate-spin">⌛</span>
                                                ) : (
                                                    <Plus className="w-4 h-4" />
                                                )}
                                                Búa til gestahlekk
                                            </button>
                                        )}
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Manual / Permanent Links Section (Optional, if we want to separate them) */}
            {/* Keeping it simple for now, focusing on the Booking Links as requested */}

        </div>
    );
}
