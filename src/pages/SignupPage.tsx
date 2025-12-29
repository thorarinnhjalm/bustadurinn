/**
 * Signup Page
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { UserPlus } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { useSearchParams } from 'react-router-dom';

export default function SignupPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnUrl = searchParams.get('returnUrl');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Lykilorð stemma ekki');
            return;
        }

        if (formData.password.length < 6) {
            setError('Lykilorð verður að vera að minnsta kosti 6 stafir');
            return;
        }

        setIsLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            // Update user profile with name
            await updateProfile(userCredential.user, {
                displayName: formData.name
            });

            // Create user doc if it doesn't exist (it won't for email signup)
            const user = userCredential.user;
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                name: formData.name || '',
                house_ids: [],
                created_at: serverTimestamp(),
                last_login: serverTimestamp()
            });

            if (returnUrl) {
                navigate(returnUrl);
            } else {
                navigate('/onboarding');
            }
        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
                setError('Þetta netfang er þegar í notkun');
            } else {
                setError('Villa kom upp við skráningu');
            }
            console.error('Signup error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setError('');
        setIsLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Check if user exists
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (!userDoc.exists()) {
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName || '',
                    avatar: user.photoURL || '',
                    house_ids: [],
                    created_at: serverTimestamp(),
                    last_login: serverTimestamp()
                });

                if (returnUrl) {
                    navigate(returnUrl);
                } else {
                    navigate('/onboarding');
                }
            } else {
                await setDoc(doc(db, 'users', user.uid), {
                    last_login: serverTimestamp()
                }, { merge: true });

                if (returnUrl) {
                    navigate(returnUrl);
                } else {
                    navigate('/dashboard');
                }
            }
        } catch (err: any) {
            setError('Villa við skráningu með Google');
            console.error('Google signup error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bone flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-serif mb-2">Bústaðurinn.is</h1>
                    <p className="text-grey-mid">Búa til aðgang</p>
                    <div className="badge mt-4">Frítt í 14 daga</div>
                </div>

                <div className="card">
                    <form onSubmit={handleSignup} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="label">Nafn</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Fullt nafn"
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Netfang</label>
                            <input
                                type="email"
                                className="input"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="nafn@netfang.is"
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Lykilorð</label>
                            <input
                                type="password"
                                className="input"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Staðfesta lykilorð</label>
                            <input
                                type="password"
                                className="input"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={isLoading}
                        >
                            <UserPlus className="w-5 h-5" />
                            {isLoading ? 'Býr til aðgang...' : 'Búa til aðgang'}
                        </button>

                        <div className="text-center text-sm text-grey-mid">
                            Ertu nú þegar með aðgang?{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="text-charcoal font-medium hover:text-amber"
                            >
                                Skrá inn
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
                            onClick={handleGoogleSignup}
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
                            Nýskrá með Google
                        </button>

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
                </div>
            </div>
        </div>
    );
}
