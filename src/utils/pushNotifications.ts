import { getToken, onMessage } from "firebase/messaging";
import { messaging, db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { type User } from "@/types/models";

// This is the public VAPID key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
// If not provided, push notifications won't initialize. 
// USER: You need to replace this with your actual VAPID key.
const VAPID_KEY = "BD8KsStlsJ0gDutzeb0jUCF_ko3N0r9m-xSv-4srOvNggITWUV6dJ9SzQtGE8hRxCCGU6XKrwly5GGa2guQoyEo";

export const requestPushPermission = async (currentUser: User) => {
    if (!messaging) return null;

    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            const token = await getToken(messaging, {
                vapidKey: VAPID_KEY
            });

            if (token) {
                console.log("FCM Token generated:", token);

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

export const onForegroundMessage = () => {
    if (!messaging) return;

    onMessage(messaging, (payload) => {
        console.log("Foreground message received:", payload);
        // You could show a custom toast here if you want
    });
};
