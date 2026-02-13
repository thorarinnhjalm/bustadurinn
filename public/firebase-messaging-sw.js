importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyA6wJPUE5ZfJxuS7WZ9eB1eaG3bKrMSAjs",
    authDomain: "bustadurinn-599f2.firebaseapp.com",
    projectId: "bustadurinn-599f2",
    storageBucket: "bustadurinn-599f2.firebasestorage.app",
    messagingSenderId: "202319322190",
    appId: "1:202319322190:web:f9f2c2e125a8109b02771f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.png', // Fallback to logo
        badge: '/icon-192x192.png',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
