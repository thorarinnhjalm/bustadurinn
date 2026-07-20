/**
 * Firebase Services Initialization
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';
import firebaseConfig from '@/config/firebase';

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

export const functions = getFunctions(app);
export const storage = getStorage(app);
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// Auth Providers
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

export default app;
