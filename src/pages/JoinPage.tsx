import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore } from '@/store/appStore';
import { Home, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import type { House } from '@/types/models';

export default function JoinPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const houseId = searchParams.get('houseId');
    const code = searchParams.get('code');
    const { currentUser } = useAppStore();

    const [loading, setLoading] = useState(true);
    const [house, setHouse] = useState<House | null>(null);
    const [error, setError] = useState('');
    const [status, setStatus] = useState<'idle' | 'joining' | 'requested' | 'joined'>('idle');

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

                        // Check if already a member
                        if (currentUser && houseData.owner_ids.includes(currentUser.uid)) {
                            setStatus('joined');
                        } else if (currentUser) {
                            // Check if already requested
                            const q = query(
                                collection(db, 'join_requests'),
                                where('houseId', '==', houseId),
                                where('userId', '==', currentUser.uid)
                            );
                            const snapshot = await getDocs(q);
                            if (!snapshot.empty) {
                                setStatus('requested');
                            }
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

    const handleRequestAccess = async () => {
        if (!currentUser || !house) return;

        setStatus('joining');
        try {
            await addDoc(collection(db, 'join_requests'), {
                houseId: house.id,
                userId: currentUser.uid,
                userName: currentUser.name || currentUser.email,
                userEmail: currentUser.email,
                status: 'pending',
                created_at: serverTimestamp()
            });
            setStatus('requested');
        } catch (err) {
            console.error(err);
            setError('Villa við að senda beiðni.');
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
                    <button onClick={() => navigate('/')} className="btn btn-ghost">
                        Fara á forsíðu
                    </button>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        // Redirect to login if not authenticated, storing return URL
        // In a real app we'd pass ?returnUrl=...
        return (
            <div className="min-h-screen bg-bone flex items-center justify-center p-4">
                <div className="card max-w-md text-center">
                    <Home className="w-12 h-12 text-amber mx-auto mb-4" />
                    <h2 className="text-xl font-serif mb-2">{house?.name}</h2>
                    <p className="text-grey-mid mb-6">
                        Þú hefur verið boðið að gengast í húsfélagið. <br />
                        Vinsamlegast skráðu þig inn til að halda áfram.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn btn-primary w-full"
                    >
                        Skrá inn
                    </button>
                    <div className="mt-4">
                        <button
                            onClick={() => navigate('/signup')}
                            className="text-sm text-grey-dark hover:underline"
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

                <div className="my-8 border-t border-b border-bone py-4">
                    <p className="text-sm text-charcoal font-medium">Boð frá stjórnanda</p>
                </div>

                {status === 'joined' ? (
                    <div className="animate-fade-in">
                        <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 flex items-center justify-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            <span>Þú ert nú þegar meðlimur!</span>
                        </div>
                        <button onClick={() => navigate('/dashboard')} className="btn btn-primary w-full">
                            Fara á stjórnborð
                        </button>
                    </div>
                ) : status === 'requested' ? (
                    <div className="animate-fade-in">
                        <div className="bg-amber/10 text-amber-900 p-4 rounded-lg mb-6">
                            <h3 className="font-medium mb-1">Beiðni send!</h3>
                            <p className="text-sm">Stjórnandi hússins mun samþykkja beiðni þína fljótlega.</p>
                        </div>
                        <button onClick={() => navigate('/dashboard')} className="btn btn-ghost w-full">
                            Fara á forsíðu
                        </button>
                    </div>
                ) : (
                    <div>
                        <button
                            onClick={handleRequestAccess}
                            disabled={status === 'joining'}
                            className="btn btn-primary w-full mb-3"
                        >
                            {status === 'joining' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Senda inngöngubeiðni'}
                        </button>
                        <button onClick={() => navigate('/')} className="btn btn-ghost w-full">
                            Hætta við
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
