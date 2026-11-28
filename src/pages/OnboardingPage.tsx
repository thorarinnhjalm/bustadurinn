// Declare Google Maps types
declare const google: any;

import { useState, useEffect, useCallback, useRef, useId } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, MapPin, Users, CheckCircle, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, arrayUnion, runTransaction } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAppStore } from '@/store/appStore';
import { searchHMSAddresses, formatHMSAddress } from '@/utils/hmsSearch';
import { analytics } from '@/utils/analytics';
import { logger } from '@/utils/logger';
import { getUserMessage } from '@/utils/userMessages';
import { trackFunnel, describeError, markInOnboarding } from '@/utils/funnel';
import AddToHomeScreenPrompt from '@/components/AddToHomeScreenPrompt';
import { generateInviteCode } from '@/utils/secureToken';

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
    const [nameInvalid, setNameInvalid] = useState(false);
    const nameId = useId();
    const addressId = useId();
    const addressHintId = useId();
    const emailsId = useId();
    const errorId = useId();
    const cardRef = useRef<HTMLDivElement>(null);
    const firstStepRender = useRef(true);

    // Move focus to the step heading when the step changes (screen reader + keyboard users)
    useEffect(() => {
        if (firstStepRender.current) {
            firstStepRender.current = false;
            return;
        }
        const heading = cardRef.current?.querySelector<HTMLElement>('h2');
        if (heading) {
            heading.setAttribute('tabindex', '-1');
            heading.focus();
        }
    }, [currentStep]);

    const steps = [
        { id: 'welcome', label: 'Velkomin' },
        { id: 'house', label: 'Húsupplýsingar' },
        { id: 'invite', label: 'Bjóða meðeigendum' },
        { id: 'finish', label: 'Klára' }
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    const logFunnelEvent = useCallback(async (eventName: string, data?: Record<string, unknown>) => {
        await trackFunnel(eventName, { house_id: houseData.id || undefined, ...data });
    }, [houseData.id]);

    // One event per mount: a new mount_id without a new load_id means React
    // remounted the page (e.g. after the error boundary's "Reyna aftur"),
    // while a new load_id means the page was reloaded.
    const [mountId] = useState(() => Math.random().toString(36).slice(2, 10));
    useEffect(() => {
        void trackFunnel('onboarding_mounted', {
            mount_id: mountId,
            initial_step: initialStep,
            new_param: searchParams.get('new'),
            has_user: !!currentUser,
            house_count: currentUser?.house_ids?.length ?? 0,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Record leaving the page (app switched, tab hidden or closed, navigated
    // away) together with the step the user was on. Best effort: a write
    // started while the tab is closing may never reach the server.
    const currentStepRef = useRef(currentStep);
    currentStepRef.current = currentStep;
    useEffect(() => {
        const onHide = () => {
            if (document.visibilityState !== 'hidden') return;
            void trackFunnel('onboarding_page_hidden', { step: currentStepRef.current, mount_id: mountId });
        };
        document.addEventListener('visibilitychange', onHide);
        return () => {
            document.removeEventListener('visibilitychange', onHide);
            void trackFunnel('onboarding_unmounted', { step: currentStepRef.current, mount_id: mountId });
        };
    }, [mountId]);

    useEffect(() => {
        // Only auto-redirect if they have a house AND are on the very first step
        // AND they are not explicitly trying to create a new house
        const isCreatingNew = searchParams.get('new') === 'true';

        if (currentUser && currentUser.house_ids && currentUser.house_ids.length > 0 && currentStep === 'welcome' && !isCreatingNew) {
            void trackFunnel('onboarding_redirect_dashboard', { house_count: currentUser.house_ids.length });
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
                    logger.warn('Google Maps API key not found.');
                    void trackFunnel('maps_key_missing');
                    return;
                }

                if (typeof google === 'undefined' || !google.maps) {
                    const script = document.createElement('script');
                    // Ensure v=weekly to get new features
                    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&v=weekly`;
                    script.async = true;
                    script.defer = true;
                    script.onload = () => setScriptLoaded(true);
                    script.onerror = () => {
                        logger.error('Failed to load Maps');
                        void trackFunnel('maps_load_error');
                    };
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
                    logger.error("HMS search error:", e);
                    void trackFunnel('address_search_error', { source: 'hms', ...describeError(e) });
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
                        logger.error("Google search error:", e);
                        void trackFunnel('address_search_error', { source: 'google', ...describeError(e) });
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
        const lat = suggestion.location && typeof suggestion.location.lat === 'function'
            ? suggestion.location.lat()
            : (suggestion.location?.lat || 0);
            
        const lng = suggestion.location && typeof suggestion.location.lng === 'function'
            ? suggestion.location.lng()
            : (suggestion.location?.lng || 0);

        analytics.track('address_selected', { source: suggestion.source || 'unknown' });
        void trackFunnel('address_selected', { source: suggestion.source || 'unknown' });

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
            void trackFunnel('onboarding_back', { from: currentStep, to: prevStepId, mount_id: mountId });
            setCurrentStep(prevStepId as OnboardingStep);
        }
    };

    const handleCreateHouse = async () => {
        // Only name is strictly required now
        void trackFunnel('house_create_submitted', {
            has_name: !!houseData.name,
            has_address: !!houseData.address,
            has_location: !!(houseData.location?.lat || houseData.location?.lng),
        });

        setNameInvalid(false);
        if (!houseData.name) {
            setNameInvalid(true);
            setError('Vinsamlegast settu inn nafn á húsið');
            analytics.error('house_creation', 'Missing house name');
            void trackFunnel('house_create_error', { stage: 'validation', code: 'missing_name' });
            return;
        }

        if (!currentUser) {
            setError('Engin notandi skráður inn');
            void trackFunnel('house_create_error', { stage: 'validation', code: 'no_current_user' });
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 0. Skip duplicate address check (Privacy rules prevent clients from searching all houses)
            // We rely on backend constraints or ignore duplicates for now as address is not a unique key.
            // (Permission denied errors were causing issues here)


            // 1. Create House (free)
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
                inviteCode = generateInviteCode();
                const houseRef = doc(collection(db, 'houses')); // Generate ID first
                houseId = houseRef.id;

                const newHouseData = {
                    name: houseData.name,
                    address: houseData.address || '',
                    location: houseData.location || { lat: 0, lng: 0 },
                    manager_id: currentUser.uid,
                    owner_ids: [currentUser.uid],
                    invite_code: inviteCode,
                    holiday_mode: 'fairness',
                    seo_slug: houseData.name.toLowerCase().replace(/\s+/g, '-'),
                    subscription_status: 'free',
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
                subscription_status: 'free'
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
                logger.error("Error initializing default data:", initErr);
                void trackFunnel('house_init_error', { house_id: houseId!, ...describeError(initErr) });
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

            logger.debug("House transaction complete. ID:", houseId!);

            analytics.onboardingCompleted();

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
                        logger.error('Failed to send welcome email');
                        void trackFunnel('onboarding_email_error', { template: 'welcome', status: res.status });
                    }
                } catch (e) {
                    logger.error("Failed to send welcome email:", e);
                    void trackFunnel('onboarding_email_error', { template: 'welcome', ...describeError(e) });
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
                        logger.error('Failed to send onboarding email');
                        void trackFunnel('onboarding_email_error', { template: 'onboarding_complete', status: res.status });
                    }
                } catch (e) {
                    logger.error("Failed to send onboarding email:", e);
                    void trackFunnel('onboarding_email_error', { template: 'onboarding_complete', ...describeError(e) });
                }
            })();

            logger.debug("Tracking analytics...");
            analytics.onboardingStep('invite');
            logFunnelEvent('house_created', { house_id: houseId! });
            // Lets the dashboard record the end of the funnel once.
            markInOnboarding();

            logger.debug("Calling nextStep()...");
            nextStep();
        } catch (err: any) {
            logger.error('Error creating house:', err);
            void trackFunnel('house_create_error', { stage: 'transaction', ...describeError(err) });
            if (err.message && err.message.includes("User does not exist")) {
                setError('Villa: Notandaskráningu ekki lokið. Vinsamlegast endurhladdu síðuna til að klára uppsetningu.');
            } else {
                setError(getUserMessage(err, 'Villa kom upp við að búa til hús. Reyndu aftur.'));
            }
            analytics.error('house_creation', err.message, err.code);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
        }
    };

    const handleSendInvites = async () => {
        if (!inviteEmails.trim()) {
            void trackFunnel('invites_skipped', { reason: 'empty' });
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
                void trackFunnel('invites_skipped', { reason: 'no_valid_emails' });
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
            void trackFunnel('invites_result', {
                requested: emailList.length,
                failed: failures.length,
                first_error: failures.length > 0 ? describeError((failures[0] as PromiseRejectedResult).reason).message : undefined,
            });
            if (failures.length > 0) {
                logger.error('Some invites failed:', failures);
                setError(`Villa: Gat ekki sent boð á ${failures.length} af ${emailList.length} netföngum. Þú getur reynt aftur, eða smellt á 'Sleppa þessu' til að halda áfram og bæta þeim við síðar.`);
                return; // Block flow so user can see error and retry or skip
            }

            nextStep();
        } catch (err: any) {
            logger.error('Error sending invites:', err);
            void trackFunnel('invites_error', describeError(err));
            setError(getUserMessage(err, 'Villa við að senda boð. Reyndu aftur.'));
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
                                <div
                                    aria-current={index === currentStepIndex ? 'step' : undefined}
                                    className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${index <= currentStepIndex
                                        ? 'bg-charcoal text-bone'
                                        : 'bg-grey-warm text-grey-mid'
                                    }
                `}>
                                    <span aria-hidden="true">{index + 1}</span>
                                    <span className="sr-only">Skref {index + 1} af {steps.length}: {step.label}</span>
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
                    <div className="flex justify-between text-sm text-grey-mid" aria-hidden="true">
                        {steps.map(step => (
                            <span key={step.id} className="flex-1 text-center">
                                {step.label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div id={errorId} role="alert" className="bg-red-500/10 border border-red-500 text-red-700 rounded p-4 mb-6">
                        {error}
                    </div>
                )}

                {/* Step Content */}
                <div className="card" ref={cardRef}>
                    {currentStep === 'welcome' && (
                        <div className="text-center py-8 animate-fade-in relative">
                            {/* Removed Urgency Badge */}

                            <Home className="w-16 h-16 mx-auto mb-6 text-amber-ink" aria-hidden="true" />
                            <h2 className="mb-4">Velkomin í Bústaðurinn.is</h2>
                            <p className="text-xl text-grey-dark mb-4 max-w-md mx-auto">
                                Við skulum setja upp sumarhúsið ykkar í kerfinu.
                                Þetta tekur bara nokkrar mínútur.
                            </p>

                            {/* Removed Launch Offer Info */}

                            <button type="button" onClick={nextStep} className="btn btn-primary w-full md:w-auto px-8 relative overflow-hidden group">
                                <span className="relative z-10">Byrja uppsetningu</span>
                                <div aria-hidden="true" className="motion-reduce:hidden absolute inset-0 bg-white/20 transform -skew-x-12 translate-x-full group-hover:translate-x-[-150%] transition-transform duration-700 ease-in-out"></div>
                            </button>
                        </div>
                    )}

                    {currentStep === 'house' && (
                        <div className="animate-fade-in">
                            <div className="flex items-center gap-3 mb-6">
                                <MapPin className="w-8 h-8 text-amber-ink" aria-hidden="true" />
                                <h2 className="mb-0">Upplýsingar um húsið</h2>
                            </div>

                            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleCreateHouse(); }}>
                                <div>
                                    <label htmlFor={nameId} className="label">Nafn á húsinu *</label>
                                    <input
                                        id={nameId}
                                        type="text"
                                        aria-invalid={nameInvalid ? true : undefined}
                                        aria-describedby={nameInvalid ? errorId : undefined}
                                        className="input"
                                        value={houseData.name}
                                        onChange={(e) => setHouseData({ ...houseData, name: e.target.value })}
                                        placeholder="t.d. Sumarbústaðurinn okkar"
                                        required
                                    />
                                </div>

                                <div className="relative">
                                    <label htmlFor={addressId} className="label">Heimilisfang <span className="font-normal text-stone-600">(má fylla út síðar)</span></label>
                                    <input
                                        id={addressId}
                                        type="text"
                                        aria-describedby={addressHintId}
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
                                                    className="border-b last:border-0 border-stone-100"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectPrediction(suggestion)}
                                                        className="w-full text-left px-4 py-3 hover:bg-stone-50 cursor-pointer text-sm flex items-center justify-between group"
                                                    >
                                                    <div className="flex items-center gap-3">
                                                        {suggestion.source === 'hms' ? (
                                                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                                                <CheckCircle className="w-4 h-4 text-green-600" aria-hidden="true" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center">
                                                                <MapPin className="w-4 h-4 text-stone-500" aria-hidden="true" />
                                                            </div>
                                                        )}
                                                        <span className="font-medium">{suggestion.description}</span>
                                                    </div>
                                                    {suggestion.source === 'hms' && (
                                                        <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200 font-bold uppercase tracking-wider">
                                                            HMS
                                                        </span>
                                                    )}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <p id={addressHintId} className="text-sm text-grey-mid mt-2">
                                        Þú getur bætt við heimilisfangi síðar til að fá veðurspá og nákvæma staðsetningu.
                                    </p>

                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-3 flex gap-3 items-start">
                                        <div className="bg-blue-100 p-1.5 rounded-full mt-0.5">
                                            <MapPin className="w-4 h-4 text-blue-700" aria-hidden="true" />
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
                                    <button type="submit" className="btn btn-primary" disabled={loading} aria-busy={loading}>
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
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
                                <Users className="w-8 h-8 text-amber-ink" aria-hidden="true" />
                                <h2 className="mb-0">Bjóða meðeigendum</h2>
                            </div>

                            <p className="text-grey-dark mb-6">
                                Við mælum með að bjóða að minnsta kosti einum meðeiganda eða fjölskyldumeðlim strax til að þið getið prófað kerfið saman. Það tekur enga stund!
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
                                    <strong>Engar áhyggjur:</strong> Ef þú hefur ekki netföngin við höndina núna, þá geturðu rekið inn aukaaðila hvenær sem er inni í stillingum hússins.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor={emailsId} className="label">Netföng (aðskilin með kommu)</label>
                                    <textarea
                                        id={emailsId}
                                        autoComplete="email"
                                        aria-describedby={error ? errorId : undefined}
                                        className="input min-h-[100px]"
                                        placeholder="nafn1@netfang.is, nafn2@netfang.is"
                                        value={inviteEmails}
                                        onChange={(e) => setInviteEmails(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 justify-end mt-6">
                                <button type="button" onClick={prevStep} className="btn btn-ghost" disabled={loading}>
                                    Til baka
                                </button>
                                <button type="button" onClick={() => { void trackFunnel('invites_skipped', { reason: 'skip_button' }); nextStep(); }} className="btn btn-secondary font-medium border-transparent hover:border-stone-200" disabled={loading}>
                                    Sleppa þessu (Bæta við seinna)
                                </button>
                                <button type="button" onClick={handleSendInvites} className="btn btn-primary" disabled={loading} aria-busy={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                                            Sendi boð...
                                        </>
                                    ) : (
                                        'Senda boð & Klára'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 'finish' && (
                        <div className="text-center py-8 animate-fade-in">
                            <CheckCircle className="w-16 h-16 mx-auto mb-6 text-amber-ink" aria-hidden="true" />
                            <h2 className="mb-4">Allt tilbúið!</h2>
                            <p className="text-xl text-grey-dark mb-8 max-w-md mx-auto">
                                Uppsetningu á <strong>{houseData.name || 'sumarhúsinu'}</strong> er
                                lokið. Njótið þess að nota kerfið!
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    analytics.onboardingCompleted();
                                    logFunnelEvent('onboarding_completed');

                                    // Check if mobile - show PWA prompt after short delay
                                    const isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent.toLowerCase());
                                    if (isMobile) {
                                        // Show PWA prompt after a short delay
                                        setTimeout(() => {
                                            void trackFunnel('pwa_prompt_shown');
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
