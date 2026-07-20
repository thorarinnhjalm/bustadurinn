/**
 * Merged Service Worker
 *
 * Single service worker registered at scope "/" (filename
 * firebase-messaging-sw.js — kept for backwards compatibility with FCM's
 * default `getToken()` service-worker lookup, see src/utils/pushNotifications.ts).
 *
 * Combines two previously-separate concerns:
 *   1. Firebase Cloud Messaging background notifications (previously
 *      public/firebase-messaging-sw.js, compat SDK loaded via importScripts).
 *   2. Workbox app-shell precaching for offline/PWA support (Phase 6),
 *      injected by vite-plugin-pwa's `injectManifest` strategy.
 *
 * Built as an ES module by vite-plugin-pwa (rollupFormat: 'es'), so we use
 * the modular Firebase SDK's dedicated service-worker entry point
 * (`firebase/messaging/sw`) instead of the old `importScripts` + compat SDK
 * approach, which does not work in module-type service workers.
 *
 * Kept intentionally minimal: no caching strategy for Firestore or /api/*
 * traffic. Firestore already has its own IndexedDB persistence (see
 * src/lib/firebase.ts) and API routes must always hit the network.
 */

import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// --- App-shell precache (Workbox) -----------------------------------------

// self.__WB_MANIFEST is replaced at build time with the list of hashed
// build assets (JS/CSS chunks, index.html, etc.) by vite-plugin-pwa.
precacheAndRoute(self.__WB_MANIFEST);

// SPA fallback: serve the precached index.html for any navigation request
// that isn't otherwise handled (client-side routing). Never intercept
// /api/* — those must always go to the network.
registerRoute(
    new NavigationRoute(createHandlerBoundToURL('index.html'), {
        denylist: [/^\/api\//],
    })
);

// --- Firebase Cloud Messaging (background messages) -----------------------

// Config is intentionally hardcoded (matches the previous
// public/firebase-messaging-sw.js) — service workers register before the
// app's env-driven config module runs, and there is no reliable way to pass
// Vite env vars into this file at runtime.
const firebaseConfig = {
    apiKey: 'AIzaSyA6wJPUE5ZfJxuS7WZ9eB1eaG3bKrMSAjs',
    authDomain: 'bustadurinn-599f2.firebaseapp.com',
    projectId: 'bustadurinn-599f2',
    storageBucket: 'bustadurinn-599f2.firebasestorage.app',
    messagingSenderId: '202319322190',
    appId: '1:202319322190:web:f9f2c2e125a8109b02771f',
};

const firebaseApp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseApp);

onBackgroundMessage(messaging, (payload) => {
    const notificationTitle = payload.notification?.title ?? 'Bústaðurinn';
    const notificationOptions = {
        body: payload.notification?.body,
        icon: '/logo.png',
        badge: '/icon-192x192.png',
        data: payload.data,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
