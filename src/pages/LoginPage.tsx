/**
 * Login Page
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider, db } from '@/lib/firebase';
import { LogIn } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import SEO from '@/components/SEO';
import { analytics } from '@/utils/analytics';
import { logger } from '@/utils/logger';

// Only allows relative paths — rejects absolute and protocol-relative URLs
function safeRedirect(url: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('/') && !url.startsWith('//')) return url;
    return null;
}

// Checks super_admin role in Firestore by UID (distinct from rbac.ts isSuperAdmin which takes a role string)
async function checkIsSuperAdmin(uid: string): Promise<boolean> {
    try {
        const roleDoc = await getDoc(doc(db, 'user_roles', uid));
        if (roleDoc.exists()) {
            const roleData = roleDoc.data();
            return roleData.system_role === 'super_admin';
        }
        return false;
    } catch (error) {
        logger.error('Error checking admin role:', error);
        return false;
    }
}

export default function LoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnUrl = searchParams.get('returnUrl');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMagicLinkMode, setIsMagicLinkMode] = useState(false);
    const [magicLinkSent, setMagicLinkSent] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [crossDeviceEmail, setCrossDeviceEmail] = useState('');
    const [pendingSignInUrl, setPendingSignInUrl] = useState<string | null>(null);
    const signingInRef = useRef(false);

    const doEmailLinkSignIn = async (emailToUse: string, signInUrl: string) => {
        if (signingInRef.current) return;
        signingInRef.current = true;

        setIsLoading(true);
        setError('');
        setStatusMessage('Skrái inn með tölvupóst-hlekk...');

        try {
            const result = await signInWithEmailLink(auth, emailToUse, signInUrl);
            const isAdmin = await checkIsSuperAdmin(result.user.uid);

            const userDocRef = doc(db, 'users', result.user.uid);
            const userDoc = await getDoc(userDocRef);
            const isNewUser = !userDoc.exists();

            if (isNewUser) {
                await setDoc(userDocRef, {
                    uid: result.user.uid,
                    email: result.user.email,
                    name: result.user.displayName || result.user.email?.split('@')[0] || '',
                    avatar: result.user.photoURL || '',
                    house_ids: [],
                    created_at: serverTimestamp(),
                    last_login: serverTimestamp()
                });
            } else {
                await setDoc(userDocRef, { last_login: serverTimestamp() }, { merge: true });
            }

            // Clear stored email and fire analytics only after all async ops succeed
            window.localStorage.removeItem('emailForSignIn');
            analytics.loginCompleted('email_link');

            const safe = safeRedirect(returnUrl);
            if (isAdmin) {
                navigate('/super-admin');
            } else if (safe) {
                navigate(safe);
            } else if (isNewUser) {
                navigate('/onboarding');
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            logger.error('Email link sign in error:', err);
            setError('Villa við að skrá inn með hlekk: ' + (err.message || 'Ógildur eða útrunninn hlekkur'));
            analytics.error('login_email_link', err.message, err.code);
            signingInRef.current = false;
        } finally {
            setIsLoading(false);
            setStatusMessage('');
        }
    };

    // Handle incoming Email Link Sign-In — runs once on mount only
    useEffect(() => {
        if (!isSignInWithEmailLink(auth, window.location.href)) return;

        const stored = window.localStorage.getItem('emailForSignIn');
        if (!stored) {
            // Cross-device: show inline form to collect email
            setPendingSignInUrl(window.location.href);
            return;
        }

        void doEmailLinkSignIn(stored, window.location.href);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCrossDeviceSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!pendingSignInUrl) return;
        const url = pendingSignInUrl;
        setPendingSignInUrl(null);
        await doEmailLinkSignIn(crossDeviceEmail, url);
    };

    const handleSendMagicLink = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setMagicLinkSent(false);
        setIsLoading(true);
        setStatusMessage('Sendi innskráningarhlekk...');

        try {
            const safe = safeRedirect(returnUrl);
            const actionCodeSettings = {
                url: window.location.origin + '/login' + (safe ? `?returnUrl=${encodeURIComponent(safe)}` : ''),
                handleCodeInApp: true,
            };

            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            window.localStorage.setItem('emailForSignIn', email);
            setMagicLinkSent(true);
            setStatusMessage('');
        } catch (err: any) {
            logger.error('Error sending magic link:', err);
            setError('Villa við að senda hlekk: ' + (err.message || 'Prófaðu aftur síðar'));
            analytics.error('send_magic_link_error', err.message, err.code);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        analytics.loginStarted('email');

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            analytics.loginCompleted('email');

            const isAdmin = await checkIsSuperAdmin(user.uid);
            const safe = safeRedirect(returnUrl);
            if (isAdmin) {
                navigate('/super-admin');
            } else if (safe) {
                navigate(safe);
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError('Rangt netfang eða lykilorð');
            logger.error('Login error:', err);
            analytics.error('login_email', err.message, err.code);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setIsLoading(true);
        analytics.loginStarted('google');
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const safe = safeRedirect(returnUrl);

            if (!userDoc.exists()) {
                analytics.signupCompleted('google');
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName || '',
                    avatar: user.photoURL || '',
                    house_ids: [],
                    created_at: serverTimestamp(),
                    last_login: serverTimestamp()
                });

                const isAdmin = await checkIsSuperAdmin(user.uid);
                if (isAdmin) {
                    navigate('/super-admin');
                } else if (safe) {
                    navigate(safe);
                } else {
                    navigate('/onboarding');
                }
            } else {
                analytics.loginCompleted('google');
                await setDoc(doc(db, 'users', user.uid), {
                    last_login: serverTimestamp()
                }, { merge: true });

                const isAdmin = await checkIsSuperAdmin(user.uid);
                if (isAdmin) {
                    navigate('/super-admin');
                } else if (safe) {
                    navigate(safe);
                } else {
                    navigate('/dashboard');
                }
            }
        } catch (err: any) {
            setError('Villa við innskráningu með Google');
            logger.error('Google login error:', err);
            analytics.error('login_google', err.message, err.code);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFacebookLogin = async () => {
        setError('');
        setIsLoading(true);
        analytics.loginStarted('facebook');
        try {
            const result = await signInWithPopup(auth, facebookProvider);
            const user = result.user;

            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const safe = safeRedirect(returnUrl);

            if (!userDoc.exists()) {
                analytics.signupCompleted('facebook');
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName || '',
                    avatar: user.photoURL || '',
                    house_ids: [],
                    created_at: serverTimestamp(),
                    last_login: serverTimestamp()
                });

                const isAdmin = await checkIsSuperAdmin(user.uid);
                if (isAdmin) {
                    navigate('/super-admin');
                } else if (safe) {
                    navigate(safe);
                } else {
                    navigate('/onboarding');
                }
            } else {
                analytics.loginCompleted('facebook');
                await setDoc(doc(db, 'users', user.uid), {
                    last_login: serverTimestamp()
                }, { merge: true });

                const isAdmin = await checkIsSuperAdmin(user.uid);
                if (isAdmin) {
                    navigate('/super-admin');
                } else if (safe) {
                    navigate(safe);
                } else {
                    navigate('/dashboard');
                }
            }
        } catch (err: any) {
            setError('Villa við innskráningu með Facebook');
            logger.error('Facebook login error:', err);
            analytics.error('login_facebook', err.message, err.code);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bone flex items-center justify-center p-6">
            <SEO
                title="Innskráning - Bústaðurinn.is"
                description="Skráðu þig inn á Bústaðurinn.is til að stjórna sumarhúsinu þínu."
                canonical="https://www.bustadurinn.is/login"
            />
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-serif mb-2">Bústaðurinn.is</h1>
                    <p className="text-grey-mid">Innskráning</p>
                </div>

                <div className="card">
                    {statusMessage && (
                        <div className="bg-stone-50 border border-stone-200 text-stone-700 px-4 py-3 rounded mb-4 flex items-center justify-center gap-2">
                            <span className="animate-spin w-4 h-4 border-2 border-stone-600 border-t-transparent rounded-full"></span>
                            {statusMessage}
                        </div>
                    )}

                    {pendingSignInUrl ? (
                        <div className="text-center py-6 space-y-4">
                            <div className="w-12 h-12 bg-amber/10 rounded-full flex items-center justify-center mx-auto text-amber text-2xl">
                                ✉️
                            </div>
                            <h3 className="text-lg font-serif font-bold text-charcoal">Staðfestu netfangið þitt</h3>
                            <p className="text-sm text-grey-dark max-w-sm mx-auto">
                                Þú opnaðir innskráningarhlekk í öðrum vafra eða tæki. Sláðu inn netfangið þitt til að halda áfram.
                            </p>
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                                    {error}
                                </div>
                            )}
                            <form onSubmit={handleCrossDeviceSignIn} className="space-y-4">
                                <input
                                    type="email"
                                    className="input"
                                    value={crossDeviceEmail}
                                    onChange={(e) => setCrossDeviceEmail(e.target.value)}
                                    placeholder="nafn@netfang.is"
                                    required
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    className="btn btn-primary w-full"
                                    disabled={isLoading}
                                >
                                    <LogIn className="w-5 h-5" />
                                    {isLoading ? 'Skrái inn...' : 'Staðfesta og skrá inn'}
                                </button>
                            </form>
                        </div>
                    ) : magicLinkSent ? (
                        <div className="text-center py-6 space-y-4">
                            <div className="w-12 h-12 bg-amber/10 rounded-full flex items-center justify-center mx-auto text-amber text-2xl">
                                ✉️
                            </div>
                            <h3 className="text-lg font-serif font-bold text-charcoal">Innskráningarhlekkur sendur!</h3>
                            <p className="text-sm text-grey-dark max-w-sm mx-auto">
                                Við höfum sent innskráningarhlekk á <strong>{email}</strong>.
                                Smelltu á hlekkinn í póstinum til að skrá þig inn án lykilorðs.
                            </p>
                            <button
                                type="button"
                                onClick={() => setMagicLinkSent(false)}
                                className="text-sm text-charcoal font-medium hover:text-amber underline"
                            >
                                Senda aftur eða breyta netfangi
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={isMagicLinkMode ? handleSendMagicLink : handleLogin} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="label">Netfang</label>
                                <input
                                    type="email"
                                    className="input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="nafn@netfang.is"
                                    required
                                />
                            </div>

                            {!isMagicLinkMode && (
                                <div>
                                    <label className="label">Lykilorð</label>
                                    <input
                                        type="password"
                                        className="input"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary w-full"
                                disabled={isLoading}
                            >
                                <LogIn className="w-5 h-5" />
                                {isLoading
                                    ? (isMagicLinkMode ? 'Sendi hlekk...' : 'Skrái inn...')
                                    : (isMagicLinkMode ? 'Senda innskráningarhlekk' : 'Skrá inn')}
                            </button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsMagicLinkMode(!isMagicLinkMode);
                                        setError('');
                                    }}
                                    className="text-sm text-charcoal font-medium hover:text-amber underline"
                                >
                                    {isMagicLinkMode ? 'Innskrá með lykilorði' : 'Innskrá án lykilorðs (tölvupóst-hlekkur)'}
                                </button>
                            </div>

                            <div className="text-center text-sm text-grey-mid">
                                Ekki með aðgang?{' '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const safe = safeRedirect(returnUrl);
                                        if (safe) {
                                            navigate(`/signup?returnUrl=${encodeURIComponent(safe)}`);
                                        } else {
                                            navigate('/signup');
                                        }
                                    }}
                                    className="text-charcoal font-medium hover:text-amber"
                                >
                                    Skrá sig
                                </button>
                            </div>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-grey-warm" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-grey-mid">Eða skráðu þig inn með</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="btn bg-white border border-grey-mid text-charcoal hover:bg-grey-warm w-full flex items-center justify-center gap-2"
                                disabled={isLoading}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Google
                            </button>

                            <button
                                type="button"
                                onClick={handleFacebookLogin}
                                className="btn bg-[#1877F2] text-white hover:bg-[#166FE5] w-full flex items-center justify-center gap-2"
                                disabled={isLoading}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                Facebook
                            </button>

                            <p className="text-xs text-center text-grey-mid mt-4">
                                Með því að skrá þig inn samþykkir þú <Link to="/skilmalar" className="underline hover:text-charcoal" target="_blank">Notkunarskilmála</Link> og <Link to="/personuvernd" className="underline hover:text-charcoal" target="_blank">Persónuverndarstefnu</Link> okkar.
                            </p>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    className="text-sm text-grey-mid hover:text-charcoal"
                                >
                                    ← Til baka
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
