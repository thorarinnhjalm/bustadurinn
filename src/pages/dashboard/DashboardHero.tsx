import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Image as ImageIcon, Camera } from 'lucide-react';
import type { House, User } from '@/types/models';
import type { HeroWeather } from './useDashboardWeather';

interface DashboardHeroProps {
    currentHouse: House;
    currentUser: User | null;
    weather: HeroWeather;
    isOccupied: boolean;
}

export default function DashboardHero({ currentHouse, currentUser, weather, isOccupied }: DashboardHeroProps) {
    const [_selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);

    return (
        <div className="max-w-5xl mx-auto">
            <div className="relative h-72 md:h-96 w-full overflow-hidden md:rounded-b-3xl shadow-xl shadow-stone-200/50" style={{ minHeight: '288px' }}>
                <img
                    src={currentHouse?.image_url || "/hero_summer_house.jpg"}
                    alt={currentHouse?.name ? `Mynd af ${currentHouse.name}` : "Mynd af bústaðnum"}
                    className="w-full h-full object-cover transform motion-safe:hover:scale-105 transition-transform duration-1000"
                    fetchPriority="high"
                    loading="eager"
                    decoding="async"
                    width="800"
                    height="600"
                />
                

                {/* Gallery Preview Button */}
                <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
                    {currentUser && (currentUser.uid === currentHouse?.manager_id || currentHouse?.owner_ids?.includes(currentUser.uid)) && (
                        <Link
                            to="/settings?tab=house"
                            aria-label="Breyta mynd"
                            className="bg-[#1a1a1a]/65 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-white/20 transition-all flex items-center gap-2"
                        >
                            <Camera size={14} aria-hidden="true" />
                            <span className="hidden sm:inline">Breyta mynd</span>
                        </Link>
                    )}

                    {currentHouse?.gallery_urls && currentHouse.gallery_urls.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setSelectedGalleryImage(currentHouse.image_url || currentHouse.gallery_urls![0])}
                            aria-label={`Skoða myndasafn (${currentHouse.gallery_urls.length + (currentHouse.image_url ? 1 : 0)})`}
                            className="bg-[#1a1a1a]/65 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-white/20 transition-all flex items-center gap-2"
                        >
                            <ImageIcon size={14} aria-hidden="true" />
                            <span className="hidden sm:inline">Skoða myndasafn ({currentHouse.gallery_urls.length + (currentHouse.image_url ? 1 : 0)})</span>
                        </button>
                    )}
                </div>

                {/* Greeting & Weather */}
                {/* Scrim behind the text: transparent at the top, ~85% charcoal by the time the eyebrow starts (the amber
                    eyebrow needs a background no lighter than ~rgb(74,74,74) to reach 4.5:1, even over a white sky). */}
                <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-14 md:px-8 md:pb-8 md:pt-24 text-white bg-gradient-to-b from-[#1a1a1a]/0 via-[#1a1a1a]/85 via-20% to-[#1a1a1a]/90 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <p className="text-amber font-bold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="w-8 h-0.5 bg-amber inline-block"></span>
                            {(() => {
                                const hour = new Date().getHours();
                                if (hour < 12) return 'Góðan daginn';
                                if (hour < 18) return 'Góðan dag';
                                return 'Góða kvöldið';
                            })()}
                        </p>
                        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-2 text-white/95">
                            {currentUser?.name?.split(' ')[0] || 'Gestur'}
                        </h1>
                        <div className="flex items-center gap-4 text-stone-300 text-sm font-medium">
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                                <Sun size={16} className="text-amber" aria-hidden="true" />
                                <span>{weather.temp}°</span>
                                <span className="text-stone-300" aria-hidden="true">|</span>
                                <span>{weather.wind} m/s</span>
                            </div>
                            <span className="hidden md:inline text-stone-400" aria-hidden="true">•</span>
                            <span className="hidden md:inline capitalize">{weather.condition}</span>
                        </div>
                    </div>

                    {/* Occupancy Status Badge */}
                    <div className="self-start md:self-end mb-1">
                        {isOccupied ? (
                            <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-100 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-lg">
                                <div className="relative flex h-2.5 w-2.5" aria-hidden="true">
                                    <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest leading-none">Húsið er í notkun</span>
                            </div>
                        ) : (
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 text-stone-200 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-lg">
                                <div className="w-2.5 h-2.5 rounded-full bg-stone-400" aria-hidden="true"></div>
                                <span className="text-xs font-bold uppercase tracking-widest leading-none">Laust núna</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
