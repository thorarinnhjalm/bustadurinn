/**
 * Onboarding Wizard Page - FUNCTIONAL with Google Maps
 * Multi-step flow: Welcome → House Info → Invite Co-owners → Finish
 */

// Declare Google Maps types
declare var google: any;

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MapPin, Users, CheckCircle, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore } from '@/store/appStore';

type OnboardingStep = 'welcome' | 'house' | 'invite' | 'finish';

export default function OnboardingPage() {
    const navigate = useNavigate();
    const currentUser = useAppStore((state) => state.currentUser);
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [houseData, setHouseData] = useState({
        name: '',
        address: '',
        location: { lat: 0, lng: 0 }
    });

    const [inviteEmails, setInviteEmails] = useState('');
    const addressInputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<any>(null);

    const steps = [
        { id: 'welcome', label: 'Velkomin' },
        { id: 'house', label: 'Húsupplýsingar' },
        { id: 'invite', label: 'Bjóða meðeigendum' },
        { id: 'finish', label: 'Klára' }
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    // Initialize Google Places Autocomplete
    useEffect(() => {
        if (currentStep === 'house' && addressInputRef.current && !autocompleteRef.current) {
            const initAutocomplete = async () => {
                const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

                // Skip if no API key
                if (!apiKey) {
                    console.warn('Google Maps API key not found. Autocomplete disabled.');
                    return;
                }

                try {
                    // Check if Google Maps is already loaded
                    if (typeof google === 'undefined' || !google.maps) {
                        // Load Google Maps script
                        const script = document.createElement('script');
                        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
                        script.async = true;
                        script.defer = true;

                        await new Promise<void>((resolve, reject) => {
                            script.onload = () => resolve();
                            script.onerror = () => reject(new Error('Failed to load Google Maps'));
                            document.head.appendChild(script);
                        });
                    }

                    // Initialize autocomplete
                    autocompleteRef.current = new google.maps.places.Autocomplete(
                        addressInputRef.current!,
                        {
                            componentRestrictions: { country: 'is' }, // Iceland only
                            fields: ['formatted_address', 'geometry', 'name']
                        }
                    );

                    autocompleteRef.current.addListener('place_changed', () => {
                        const place = autocompleteRef.current!.getPlace();
                        if (place.geometry && place.geometry.location) {
                            setHouseData(prev => ({
                                ...prev,
                                address: place.formatted_address || '',
                                location: {
                                    lat: place.geometry!.location!.lat(),
                                    lng: place.geometry!.location!.lng()
                                }
                            }));
                        }
                    });
                } catch (err) {
                    console.error('Google Maps API error:', err);
                    // Continue without autocomplete if Maps API fails
                }
            };

            initAutocomplete();
        }
    }, [currentStep]);

    const nextStep = () => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < steps.length) {
            setCurrentStep(steps[nextIndex].id as OnboardingStep);
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
            // Create house in Firestore
            await addDoc(collection(db, 'houses'), {
                name: houseData.name,
                address: houseData.address,
                location: houseData.location,
                manager_uid: currentUser.uid, // Creator is the Manager
                owner_ids: [currentUser.uid], // Start with just the creator
                seo_slug: houseData.name.toLowerCase().replace(/\s+/g, '-'),
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            });

            nextStep(); // Go to invite step
        } catch (err: any) {
            console.error('Error creating house:', err);
            setError('Villa kom upp við að búa til hús: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendInvites = async () => {
        // For now, just skip to finish
        // TODO: Implement email invites via Cloud Functions
        nextStep();
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
                                Við skulum setja upp stafræna tvíburann af sumarhúsinu ykkar.
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

                                <div>
                                    <label className="label">Heimilisfang *</label>
                                    <input
                                        ref={addressInputRef}
                                        type="text"
                                        className="input"
                                        value={houseData.address}
                                        onChange={(e) => setHouseData({ ...houseData, address: e.target.value })}
                                        placeholder="t.d. Sumarhúsabyggð 12, 800 Selfoss"
                                        required
                                    />
                                    <p className="text-sm text-grey-mid mt-2">
                                        Byrjaðu að skrifa og velja úr tillögum fyrir nákvæma staðsetningu
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
                                Stafræni tvíburinn af <strong>{houseData.name || 'sumarhúsinu'}</strong> er
                                nú tilbúinn. Komdu vel fyrir í ykkur!
                            </p>
                            <button
                                onClick={() => navigate('/dashboard')}
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
