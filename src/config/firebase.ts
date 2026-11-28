/**
 * Firebase Configuration
 * This is a DEVELOPMENT environment config
 * Replace with your Firebase project credentials
 */

// Build-time only switch for the local emulator e2e suite (tests/e2e-emulator).
// Never read from anywhere but the Vite build env, so a production build that
// is not made with VITE_USE_EMULATORS=true cannot pick up emulator settings.
export const USE_EMULATORS = import.meta.env.VITE_USE_EMULATORS === 'true';

const emulatorConfig = {
    apiKey: "demo-api-key",
    authDomain: "demo-bustadurinn.firebaseapp.com",
    projectId: "demo-bustadurinn",
    storageBucket: "demo-bustadurinn.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:0000000000000000000000"
};

const firebaseConfig = USE_EMULATORS ? emulatorConfig : {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

export default firebaseConfig;
