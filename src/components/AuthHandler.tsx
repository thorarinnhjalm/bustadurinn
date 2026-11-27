import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, getDocFromServer, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useAppStore } from '@/store/appStore';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { logger } from '@/utils/logger';
import { trackFunnel, flushFunnelBuffer, resetFunnelSession, describeError } from '@/utils/funnel';
import type { House, User } from '@/types/models';
import { accountDeletionState, collectSettledHouses, shouldAttemptProfileRepair } from './authHandlerHelpers';

export default function AuthHandler() {
    const setCurrentUser = useAppStore((state) => state.setCurrentUser);
    const setAuthenticated = useAppStore((state) => state.setAuthenticated);
    const setLoading = useAppStore((state) => state.setLoading);
    const setCurrentHouse = useAppStore((state) => state.setCurrentHouse);
    const setUserHouses = useAppStore((state) => state.setUserHouses);
    const setCachedRole = useAppStore((state) => state.setCachedRole);

    const { impersonatedUser, isImpersonating } = useImpersonation();

    // Local state to track the actual authenticated Firebase user
    const [realUser, setRealUser] = useState<User | null>(null);
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    // 1. Listen to Firebase Auth (Runs once on mount)
    useEffect(() => {
        let unsubscribeProfile: (() => void) | null = null;
        let signedInUid: string | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            // Auth identity changed (sign-in, sign-out, or user switch) -
            // any cached RBAC role belongs to the previous auth state and
            // must not be served to whatever user is now current.
            setCachedRole(null);

            if (unsubscribeProfile) {
                unsubscribeProfile();
                unsubscribeProfile = null;
            }

            // Signed in → signed out (or a different user): forget the previous
            // user's funnel session so nothing is attributed to the next one.
            if (signedInUid && signedInUid !== firebaseUser?.uid) {
                resetFunnelSession();
            }
            signedInUid = firebaseUser?.uid ?? null;

            if (firebaseUser) {
                // Attribute anything recorded before sign-in (signup page,
                // failed attempts) to this user.
                void flushFunnelBuffer();

                // Construct base user
                const baseUser: User = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    name: firebaseUser.displayName || '',
                    avatar: firebaseUser.photoURL || undefined,
                    house_ids: [],
                    created_at: new Date(),
                };

                // Subscribe to Firestore Profile in real-time
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                unsubscribeProfile = onSnapshot(userDocRef, async (userSnap) => {
                    let updatedUser = { ...baseUser };
                    
                    if (userSnap.exists()) {
                        updatedUser = { ...updatedUser, ...userSnap.data() };
                        logger.debug('AuthHandler: User profile synchronized:', updatedUser.email);
                    } else {
                        // SELF-REPAIR: Missing profile but authenticated.
                        // Only trust a "does not exist" answer that came from the
                        // server (a cold local cache also reports "missing"), and
                        // skip accounts created in the last 15 seconds: SignupPage
                        // is still writing the profile.
                        const creationTime = firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime).getTime() : 0;
                        const shouldRepair = shouldAttemptProfileRepair({
                            exists: false,
                            fromCache: userSnap.metadata.fromCache,
                            creationTimeMs: creationTime,
                            nowMs: Date.now(),
                        });

                        if (shouldRepair && !accountDeletionState.inProgress) {
                            try {
                                // Authoritative check right before writing: if this read
                                // fails we do not know the doc is new, so we do not write.
                                const serverSnap = await getDocFromServer(userDocRef);
                                if (!serverSnap.exists()) {
                                    logger.warn("AuthHandler: Orphan user detected, triggering self-repair for:", firebaseUser.email);
                                    void trackFunnel('profile_self_repair');
                                    await setDoc(userDocRef, {
                                        uid: baseUser.uid,
                                        email: baseUser.email,
                                        name: baseUser.name || baseUser.email.split('@')[0],
                                        house_ids: [], // safe: the server just confirmed there is no profile
                                        created_at: serverTimestamp(),
                                        last_login: serverTimestamp(),
                                        repaired_auto: true
                                    }, { merge: true });
                                }
                            } catch (repairErr) {
                                logger.error("AuthHandler: Self-repair failed:", repairErr);
                                void trackFunnel('profile_self_repair_error', describeError(repairErr));
                            }
                        }
                    }

                    setRealUser(updatedUser);
                    setAuthenticated(true);
                    setInitialLoadDone(true);
                }, (err) => {
                    logger.error("Error listening to user profile:", err);
                    void trackFunnel('profile_listen_error', describeError(err));
                    setRealUser(baseUser);
                    setAuthenticated(true);
                    setInitialLoadDone(true);
                });
            } else {
                setRealUser(null);
                setAuthenticated(false);
                setCurrentUser(null);
                setCurrentHouse(null);
                setUserHouses([]);
                setLoading(false);
                setInitialLoadDone(true);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
        };
    }, [setAuthenticated, setCurrentUser, setCurrentHouse, setUserHouses, setCachedRole]); // Zustand setters are stable

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
            // Defensive check: ensure house_ids exists and is an array
            if (!effectiveUser.house_ids || !Array.isArray(effectiveUser.house_ids) || effectiveUser.house_ids.length === 0) {
                setUserHouses([]);
                setCurrentHouse(null);
                setLoading(false);
                return;
            }

            if (effectiveUser.house_ids && effectiveUser.house_ids.length > 0) {
                try {
                    const houseIds = effectiveUser.house_ids as string[];
                    // allSettled: one deleted house / stale id (permission-denied)
                    // must not hide the houses that did load.
                    const settled = await Promise.allSettled(
                        houseIds.map((id: string) => getDoc(doc(db, 'houses', id)))
                    );
                    const { houses, failures } = collectSettledHouses(houseIds, settled);
                    failures.forEach(({ houseId, reason }) =>
                        logger.warn(`AuthHandler: Could not load house ${houseId}:`, reason)
                    );
                    if (failures.length > 0 && houses.length === 0) {
                        // Nothing loaded: same handling as a failed fetch
                        throw failures[0].reason;
                    }

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
                    logger.error("Error fetching houses:", e);
                    void trackFunnel('houses_fetch_error', describeError(e));
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
    }, [realUser, impersonatedUser, isImpersonating, initialLoadDone, setCurrentUser, setUserHouses, setCurrentHouse, setLoading]); // Zustand setters are stable

    return null;
}
