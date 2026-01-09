import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, type DocumentSnapshot } from 'firebase/firestore';
import { useAppStore } from '@/store/appStore';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { logger } from '@/utils/logger';
import type { House, User } from '@/types/models';

export default function AuthHandler() {
    const setCurrentUser = useAppStore((state) => state.setCurrentUser);
    const setAuthenticated = useAppStore((state) => state.setAuthenticated);
    const setLoading = useAppStore((state) => state.setLoading);
    const setCurrentHouse = useAppStore((state) => state.setCurrentHouse);
    const setUserHouses = useAppStore((state) => state.setUserHouses);

    const { impersonatedUser, isImpersonating } = useImpersonation();

    // Local state to track the actual authenticated Firebase user
    const [realUser, setRealUser] = useState<User | null>(null);
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    // 1. Listen to Firebase Auth (Runs once on mount)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Construct base user
                let baseUser: User = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    name: firebaseUser.displayName || '',
                    avatar: firebaseUser.photoURL || undefined,
                    house_ids: [],
                    created_at: new Date(),
                };

                // Fetch Firestore Profile
                try {
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userSnap = await getDoc(userDocRef);
                    if (userSnap.exists()) {
                        const firestoreData = userSnap.data();
                        baseUser = { ...baseUser, ...firestoreData };
                    }
                } catch (err) {
                    console.error("Error fetching user profile:", err);
                }

                setRealUser(baseUser);
                setAuthenticated(true);
            } else {
                setRealUser(null);
                setAuthenticated(false);
                setCurrentUser(null);
                setCurrentHouse(null);
                setUserHouses([]);
            }
            setInitialLoadDone(true);
        });

        return () => unsubscribe();
    }, [setAuthenticated, setCurrentUser, setCurrentHouse, setUserHouses]);

    // 2. Handle Effective User Logic (Runs when realUser OR impersonatedUser changes)
    useEffect(() => {
        if (!initialLoadDone) return; // Wait for auth check to complete

        const handleUserData = async () => {
            if (!realUser) {
                setLoading(false);
                return;
            }

            // Determine Effective User
            // If impersonating, use that. Otherwise use realUser.
            const effectiveUser = isImpersonating && impersonatedUser ? impersonatedUser : realUser;

            logger.debug(`AuthHandler: Loading data for ${isImpersonating ? 'IMPERSONATED' : 'REAL'} user:`, effectiveUser.email);

            // Update Store with EFFECTIVE user
            setCurrentUser(effectiveUser);

            // Fetch Houses for EFFECTIVE User
            if (effectiveUser.house_ids && effectiveUser.house_ids.length > 0) {
                try {
                    const housesPromises = effectiveUser.house_ids.map((id: string) => getDoc(doc(db, 'houses', id)));
                    const houseSnaps = await Promise.all(housesPromises);
                    const houses = houseSnaps
                        .filter((snap: DocumentSnapshot) => snap.exists())
                        .map((snap: DocumentSnapshot) => ({ id: snap.id, ...snap.data() } as House));

                    setUserHouses(houses);

                    // Determine Current House
                    const storedHouseId = localStorage.getItem('last_house_id');

                    if (isImpersonating) {
                        // For impersonation, grab the first house or the one in the store if already matched
                        // But usually we just default to the first one available to them
                        const currentStoreHouse = useAppStore.getState().currentHouse;

                        // If the store already has a house for this user (e.g. set by SuperAdminPage), keep it
                        if (currentStoreHouse && houses.find((h: House) => h.id === currentStoreHouse.id)) {
                            // do nothing, house is already set
                        } else {
                            setCurrentHouse(houses[0] || null);
                        }
                    } else {
                        // For real user, respect their last choice
                        const lastHouse = houses.find((h: House) => h.id === storedHouseId);
                        setCurrentHouse(lastHouse || houses[0] || null);
                    }
                } catch (e) {
                    console.error("Error fetching houses:", e);
                    setUserHouses([]);
                    setCurrentHouse(null);
                }
            } else {
                setUserHouses([]);
                setCurrentHouse(null);
            }

            setLoading(false);
        };

        handleUserData();
    }, [realUser, impersonatedUser, isImpersonating, initialLoadDone, setCurrentUser, setCurrentHouse, setUserHouses, setLoading]);

    return null;
}
