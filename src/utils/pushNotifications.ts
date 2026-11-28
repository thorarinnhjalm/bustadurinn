import type { MessagePayload } from 'firebase/messaging';
import { logger } from './logger';
import { db } from "@/lib/firebase";
import { USE_EMULATORS } from "@/config/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { type User } from "@/types/models";

// firebase/messaging (and the Messaging instance) is loaded on demand, so it is not
// part of the Firebase chunk that every page needs. No push messaging against the
// emulators (it would talk to the real FCM).
const loadMessaging = async () => {
    if (typeof window === 'undefined' || USE_EMULATORS) return null;
    try {
        const [{ getMessaging, getToken, onMessage }, { default: app }] = await Promise.all([
            import('firebase/messaging'),
            import('@/lib/firebase'),
        ]);
        return { messaging: getMessaging(app), getToken, onMessage };
    } catch (error) {
        // Unsupported browser or the chunk failed to load: push is simply unavailable.
        logger.warn('Push messaging unavailable:', error);
        return null;
    }
};

// This is the public VAPID key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
// If not provided, push notifications won't initialize. 
// USER: You need to replace this with your actual VAPID key.
const VAPID_KEY = "BD8KsStlsJ0gDutzeb0jUCF_ko3N0r9m-xSv-4srOvNggITWUV6dJ9SzQtGE8hRxCCGU6XKrwly5GGa2guQoyEo";

export const requestPushPermission = async (currentUser: User) => {
    const fcm = await loadMessaging();
    if (!fcm) return null;

    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            const token = await fcm.getToken(fcm.messaging, {
                vapidKey: VAPID_KEY
            });

            if (token) {
                logger.info("FCM Token generated:", token);

                // Save token to user profile if not already there
                if (!currentUser.fcm_tokens?.includes(token)) {
                    await updateDoc(doc(db, "users", currentUser.uid), {
                        fcm_tokens: arrayUnion(token)
                    });
                }
                return token;
            }
        }
    } catch (error) {
        console.error("Error requesting push permission:", error);
    }
    return null;
};

export const onForegroundMessage = async () => {
    const fcm = await loadMessaging();
    if (!fcm) return;

    fcm.onMessage(fcm.messaging, (payload) => {
        logger.debug("Foreground message received:", payload);
        showForegroundToast(payload);
    });
};

// Minimal DOM toast for push messages that arrive while the app is in the
// foreground (Firebase does not surface these as OS notifications itself).
const showForegroundToast = (payload: MessagePayload) => {
    if (typeof document === 'undefined') return;

    const title = payload.notification?.title || 'Ný tilkynning';
    const body = payload.notification?.body || '';

    const toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');

    const titleEl = document.createElement('p');
    titleEl.className = 'font-serif font-semibold text-charcoal';
    titleEl.textContent = title;
    toastEl.appendChild(titleEl);

    if (body) {
        const bodyEl = document.createElement('p');
        bodyEl.className = 'text-sm text-grey-mid mt-1';
        bodyEl.textContent = body;
        toastEl.appendChild(bodyEl);
    }

    document.body.appendChild(toastEl);

    window.setTimeout(() => {
        toastEl.remove();
    }, 6000);
};
