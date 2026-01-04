import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAppStore } from '@/store/appStore';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import type { House, User } from '@/types/models';

export default function AuthHandler() {
    const setCurrentUser = useAppStore((state) => state.setCurrentUser);
    const setAuthenticated = useAppStore((state) => state.setAuthenticated);
    const setLoading = useAppStore((state) => state.setLoading);
    const setCurrentHouse = useAppStore((state) => state.setCurrentHouse);
    const setUserHouses = useAppStore((state) => state.setUserHouses);

    const { impersonatedUser, isImpersonating } = useImpersonation();

    useEffect(() => {
        // Main Auth Listener
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // 1. Set Real User (Always needed for permission checks)
                let realUser: User = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    name: firebaseUser.displayName || '',
                    avatar: firebaseUser.photoURL || undefined,
                    house_ids: [],
                    created_at: new Date(),
                };

                // Fetch Firestore Profile for Real User
                try {
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userSnap = await getDoc(userDocRef);
                    if (userSnap.exists()) {
                        const firestoreData = userSnap.data();
                        realUser = { ...realUser, ...firestoreData };
                    }
                } catch (err) {
                    console.error("Error fetching user profile:", err);
                }

                setCurrentUser(realUser);
                setAuthenticated(true);

                // 2. Determine Data Source (Impersonated vs Real)
                const effectiveUser = isImpersonating && impersonatedUser ? impersonatedUser : realUser;
                console.log(`📡 AuthHandler: Loading data for ${isImpersonating ? 'IMPERSONATED' : 'REAL'} user:`, effectiveUser.email);

                // 3. Fetch Houses for EFFECTIVE User
                if (effectiveUser.house_ids && effectiveUser.house_ids.length > 0) {
                    try {
                        const housesPromises = effectiveUser.house_ids.map((id: string) => getDoc(doc(db, 'houses', id)));
                        const houseSnaps = await Promise.all(housesPromises);
                        const houses = houseSnaps
                            .filter(snap => snap.exists())
                            .map(snap => ({ id: snap.id, ...snap.data() } as House));

                        setUserHouses(houses);

                        // If currentHouse isn't set, or if we switched users, update it
                        // Logic: If isImpersonating, always pick their first house
                        // If real user, try localStorage first
                        const storedHouseId = localStorage.getItem('last_house_id');

                        if (isImpersonating) {
                            // For impersonation, just grab the first valid house
                            setCurrentHouse(houses[0] || null);
                        } else {
                            // For real user, respect their last choice
                            const lastHouse = houses.find(h => h.id === storedHouseId);
                            setCurrentHouse(lastHouse || houses[0] || null);
                        }
                    } catch (e) {
                        console.error("Error fetching houses:", e);
                        setUserHouses([]);
                        setCurrentHouse(null);
                    }
                } else {
                    // No houses
                    setUserHouses([]);
                    setCurrentHouse(null);
                }

            } else {
                // Signed Out
                setCurrentUser(null);
                setAuthenticated(false);
                setCurrentHouse(null);
                setUserHouses([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [setCurrentUser, setAuthenticated, setLoading, setUserHouses, setCurrentHouse, impersonatedUser, isImpersonating]);

    return null; // Component does not render anything
}
