import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore } from '@/store/appStore';
import { Home, Loader2, CheckCircle, AlertTriangle, X, Calendar, DollarSign, ListTodo, ArrowRight } from 'lucide-react';
import type { House, User } from '@/types/models';

export default function JoinPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const houseId = searchParams.get('houseId');
    const code = searchParams.get('code');
    const { currentUser } = useAppStore();

    const [loading, setLoading] = useState(true);
    const [house, setHouse] = useState<House | null>(null);
    const [inviter, setInviter] = useState<User | null>(null);
    const [error, setError] = useState('');
    const [status, setStatus] = useState<'idle' | 'joining' | 'requested' | 'joined'>('idle');
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);

    useEffect(() => {
        const checkHouse = async () => {
            if (!houseId || !code) {
                setError('Ógildur boðshlekkur.');
                setLoading(false);
                return;
            }

            try {
                const docRef = doc(db, 'houses', houseId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const houseData = docSnap.data() as House;
                    if (houseData.invite_code === code) {
                        setHouse({ ...houseData, id: docSnap.id });

                        // Fetch inviter (manager) info
                        if (houseData.manager_id) {
                            try {
                                const managerDoc = await getDoc(doc(db, 'users', houseData.manager_id));
                                if (managerDoc.exists()) {
                                    setInviter({ uid: managerDoc.id, ...managerDoc.data() } as User);
                                }
                            } catch (err) {
                                console.error('Could not fetch inviter:', err);
                            }
                        }

                        // Check if already a member
                        if (currentUser && houseData.owner_ids?.includes(currentUser.uid)) {
                            setStatus('joined');
                        }

                    } else {
                        setError('Boðskóði er ekki réttur eða útrunninn.');
                    }
                } else {
                    setError('Sumarhús fannst ekki.');
                }
            } catch (err) {
                console.error(err);
                setError('Villa við að sækja upplýsingar.');
            } finally {
                setLoading(false);
            }
        };

        checkHouse();
    }, [houseId, code, currentUser]);

    const handleJoinHouse = async () => {
        if (!currentUser || !house) return;

        setStatus('joining');
        try {
            // 1. Add user to house owner_ids
            await updateDoc(doc(db, 'houses', house.id), {
                owner_ids: arrayUnion(currentUser.uid)
            });

            // 2. Add house to user house_ids
            await updateDoc(doc(db, 'users', currentUser.uid), {
                house_ids: arrayUnion(house.id)
            });

            // 3. Update Local Store immediately (otherwise Dashboard redirects to onboarding)
            useAppStore.getState().setCurrentUser({
                ...currentUser,
                house_ids: [...(currentUser.house_ids || []), house.id]
            });
            useAppStore.getState().setCurrentHouse(house);

            setStatus('joined');
            // Show welcome modal instead of immediately redirecting
            setShowWelcomeModal(true);
        } catch (err) {
            console.error(err);
            setError('Villa við að ganga í hús. Mögulega vantar réttindi.');
            setStatus('idle');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bone flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-charcoal" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-bone flex items-center justify-center p-4">
                <div className="card max-w-md text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-serif mb-2">Villa</h2>
                    <p className="text-grey-mid mb-6">{error}</p>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => window.location.reload()} className="btn btn-primary w-full">
                            Reyna aftur
                        </button>
                        <button onClick={() => navigate('/')} className="btn btn-ghost w-full">
                            Fara á forsíðu
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-bone flex items-center justify-center p-4">
                <div className="card max-w-md text-center">
                    <Home className="w-12 h-12 text-amber mx-auto mb-4" />
                    <h2 className="text-xl font-serif mb-2">{house?.name}</h2>
                    <p className="text-grey-mid mb-6">
                        Þér hefur verið boðið að gerast meðeigandi. <br />
                        Vinsamlegast skráðu þig inn eða stofnaðu aðgang til að tengjast húsinu.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
                            className="btn btn-primary w-full"
                        >
                            Skrá inn
                        </button>
                        <button
                            onClick={() => navigate(`/signup?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
                            className="btn btn-ghost w-full"
                        >
                            Búa til aðgang
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bone flex items-center justify-center p-4">
            <div className="card max-w-md w-full text-center">
                <Home className="w-12 h-12 text-amber mx-auto mb-4" />
                <h1 className="text-2xl font-serif mb-2">{house?.name}</h1>
                <p className="text-grey-mid mb-2">{house?.address}</p>

                {inviter && (
                    <p className="text-sm text-grey-mid mb-4">
                        Boðið af <strong className="text-charcoal">{inviter.name || inviter.email}</strong>
                    </p>
                )}

                <div className="my-8 border-t border-b border-bone py-6 space-y-4">
                    <p className="text-sm text-charcoal font-medium">Þú ert að ganga í húsfélagið</p>

                    <div className="bg-bone border border-stone-200 rounded-lg p-4 text-left">
                        <h4 className="font-semibold text-charcoal mb-3 text-sm">Sem meðeigandi getur þú:</h4>
                        <ul className="space-y-2 text-sm text-grey-dark">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span>Bóka helgar og dvalir</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span>Skrá útgjöld og sjá fjármál</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span>Bæta við verkefnum og listum</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <X className="w-4 h-4 text-stone-300 flex-shrink-0" />
                                <span className="text-stone-400">Breyta stillingum eða eyða húsi</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {status === 'joined' ? (
                    <div className="animate-fade-in">
                        <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 flex items-center justify-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            <span>Velkomin! Þú ert nú meðlimur.</span>
                        </div>
                        <button onClick={() => navigate('/dashboard')} className="btn btn-primary w-full">
                            Fara á stjórnborð
                        </button>
                    </div>
                ) : (
                    <div>
                        <button
                            onClick={handleJoinHouse}
                            disabled={status === 'joining'}
                            className="btn btn-primary w-full mb-3"
                        >
                            {status === 'joining' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Samþykkja boð og ganga í hús'}
                        </button>
                        <button onClick={() => navigate('/')} className="btn btn-ghost w-full">
                            Ekki núna
                        </button>
                    </div>
                )}
            </div>

            {/* Welcome Modal - Feature Tour */}
            {showWelcomeModal && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
                    onClick={() => {
                        setShowWelcomeModal(false);
                        navigate('/dashboard');
                    }}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-serif mb-2">Velkomin í {house?.name}!</h2>
                            <p className="text-grey-mid">
                                Nú hefur þú aðgang að öllum helstu eiginleikum kerfisins.
                            </p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-start gap-4 p-4 bg-bone rounded-lg hover:bg-stone-100 transition-colors">
                                <div className="w-10 h-10 bg-amber/20 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-5 h-5 text-amber" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-charcoal mb-1">Bókun</h3>
                                    <p className="text-sm text-grey-dark">Skipuleggðu dvalir og sjáðu hvenær aðrir eru að heimsækja húsið</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-bone rounded-lg hover:bg-stone-100 transition-colors">
                                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-charcoal mb-1">Fjármál</h3>
                                    <p className="text-sm text-grey-dark">Skráðu útgjöld, sjáðu áætlun og fylgist með hússjóði</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-bone rounded-lg hover:bg-stone-100 transition-colors">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <ListTodo className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-charcoal mb-1">Verkefni</h3>
                                    <p className="text-sm text-grey-dark">Haltu utan um viðhald og verkefni sem þarf að klára</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setShowWelcomeModal(false);
                                navigate('/dashboard');
                            }}
                            className="btn btn-primary w-full flex items-center justify-center gap-2"
                        >
                            Byrja að nota kerfið
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
