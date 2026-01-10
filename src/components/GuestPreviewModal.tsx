import { useState, useEffect } from 'react';
import { X, Wifi, MapPin, Key, Copy, BookOpen, Sun, Phone, Heart, Share2, Tv, Droplets, Flame, Navigation, ArrowRight } from 'lucide-react';
import { fetchWeather } from '@/utils/weather';
import type { House } from '@/types/models';

// A-Frame Logo
const CabinLogo = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L2 22H22L12 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 15V22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

interface GuestPreviewModalProps {
    house: House;
    isOpen: boolean;
    onClose: () => void;
}

export default function GuestPreviewModal({ house, isOpen, onClose }: GuestPreviewModalProps) {
    const [copied, setCopied] = useState('');
    const [weather, setWeather] = useState<{ temp: number | string, condition: string }>({ temp: '—', condition: 'Hleður...' });

    useEffect(() => {
        if (isOpen && house.location?.lat && house.location?.lng) {
            fetchWeather(house.location.lat, house.location.lng)
                .then(wData => {
                    if (wData) {
                        setWeather({ temp: `${wData.temp}°C`, condition: wData.condition });
                    }
                })
                .catch(() => setWeather({ temp: '?', condition: 'Villa' }));
        }
    }, [isOpen, house.location]);

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(label);
            setTimeout(() => setCopied(''), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (!isOpen) return null;

    const houseName = house.name || 'Sumarhús';
    const accessCode = house.access_instructions?.match(/\d{4,6}/)?.[0];

    // Build amenities list from data
    const amenityConfig: { [key: string]: { label: string; icon: React.ReactNode } } = {
        hot_tub: { label: 'Heitur pottur', icon: <Droplets size={20} /> },
        grill: { label: 'Grill', icon: <Flame size={20} /> },
        tv: { label: 'Sjónvarp / Apple TV', icon: <Tv size={20} /> },
        sauna: { label: 'Sauna / Gufa', icon: <Droplets size={20} /> },
        washer: { label: 'Þvottavél', icon: <Droplets size={20} /> },
        dishwasher: { label: 'Uppþvottavél', icon: <Droplets size={20} /> },
        fireplace: { label: 'Arinn', icon: <Flame size={20} /> },
        outdoor_furniture: { label: 'Verönd / Garðhúsgögn', icon: <BookOpen size={20} /> },
        kayak: { label: 'Kajak / Bátur', icon: <Droplets size={20} /> },
        bikes: { label: 'Reiðhjól', icon: <BookOpen size={20} /> },
        games: { label: 'Leikir / Spil', icon: <BookOpen size={20} /> },
        coffee_machine: { label: 'Kaffivél', icon: <BookOpen size={20} /> }
    };

    const guides = [
        // Add house rules if present
        ...(house.house_rules ? [{ id: 'rules', title: 'Húsreglur', icon: <BookOpen size={20} /> }] : []),
        // Add amenities from data
        ...(house.amenities || []).map((amenityId: string) => ({
            id: amenityId,
            title: amenityConfig[amenityId]?.label || amenityId,
            icon: amenityConfig[amenityId]?.icon || <BookOpen size={20} />
        }))
    ];

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Container */}
            <div className="absolute inset-4 md:inset-8 lg:inset-16 bg-[#FDFCF8] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 bg-black/50 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Preview Banner */}
                <div className="bg-amber-500 text-white text-center py-2 text-sm font-medium">
                    👁️ Forskoðun gestasíðu — Þannig sjá gestir upplýsingarnar
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* HERO HEADER */}
                    <header className="relative pt-8 pb-24 px-6 rounded-b-[2.5rem] shadow-2xl overflow-hidden min-h-[340px] flex flex-col justify-between">
                        {/* Background Image */}
                        <div className="absolute inset-0 z-0">
                            <img
                                src={house.image_url || "https://images.unsplash.com/photo-1542718610-a1d656d1884c?q=80&w=2670&auto=format&fit=crop"}
                                alt="Cabin Background"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80"></div>
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-2 text-[#e8b058] bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-sm">
                                    <CabinLogo size={20} />
                                    <span className="font-serif font-bold tracking-tight text-white text-sm">{houseName}</span>
                                </div>
                                <button className="bg-black/30 backdrop-blur-md p-2 rounded-full hover:bg-black/40 transition-colors text-white border border-white/10">
                                    <Share2 size={18} />
                                </button>
                            </div>

                            <div className="space-y-3 mt-8">
                                <div className="inline-block">
                                    <p className="text-[#e8b058] text-[10px] font-bold uppercase tracking-widest bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md border border-white/5 inline-block">Velkomin</p>
                                </div>
                                <h1 className="font-serif text-4xl md:text-5xl font-bold text-white drop-shadow-xl leading-tight">
                                    Góðan daginn!
                                </h1>

                                <div className="flex flex-wrap gap-2">
                                    <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                        <p className="text-stone-200 text-sm font-medium">Dvalaðgangur virkur</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* MAIN CONTENT */}
                    <main className="px-4 -mt-16 relative z-20 space-y-4 max-w-md mx-auto pb-8">
                        {/* ACCESS CARD */}
                        <div className="bg-white p-6 rounded-2xl shadow-xl shadow-stone-200 border border-stone-100">
                            <div className="flex justify-between items-start mb-6 border-b border-stone-100 pb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Sun size={18} className="text-[#e8b058]" />
                                        <span className="font-bold text-xl">{weather.temp}</span>
                                    </div>
                                    <p className="text-xs text-stone-400">{weather.condition}</p>
                                </div>
                                <div className="bg-stone-50 p-2 rounded-lg">
                                    <MapPin size={20} className="text-[#1a1a1a]" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Door Code */}
                                {accessCode && (
                                    <div
                                        onClick={() => copyToClipboard(accessCode, 'code')}
                                        className="bg-[#1a1a1a] rounded-xl p-4 text-center relative overflow-hidden group cursor-pointer shadow-lg shadow-stone-200"
                                    >
                                        <p className="text-stone-400 text-[10px] uppercase tracking-widest mb-1">Lyklabox / Kóði</p>
                                        <p className="text-white font-mono text-3xl font-bold tracking-[0.2em]">{accessCode}</p>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600 group-hover:text-[#e8b058] transition-colors">
                                            {copied === 'code' ? <span className="text-xs">✓</span> : <Copy size={16} />}
                                        </div>
                                    </div>
                                )}

                                {/* WiFi */}
                                {(house.wifi_ssid || house.wifi_password) && (
                                    <div className="flex gap-3">
                                        {house.wifi_ssid && (
                                            <div className="flex-1 bg-stone-50 rounded-xl p-3 border border-stone-100">
                                                <div className="flex items-center gap-2 mb-1 text-stone-400">
                                                    <Wifi size={14} /> <span className="text-[10px] uppercase font-bold">Netið</span>
                                                </div>
                                                <p className="font-bold text-sm text-[#1a1a1a] truncate">{house.wifi_ssid}</p>
                                            </div>
                                        )}
                                        {house.wifi_password && (
                                            <div
                                                onClick={() => copyToClipboard(house.wifi_password!, 'wifi')}
                                                className="flex-1 bg-stone-50 rounded-xl p-3 border border-stone-100 cursor-pointer hover:border-[#e8b058] transition-colors relative group"
                                            >
                                                <div className="flex items-center gap-2 mb-1 text-stone-400">
                                                    <Key size={14} /> <span className="text-[10px] uppercase font-bold">Lykilorð</span>
                                                </div>
                                                <p className="font-bold text-sm text-[#1a1a1a] truncate">{house.wifi_password}</p>
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {copied === 'wifi' ? <span className="text-xs text-[#e8b058]">✓</span> : <Copy size={12} className="text-[#e8b058]" />}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* GALLERY PREVIEW */}
                        {house.gallery_urls && house.gallery_urls.length > 0 && (
                            <div className="bg-white p-1 rounded-2xl shadow-xl shadow-stone-200 border border-stone-100 overflow-hidden">
                                <div className="px-5 py-4 flex justify-between items-center">
                                    <h3 className="font-serif text-lg font-bold">Myndir</h3>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{house.gallery_urls.length} myndir</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 p-1">
                                    {house.gallery_urls.slice(0, 4).map((url: string, i: number) => (
                                        <div key={i} className="relative overflow-hidden aspect-square">
                                            <img
                                                src={url}
                                                alt={`House view ${i + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* GUIDES GRID */}
                        <div className="grid grid-cols-2 gap-3">
                            {house.location?.lat && house.location?.lng && (
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 group text-left col-span-2 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <Navigation size={20} />
                                    </div>
                                    <div>
                                        <span className="font-bold text-sm text-[#1a1a1a] block">Rata í hús</span>
                                        <span className="text-xs text-stone-500">Opna í Google Maps</span>
                                    </div>
                                    <ArrowRight size={16} className="ml-auto text-stone-300" />
                                </div>
                            )}

                            {guides.map(guide => (
                                <button key={guide.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 group text-left">
                                    <div className="w-10 h-10 rounded-full bg-stone-50 text-[#1a1a1a] flex items-center justify-center mb-3">
                                        {guide.icon}
                                    </div>
                                    <span className="font-bold text-sm text-[#1a1a1a]">{guide.title}</span>
                                </button>
                            ))}
                        </div>

                        {/* CONTACT */}
                        <div className="space-y-3">
                            {house.emergency_contact && (
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                                            <Phone size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-[#1a1a1a]">Hringja í eiganda</p>
                                            <p className="text-xs text-stone-500">{house.emergency_contact}</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={16} className="text-stone-300" />
                                </div>
                            )}
                        </div>

                        {/* GUESTBOOK CTA */}
                        <div className="pt-4">
                            <div className="bg-[#e8b058]/10 rounded-xl p-6 border border-[#e8b058]/30">
                                <div className="flex justify-center mb-3">
                                    <Heart className="fill-[#e8b058] text-[#e8b058]" size={32} />
                                </div>
                                <h3 className="font-serif text-lg font-bold text-[#1a1a1a] mb-2 text-center">Skrifaðu í gestabókina</h3>
                                <p className="text-sm text-stone-600 text-center">
                                    Deildu hugsunum og minningum frá dvöl þinni
                                </p>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
