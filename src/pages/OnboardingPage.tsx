
// Declare Google Maps types
declare var google: any;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MapPin, Users, CheckCircle, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp, setDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore } from '@/store/appStore';
import { searchHMSAddresses, formatHMSAddress } from '@/utils/hmsSearch';
import { analytics } from '@/utils/analytics';

type OnboardingStep = 'welcome' | 'house' | 'invite' | 'finish';

export default function OnboardingPage() {
    const navigate = useNavigate();
    const currentUser = useAppStore((state) => state.currentUser);
    const setCurrentUser = useAppStore((state) => state.setCurrentUser);
    const setCurrentHouse = useAppStore((state) => state.setCurrentHouse);
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [houseData, setHouseData] = useState({
        name: '',
        address: '',
        location: { lat: 0, lng: 0 },
        id: '',
        invite_code: ''
    });

    const [inviteEmails, setInviteEmails] = useState('');
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [debounceTimer, setDebounceTimer] = useState<any>(null); // Store timer

    const steps = [
        { id: 'welcome', label: 'Velkomin' },
        { id: 'house', label: 'Húsupplýsingar' },
        { id: 'invite', label: 'Bjóða meðeigendum' },
        { id: 'finish', label: 'Klára' }
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    useEffect(() => {
        // Only auto-redirect if they have a house AND are on the very first step
        // This allows them to stay in the flow after house creation (Step 2 -> 3)
        if (currentUser && currentUser.house_ids && currentUser.house_ids.length > 0 && currentStep === 'welcome') {
            navigate('/dashboard');
        } else if (currentStep === 'welcome') {
            // Track visit to onboarding
            analytics.onboardingStep('welcome');
            logFunnelEvent('onboarding_started');
        }
    }, [currentUser, navigate, currentStep]);

    const logFunnelEvent = async (eventName: string) => {
        if (!currentUser) return;
        try {
            await addDoc(collection(db, 'funnel_events'), {
                uid: currentUser.uid,
                event_name: eventName,
                timestamp: serverTimestamp(),
                house_id: houseData.id || null
            });
        } catch (e) {
            console.error('Funnel log error:', e);
        }
    };

    // Initialize Google Maps API Script
    useEffect(() => {
        if (currentStep === 'house' && !scriptLoaded) {
            const loadMaps = async () => {
                const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                if (!apiKey) {
                    console.warn('Google Maps API key not found.');
                    return;
                }

                if (typeof google === 'undefined' || !google.maps) {
                    const script = document.createElement('script');
                    // Ensure v=weekly to get new features
                    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&v=weekly`;
                    script.async = true;
                    script.defer = true;
                    script.onload = () => setScriptLoaded(true);
                    script.onerror = () => console.error('Failed to load Maps');
                    document.head.appendChild(script);
                } else {
                    setScriptLoaded(true);
                }
            };
            loadMaps();
        }
    }, [currentStep, scriptLoaded]);

    const handleAddressChange = (val: string) => {
        setHouseData(prev => ({ ...prev, address: val }));

        // Debounce Search
        if (debounceTimer) clearTimeout(debounceTimer);

        if (val.length >= 2) {
            const timer = setTimeout(async () => {
                const results: any[] = [];

                // 1. Search HMS (Official Icelandic Registry)
                try {
                    const hms = await searchHMSAddresses(val);
                    hms.forEach(item => {
                        results.push({
                            id: `hms-${item.lat}-${item.lng}`,
                            description: formatHMSAddress(item),
                            location: { lat: item.lat, lng: item.lng },
                            source: 'hms'
                        });
                    });
                } catch (e) {
                    console.error("HMS search error:", e);
                }

                // 2. Search Google (Google Maps)
                if (scriptLoaded && typeof google !== 'undefined') {
                    try {
                        const { Place } = await google.maps.importLibrary("places");
                        const { places } = await Place.searchByText({
                            textQuery: val,
                            fields: ['formattedAddress', 'location'],
                        });

                        if (places) {
                            places.forEach((p: any) => {
                                // Only add if not already present via HMS (basic string comparison)
                                const desc = p.formattedAddress;
                                if (!results.some(r => r.description.includes(desc) || desc.includes(r.description))) {
                                    results.push({
                                        id: p.id || Math.random(),
                                        description: p.formattedAddress,
                                        location: p.location,
                                        source: 'google'
                                    });
                                }
                            });
                        }
                    } catch (e) {
                        console.error("Google search error:", e);
                    }
                }

                setSuggestions(results);
            }, 400);
            setDebounceTimer(timer);
        } else {
            setSuggestions([]);
        }
    };

    const handleSelectPrediction = (suggestion: any) => {
        setSuggestions([]);

        // Extract lat/lng (HMS provides numbers, Google provides functions)
        const lat = typeof suggestion.location.lat === 'function' ? suggestion.location.lat() : suggestion.location.lat;
        const lng = typeof suggestion.location.lng === 'function' ? suggestion.location.lng() : suggestion.location.lng;

        setHouseData(prev => ({
            ...prev,
            address: suggestion.description,
            location: { lat, lng }
        }));
    };

    const nextStep = () => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < steps.length) {
            const nextStepId = steps[nextIndex].id;
            setCurrentStep(nextStepId as OnboardingStep);

            // Track funnel
            analytics.onboardingStep(nextStepId);
            logFunnelEvent(`step_${nextStepId}`);
        }
    };

    const prevStep = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(steps[prevIndex].id as OnboardingStep);
        }
    };

    const handleCreateHouse = async () => {
        if (!houseData.name || !houseData.address) {
            setError('Vinsamlegast fylltu út öll nauðsynleg svæði');
            return;
        }

        if (!currentUser) {
            setError('Engin notandi skráður inn');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Create House
            const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const houseRef = await addDoc(collection(db, 'houses'), {
                name: houseData.name,
                address: houseData.address,
                location: houseData.location,
                manager_id: currentUser.uid,
                owner_ids: [currentUser.uid],
                invite_code: inviteCode,
                holiday_mode: 'fairness' as const,
                seo_slug: houseData.name.toLowerCase().replace(/\s+/g, '-'),
                subscription_status: 'trial',
                subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            });

            const newHouse = {
                id: houseRef.id,
                name: houseData.name,
                address: houseData.address,
                location: houseData.location,
                manager_id: currentUser.uid,
                owner_ids: [currentUser.uid],
                invite_code: inviteCode,
                subscription_status: 'trial' as const,
                subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            };

            // Update local state with created house metadata
            setHouseData(prev => ({
                ...prev,
                id: houseRef.id,
                invite_code: inviteCode
            }));

            // 2. Link to User (CRITICAL for Dashboard)
            // Use setDoc with merge: true to CREATE user profile if it doesn't exist
            await setDoc(doc(db, 'users', currentUser.uid), {
                email: currentUser.email,
                name: currentUser.name || currentUser.email?.split('@')[0],
                house_ids: arrayUnion(houseRef.id)
            }, { merge: true });

            // 3. Update Local State (Immediate Reflection)
            setCurrentHouse(newHouse as any);
            setCurrentUser({
                ...currentUser,
                house_ids: [...(currentUser.house_ids || []), houseRef.id]
            });

            // 4. Send Welcome Email (Non-blocking with dynamic template)
            (async () => {
                try {
                    const userName = currentUser.name || currentUser.email?.split('@')[0];

                    const res = await fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            templateId: 'welcome',
                            to: currentUser.email,
                            variables: { name: userName }
                        })
                    });

                    if (res.ok) {
                        console.log('✅ Welcome email sent');
                    } else {
                        const text = await res.text();
                        let errorMsg = res.statusText;
                        try {
                            const errorData = JSON.parse(text);
                            errorMsg = errorData.error || errorMsg;
                        } catch (e) {
                            // Not JSON
                        }
                        console.error('❌ Failed to send welcome email:', errorMsg);
                    }
                } catch (e) {
                    console.error("Failed to send welcome email:", e);
                }
            })();

            analytics.onboardingStep('invite');
            logFunnelEvent('house_created');
            nextStep();
        } catch (err: any) {
            console.error('Error creating house:', err);
            setError('Villa kom upp við að búa til hús: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendInvites = async () => {
        if (!inviteEmails.trim()) {
            nextStep();
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/send-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emails: inviteEmails,
                    houseName: houseData.name,
                    houseId: houseData.id,
                    inviteCode: houseData.invite_code,
                    senderName: currentUser?.name || currentUser?.email?.split('@')[0]
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Gat ekki sent boð');
            }

            nextStep();
        } catch (err: any) {
            console.error('Error sending invites:', err);
            setError('Villa við að senda boð: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bone flex items-center justify-center p-6">
            <div className="w-full max-w-3xl">
                {/* Progress */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-4">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center flex-1">
                                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${index <= currentStepIndex
                                        ? 'bg-charcoal text-bone'
                                        : 'bg-grey-warm text-grey-mid'
                                    }
                `}>
                                    {index + 1}
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`
                    flex-1 h-1 mx-2
                    ${index < currentStepIndex ? 'bg-charcoal' : 'bg-grey-warm'}
                  `} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-sm text-grey-mid">
                        {steps.map(step => (
                            <span key={step.id} className="flex-1 text-center">
                                {step.label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-700 rounded p-4 mb-6">
                        {error}
                    </div>
                )}

                {/* Step Content */}
                <div className="card">
                    {currentStep === 'welcome' && (
                        <div className="text-center py-8 animate-fade-in">
                            <Home className="w-16 h-16 mx-auto mb-6 text-amber" />
                            <h2 className="mb-4">Velkomin í Bústaðurinn.is</h2>
                            <p className="text-xl text-grey-dark mb-8 max-w-md mx-auto">
                                Við skulum setja upp sumarhúsið ykkar í kerfinu.
                                Þetta tekur bara nokkrar mínútur.
                            </p>
                            <button onClick={nextStep} className="btn btn-primary">
                                Byrja uppsetningu
                            </button>
                        </div>
                    )}

                    {currentStep === 'house' && (
                        <div className="animate-fade-in">
                            <div className="flex items-center gap-3 mb-6">
                                <MapPin className="w-8 h-8 text-amber" />
                                <h2 className="mb-0">Upplýsingar um húsið</h2>
                            </div>

                            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleCreateHouse(); }}>
                                <div>
                                    <label className="label">Nafn á húsinu *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={houseData.name}
                                        onChange={(e) => setHouseData({ ...houseData, name: e.target.value })}
                                        placeholder="t.d. Sumarbústaðurinn okkar"
                                        required
                                    />
                                </div>

                                <div className="relative">
                                    <label className="label">Heimilisfang *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={houseData.address}
                                        onChange={(e) => handleAddressChange(e.target.value)}
                                        placeholder="t.d. Sumarhúsabyggð 12, 800 Selfoss"
                                        required
                                        autoComplete="off"
                                    />
                                    {suggestions.length > 0 && (
                                        <ul className="absolute z-10 w-full bg-white border border-stone-200 mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                            {suggestions.map((suggestion) => (
                                                <li
                                                    key={suggestion.id}
                                                    onClick={() => handleSelectPrediction(suggestion)}
                                                    className="px-4 py-3 hover:bg-stone-50 cursor-pointer text-sm border-b last:border-0 border-stone-100 flex items-center justify-between group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {suggestion.source === 'hms' ? (
                                                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center">
                                                                <MapPin className="w-4 h-4 text-stone-400" />
                                                            </div>
                                                        )}
                                                        <span className="font-medium">{suggestion.description}</span>
                                                    </div>
                                                    {suggestion.source === 'hms' && (
                                                        <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200 font-bold uppercase tracking-wider">
                                                            HMS
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <p className="text-sm text-grey-mid mt-2">
                                        Finnst bústaðurinn ekki? Skrifaðu nafnið eða heimilisfangið hér. Þú getur svo fínstillt staðsetninguna á kortinu í Stillingum.
                                    </p>
                                </div>

                                <div className="flex gap-4 justify-end">
                                    <button type="button" onClick={prevStep} className="btn btn-ghost" disabled={loading}>
                                        Til baka
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Bý til hús...
                                            </>
                                        ) : (
                                            'Áfram'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {currentStep === 'invite' && (
                        <div className="animate-fade-in">
                            <div className="flex items-center gap-3 mb-6">
                                <Users className="w-8 h-8 text-amber" />
                                <h2 className="mb-0">Bjóða meðeigendum</h2>
                            </div>

                            <p className="text-grey-dark mb-6">
                                Sendu boð til fjölskyldumeðlima og meðeigenda sem eiga að hafa aðgang að húsinu.
                            </p>

                            <div className="bg-bone border border-stone-200 rounded-lg p-4 mb-6">
                                <h4 className="font-semibold text-charcoal mb-3 text-sm">Hlutverk í kerfinu</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex gap-2">
                                        <span className="font-bold text-charcoal min-w-[90px]">Bústaðastjóri:</span>
                                        <span className="text-grey-dark">Þú (getur breytt stillingum, bætt við eigendum, eytt húsi)</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-bold text-charcoal min-w-[90px]">Meðeigendur:</span>
                                        <span className="text-grey-dark">Geta bókað, skráð útgjöld, bætt við verkefnum og séð allar upplýsingar</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber/10 border border-amber/30 rounded p-4 mb-6">
                                <p className="text-sm">
                                    <strong>Ábending:</strong> Þú getur boðið fleiri aðilum síðar í stillingunum.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="label">Netföng (aðskilin með kommu)</label>
                                    <textarea
                                        className="input min-h-[100px]"
                                        placeholder="nafn1@netfang.is, nafn2@netfang.is"
                                        value={inviteEmails}
                                        onChange={(e) => setInviteEmails(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 justify-end mt-6">
                                <button onClick={prevStep} className="btn btn-ghost" disabled={loading}>
                                    Til baka
                                </button>
                                <button onClick={handleSendInvites} className="btn btn-secondary" disabled={loading}>
                                    Sleppa þessu skrefi
                                </button>
                                <button onClick={handleSendInvites} className="btn btn-primary" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Sendi boð...
                                        </>
                                    ) : (
                                        'Senda boð'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 'finish' && (
                        <div className="text-center py-8 animate-fade-in">
                            <CheckCircle className="w-16 h-16 mx-auto mb-6 text-amber" />
                            <h2 className="mb-4">Allt tilbúið!</h2>
                            <p className="text-xl text-grey-dark mb-8 max-w-md mx-auto">
                                Uppsetningu á <strong>{houseData.name || 'sumarhúsinu'}</strong> er
                                lokið. Njótið þess að nota kerfið!
                            </p>
                            <button
                                onClick={() => {
                                    analytics.onboardingCompleted();
                                    logFunnelEvent('onboarding_completed');
                                    navigate('/dashboard');
                                }}
                                className="btn btn-primary"
                            >
                                Fara á stjórnborð
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
