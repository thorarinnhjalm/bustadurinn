import { Calendar, CheckSquare, Wallet, Globe, Bell, Home, TrendingUp, Shield, ArrowRight, Share2, Plus } from 'lucide-react';

export const CalendarMockup = () => (
    <div className="w-full h-full bg-white p-6 relative flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-serif font-bold text-xl text-[#1a1a1a]">Júlí 2026</h3>
            <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400">
                    <ArrowRight className="rotate-180 w-4 h-4" />
                </div>
                <div className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400">
                    <ArrowRight className="w-4 h-4" />
                </div>
            </div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-stone-400 uppercase tracking-wider">
            <div>Mán</div><div>Þri</div><div>Mið</div><div>Fim</div><div>Fös</div><div>Lau</div><div>Sun</div>
        </div>
        <div className="grid grid-cols-7 gap-2 flex-1 relative">
            {/* Empty Days */}
            {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-stone-50 border border-stone-100 relative group hover:border-amber/50 transition-colors">
                    <span className="absolute top-1 left-2 text-xs text-stone-400 font-medium">{i + 1}</span>

                    {/* Mock Bookings */}
                    {i === 14 && (
                        <div className="absolute inset-1 bg-amber rounded-md z-10 flex items-center justify-center shadow-md">
                            <span className="text-[10px] font-bold text-[#1a1a1a]">Jón</span>
                        </div>
                    )}
                    {i === 15 && (
                        <div className="absolute inset-1 bg-amber rounded-md z-10 flex items-center justify-center shadow-md">
                            <span className="text-[10px] font-bold text-[#1a1a1a] opacity-50">...</span>
                        </div>
                    )}
                    {i === 16 && (
                        <div className="absolute inset-1 bg-amber rounded-md z-10 flex items-center justify-center shadow-md">
                            <span className="text-[10px] font-bold text-[#1a1a1a] opacity-50">...</span>
                        </div>
                    )}

                    {i === 28 && (
                        <div className="absolute inset-1 bg-[#1a1a1a] rounded-md z-10 flex items-center justify-center shadow-md">
                            <span className="text-[10px] font-bold text-white">Sigga</span>
                        </div>
                    )}
                    {i === 29 && (
                        <div className="absolute inset-1 bg-[#1a1a1a] rounded-md z-10 flex items-center justify-center shadow-md">
                            <span className="text-[10px] font-bold text-white opacity-50">...</span>
                        </div>
                    )}
                </div>
            ))}

            {/* Popover Mock */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl border border-stone-100 p-4 w-48 z-20 animate-in zoom-in-95">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-amber flex items-center justify-center font-bold text-xs">Jón</div>
                    <div>
                        <p className="text-xs font-bold">Helgarferð</p>
                        <p className="text-[10px] text-stone-400">15. - 17. Júlí</p>
                    </div>
                </div>
                <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                    <div className="w-2/3 h-full bg-amber"></div>
                </div>
            </div>
        </div>
    </div>
);

export const FairnessMockup = () => (
    <div className="w-full h-full bg-stone-50 p-8 flex items-center justify-center relative overflow-hidden">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm relative z-10">
            <h4 className="font-serif font-bold text-[#1a1a1a] mb-6">Forgangsstaða</h4>

            <div className="space-y-4">
                {/* User 1 */}
                <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                        <span>Sigga</span>
                        <span className="text-green-600">Hár forgangur</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full w-[85%] bg-green-500 rounded-full"></div>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">Hefur bókað 2 helgar á árinu</p>
                </div>

                {/* User 2 */}
                <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                        <span>Palli</span>
                        <span className="text-yellow-600">Meðal forgangur</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full w-[60%] bg-yellow-500 rounded-full"></div>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">Hefur bókað 4 helgar á árinu</p>
                </div>

                {/* User 3 */}
                <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                        <span>Jón (Þú)</span>
                        <span className="text-red-500">Lágur forgangur</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full w-[30%] bg-red-500 rounded-full"></div>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">Hefur bókað 6 helgar á árinu</p>
                </div>
            </div>

            <div className="mt-6 p-3 bg-stone-50 rounded-lg border border-stone-100 flex gap-3 text-xs text-stone-500">
                <Shield className="w-4 h-4 text-stone-400 flex-shrink-0" />
                <p>Kerfið reiknar sjálfkrafa út stöðuna byggt á nýtingu síðustu 12 mánaða.</p>
            </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>
    </div>
);

export const FinanceMockup = () => (
    <div className="w-full h-full bg-[#1a1a1a] p-8 flex flex-col justify-between relative text-white">
        <div>
            <div className="flex items-center gap-2 mb-6 opacity-80">
                <Wallet className="w-5 h-5 text-amber" />
                <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Hússjóðurinn</span>
            </div>

            <div className="text-5xl font-serif font-bold mb-2">
                145.200 <span className="text-2xl font-sans font-normal text-stone-500">kr.</span>
            </div>
            <p className="text-stone-400 text-sm mb-12">Staða á reikningi í dag</p>

            <div className="space-y-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                            <TrendingUp size={16} />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Innborganir</p>
                            <p className="text-xs text-stone-500">Júlí mánuður</p>
                        </div>
                    </div>
                    <span className="font-bold text-green-400">+45.000 kr</span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center">
                            <TrendingUp size={16} className="rotate-180" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Rafmagnsreikningur</p>
                            <p className="text-xs text-stone-500">Orkusalan</p>
                        </div>
                    </div>
                    <span className="font-bold text-white">-12.450 kr</span>
                </div>
            </div>
        </div>

        {/* Graph Line */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-amber/10 to-transparent">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 100 L0 60 Q 20 50 40 70 T 80 40 L 100 30 L 100 100 Z" fill="currentColor" className="text-amber/5" />
                <path d="M0 60 Q 20 50 40 70 T 80 40 L 100 30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-amber/50" />
            </svg>
        </div>
    </div>
);

export const RolesMockup = () => (
    <div className="w-full h-full bg-white p-6 md:p-10 flex flex-col gap-4">
        <div className="flex items-center gap-4 p-4 border border-stone-100 rounded-xl shadow-sm bg-stone-50/50">
            <div className="w-12 h-12 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center font-bold text-lg">ME</div>
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <h4 className="font-bold text-[#1a1a1a]">Þú (Jón)</h4>
                    <span className="bg-[#1a1a1a] text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Bústaðastjóri</span>
                </div>
                <p className="text-xs text-stone-500">Hefur fullt aðgengi að öllum stillingum</p>
            </div>
        </div>

        <div className="flex items-center gap-4 p-4 border border-stone-100 rounded-xl shadow-sm hover:border-amber/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center font-bold text-lg">S</div>
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <h4 className="font-bold text-[#1a1a1a]">Sigga</h4>
                    <span className="bg-stone-100 text-stone-500 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Meðeigandi</span>
                </div>
                <p className="text-xs text-stone-500">Getur bókað og skráð verkefni</p>
            </div>
        </div>

        <button className="w-full py-3 border-2 border-dashed border-stone-200 rounded-xl text-stone-400 font-bold text-sm flex items-center justify-center gap-2 hover:border-amber hover:text-amber transition-colors">
            <Plus size={16} />
            Bæta við meðeiganda
        </button>
    </div>
);

export const GuestLinkMockup = () => (
    <div className="w-full h-full bg-stone-100 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Phone Frame */}
        <div className="w-64 bg-white rounded-[2rem] shadow-2xl border-4 border-white overflow-hidden relative z-10">
            <div className="h-4 bg-stone-50 w-full mb-4"></div>

            <div className="px-6 pb-8 space-y-6">
                <div className="text-center">
                    <h4 className="font-serif font-bold text-xl mb-1">Velkomin í Bústaðinn!</h4>
                    <p className="text-xs text-stone-400">Hlekkur rennur út eftir 3 daga</p>
                </div>

                <div className="space-y-3">
                    <div className="bg-amber/10 p-3 rounded-xl flex items-center gap-3">
                        <Globe className="w-5 h-5 text-amber" />
                        <div>
                            <p className="text-[10px] font-bold uppercase text-amber-800">WiFi Nafn</p>
                            <p className="text-xs font-bold">Sumarhus_5GHz</p>
                        </div>
                    </div>
                    <div className="bg-stone-50 p-3 rounded-xl flex items-center gap-3">
                        <Shield className="w-5 h-5 text-stone-400" />
                        <div>
                            <p className="text-[10px] font-bold uppercase text-stone-400">Lykilbox</p>
                            <p className="text-xs font-bold">4492</p>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <button className="bg-[#1a1a1a] text-white w-full py-3 rounded-xl text-xs font-bold">
                        Sjá leiðbeiningar
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export const NotificationsMockup = () => (
    <div className="w-full h-full bg-[#FAFAFA] text-[#1a1a1a] flex flex-col">
        <div className="p-4 border-b border-stone-100 bg-white shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Bell size={18} className="text-amber" />
                <span className="font-bold text-sm">Tilkynningar</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
        </div>

        <div className="flex-1 overflow-hidden p-4 space-y-3">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-stone-100 flex gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                    <Calendar size={18} />
                </div>
                <div>
                    <p className="text-sm font-bold">Jón bókaði helgi</p>
                    <p className="text-xs text-stone-500">15. - 17. Júlí 2026</p>
                </div>
            </div>

            <div className="bg-white p-3 rounded-xl shadow-sm border border-stone-100 flex gap-3 opacity-75">
                <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center flex-shrink-0">
                    <CheckSquare size={18} />
                </div>
                <div>
                    <p className="text-sm font-bold">Ruslatunna tæmd</p>
                    <p className="text-xs text-stone-500">Sigga kláraði verkefni</p>
                </div>
            </div>
        </div>
    </div>
);

export const MultiHouseMockup = () => (
    <div className="w-full h-full bg-stone-900 p-8 flex items-center justify-center">
        <div className="w-full max-w-sm space-y-3">
            <h4 className="text-white font-serif font-bold mb-4 opacity-50 uppercase tracking-widest text-xs">Mín hús</h4>

            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-amber/50 flex items-center justify-between shadow-lg shadow-amber/10 transform scale-105">
                <div className="flex items-center gap-4">
                    <Home className="text-amber w-6 h-6" />
                    <div className="text-white">
                        <h4 className="font-bold">Fjölskyldan</h4>
                        <p className="text-xs text-stone-400">4 meðeigendur</p>
                    </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-amber"></div>
            </div>

            <div className="bg-[#1a1a1a]/50 p-4 rounded-xl border border-white/5 flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-4">
                    <Share2 className="text-white w-6 h-6" />
                    <div className="text-white">
                        <h4 className="font-bold">Veiðihúsið</h4>
                        <p className="text-xs text-stone-400">2 leigjendur</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-center mt-4">
                <button className="text-stone-500 text-xs font-bold flex items-center gap-2 hover:text-white transition-colors">
                    <Plus size={14} /> Bæta við nýju húsi
                </button>
            </div>
        </div>
    </div>
);
