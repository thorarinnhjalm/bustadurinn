import { useState, useEffect, useId } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
    Wifi, MapPin, Key, Copy, BookOpen,
    Sun, Phone, Heart, Share2, Mail,
    Tv, Droplets, Flame, ArrowRight, Loader2, Navigation
} from 'lucide-react';
import { fetchWeather } from '@/utils/weather';
import { logger } from '@/utils/logger';
import Modal from '@/components/ui/Modal';
import Logo from '@/components/Logo';

// A-Frame Logo
export default function GuestPage() {
    const { token } = useParams();
    const formId = useId();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState('');
    const [weather, setWeather] = useState<{ temp: number | string, condition: string }>({ temp: '—', condition: 'Hleður...' });
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showRules, setShowRules] = useState(false);
    const [sending, setSending] = useState(false);
    const [formStatus, setFormStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const fetchView = async () => {
            if (!token) return;
            try {
                const docSnap = await getDoc(doc(db, 'guest_views', token));
                if (docSnap.exists()) {
                    const viewData = docSnap.data();

                    // Check Time Validity
                    const now = new Date();
                    const validFrom = viewData.valid_from?.toDate ? viewData.valid_from.toDate() : (viewData.valid_from ? new Date(viewData.valid_from) : null);
                    const validUntil = viewData.valid_until?.toDate ? viewData.valid_until.toDate() : (viewData.valid_until ? new Date(viewData.valid_until) : null);

                    if (validFrom && now < validFrom) {
                        setError(`Þessi hlekkur virkjast þann ${validFrom.toLocaleDateString('is-IS')} kl. ${validFrom.toLocaleTimeString('is-IS', { hour: '2-digit', minute: '2-digit' })}`);
                        setLoading(false);
                        return;
                    }

                    if (validUntil && now > validUntil) {
                        setError('Þessi hlekkur er útrunninn.');
                        setLoading(false);
                        return;
                    }

                    setData(viewData);

                    // Fetch weather
                    if (viewData.location?.lat && viewData.location?.lng) {
                        try {
                            const wData = await fetchWeather(viewData.location.lat, viewData.location.lng);
                            if (wData) {
                                setWeather({ temp: `${wData.temp}°C`, condition: wData.condition });
                            }
                        } catch (e) {
                            logger.error('Weather fetch error:', e);
                        }
                    } else {
                        setWeather({ temp: '?', condition: 'Vantar staðsetningu' });
                    }
                } else {
                    setError('Hlekkurinn er útrunninn eða ógildur.');
                }
            } catch (err: any) {
                if (err?.code === 'permission-denied') {
                    setError('Þessi hlekkur er útrunninn.');
                } else {
                    logger.error('Error loading guest view:', err);
                    setError('Villa kom upp. Gakktu úr skugga um að hlekkurinn sé réttur.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchView();
    }, [token]);

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(label);
            setTimeout(() => setCopied(''), 2000);
        } catch (err) {
            logger.error('Failed to copy:', err);
        }
    };

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
        ...(data?.house_rules ? [{ id: 'rules', title: 'Húsreglur', icon: <BookOpen size={20} /> }] : []),
        // Add amenities from data
        ...(data?.amenities || []).map((amenityId: string) => ({
            id: amenityId,
            title: amenityConfig[amenityId]?.label || amenityId,
            icon: amenityConfig[amenityId]?.icon || <BookOpen size={20} />
        }))
    ];

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#FDFCF8]">
                <Loader2 className="animate-spin text-[#1a1a1a]" size={32} aria-hidden="true" />
                <span role="status" className="sr-only">Hleð…</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center p-6 text-center bg-[#FDFCF8]">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200">
                    <h1 className="text-xl font-serif mb-2 text-[#1a1a1a]">Upplýsingar fannst ekki</h1>
                    <p className="text-stone-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!data) return null;


    const houseName = data.house_name ?? data.name ?? 'Sumarhús';

    return (
        <div className="min-h-screen bg-[#FDFCF8] text-[#1a1a1a] font-sans pb-10">

            {/* HERO HEADER with Background Image */}
            <header className="relative pt-8 pb-24 px-6 rounded-b-[2.5rem] shadow-2xl overflow-hidden min-h-[340px] flex flex-col justify-between">

                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={data.image_url || "https://images.unsplash.com/photo-1542718610-a1d656d1884c?q=80&w=2670&auto=format&fit=crop"}
                        alt={`Mynd af ${houseName}`}
                        className="w-full h-full object-cover"
                    />
                    {/* Gradient Overlay - Darkened top for visibility */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-8">
                        {/* Glass Container for Logo & Name */}
                        <div className="flex items-center gap-2 text-[#e8b058] bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-sm">
                            <Logo size={20} decorative />
                            <span className="font-serif font-bold tracking-tight text-white text-sm">{houseName}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: `Gestasíða - ${houseName}`,
                                        url: window.location.href
                                    });
                                }
                            }}
                            aria-label="Deila síðunni" className="bg-black/30 backdrop-blur-md p-2 rounded-full hover:bg-black/40 transition-colors text-white border border-white/10"
                        >
                            <Share2 size={18} aria-hidden="true" />
                        </button>
                    </div>

                    <div className="space-y-3 mt-8">
                        {/* Glass Pill for "Velkomin" */}
                        <div className="inline-block">
                            <p className="text-[#e8b058] text-[10px] font-bold uppercase tracking-widest bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md border border-white/5 inline-block">Velkomin</p>
                        </div>
                        <h1 className="font-serif text-4xl md:text-5xl font-bold text-white drop-shadow-xl leading-tight">
                            Góðan daginn!
                        </h1>

                        {/* Information Pills */}
                        <div className="flex flex-wrap gap-2">
                            <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full motion-safe:animate-pulse" aria-hidden="true"></div>
                                <p className="text-stone-200 text-sm font-medium">Dvalaðgangur virkur</p>
                            </div>

                            {/* Expiration Notice (if available) */}
                            {data.valid_until && (() => {
                                const expiryDate = data.valid_until.toDate ? data.valid_until.toDate() : new Date(data.valid_until);
                                const isExpiringSoon = (expiryDate.getTime() - Date.now()) < (24 * 60 * 60 * 1000); // Less than 24h

                                return (
                                    <div className={`inline-flex items-center gap-2 backdrop-blur-md border px-4 py-2 rounded-full ${isExpiringSoon
                                        ? 'bg-red-500/40 border-red-300/30'
                                        : 'bg-black/40 border-white/10'
                                        }`}>
                                        <p className="text-stone-200 text-sm font-medium">
                                            Gildir til {expiryDate.toLocaleDateString('is-IS', { day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT CARD */}
            <main className="px-4 -mt-16 relative z-20 space-y-4 max-w-md mx-auto">

                {/* ACCESS CARD */}
                <section aria-labelledby={`${formId}-access`} className="bg-white p-6 rounded-2xl shadow-xl shadow-stone-200 border border-stone-100">
                    <h2 id={`${formId}-access`} className="sr-only">Aðgangur og upplýsingar</h2>
                    <div className="flex justify-between items-start mb-6 border-b border-stone-100 pb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sun size={18} className="text-amber-ink" aria-hidden="true" />
                                <span className="font-bold text-xl">{weather.temp}</span>
                            </div>
                            <p className="text-xs text-stone-500">{weather.condition}</p>
                        </div>
                        <div className="bg-stone-50 p-2 rounded-lg">
                            <MapPin size={20} className="text-[#1a1a1a]" aria-hidden="true" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Door Code */}
                        {(() => {
                            const accessCode = data.access_instructions?.match(/\d{4,6}/)?.[0];
                            return accessCode ? (
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(accessCode, 'code')}
                                    className="block w-full bg-[#1a1a1a] rounded-xl p-4 text-center relative overflow-hidden group cursor-pointer shadow-lg shadow-stone-200"
                                >
                                    <span className="block text-stone-300 text-[10px] uppercase tracking-widest mb-1">Lyklabox / Kóði</span>
                                    <span className="block text-white font-mono text-3xl font-bold tracking-[0.2em]">{accessCode}</span>
                                    <span className="sr-only">Ýttu til að afrita kóðann</span>
                                    <span aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 group-hover:text-[#e8b058] transition-colors">
                                        {copied === 'code' ? <span className="text-xs">✓</span> : <Copy size={16} />}
                                    </span>
                                </button>
                            ) : null;
                        })()}

                        {/* WiFi */}
                        {(data.wifi_ssid || data.wifi_password) && (
                            <div className="flex gap-3">
                                {data.wifi_ssid && (
                                    <div className="flex-1 bg-stone-50 rounded-xl p-3 border border-stone-100">
                                        <div className="flex items-center gap-2 mb-1 text-stone-500">
                                            <Wifi size={14} aria-hidden="true" /> <span className="text-[10px] uppercase font-bold">Netið</span>
                                        </div>
                                        <p className="font-bold text-sm text-[#1a1a1a] truncate">{data.wifi_ssid}</p>
                                    </div>
                                )}
                                {data.wifi_password && (
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(data.wifi_password, 'wifi')}
                                        className="flex-1 min-w-0 text-left bg-stone-50 rounded-xl p-3 border border-stone-100 cursor-pointer hover:border-[#e8b058] transition-colors relative group"
                                    >
                                        <span className="flex items-center gap-2 mb-1 text-stone-500">
                                            <Key size={14} aria-hidden="true" /> <span className="text-[10px] uppercase font-bold">Wi-Fi lykilorð</span>
                                        </span>
                                        <span className="block font-bold text-sm text-[#1a1a1a] truncate">{data.wifi_password}</span>
                                        <span className="sr-only">Ýttu til að afrita lykilorðið</span>
                                        <span aria-hidden="true" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity">
                                            {copied === 'wifi' ? <span className="text-xs text-amber-ink">✓</span> : <Copy size={12} className="text-amber-ink" />}
                                        </span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <p role="status" className="sr-only">
                        {copied === 'code' ? 'Kóði afritaður' : copied === 'wifi' ? 'Lykilorð afritað' : ''}
                    </p>
                </section>

                {/* GALLERY SECTION */}
                {data.gallery_urls && data.gallery_urls.length > 0 && (
                    <div className="bg-white p-1 rounded-2xl shadow-xl shadow-stone-200 border border-stone-100 overflow-hidden">
                        <div className="px-5 py-4 flex justify-between items-center">
                            <h2 className="font-serif text-lg font-bold">Myndir</h2>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 underline decoration-amber underline-offset-4">{data.gallery_urls.length} myndir</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 p-1">
                            {data.gallery_urls.map((url: string, i: number) => (
                                <div key={i} className={`relative overflow-hidden ${i === 0 && data.gallery_urls.length % 2 !== 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`}>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedImage(url)}
                                        aria-label={`Opna mynd ${i + 1} í fullri stærð`}
                                        className="block w-full h-full"
                                    >
                                        <img
                                            src={url}
                                            alt={`Mynd ${i + 1} úr myndasafni`}
                                            loading="lazy"
                                            className="w-full h-full object-cover cursor-pointer motion-safe:hover:scale-105 transition-transform duration-500"
                                        />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* GUIDES GRID */}
                <section aria-labelledby={`${formId}-guides`} className="grid grid-cols-2 gap-3">
                    <h2 id={`${formId}-guides`} className="sr-only">Leiðbeiningar og leiðarlýsing</h2>
                    {/* Directions Button (Dynamic based on GPS) */}
                    {data.location?.lat && data.location?.lng && (
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${data.location.lat},${data.location.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 hover:border-[#e8b058] transition-all group text-left col-span-2 flex items-center gap-4"
                        >
                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <Navigation size={20} aria-hidden="true" />
                            </div>
                            <div>
                                <span className="font-bold text-sm text-[#1a1a1a] block">Rata í hús</span>
                                <span className="text-xs text-stone-500">Opna í Google Maps<span className="sr-only"> (opnast í nýjum glugga)</span></span>
                            </div>
                            <ArrowRight size={16} aria-hidden="true" className="ml-auto text-stone-300 group-hover:text-emerald-600" />
                        </a>
                    )}

                    {guides.map(guide => guide.id === 'rules' ? (
                        // The house rules tile opens the rules text; amenity tiles below are informational only.
                        <button
                            type="button"
                            key={guide.id}
                            onClick={() => setShowRules(true)}
                            className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 hover:border-[#e8b058] transition-all group text-left"
                        >
                            <div className="w-10 h-10 rounded-full bg-stone-50 text-[#1a1a1a] flex items-center justify-center mb-3 group-hover:bg-[#1a1a1a] group-hover:text-white transition-colors">
                                {guide.icon}
                            </div>
                            <span className="font-bold text-sm text-[#1a1a1a]">{guide.title}</span>
                        </button>
                    ) : (
                        <div key={guide.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 text-left">
                            <div className="w-10 h-10 rounded-full bg-stone-50 text-[#1a1a1a] flex items-center justify-center mb-3">
                                {guide.icon}
                            </div>
                            <span className="font-bold text-sm text-[#1a1a1a]">{guide.title}</span>
                        </div>
                    ))}
                </section>

                {/* CONTACT OWNER / EMERGENCY */}
                <section aria-labelledby={`${formId}-contact`} className="space-y-3">
                    <h2 id={`${formId}-contact`} className="sr-only">Hafa samband</h2>
                    {data.emergency_contact && (
                        <a
                            href={`tel:${data.emergency_contact}`}
                            className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex items-center justify-between hover:bg-red-50 hover:border-red-100 transition-colors group block"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                                    <Phone size={18} aria-hidden="true" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-[#1a1a1a]">Hringja í eiganda</p>
                                    <p className="text-xs text-stone-500">{data.emergency_contact}</p>
                                </div>
                            </div>
                            <ArrowRight size={16} aria-hidden="true" className="text-stone-300 group-hover:text-red-600" />
                        </a>
                    )}

                    {data.owner_email && (
                        <a
                            href={`mailto:${data.owner_email}?subject=Spurning um ${houseName}`}
                            className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex items-center justify-between hover:bg-blue-50 hover:border-blue-100 transition-colors group block"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Mail size={18} aria-hidden="true" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-[#1a1a1a]">Hafa samband við eiganda</p>
                                    <p className="text-xs text-stone-500 truncate max-w-[200px]">{data.owner_email}</p>
                                </div>
                            </div>
                            <ArrowRight size={16} aria-hidden="true" className="text-stone-300 group-hover:text-blue-600" />
                        </a>
                    )}
                </section>

                {/* GUESTBOOK CTA */}
                <div className="pt-4 pb-8">
                    <div className="bg-[#e8b058]/10 rounded-xl p-6 border border-[#e8b058]/30">
                        <div className="flex justify-center mb-3">
                            <Heart className="fill-[#e8b058] text-[#e8b058]" size={32} aria-hidden="true" />
                        </div>
                        <h2 className="font-serif text-lg font-bold text-[#1a1a1a] mb-2 text-center">Skrifaðu í gestabókina</h2>
                        <p className="text-sm text-stone-600 mb-4 text-center">
                            Deildu hugsunum og minningum frá dvöl þinni
                        </p>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.currentTarget;
                            if (sending || !token) return;
                            const formData = new FormData(form);
                            const author = String(formData.get('author') ?? '').trim();
                            const message = String(formData.get('message') ?? '').trim();

                            if (!author || !message) return;

                            setSending(true);
                            setFormStatus(null);
                            try {
                                const response = await fetch('/api/guestbook-entry', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ token, name: author, message })
                                });
                                if (!response.ok) {
                                    throw new Error(`Guestbook request failed: ${response.status}`);
                                }
                                setFormStatus({ type: 'success', text: 'Takk fyrir að skrifa í gestabókina!' });
                                form.reset();
                            } catch (error) {
                                logger.error('Error saving guestbook entry:', error);
                                setFormStatus({ type: 'error', text: 'Villa kom upp. Reyndu aftur.' });
                            } finally {
                                setSending(false);
                            }
                        }} className="space-y-3">
                            <label htmlFor={`${formId}-author`} className="sr-only">Nafn þitt</label>
                            <input
                                id={`${formId}-author`}
                                type="text"
                                name="author"
                                placeholder="Nafn þitt"
                                required
                                maxLength={80}
                                className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:border-[#e8b058] focus:outline-none text-sm"
                            />
                            <label htmlFor={`${formId}-message`} className="sr-only">Skilaboð í gestabókina</label>
                            <textarea
                                id={`${formId}-message`}
                                name="message"
                                placeholder="Skrifaðu hér..."
                                required
                                rows={4}
                                maxLength={2000}
                                className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:border-[#e8b058] focus:outline-none text-sm resize-none"
                            />
                            <button type="submit" disabled={sending} className="bg-[#1a1a1a] text-white w-full py-3 rounded-lg font-bold text-sm hover:bg-[#333] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                                {sending ? 'Sendi...' : 'Senda inn'}
                            </button>
                            {formStatus && (
                                <p role={formStatus.type === 'error' ? 'alert' : 'status'} className={`text-sm text-center ${formStatus.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
                                    {formStatus.text}
                                </p>
                            )}
                        </form>
                    </div>
                </div>

            </main>

            {/* House rules */}
            <Modal open={showRules} onClose={() => setShowRules(false)} title="Húsreglur" size="md">
                <p className="text-sm text-stone-700 whitespace-pre-line leading-relaxed">{data?.house_rules}</p>
            </Modal>

            {/* Image lightbox */}
            <Modal
                open={selectedImage !== null}
                onClose={() => setSelectedImage(null)}
                title="Mynd í fullri stærð"
                hideTitle
                size="full"
                className="!bg-black !text-white"
                bodyClassName="flex items-center justify-center !p-4"
            >
                {selectedImage && (
                    <img
                        src={selectedImage}
                        alt="Mynd úr myndasafni í fullri stærð"
                        className="max-w-full max-h-[calc(100dvh-8rem)] rounded-lg shadow-2xl object-contain"
                    />
                )}
            </Modal>
        </div>
    );
}
