/**
 * Firebase Services Initialization
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { initializeFirestore, connectFirestoreEmulator, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import firebaseConfig, { USE_EMULATORS } from '@/config/firebase';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);

// Use initializeFirestore to configure specific settings
// experimentalForceLongPolling helps resolve Safari CORS/ITP issues.
// localCache enables IndexedDB-backed offline persistence (cached reads +
// queued writes while offline — important for cabins with poor internet),
// synced across tabs via persistentMultipleTabManager.
//
// Trade-off: experimentalForceLongPolling + persistentLocalCache is not a
// combination Firebase explicitly documents as tested together (the SDK's
// documented incompatibility is only between experimentalForceLongPolling
// and experimentalAutoDetectLongPolling, which we don't use). The two
// settings operate at different layers — persistence is local IndexedDB
// caching, long-polling is the network transport — so they are expected to
// be compatible, but this combination should be watched for regressions in
// Safari specifically.
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true,
});

export const storage = getStorage(app);
// Messaging is not created here: firebase/messaging is only needed once push is
// used, so src/utils/pushNotifications.ts imports and initialises it on demand
// (and never against the emulators). Keeping it out of this module keeps it out
// of the Firebase chunk every page loads.

// Local emulator e2e suite only (VITE_USE_EMULATORS=true at build time).
if (USE_EMULATORS) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
}

// Auth Providers
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

export default app;
