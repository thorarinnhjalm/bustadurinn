import { useState, useEffect } from 'react';
import {
    Home,
    ImageIcon,
    Upload,
    Trash2,
    Plus,
    Edit2,
    X,
    CheckCircle,
    MapPin,
    Wifi,
    Shield,
    Users,
    Save,
    Loader2,
    ClipboardList,
    Smartphone,
    Globe,
    Zap,
    Coffee,
    Waves,
    Utensils,
    Bike,
    Dices,
    Tv,
    Flame,
    ListChecks,
    LogIn,
    Package,
    CalendarRange,
    Sparkles,
    Snowflake
} from 'lucide-react';
import type { House, User } from '@/types/models';
import Toggle from './Toggle';
import ChecklistEditor from './ChecklistEditor';

interface HouseSettingsProps {
    house: House;
    isManager: boolean;
    members: User[];
    loadingMembers: boolean;
    isSaving: boolean;
    onSave: (data: any) => Promise<void>;
    onImageSelect: (e: React.ChangeEvent<HTMLInputElement>, mode: 'main' | 'gallery') => void;
    onRemoveGalleryImage: (url: string) => void;
    suggestions: any[];
    handleAddressChange: (val: string) => void;
    handleSelectPrediction: (suggestion: any) => void;
}

export default function HouseSettings({
    house,
    isManager,
    members,
    loadingMembers,
    isSaving,
    onSave,
    onImageSelect,
    onRemoveGalleryImage,
    suggestions,
    handleAddressChange,
    handleSelectPrediction
}: HouseSettingsProps) {
    const [houseForm, setHouseForm] = useState({
        name: house.name || '',
        address: house.address || '',
        lat: house.location?.lat || 0,
        lng: house.location?.lng || 0,
        invite_code: house.invite_code || '',
        wifi_ssid: house.wifi_ssid || '',
        wifi_password: house.wifi_password || '',
        no_wifi: house.no_wifi || false,
        holiday_mode: house.holiday_mode || 'first_come',
        house_rules: house.house_rules || '',
        house_rules_en: house.house_rules_en || '',
        check_in_time: house.check_in_time || '',
        check_out_time: house.check_out_time || '',
        directions: house.directions || '',
        directions_en: house.directions_en || '',
        access_instructions: house.access_instructions || '',
        access_instructions_en: house.access_instructions_en || '',
        emergency_contact: house.emergency_contact || '',
        guest_instructions: house.guest_instructions || '',
        guest_instructions_en: house.guest_instructions_en || '',
        amenities: house.amenities || [],
        privacy_hide_finances: house.privacy_hide_finances || false,
        finance_viewer_ids: house.finance_viewer_ids || [],
        checkout_checklist: house.checkout_checklist || [],
        arrival_checklist: house.arrival_checklist || [],
        supply_checklist: house.supply_checklist || [],
        seasonal_checklists: {
            spring: house.seasonal_checklists?.spring || [],
            autumn: house.seasonal_checklists?.autumn || []
        }
    });

    const [isEditingLocation, setIsEditingLocation] = useState(false);
    const [editLang, setEditLang] = useState<'is' | 'en'>('is');
    const [, setCropMode] = useState<'main' | 'gallery'>('main');

    // Sync form with house prop
    useEffect(() => {
        setHouseForm({
            name: house.name || '',
            address: house.address || '',
            lat: house.location?.lat || 0,
            lng: house.location?.lng || 0,
            invite_code: house.invite_code || '',
            wifi_ssid: house.wifi_ssid || '',
            wifi_password: house.wifi_password || '',
            no_wifi: house.no_wifi || false,
            holiday_mode: house.holiday_mode || 'first_come',
            house_rules: house.house_rules || '',
            house_rules_en: house.house_rules_en || '',
            check_in_time: house.check_in_time || '',
            check_out_time: house.check_out_time || '',
            directions: house.directions || '',
            directions_en: house.directions_en || '',
            access_instructions: house.access_instructions || '',
            access_instructions_en: house.access_instructions_en || '',
            emergency_contact: house.emergency_contact || '',
            guest_instructions: house.guest_instructions || '',
            guest_instructions_en: house.guest_instructions_en || '',
            amenities: house.amenities || [],
            privacy_hide_finances: house.privacy_hide_finances || false,
            finance_viewer_ids: house.finance_viewer_ids || [],
            checkout_checklist: house.checkout_checklist || [],
            arrival_checklist: house.arrival_checklist || [],
            supply_checklist: house.supply_checklist || [],
            seasonal_checklists: {
                spring: house.seasonal_checklists?.spring || [],
                autumn: house.seasonal_checklists?.autumn || []
            }
        });
    }, [house]);

    const DEFAULT_CHECKOUT_CHECKLIST = [
        'Læsa öllum hurðum',
        'Loka öllum gluggum',
        'Taka ruslið',
        'Slökkva á rafmagnstækjum',
        'Skrúfa fyrir vatn'
    ];

    const DEFAULT_ARRIVAL_CHECKLIST = [
        'Kveikja á vatni',
        'Kveikja á rafmagni',
        'Kynda upp',
        'Athuga með mýs'
    ];

    const DEFAULT_SUPPLY_CHECKLIST = [
        'Klósettpappír',
        'Eldhúsrúllur',
        'Uppþvottalögur',
        'Kaffi',
        'Kerti',
        'Eldiviður'
    ];

    const DEFAULT_SPRING_CHECKLIST = [
        'Skrúfa frá vatni',
        'Setja upp útihúsgögn',
        'Yfirfara reykskynjara',
        'Tékka á þakrennum'
    ];

    const DEFAULT_AUTUMN_CHECKLIST = [
        'Tæma vatnslagnir',
        'Taka inn útihúsgögn',
        'Tæma ísskáp',
        'Aftengja gaskút'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(houseForm);
    };

    return (
        <div className="space-y-6">
            {/* House Image Upload */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <ImageIcon className="w-6 h-6 text-amber" />
                    <h2 className="text-xl font-serif">Myndir af húsinu</h2>
                </div>

                <div className="space-y-6">
                    {/* MAIN IMAGE */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">Aðalmynd (Cover)</h3>
                        {house.image_url ? (
                            <div className="relative aspect-video rounded-lg overflow-hidden border border-stone-200 group">
                                <img loading="lazy" src={house.image_url} alt={house.name} className="w-full h-full object-cover" />
                                <label className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold text-stone-600 border border-stone-200 cursor-pointer hover:bg-white transition-all shadow-sm opacity-0 group-hover:opacity-100">
                                    <span className="flex items-center gap-2">
                                        <Upload className="w-3 h-3" /> Skipta um mynd
                                    </span>
                                    <input type="file" accept="image/*" onChange={(e) => {
                                        setCropMode('main');
                                        onImageSelect(e, 'main');
                                    }} className="hidden" />
                                </label>
                            </div>
                        ) : (
                            <label className="border-2 border-dashed border-stone-300 rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:border-amber transition-colors bg-stone-50">
                                <Upload className="w-8 h-8 text-stone-400 mb-3" />
                                <p className="text-stone-600 font-medium mb-1">Hlaða upp aðalmynd</p>
                                <p className="text-stone-400 text-xs text-center">Þessi mynd birtist á stjórnborði og gestasíðu.</p>
                                <input type="file" accept="image/*" onChange={(e) => {
                                    setCropMode('main');
                                    onImageSelect(e, 'main');
                                }} className="hidden" />
                            </label>
                        )}
                    </div>

                    {/* GALLERY */}
                    <div className="pt-6 border-t border-stone-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500">Gallerí</h3>
                            <label className="text-xs font-bold text-amber hover:underline cursor-pointer flex items-center gap-1.5">
                                <Plus className="w-3.5 h-3.5" /> Bæta við myndum
                                <input type="file" accept="image/*" onChange={(e) => {
                                    setCropMode('gallery');
                                    onImageSelect(e, 'gallery');
                                }} className="hidden" />
                            </label>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {house.gallery_urls?.map((url, idx) => (
                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-stone-100 group shadow-sm bg-stone-100">
                                    <img loading="lazy" src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => onRemoveGalleryImage(url)}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}

                            {/* ADD BOX */}
                            <label className="aspect-square border-2 border-dashed border-stone-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-amber hover:bg-amber-50/30 transition-all text-stone-400">
                                <Plus size={20} />
                                <span className="text-[10px] font-bold mt-1 uppercase tracking-tight">Ný mynd</span>
                                <input type="file" accept="image/*" onChange={(e) => {
                                    setCropMode('gallery');
                                    onImageSelect(e, 'gallery');
                                }} className="hidden" />
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* General Info */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Home className="w-6 h-6 text-amber" />
                    <h2 className="text-xl font-serif">Grunnupplýsingar</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">Nafn sumarhúss</label>
                        <input
                            type="text"
                            className="input"
                            value={houseForm.name}
                            onChange={(e) => setHouseForm({ ...houseForm, name: e.target.value })}
                            disabled={!isManager}
                        />
                    </div>

                    <div className="relative">
                        <div className="flex items-center justify-between mb-3">
                            <label className="label">
                                Heimilisfang & Staðsetning
                                {houseForm.lat === 0 && (
                                    <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-sans font-medium uppercase tracking-wide">
                                        Vantar GPS
                                    </span>
                                )}
                            </label>
                            {isManager && (
                                <button
                                    type="button"
                                    onClick={() => setIsEditingLocation(!isEditingLocation)}
                                    className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${isEditingLocation
                                        ? 'bg-[#e8b058] text-white hover:bg-[#d4a04d]'
                                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                        }`}
                                >
                                    {isEditingLocation ? (
                                        <><X size={14} /> Loka</>
                                    ) : (
                                        <><Edit2 size={14} /> Breyta</>
                                    )}
                                </button>
                            )}
                        </div>
                        <input
                            type="text"
                            className={`input ${isEditingLocation ? 'border-[#e8b058] border-2' : ''}`}
                            value={houseForm.address}
                            onChange={(e) => handleAddressChange(e.target.value)}
                            disabled={!isManager || !isEditingLocation}
                            autoComplete="off"
                            placeholder={isEditingLocation ? "Leitaðu að heimilisfangi..." : houseForm.address || "Heimilisfang"}
                        />
                        {suggestions.length > 0 && isEditingLocation && (
                            <ul className="absolute z-20 w-full bg-white border border-stone-200 mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {suggestions.map((suggestion) => (
                                    <li
                                        key={suggestion.id}
                                        onClick={() => handleSelectPrediction(suggestion)}
                                        className="px-4 py-3 hover:bg-stone-50 cursor-pointer text-sm border-b last:border-0 border-stone-100 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            {suggestion.source === 'hms' ? (
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <MapPin className="w-4 h-4 text-stone-400" />
                                            )}
                                            <span className="font-medium">{suggestion.description}</span>
                                        </div>
                                        {suggestion.source === 'hms' && (
                                            <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200 font-bold uppercase">HMS</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Breiddargráða (Lat)</label>
                            <input
                                type="number"
                                step="0.000001"
                                className="input"
                                value={houseForm.lat}
                                onChange={(e) => setHouseForm({ ...houseForm, lat: parseFloat(e.target.value) })}
                                disabled={!isManager || !isEditingLocation}
                                placeholder="64.123456"
                            />
                        </div>
                        <div>
                            <label className="label">Lengdargráða (Lng)</label>
                            <input
                                type="number"
                                step="0.000001"
                                className="input"
                                value={houseForm.lng}
                                onChange={(e) => setHouseForm({ ...houseForm, lng: parseFloat(e.target.value) })}
                                disabled={!isManager || !isEditingLocation}
                                placeholder="-21.123456"
                            />
                        </div>
                    </div>

                    <div className="border-t border-grey-warm pt-4 mt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Wifi className="w-5 h-5 text-amber" />
                            <h3 className="font-serif text-lg">Internet (Wi-Fi)</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Nafn nets (SSID)</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={houseForm.wifi_ssid}
                                    onChange={(e) => setHouseForm({ ...houseForm, wifi_ssid: e.target.value })}
                                    disabled={!isManager}
                                    placeholder="t.d. Sumarbústaður 5G"
                                />
                            </div>
                            <div>
                                <label className="label">Lykilorð (Password)</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={houseForm.wifi_password}
                                    onChange={(e) => setHouseForm({ ...houseForm, wifi_password: e.target.value })}
                                    disabled={!isManager}
                                    placeholder="••••••••"
                                />
                            </div>
                            <label className="flex items-center gap-3 mt-4 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={houseForm.no_wifi}
                                    onChange={(e) => setHouseForm({ ...houseForm, no_wifi: e.target.checked })}
                                    disabled={!isManager}
                                    className="w-5 h-5 rounded border-stone-300 text-amber focus:ring-amber"
                                />
                                <span className="text-sm text-stone-600">Ekkert WiFi í boði</span>
                            </label>
                        </div>
                    </div>

                    <div className="border-t border-grey-warm pt-4 mt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-5 h-5 text-amber" />
                            <h3 className="font-serif text-lg">Aðgangsstýring</h3>
                        </div>

                        <div className="space-y-4">
                            <Toggle
                                label="Fela fjármál (Hússjóður)"
                                description="Ef kveikt er á þessu sjá einungis stjórnendur (þú) fjármálayfirlitið sjálfkrafa. Aðrir sjá það ekki nema þeim sé sérstaklega veittur aðgangur hér að neðan."
                                checked={houseForm.privacy_hide_finances}
                                onChange={(val: boolean) => setHouseForm({ ...houseForm, privacy_hide_finances: val })}
                                disabled={!isManager}
                            />

                            {/* Viewer Selection */}
                            {houseForm.privacy_hide_finances && isManager && (
                                <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 animate-in fade-in slide-in-from-top-2">
                                    <h5 className="text-sm font-bold text-charcoal mb-3 flex items-center gap-2">
                                        <Users size={14} className="text-amber" />
                                        Hverjir mega sjá?
                                    </h5>

                                    {loadingMembers ? (
                                        <div className="text-sm text-stone-400">Hleð notendum...</div>
                                    ) : (
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            {members
                                                .filter(m => m.uid !== house?.manager_id)
                                                .map(member => {
                                                    const canView = houseForm.finance_viewer_ids?.includes(member.uid) || false;
                                                    return (
                                                        <div
                                                            key={member.uid}
                                                            className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${canView
                                                                ? 'bg-white border-green-500 shadow-sm'
                                                                : 'bg-transparent border-transparent hover:bg-stone-100 hover:border-stone-200'
                                                                }`}
                                                            onClick={() => {
                                                                const currentViewers = houseForm.finance_viewer_ids || [];
                                                                let newViewers;
                                                                if (canView) {
                                                                    newViewers = currentViewers.filter(id => id !== member.uid);
                                                                } else {
                                                                    newViewers = [...currentViewers, member.uid];
                                                                }
                                                                setHouseForm({ ...houseForm, finance_viewer_ids: newViewers });
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold text-stone-500">
                                                                    {(member.name || member.email || '?').substring(0, 1).toUpperCase()}
                                                                </div>
                                                                <div className="text-sm font-medium text-stone-700">{member.name || member.email}</div>
                                                            </div>
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${canView ? 'bg-green-500 border-green-500' : 'border-stone-300'}`}>
                                                                {canView && <CheckCircle size={12} className="text-white" />}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AMENITIES */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <Zap className="w-6 h-6 text-amber" />
                            <h2 className="text-xl font-serif">Þægindi & Búnaður</h2>
                        </div>
                        <p className="text-sm text-stone-500 mb-6">Merktu við þau þægindi sem gestir geta búist við í húsinu.</p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {[
                                { id: 'hot_tub', label: 'Heitur pottur', icon: Waves },
                                { id: 'grill', label: 'Grill', icon: Utensils },
                                { id: 'tv', label: 'Sjónvarp', icon: Tv },
                                { id: 'sauna', label: 'Sauna', icon: Flame },
                                { id: 'washer', label: 'Þvottavél', icon: Smartphone },
                                { id: 'dishwasher', label: 'Uppþvottavél', icon: Utensils },
                                { id: 'fireplace', label: 'Arinn', icon: Flame },
                                { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
                                { id: 'coffee_machine', label: 'Kaffivél', icon: Coffee },
                                { id: 'bikes', label: 'Reiðhjól', icon: Bike },
                                { id: 'games', label: 'Spil & Leikir', icon: Dices },
                            ].map(item => {
                                const active = houseForm.amenities.includes(item.id);
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            const newAmenities = active
                                                ? houseForm.amenities.filter(a => a !== item.id)
                                                : [...houseForm.amenities, item.id];
                                            setHouseForm({ ...houseForm, amenities: newAmenities });
                                        }}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${active
                                                ? 'bg-amber/5 border-amber/30 text-amber-900 shadow-sm'
                                                : 'bg-stone-50 border-stone-100 text-stone-600 hover:border-stone-200'
                                            }`}
                                    >
                                        <item.icon className={`w-4 h-4 ${active ? 'text-amber' : 'text-stone-400'}`} />
                                        <span className="text-xs font-bold">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* TEXT CONTENT & LANGUAGE */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <Globe className="w-6 h-6 text-amber" />
                                <h2 className="text-xl font-serif">Upplýsingar & Reglur</h2>
                            </div>

                            <div className="flex bg-stone-100 rounded-lg p-1">
                                <button
                                    type="button"
                                    onClick={() => setEditLang('is')}
                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${editLang === 'is'
                                            ? 'bg-white text-charcoal shadow-sm'
                                            : 'text-stone-500 hover:text-stone-700'
                                        }`}
                                >
                                    Ís
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditLang('en')}
                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${editLang === 'en'
                                            ? 'bg-white text-charcoal shadow-sm'
                                            : 'text-stone-500 hover:text-stone-700'
                                        }`}
                                >
                                    En
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="label flex items-center gap-2 mb-2">
                                    Almennar leiðbeiningar
                                    {editLang === 'en' && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">Enska</span>}
                                </label>
                                <textarea
                                    className="input min-h-[120px] text-sm"
                                    value={editLang === 'is' ? houseForm.guest_instructions : houseForm.guest_instructions_en}
                                    onChange={(e) => setHouseForm({
                                        ...houseForm,
                                        [editLang === 'is' ? 'guest_instructions' : 'guest_instructions_en']: e.target.value
                                    })}
                                    placeholder="Gott að vita fyrir gesti..."
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label mb-2">Innritun (kl.)</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={houseForm.check_in_time}
                                        onChange={(e) => setHouseForm({ ...houseForm, check_in_time: e.target.value })}
                                        placeholder="16:00"
                                    />
                                </div>
                                <div>
                                    <label className="label mb-2">Útritun (kl.)</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={houseForm.check_out_time}
                                        onChange={(e) => setHouseForm({ ...houseForm, check_out_time: e.target.value })}
                                        placeholder="12:00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label flex items-center gap-2 mb-2">
                                    Húsreglur
                                    {editLang === 'en' && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">Enska</span>}
                                </label>
                                <textarea
                                    className="input min-h-[100px] text-sm"
                                    value={editLang === 'is' ? houseForm.house_rules : houseForm.house_rules_en}
                                    onChange={(e) => setHouseForm({
                                        ...houseForm,
                                        [editLang === 'is' ? 'house_rules' : 'house_rules_en']: e.target.value
                                    })}
                                    placeholder="T.d. Engar veislur, þrífa eftir notkun..."
                                />
                            </div>

                            <div>
                                <label className="label flex items-center gap-2 mb-2">
                                    Leiðarlýsing
                                    {editLang === 'en' && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">Enska</span>}
                                </label>
                                <textarea
                                    className="input text-sm"
                                    value={editLang === 'is' ? houseForm.directions : houseForm.directions_en}
                                    onChange={(e) => setHouseForm({
                                        ...houseForm,
                                        [editLang === 'is' ? 'directions' : 'directions_en']: e.target.value
                                    })}
                                    placeholder="Hvernig rata gestir í bústaðinn?"
                                />
                            </div>

                            <div>
                                <label className="label flex items-center gap-2 mb-2">
                                    Aðgangur (Lykilbox o.fl.)
                                    {editLang === 'en' && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">Enska</span>}
                                </label>
                                <textarea
                                    className="input text-sm"
                                    value={editLang === 'is' ? houseForm.access_instructions : houseForm.access_instructions_en}
                                    onChange={(e) => setHouseForm({
                                        ...houseForm,
                                        [editLang === 'is' ? 'access_instructions' : 'access_instructions_en']: e.target.value
                                    })}
                                    placeholder="T.d. Lykilbox vinstra megin við dyr..."
                                />
                            </div>

                            <div>
                                <label className="label mb-2">Neyðartengiliður / Sími</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={houseForm.emergency_contact}
                                    onChange={(e) => setHouseForm({ ...houseForm, emergency_contact: e.target.value })}
                                    placeholder="Nafn og símanúmer"
                                />
                            </div>
                        </div>
                    </div>

                    {/* BOOKING MODES */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <ClipboardList className="w-6 h-6 text-amber" />
                            <h2 className="text-xl font-serif">Bókunarreglur</h2>
                        </div>
                        <p className="text-sm text-stone-500 mb-6">Veldu hvernig úthlutun á vinsælum dögum fer fram.</p>

                        <div className="space-y-4">
                            {[
                                {
                                    id: 'fairness',
                                    title: 'Sanngirnisregla',
                                    desc: 'Kerfið fylgist með bókunum á vinsælum helgum. Ef einhver fékk í fyrra fær hann ekki í ár.'
                                },
                                {
                                    id: 'first_come',
                                    title: 'Fyrstur kemur, fyrstur fær',
                                    desc: 'Engar takmarkanir. Sá sem bókar fyrstur fær dagana.'
                                }
                            ].map(mode => (
                                <label
                                    key={mode.id}
                                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${houseForm.holiday_mode === mode.id
                                            ? 'bg-amber/5 border-amber/30'
                                            : 'bg-stone-50 border-stone-100 hover:border-stone-200'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        checked={houseForm.holiday_mode === mode.id}
                                        onChange={() => setHouseForm({ ...houseForm, holiday_mode: mode.id as any })}
                                        disabled={!isManager}
                                        className="mt-1 w-4 h-4 text-amber focus:ring-amber border-stone-300"
                                    />
                                    <div>
                                        <div className="text-sm font-bold text-charcoal">{mode.title}</div>
                                        <p className="text-xs text-stone-500 mt-1 leading-relaxed">{mode.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* CHECKLISTS */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <ListChecks className="w-6 h-6 text-amber" />
                            <h2 className="text-xl font-serif">Gátlistar</h2>
                        </div>
                        <p className="text-sm text-stone-500 mb-6">
                            Þessir listar birtast gestum við komu og brottför. Hakað er við hvert atriði en það er ekki skylda.
                        </p>

                        <div className="space-y-8">
                            <ChecklistEditor
                                icon={ListChecks}
                                title="Brottfarargátlisti"
                                description="Birtist gestum þegar þeir skrá brottför."
                                items={houseForm.checkout_checklist}
                                onChange={(items) => setHouseForm({ ...houseForm, checkout_checklist: items })}
                                defaults={DEFAULT_CHECKOUT_CHECKLIST}
                                isManager={isManager}
                                placeholder="T.d. Setja rusl í tunnu"
                            />

                            <div className="border-t border-stone-100 pt-8">
                                <ChecklistEditor
                                    icon={LogIn}
                                    title="Komugátlisti"
                                    description="Birtist gestum þegar þeir skrá komu."
                                    items={houseForm.arrival_checklist}
                                    onChange={(items) => setHouseForm({ ...houseForm, arrival_checklist: items })}
                                    defaults={DEFAULT_ARRIVAL_CHECKLIST}
                                    isManager={isManager}
                                    placeholder="T.d. Kveikja á ísskáp"
                                />
                            </div>

                            <div className="border-t border-stone-100 pt-8">
                                <ChecklistEditor
                                    icon={Package}
                                    title="Birgðalisti"
                                    description="Birgðir sem eru athugaðar við brottför — ef eitthvað er á þrotum fer það sjálfkrafa á innkaupalistann."
                                    items={houseForm.supply_checklist}
                                    onChange={(items) => setHouseForm({ ...houseForm, supply_checklist: items })}
                                    defaults={DEFAULT_SUPPLY_CHECKLIST}
                                    isManager={isManager}
                                    placeholder="T.d. Ruslapokar"
                                />
                            </div>

                            <div className="border-t border-stone-100 pt-8">
                                <div className="flex items-center gap-2 mb-1">
                                    <CalendarRange className="w-5 h-5 text-amber" />
                                    <h3 className="font-serif text-lg">Árstíðalistar</h3>
                                </div>
                                <p className="text-sm text-stone-500 mb-4">
                                    Vor-opnun og vetrarfrágangur — bústaðurinn stingur upp á þessum listum á réttum árstíma.
                                </p>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <ChecklistEditor
                                        icon={Sparkles}
                                        title="Vor-opnun"
                                        description="Stungið upp á í apríl-maí."
                                        items={houseForm.seasonal_checklists.spring}
                                        onChange={(items) => setHouseForm({
                                            ...houseForm,
                                            seasonal_checklists: { ...houseForm.seasonal_checklists, spring: items }
                                        })}
                                        defaults={DEFAULT_SPRING_CHECKLIST}
                                        isManager={isManager}
                                        placeholder="T.d. Þrífa svalir"
                                    />
                                    <ChecklistEditor
                                        icon={Snowflake}
                                        title="Vetrarfrágangur"
                                        description="Stungið upp á í september-október."
                                        items={houseForm.seasonal_checklists.autumn}
                                        onChange={(items) => setHouseForm({
                                            ...houseForm,
                                            seasonal_checklists: { ...houseForm.seasonal_checklists, autumn: items }
                                        })}
                                        defaults={DEFAULT_AUTUMN_CHECKLIST}
                                        isManager={isManager}
                                        placeholder="T.d. Setja yfirbreiðslu á pott"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6">
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg px-8 flex items-center gap-3 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                            disabled={!isManager || isSaving}
                        >
                            {isSaving ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Vistar...</>
                            ) : (
                                <><Save className="w-5 h-5" /> Vista breytingar</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
