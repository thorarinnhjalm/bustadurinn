import { useState, useId } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { Save, CheckCircle, Copy, RefreshCw, Link as LinkIcon, Eye } from 'lucide-react';
import { db } from '@/lib/firebase';
import MagicLinkGenerator from '@/components/guest/MagicLinkGenerator';
import type { House } from '@/types/models';
import { generateSecureToken } from '@/utils/secureToken';
import { logger } from '@/utils/logger';
import type { HouseFormState, SetHouseForm, SettingsFeedback } from './types';

interface GuestsTabProps extends SettingsFeedback {
    house: House;
    setHouse: Dispatch<SetStateAction<House | null>>;
    houseForm: HouseFormState;
    setHouseForm: SetHouseForm;
    isManager: boolean;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    onSaveHouse: (formData: any) => Promise<void>;
    onPreview: () => void;
}

/** Gestaupplýsingar tab: booking links, the fixed guest link and the guest info form. */
export default function GuestsTab({
    house,
    setHouse,
    houseForm,
    setHouseForm,
    isManager,
    loading,
    setLoading,
    onSaveHouse,
    onPreview,
    setSuccess,
    setError,
}: GuestsTabProps) {
    const baseId = useId();

    // Language Toggle for dual-input fields
    const [editLang, setEditLang] = useState<'is' | 'en'>('is');

    // Gestir tab: send only the fields it edits so a stale houseForm can't
    // overwrite changes saved from the Hús tab (name, wifi, location, ...).
    const handleSaveGuestInfo = (e: React.FormEvent) => {
        e.preventDefault();
        onSaveHouse({
            house_rules: houseForm.house_rules,
            house_rules_en: houseForm.house_rules_en,
            check_in_time: houseForm.check_in_time,
            check_out_time: houseForm.check_out_time,
            directions: houseForm.directions,
            directions_en: houseForm.directions_en,
            access_instructions: houseForm.access_instructions,
            access_instructions_en: houseForm.access_instructions_en,
            emergency_contact: houseForm.emergency_contact,
            guest_instructions: houseForm.guest_instructions,
            guest_instructions_en: houseForm.guest_instructions_en,
            amenities: houseForm.amenities
        });
    };

    const handleGenerateGuestToken = async (replace = false) => {
        // The fixed guest link is stored on the house document (guest_token), which only
        // the manager may write, so only the manager creates/replaces/deletes it.
        if (!house || !isManager) return;
        if (replace && !confirm('Ertu viss? Gamli hlekkurinn mun hætta að virka.')) return;

        // Check if we have enough info to make a useful guest page
        const hasInfo =
            houseForm.wifi_ssid ||
            houseForm.wifi_password ||
            houseForm.house_rules ||
            houseForm.check_in_time ||
            houseForm.check_out_time ||
            houseForm.directions ||
            houseForm.access_instructions ||
            (houseForm.lat !== 0 && houseForm.lng !== 0); // Valid coordinates act as "info" (Directions)

        if (!hasInfo) {
            setError('Vinsamlegast fylltu út einhverjar upplýsingar (t.d. WiFi, reglur, eða staðsetningu) áður en þú býrð til gestahlekk.');
            // Switch to relevant tab (e.g. house or guests) if needed, currently mainly in Guests
            // But some info is in House tab (location).
            return;
        }

        setLoading(true);
        try {
            // Delete old if exists
            if (house.guest_token) {
                await deleteDoc(doc(db, 'guest_views', house.guest_token));
            }

            const newToken = generateSecureToken();

            // Create new view
            await setDoc(doc(db, 'guest_views', newToken), {
                houseId: house.id,
                name: houseForm.name,
                address: houseForm.address,
                wifi_ssid: houseForm.wifi_ssid,
                wifi_password: houseForm.wifi_password,
                no_wifi: houseForm.no_wifi,
                house_rules: houseForm.house_rules,
                house_rules_en: houseForm.house_rules_en,
                check_in_time: houseForm.check_in_time,
                check_out_time: houseForm.check_out_time,
                directions: houseForm.directions,
                directions_en: houseForm.directions_en,
                access_instructions: houseForm.access_instructions,
                access_instructions_en: houseForm.access_instructions_en,
                emergency_contact: houseForm.emergency_contact,
                guest_instructions: houseForm.guest_instructions,
                guest_instructions_en: houseForm.guest_instructions_en,
                amenities: houseForm.amenities || [],
                location: {
                    lat: houseForm.lat,
                    lng: houseForm.lng
                },
                image_url: house.image_url || '',
                updated_at: new Date()
            });

            await updateDoc(doc(db, 'houses', house.id), { guest_token: newToken });
            setHouse({ ...house, guest_token: newToken });
            setSuccess('Nýr gestahlekkur búinn til! Gestir geta nú nálgast upplýsingar.');
        } catch (err) {
            logger.error('Error creating guest link:', err);
            setError('Villa við að búa til hlekk.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12">

            {/* Dynamic Links (New) */}
            <section>
                <div className="mb-6">
                    <h2 className="text-2xl font-serif font-bold text-charcoal mb-2">Bókunarhlekkir</h2>
                    <p className="text-grey-mid">Búðu til tímabundna hlekki sem virka sjálfkrafa fyrir hverja bókun.</p>
                </div>
                <MagicLinkGenerator house={house} />
            </section>

            <hr className="border-stone-200" />

            {/* Static Link (Old) */}
            <section>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-charcoal mb-2">Fastur Gestahlekkur</h2>
                        <p className="text-grey-mid">Einn fastur hlekkur fyrir húsið sem hægt er að senda handvirkt. Virkur þar til honum er eytt.</p>
                    </div>
                    <div className="bg-amber/10 text-amber-ink px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                        Mælt með fyrir fjölskyldu
                    </div>
                </div>

                <div className="card p-6 border-2 border-stone-100">
                    {house.guest_token ? (
                        <div className="space-y-6">
                            <div className="bg-green-50 border border-green-100 rounded-xl p-6 text-center">
                                <p className="text-green-800 font-medium mb-2">✓ Gestasíða er virk</p>
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <code className="bg-white px-3 py-1 rounded border border-green-200 text-green-900 font-mono text-lg">
                                        bustadurinn.is/guest/{house.guest_token}
                                    </code>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/guest/${house.guest_token}`);
                                            setSuccess('Hlekkur afritaður!');
                                            setTimeout(() => setSuccess(''), 2000);
                                        }}
                                        className="p-2 hover:bg-green-100 rounded-lg text-green-700 transition-colors"
                                        aria-label="Afrita gestahlekk"
                                    >
                                        <Copy size={20} aria-hidden="true" />
                                    </button>
                                </div>
                                <div className="flex justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={onPreview}
                                        className="btn bg-amber-500 text-charcoal hover:bg-amber-600 border-none text-sm px-4"
                                    >
                                        <Eye size={16} className="mr-2" aria-hidden="true" />
                                        Forskoða
                                    </button>
                                    <a
                                        href={`/guest/${house.guest_token}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn bg-green-700 text-white hover:bg-green-800 border-none text-sm px-6"
                                    >
                                        Opna síðu<span className="sr-only"> (opnast í nýjum glugga)</span>
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (navigator.share) {
                                                navigator.share({
                                                    title: `Gestasíða - ${house.name}`,
                                                    url: `${window.location.origin}/guest/${house.guest_token}`
                                                });
                                            }
                                        }}
                                        className="btn bg-white text-green-700 border border-green-200 hover:bg-green-50 text-sm px-4"
                                    >
                                        Deila
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                                <p id="guest-link-readonly-note" className="text-sm text-stone-500">
                                    {isManager
                                        ? 'Viltu endurnýja hlekkinn? Gamli hlekkurinn hættir að virka.'
                                        : 'Aðeins umsjónarmaður hússins getur breytt eða eytt fasta hlekknum.'}
                                </p>
                                <div className="mt-4 flex gap-2">
                                    {isManager && (
                                    <button
                                        type="button"
                                        onClick={() => handleGenerateGuestToken(true)}
                                        className="btn btn-ghost text-stone-500 hover:text-charcoal text-sm"
                                    >
                                        <RefreshCw size={14} className="mr-2" aria-hidden="true" />
                                        Endurnýja
                                    </button>
                                    )}
                                    {isManager && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!confirm('Ertu viss? Þetta lokar á aðganginn strax.')) return;
                                            setLoading(true);
                                            try {
                                                await deleteDoc(doc(db, 'guest_views', house.guest_token!));
                                                await updateDoc(doc(db, 'houses', house.id), { guest_token: null });
                                                setHouse({ ...house, guest_token: undefined });
                                                setSuccess('Gestasíðu eytt');
                                            } catch (e) {
                                                logger.error('Error deleting guest page:', e);
                                                setError('Gat ekki eytt síðu');
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        className="btn btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700 text-sm"
                                    >
                                        Eyða<span className="sr-only"> gestasíðu</span>
                                    </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : !isManager ? (
                        <div className="text-center py-8">
                            <h3 className="text-lg font-bold text-charcoal mb-2">Enginn fastur gestahlekkur</h3>
                            <p className="text-stone-500 max-w-sm mx-auto">
                                Aðeins umsjónarmaður hússins getur búið til fastan gestahlekk. Bókunarhlekkirnir hér að ofan virka fyrir alla meðeigendur.
                            </p>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <LinkIcon size={32} className="text-stone-500" aria-hidden="true" />
                            </div>
                            <h3 className="text-lg font-bold text-charcoal mb-2">Enginn fastur gestahlekkur</h3>
                            <p className="text-stone-500 mb-6 max-w-sm mx-auto">
                                Þú getur búið til einn fastan hlekk sem er alltaf virkur, til dæmis fyrir fjölskyldumeðlimi.
                            </p>
                            <button
                                type="button"
                                onClick={() => handleGenerateGuestToken(false)}
                                disabled={loading}
                                className="btn btn-primary"
                            >
                                {loading ? 'Bý til...' : 'Búa til fastan hlekk'}
                            </button>
                        </div>
                    )}
                </div>
            </section>

            <hr className="border-stone-200" />

            {!isManager && (
                <div id="guest-info-readonly-note" className="bg-amber/10 border border-amber/30 text-charcoal px-4 py-3 rounded text-sm">
                    Aðeins umsjónarmaður hússins getur breytt gestaupplýsingum. Þú getur skoðað þær hér.
                </div>
            )}
            {/* House-document fields: disabled unless the user is the manager */}
            <fieldset disabled={!isManager} aria-describedby={!isManager ? 'guest-info-readonly-note' : undefined} className="space-y-12 min-w-0 border-0 p-0 m-0">
            <legend className="sr-only">Gestaupplýsingar hússins</legend>

            {/* Amenities Section */}
            <section>
                <div className="mb-6">
                    <h2 id={`${baseId}-amenities-h`} className="text-2xl font-serif font-bold text-charcoal mb-2">Þægindi</h2>
                    <p className="text-grey-mid">Merktu við það sem er í boði í húsinu. Þetta birtist á gestasíðunni.</p>
                </div>

                <div className="card p-6 border-2 border-stone-100">
                    <div role="group" aria-labelledby={`${baseId}-amenities-h`} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { id: 'hot_tub', label: 'Heitur pottur' },
                            { id: 'grill', label: 'Grill' },
                            { id: 'tv', label: 'Sjónvarp / Apple TV' },
                            { id: 'sauna', label: 'Sauna / Gufa' },
                            { id: 'washer', label: 'Þvottavél' },
                            { id: 'dishwasher', label: 'Uppþvottavél' },
                            { id: 'fireplace', label: 'Arinn' },
                            { id: 'outdoor_furniture', label: 'Verönd / Garðhúsgögn' },
                            { id: 'kayak', label: 'Kajak / Bátur' },
                            { id: 'bikes', label: 'Reiðhjól' },
                            { id: 'games', label: 'Leikir / Spil' },
                            { id: 'coffee_machine', label: 'Kaffivél' }
                        ].map(amenity => (
                            <label key={amenity.id} htmlFor={`${baseId}-amenity-${amenity.id}`} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-stone-50 transition-colors">
                                <input
                                    id={`${baseId}-amenity-${amenity.id}`}
                                    type="checkbox"
                                    checked={houseForm.amenities.includes(amenity.id)}
                                    onChange={(e) => {
                                        const newAmenities = e.target.checked
                                            ? [...houseForm.amenities, amenity.id]
                                            : houseForm.amenities.filter(a => a !== amenity.id);
                                        setHouseForm({ ...houseForm, amenities: newAmenities });
                                    }}
                                    className="w-5 h-5 rounded border-stone-300 text-amber focus:ring-amber"
                                />
                                <span className="text-sm text-charcoal">{amenity.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </section>

            <hr className="border-stone-200" />

            {/* Guest Instructions */}
            <section>
                <div className="mb-6">
                    <h2 className="text-2xl font-serif font-bold text-charcoal mb-2">Almennar leiðbeiningar</h2>
                    <p className="text-grey-mid">Frjálst svæði fyrir ráðleggingar og upplýsingar sem gestir ættu að vita.</p>
                </div>

                <div className="card p-6 border-2 border-stone-100">
                    <textarea
                        id={`${baseId}-guest-instr`}
                        aria-label="Almennar leiðbeiningar fyrir gesti"
                        className="input min-h-[120px]"
                        value={editLang === 'is' ? houseForm.guest_instructions : houseForm.guest_instructions_en}
                        onChange={(e) => setHouseForm({
                            ...houseForm,
                            [editLang === 'is' ? 'guest_instructions' : 'guest_instructions_en']: e.target.value
                        })}
                        placeholder="t.d. Gott að vita: Heitt vatn tekur 10 mín að hitna. Nálægustu matvöruverslanir eru í Selfossi..."
                    />
                    <p className="text-xs text-stone-500 mt-2">
                        Skiptið á milli íslensku/ensku með tungumálarofanum hér fyrir neðan.
                    </p>
                </div>
            </section>

            <hr className="border-stone-200" />

            {/* Content Editor */}
            <section>
                <div className="mb-6">
                    <h2 className="text-2xl font-serif font-bold text-charcoal mb-2">Upplýsingar fyrir gesti</h2>
                    <p className="text-grey-mid">Þessar upplýsingar birtast sjálfkrafa á gestasíðunni.</p>
                </div>

                <div className="card p-6 border-2 border-stone-100">
                    <form onSubmit={handleSaveGuestInfo} className="space-y-6 pb-24">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor={`${baseId}-gi-checkin`} className="label">Innritun (kl.)</label>
                                <input
                                    id={`${baseId}-gi-checkin`}
                                    type="text"
                                    className="input"
                                    value={houseForm.check_in_time}
                                    onChange={(e) => setHouseForm({ ...houseForm, check_in_time: e.target.value })}
                                    placeholder="16:00"
                                />
                            </div>
                            <div>
                                <label htmlFor={`${baseId}-gi-checkout`} className="label">Útritun (kl.)</label>
                                <input
                                    id={`${baseId}-gi-checkout`}
                                    type="text"
                                    className="input"
                                    value={houseForm.check_out_time}
                                    onChange={(e) => setHouseForm({ ...houseForm, check_out_time: e.target.value })}
                                    placeholder="12:00"
                                />
                            </div>
                        </div>

                        {/* Language Toggle */}
                        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                            <span className="text-sm font-medium text-stone-500">Tungumál lýsingar:</span>
                            <div role="group" aria-label="Tungumál lýsingar" className="flex bg-stone-100 rounded-lg p-1">
                                <button
                                    type="button"
                                    aria-pressed={editLang === 'is'}
                                    onClick={() => setEditLang('is')}
                                    className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${editLang === 'is'
                                        ? 'bg-white text-charcoal shadow-sm'
                                        : 'text-grey-mid hover:text-stone-700'
                                        }`}
                                >
                                    🇮🇸 Íslenska
                                </button>
                                <button
                                    type="button"
                                    aria-pressed={editLang === 'en'}
                                    onClick={() => setEditLang('en')}
                                    className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${editLang === 'en'
                                        ? 'bg-white text-charcoal shadow-sm'
                                        : 'text-grey-mid hover:text-stone-700'
                                        }`}
                                >
                                    🇬🇧 English
                                </button>
                            </div>
                        </div>

                        <div className={`transition-all duration-300 ${editLang === 'en' ? 'bg-amber-50/50 p-4 rounded-lg border border-amber-100' : ''}`}>
                            <div className="mb-4">
                                <label htmlFor={`${baseId}-gi-rules`} className="label flex items-center gap-2">
                                    Húsreglur
                                    {editLang === 'en' && <span className="text-[10px] uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Enska</span>}
                                </label>
                                <textarea
                                    id={`${baseId}-gi-rules`}
                                    className="input min-h-[100px]"
                                    value={editLang === 'is' ? houseForm.house_rules : houseForm.house_rules_en}
                                    onChange={(e) => setHouseForm({
                                        ...houseForm,
                                        [editLang === 'is' ? 'house_rules' : 'house_rules_en']: e.target.value
                                    })}
                                    placeholder={editLang === 'is' ? "t.d. Reykingar bannaðar. Þrífa eftir sig..." : "e.g. No smoking. Clean up after yourself..."}
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor={`${baseId}-gi-directions`} className="label flex items-center gap-2">
                                    Leiðarlýsing (eða hlekkur á kort)
                                    {editLang === 'en' && <span className="text-[10px] uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Enska</span>}
                                </label>
                                <textarea
                                    id={`${baseId}-gi-directions`}
                                    className="input"
                                    value={editLang === 'is' ? houseForm.directions : houseForm.directions_en}
                                    onChange={(e) => setHouseForm({
                                        ...houseForm,
                                        [editLang === 'is' ? 'directions' : 'directions_en']: e.target.value
                                    })}
                                    placeholder={editLang === 'is' ? "t.d. Keyrt er í gegnum..." : "e.g. Drive through..."}
                                />
                                {(houseForm.lat !== 0 && houseForm.lng !== 0) && (
                                    <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                                        <CheckCircle size={12} aria-hidden="true" />
                                        GPS hnit eru skráð. Gestasíðan mun sýna "Rata í hús" takka sjálfkrafa.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor={`${baseId}-gi-access`} className="label flex items-center gap-2">
                                    Aðgangsleiðbeiningar (Lykilbox ofl.)
                                    {editLang === 'en' && <span className="text-[10px] uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Enska</span>}
                                </label>
                                <textarea
                                    id={`${baseId}-gi-access`}
                                    className="input"
                                    value={editLang === 'is' ? houseForm.access_instructions : houseForm.access_instructions_en}
                                    onChange={(e) => setHouseForm({
                                        ...houseForm,
                                        [editLang === 'is' ? 'access_instructions' : 'access_instructions_en']: e.target.value
                                    })}
                                    placeholder={editLang === 'is' ? "t.d. Kóði í lykilbox er 1234..." : "e.g. Keybox code is 1234..."}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor={`${baseId}-gi-emergency`} className="label">Neyðarnúmer / Tengiliður</label>
                            <input
                                id={`${baseId}-gi-emergency`}
                                type="text"
                                className="input"
                                value={houseForm.emergency_contact}
                                onChange={(e) => setHouseForm({ ...houseForm, emergency_contact: e.target.value })}
                                placeholder="Sími 555-1234"
                            />
                        </div>

                        <div className="pt-4 border-t border-stone-100">
                            <button type="submit" className="btn btn-primary w-full md:w-auto" disabled={loading}>
                                <Save className="w-4 h-4 mr-2 inline" aria-hidden="true" />
                                Vista upplýsingar
                            </button>
                        </div>
                    </form>
                </div>
            </section>
            </fieldset>
        </div>
    );
}
