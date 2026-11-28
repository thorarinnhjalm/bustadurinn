import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAppStore } from '@/store/appStore';
import { Home, Loader2, CheckCircle, AlertTriangle, X, Calendar, DollarSign, ListTodo, ArrowRight, ExternalLink } from 'lucide-react';
import type { House, User } from '@/types/models';
import { logger } from '@/utils/logger';
import SEO from '@/components/SEO';
import Modal from '@/components/ui/Modal';
import { getUserMessage } from '@/utils/userMessages';

export default function JoinPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { houseId: pathHouseId, code: pathCode } = useParams();

    // Support both query params and path params
    const houseIdParam = searchParams.get('houseId') || pathHouseId;
    const codeParam = searchParams.get('code') || pathCode;
    const tokenParam = searchParams.get('token');

    const { currentUser } = useAppStore();

    const [loading, setLoading] = useState(true);
    const [house, setHouse] = useState<House | null>(null);
    const [inviter, setInviter] = useState<User | null>(null);
    const [error, setError] = useState('');
    const [status, setStatus] = useState<'idle' | 'joining' | 'requested' | 'joined'>('idle');
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [isIAB, setIsIAB] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    // Look the invitation up through the API: invitees may be logged out or not
    // yet members, so the client can no longer read houses/invitations/users.
    useEffect(() => {
        if ((window as any).isInsideAppBrowser) {
            setIsIAB(true);
        }

        let cancelled = false;

        const checkHouse = async () => {
            const hasToken = !!tokenParam;
            if (!hasToken && (!houseIdParam || !codeParam)) {
                setError('Ógildur boðshlekkur.');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('/api/invite-info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(hasToken ? { token: tokenParam } : { houseId: houseIdParam, code: codeParam })
                });

                if (cancelled) return;

                if (response.status === 404) {
                    setError(hasToken ? 'Boðstengill er útrunninn eða ógildur.' : 'Boðskóði er ekki réttur eða útrunninn.');
                    return;
                }
                if (response.status === 429) {
                    setError('Of margar tilraunir. Reyndu aftur síðar.');
                    return;
                }
                if (!response.ok) {
                    setError(hasToken ? 'Villa við að staðfesta boð.' : 'Villa við að sækja upplýsingar.');
                    return;
                }

                const info = await response.json() as { houseId: string; houseName: string; inviterName?: string; email?: string };
                if (cancelled) return;

                setHouse({ id: info.houseId, name: info.houseName } as House);
                if (info.inviterName) {
                    setInviter({ name: info.inviterName } as User);
                }
            } catch (err) {
                if (cancelled) return;
                logger.error('Invite lookup error:', err);
                setError(hasToken ? 'Villa við að staðfesta boð.' : 'Villa við að sækja upplýsingar.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        checkHouse();
        return () => { cancelled = true; };
    }, [houseIdParam, codeParam, tokenParam]);

    // Already a member? (uses the profile already in the store; no extra reads)
    useEffect(() => {
        if (house && currentUser?.house_ids?.includes(house.id)) {
            setStatus('joined');
        }
    }, [house, currentUser]);

    const handleJoinHouse = async () => {
        if (!currentUser || !house) return;

        setStatus('joining');
        try {
            // Get ID token for auth
            const idToken = await auth.currentUser?.getIdToken();

            const response = await fetch('/api/join-house', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    houseId: house.id,
                    inviteCode: codeParam,
                    token: tokenParam
                })
            });

            if (!response.ok) {
                let message = 'Villa við að ganga í hús.';
                if (response.status === 429) {
                    message = 'Of margar tilraunir. Reyndu aftur síðar.';
                } else if (response.status === 400 || response.status === 404) {
                    message = 'Boðið er ógilt eða útrunnið.';
                }
                const httpError: Error & { userMessage?: string } = new Error(message);
                httpError.userMessage = message;
                throw httpError;
            }

            // Now that the user is a member the house doc is readable; load the
            // full document for the store (fall back to the minimal info).
            let fullHouse: House = house;
            try {
                const houseSnap = await getDoc(doc(db, 'houses', house.id));
                if (houseSnap.exists()) {
                    fullHouse = { ...houseSnap.data(), id: houseSnap.id } as House;
                }
            } catch (loadErr) {
                logger.warn('Could not load house after joining:', loadErr);
            }

            // Update Local Store immediately (otherwise Dashboard redirects to onboarding)
            useAppStore.getState().setCurrentUser({
                ...currentUser,
                house_ids: [...(currentUser.house_ids || []), house.id]
            });
            useAppStore.getState().setCurrentHouse(fullHouse);

            setStatus('joined');
            setShowWelcomeModal(true);
        } catch (err: any) {
            logger.error('Join house failed:', err);
            setError(err?.userMessage || getUserMessage(err, 'Villa við að ganga í hús.'));
            setStatus('idle');
        }
    };

    if (loading) {
        return (
            <>
                <SEO
                    title="Ganga í hús - Bústaðurinn.is"
                    description="Vertu með í húsfélaginu. Gakktu í sumarhúsið og fáðu aðgang að bókunardagatali, fjármálum og öðrum eiginleikum."
                    canonical="https://www.bustadurinn.is/join"
                />
                <div className="min-h-screen bg-bone flex items-center justify-center">
                    <div role="status">
                        <Loader2 className="w-8 h-8 animate-spin text-charcoal" aria-hidden="true" />
                        <span className="sr-only">Hleð…</span>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <SEO
                    title="Ganga í hús - Bústaðurinn.is"
                    description="Vertu með í húsfélaginu. Gakktu í sumarhúsið og fáðu aðgang að bókunardagatali, fjármálum og öðrum eiginleikum."
                    canonical="https://www.bustadurinn.is/join"
                />
                <div className="min-h-screen bg-bone flex items-center justify-center p-4">
                    <div className="card max-w-md text-center">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" aria-hidden="true" />
                        <h2 className="text-xl font-serif mb-2">Villa</h2>
                        <p role="alert" className="text-grey-mid mb-6">{error}</p>
                        <div className="flex flex-col gap-3">
                            <button type="button" onClick={() => window.location.reload()} className="btn btn-primary w-full">
                                Reyna aftur
                            </button>
                            <button type="button" onClick={() => navigate('/')} className="btn btn-ghost w-full">
                                Fara á forsíðu
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!currentUser) {
        return (
            <>
                <SEO
                    title="Ganga í hús - Bústaðurinn.is"
                    description="Vertu með í húsfélaginu. Gakktu í sumarhúsið og fáðu aðgang að bókunardagatali, fjármálum og öðrum eiginleikum."
                    canonical="https://www.bustadurinn.is/join"
                />
                <div className="min-h-screen bg-bone flex items-center justify-center p-4">
                    <div className="card max-w-md text-center">
                        <Home className="w-12 h-12 text-amber-ink mx-auto mb-4" aria-hidden="true" />
                        <h2 className="text-xl font-serif mb-2">{house?.name}</h2>
                        <p className="text-grey-mid mb-6">
                            Þér hefur verið boðið að gerast meðeigandi. <br />
                            Vinsamlegast skráðu þig inn eða stofnaðu aðgang til að tengjast húsinu.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() => navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
                                className="btn btn-primary w-full"
                            >
                                Skrá inn
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(`/signup?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
                                className="btn btn-ghost w-full"
                            >
                                Búa til aðgang
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <SEO
                title="Ganga í hús - Bústaðurinn.is"
                description="Vertu með í húsfélaginu. Gakktu í sumarhúsið og fáðu aðgang að bókunardagatali, fjármálum og öðrum eiginleikum."
                canonical="https://www.bustadurinn.is/join"
            />
            <div className="min-h-screen bg-bone flex items-center justify-center p-4">
                <div className="card max-w-md w-full text-center">
                    <Home className="w-12 h-12 text-amber-ink mx-auto mb-4" aria-hidden="true" />
                    <h1 className="text-2xl font-serif mb-2">{house?.name}</h1>
                    <p className="text-grey-mid mb-2">{house?.address}</p>

                    {isIAB && (
                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-left">
                            <div className="flex items-center gap-2 text-amber-800 font-bold mb-1">
                                <AlertTriangle size={18} aria-hidden="true" />
                                <span>Vefskoðun í forriti</span>
                            </div>
                            <p className="text-xs text-amber-700 leading-relaxed mb-3">
                                Þú ert að skoða þessa síðu inni í öðru forriti (t.d. Messenger). Innskráning getur verið óstöðug hér.
                            </p>
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        await navigator.clipboard.writeText(window.location.href);
                                        setLinkCopied(true);
                                    } catch (copyErr) {
                                        logger.warn('Clipboard copy failed:', copyErr);
                                    }
                                }}
                                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200/50 px-2 py-1 rounded"
                            >
                                <ExternalLink size={12} aria-hidden="true" />
                                Afrita hlekk og opna í vafra
                            </button>
                            <p role="status" className="text-xs text-amber-800 mt-2">
                                {linkCopied ? 'Hlekkur afritaður! Opnaðu hann í Safari eða Chrome fyrir bestu upplifun.' : ''}
                            </p>
                        </div>
                    )}

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
                                    <CheckCircle className="w-4 h-4 text-green-700 flex-shrink-0" aria-hidden="true" />
                                    <span>Bóka helgar og dvalir</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-700 flex-shrink-0" aria-hidden="true" />
                                    <span>Skrá útgjöld og sjá fjármál</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-700 flex-shrink-0" aria-hidden="true" />
                                    <span>Bæta við verkefnum og listum</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <X className="w-4 h-4 text-stone-400 flex-shrink-0" aria-hidden="true" />
                                    <span className="text-stone-500"><span className="sr-only">Ekki heimilt: </span>Breyta stillingum eða eyða húsi</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {status === 'joined' ? (
                        <div className="animate-fade-in">
                            <div role="status" className="bg-green-100 text-green-800 p-4 rounded-lg mb-6 flex items-center justify-center gap-2">
                                <CheckCircle className="w-5 h-5" aria-hidden="true" />
                                <span>Velkomin! Þú ert nú meðlimur.</span>
                            </div>
                            <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-primary w-full">
                                Fara á stjórnborð
                            </button>
                        </div>
                    ) : (
                        <div>
                            <button
                                onClick={handleJoinHouse}
                                disabled={status === 'joining'}
                                className="btn btn-primary w-full mb-3"
                                aria-busy={status === 'joining'}
                            >
                                {status === 'joining' ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                        <span className="sr-only">Geng í hús…</span>
                                    </>
                                ) : 'Samþykkja boð og ganga í hús'}
                            </button>
                            <button type="button" onClick={() => navigate('/')} className="btn btn-ghost w-full">
                                Ekki núna
                            </button>
                        </div>
                    )}
                </div>

                {/* Welcome Modal - Feature Tour */}
                <Modal
                    open={showWelcomeModal}
                    onClose={() => {
                        setShowWelcomeModal(false);
                        navigate('/dashboard');
                    }}
                    title={`Velkomin í ${house?.name ?? 'húsið'}!`}
                    size="lg"
                    bodyClassName="px-8 pb-8"
                >
                    <div className="text-center mb-6">
                        <p className="text-grey-mid">
                            Nú hefur þú aðgang að öllum helstu eiginleikum kerfisins.
                        </p>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-4 p-4 bg-bone rounded-lg">
                            <div className="w-10 h-10 bg-amber/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-5 h-5 text-amber-ink" aria-hidden="true" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-charcoal mb-1">Bókun</h3>
                                <p className="text-sm text-grey-dark">Skipuleggðu dvalir og sjáðu hvenær aðrir eru að heimsækja húsið</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-bone rounded-lg">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <DollarSign className="w-5 h-5 text-emerald-700" aria-hidden="true" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-charcoal mb-1">Fjármál</h3>
                                <p className="text-sm text-grey-dark">Skráðu útgjöld, sjáðu áætlun og fylgist með hússjóði</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-bone rounded-lg">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <ListTodo className="w-5 h-5 text-blue-700" aria-hidden="true" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-charcoal mb-1">Verkefni</h3>
                                <p className="text-sm text-grey-dark">Haltu utan um viðhald og verkefni sem þarf að klára</p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setShowWelcomeModal(false);
                            navigate('/dashboard');
                        }}
                        className="btn btn-primary w-full flex items-center justify-center gap-2"
                    >
                        Byrja að nota kerfið
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                </Modal>
            </div>
        </>
    );
}
