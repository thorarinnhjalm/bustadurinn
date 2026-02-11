// Declare Google Maps types
declare const google: any;

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, MapPin, Users, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, arrayUnion, getDoc, runTransaction } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAppStore } from '@/store/appStore';
import { searchHMSAddresses, formatHMSAddress } from '@/utils/hmsSearch';
import { analytics } from '@/utils/analytics';
import { logger } from '@/utils/logger';
import AddToHomeScreenPrompt from '@/components/AddToHomeScreenPrompt';

type OnboardingStep = 'welcome' | 'house' | 'invite' | 'finish';

export default function OnboardingPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const currentUser = useAppStore((state) => state.currentUser);
    const setCurrentUser = useAppStore((state) => state.setCurrentUser);
    const setCurrentHouse = useAppStore((state) => state.setCurrentHouse);

    // Determine initial step - if creating new house (param 'new'), skip welcome
    const initialStep: OnboardingStep = searchParams.get('new') ? 'house' : 'welcome';
    const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialStep);
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
    const [showPwaPrompt, setShowPwaPrompt] = useState(false);

    const [duplicateHouse, setDuplicateHouse] = useState<{ id: string; name: string; manager_id: string } | null>(null);
    const [joinRequestSent, setJoinRequestSent] = useState(false);

    const steps = [
        { id: 'welcome', label: 'Velkomin' },
        { id: 'house', label: 'Húsupplýsingar' },
        { id: 'invite', label: 'Bjóða meðeigendum' },
        { id: 'finish', label: 'Klára' }
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    const logFunnelEvent = useCallback(async (eventName: string) => {
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
    }, [currentUser, houseData.id]);

    useEffect(() => {
        // Only auto-redirect if they have a house AND are on the very first step
        // AND they are not explicitly trying to create a new house
        const isCreatingNew = searchParams.get('new') === 'true';

        if (currentUser && currentUser.house_ids && currentUser.house_ids.length > 0 && currentStep === 'welcome' && !isCreatingNew) {
            navigate('/dashboard');
        } else if (currentStep === 'welcome') {
            // Track visit to onboarding
            analytics.onboardingStep('welcome');
            logFunnelEvent('onboarding_started');
        }
    }, [currentUser, navigate, currentStep, logFunnelEvent, searchParams]);

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
        setDuplicateHouse(null); // Reset duplicate warning on change
        setJoinRequestSent(false);

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

        analytics.track('address_selected', { source: suggestion.source || 'unknown' });

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
            const prevStepId = steps[prevIndex].id;
            // Track backtracking
            analytics.funnelDropoff(currentStep, 'back_button');
            setCurrentStep(prevStepId as OnboardingStep);
        }
    };

    const handleSendJoinRequest = async () => {
        if (!duplicateHouse || !currentUser) return;
        setLoading(true);
        setError('');

        try {
            // 1. Fetch manager email
            const managerDoc = await getDoc(doc(db, 'users', duplicateHouse.manager_id));
            if (!managerDoc.exists()) throw new Error('Eigandi fannst ekki');
            const managerData = managerDoc.data();
            const managerEmail = managerData.email;

            // 2. Send email via API
            const token = await auth.currentUser?.getIdToken();
            await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    templateId: 'general_notification', // Using generic template for now
                    to: managerEmail,
                    variables: {
                        title: 'Beiðni um aðgang að húsi',
                        message: `${currentUser.name || currentUser.email} hefur óskað eftir aðgangi að húsinu ${duplicateHouse.name} (${houseData.address}).`,
                        actionUrl: 'https://www.bustadurinn.is/dashboard' // Ideally link to approvals
                    }
                })
            });

            // 3. Create a notification in DB
            await addDoc(collection(db, 'notifications'), {
                user_id: duplicateHouse.manager_id,
                type: 'join_request',
                title: 'Beiðni um aðgang',
                message: `${currentUser.name || currentUser.email} vill ganga í húsfélagið fyrir ${duplicateHouse.name}`,
                data: {
                    requester_id: currentUser.uid,
                    requester_email: currentUser.email,
                    house_id: duplicateHouse.id
                },
                read: false,
                created_at: serverTimestamp()
            });

            setJoinRequestSent(true);
        } catch (err: any) {
            console.error('Error sending request:', err);
            setError('Ekki tókst að senda beiðni: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateHouse = async () => {
        // Only name is strictly required now
        if (!houseData.name) {
            setError('Vinsamlegast settu inn nafn á húsið');
            analytics.error('house_creation', 'Missing house name');
            return;
        }

        if (!currentUser) {
            setError('Engin notandi skráður inn');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 0. Skip duplicate address check (Privacy rules prevent clients from searching all houses)
            // We rely on backend constraints or ignore duplicates for now as address is not a unique key.
            // (Permission denied errors were causing issues here)


            // 1. Create House with Standard Trial (30 Days)
            let houseId: string;
            let inviteCode: string;

            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, 'users', currentUser.uid);

                // We don't strictly need to read the user doc for arrayUnion, but it's good practice in transactions
                // to fail fast if user doesn't exist.
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) {
                    throw new Error("User does not exist");
                }

                // Prepare House Data
                inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                const houseRef = doc(collection(db, 'houses')); // Generate ID first
                houseId = houseRef.id;

                const startDate = new Date();
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 30); // 30 Day Trial (Standard)

                const newHouseData = {
                    name: houseData.name,
                    address: houseData.address || '',
                    location: houseData.location || { lat: 0, lng: 0 },
                    manager_id: currentUser.uid,
                    owner_ids: [currentUser.uid],
                    invite_code: inviteCode,
                    holiday_mode: 'fairness',
                    seo_slug: houseData.name.toLowerCase().replace(/\s+/g, '-'),
                    subscription_status: 'trial',
                    subscription_end: endDate,
                    created_at: new Date(),
                    updated_at: new Date()
                };

                // Commit House
                transaction.set(houseRef, newHouseData);

                // Link to User (Atomic)
                transaction.update(userRef, {
                    house_ids: arrayUnion(houseId)
                });
            });

            // We need to reconstruct the objects for local state since 'serverTimestamp' is not a date yet
            // and we need strict types.
            const createdHouseLocalState = {
                id: houseId!,
                name: houseData.name,
                address: houseData.address || '',
                location: houseData.location || { lat: 0, lng: 0 },
                manager_id: currentUser.uid,
                owner_ids: [currentUser.uid],
                invite_code: inviteCode!,
                subscription_status: 'trial',
                subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            };

            // Initialize Subcollections (Post-Transaction, non-critical)
            try {
                // 1. Sample Task
                await addDoc(collection(db, 'houses', houseId!, 'tasks'), {
                    title: 'Kl klára uppsetningu',
                    description: 'Farðu í stillingar og fylltu út húsreglur, WiFi og aðrar upplýsingar.',
                    status: 'pending',
                    house_id: houseId!,
                    created_by: currentUser.uid,
                    created_at: serverTimestamp(),
                    priority: 'high'
                });

                // 2. Initial Log Entry
                await addDoc(collection(db, 'houses', houseId!, 'internal_logs'), {
                    text: 'Hús stofnað.',
                    house_id: houseId!,
                    user_id: currentUser.uid,
                    user_name: currentUser.name || currentUser.email,
                    created_at: serverTimestamp()
                });
            } catch (initErr) {
                console.error("Error initializing default data:", initErr);
                // Non-critical, continue
            }

            // Update local state with created house metadata
            setHouseData(prev => ({
                ...prev,
                id: houseId!,
                invite_code: inviteCode!
            }));

            // 3. Update Local State (Immediate Reflection)
            setCurrentHouse(createdHouseLocalState as any);
            setCurrentUser({
                ...currentUser,
                house_ids: [...(currentUser.house_ids || []), houseId!]
            });

            console.log("House transaction complete. ID:", houseId!);

            // Track key conversion events
            analytics.onboardingCompleted();
            analytics.trialStarted();

            // 4. Send Welcome Email
            (async () => {
                try {
                    const userName = currentUser.name || currentUser.email?.split('@')[0];
                    const token = await auth.currentUser?.getIdToken();

                    const res = await fetch('/api/send-email', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            templateId: 'welcome',
                            to: currentUser.email,
                            variables: { name: userName }
                        })
                    });

                    if (res.ok) {
                        logger.info('Welcome email sent');
                    } else {
                        console.error('❌ Failed to send welcome email');
                    }
                } catch (e) {
                    console.error("Failed to send welcome email:", e);
                }
            })();

            // 5. Send Onboarding Completion Email
            (async () => {
                try {
                    const userName = currentUser.name || currentUser.email?.split('@')[0];
                    const token = await auth.currentUser?.getIdToken();

                    const res = await fetch('/api/send-email', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            templateId: 'onboarding_complete',
                            to: currentUser.email,
                            variables: {
                                name: userName,
                                house_name: houseData.name
                            }
                        })
                    });

                    if (res.ok) {
                        logger.info('Onboarding completion email sent');
                    } else {
                        console.error('❌ Failed to send onboarding email');
                    }
                } catch (e) {
                    console.error("Failed to send onboarding email:", e);
                }
            })();

            console.log("Tracking analytics...");
            analytics.onboardingStep('invite');
            logFunnelEvent('house_created');

            console.log("Calling nextStep()...");
            nextStep();
        } catch (err: any) {
            console.error('Error creating house:', err);
            if (err.message && err.message.includes("User does not exist")) {
                setError('Villa: Notandaskráningu ekki lokið. Vinsamlegast endurhladdu síðuna til að klára uppsetningu.');
            } else {
                setError('Villa kom upp við að búa til hús: ' + (err.message || 'Óþekkt villa'));
            }
            analytics.error('house_creation', err.message, err.code);
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
            const token = await auth.currentUser?.getIdToken();
            const emailList = inviteEmails.split(',').map(e => e.trim()).filter(e => e.includes('@'));

            if (emailList.length === 0) {
                // If user typed something but no valid emails, just move on or warn? 
                // Let's move on to avoid blocking flow, similar to previous behavior
                nextStep();
                return;
            }

            // Send invites in parallel using the robust invite-member API
            // This API handles checking if user exists (adds them) or creates a formal pending invitation
            const results = await Promise.allSettled(emailList.map(email =>
                fetch('/api/invite-member', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        email: email,
                        houseId: houseData.id,
                        houseName: houseData.name,
                        senderName: currentUser?.name || currentUser?.email?.split('@')[0],
                        senderUid: currentUser?.uid
                    })
                }).then(async res => {
                    if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.error || 'Failed');
                    }
                    return res.json();
                })
            ));

            // Check for failures
            const failures = results.filter(r => r.status === 'rejected');
            if (failures.length > 0) {
                console.error('Some invites failed:', failures);
                // We don't block the flow for partial failures in onboarding to keep it smooth,
                // but we could show a toast or log it.
                // For now, we proceed as the critical path is creating the house.
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
                    {/* Duplicate House Modal/Override */}
                    {duplicateHouse && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                                <div className="flex items-center gap-3 text-amber mb-4">
                                    <AlertTriangle className="w-8 h-8" />
                                    <h3 className="text-xl font-bold text-charcoal m-0">Húsið er þegar skráð</h3>
                                </div>

                                <p className="text-charcoal mb-4">
                                    Húsið <strong>{duplicateHouse.name}</strong> á {houseData.address} er þegar skráð í kerfið.
                                </p>

                                {joinRequestSent ? (
                                    <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded mb-6 flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5" />
                                        <div>
                                            <p className="font-bold">Beiðni send!</p>
                                            <p className="text-sm">Eigandi hússins fær tilkynningu um að þú viljir fá aðgang.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-grey-dark mb-6">
                                        Í stað þess að búa til nýtt hús, viltu senda beiðni á núverandi eiganda um að fá aðgang?
                                    </p>
                                )}

                                <div className="flex flex-col gap-3">
                                    {!joinRequestSent && (
                                        <button
                                            onClick={handleSendJoinRequest}
                                            className="btn btn-primary w-full justify-center"
                                            disabled={loading}
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Senda aðgangsbeiðni'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            setDuplicateHouse(null);
                                            setJoinRequestSent(false);
                                        }}
                                        className="btn btn-ghost w-full"
                                    >
                                        Loka og breyta skráningu
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 'welcome' && (
                        <div className="text-center py-8 animate-fade-in relative">
                            {/* Removed Urgency Badge */}

                            <Home className="w-16 h-16 mx-auto mb-6 text-amber" />
                            <h2 className="mb-4">Velkomin í Bústaðurinn.is</h2>
                            <p className="text-xl text-grey-dark mb-4 max-w-md mx-auto">
                                Við skulum setja upp sumarhúsið ykkar í kerfinu.
                                Þetta tekur bara nokkrar mínútur.
                            </p>

                            {/* Removed Launch Offer Info */}

                            <button onClick={nextStep} className="btn btn-primary w-full md:w-auto px-8 relative overflow-hidden group">
                                <span className="relative z-10">Byrja uppsetningu</span>
                                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 translate-x-full group-hover:translate-x-[-150%] transition-transform duration-700 ease-in-out"></div>
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
                                    <label className="label">Heimilisfang <span className="font-normal text-gray-500">(má fylla út síðar)</span></label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={houseData.address}
                                        onChange={(e) => handleAddressChange(e.target.value)}
                                        placeholder="t.d. Sumarhúsabyggð 12, 800 Selfoss"
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
                                        Þú getur bætt við heimilisfangi síðar til að fá veðurspá og nákvæma staðsetningu.
                                    </p>

                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-3 flex gap-3 items-start">
                                        <div className="bg-blue-100 p-1.5 rounded-full mt-0.5">
                                            <MapPin className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-blue-900 font-medium mb-0.5">Betri upplifun</p>
                                            <p className="text-xs text-blue-800 leading-relaxed">
                                                Með því að skrá heimilisfang færðu sjálfkrafa <strong>veðurspá</strong> og <strong>akstursleiðbeiningar</strong> fyrir bústaðinn.
                                            </p>
                                        </div>
                                    </div>
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

                                    // Check if mobile - show PWA prompt after short delay
                                    const isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent.toLowerCase());
                                    if (isMobile) {
                                        // Show PWA prompt after a short delay
                                        setTimeout(() => {
                                            setShowPwaPrompt(true);
                                        }, 800);
                                    } else {
                                        navigate('/dashboard');
                                    }
                                }}
                                className="btn btn-primary"
                            >
                                Fara á stjórnborð
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* PWA Prompt for Mobile Users */}
            {showPwaPrompt && (
                <AddToHomeScreenPrompt
                    houseName={houseData.name}
                    onDismiss={() => {
                        setShowPwaPrompt(false);
                        navigate('/dashboard');
                    }}
                />
            )}
        </div>
    );
}
