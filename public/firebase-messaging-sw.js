importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

self.addEventListener('install', () => {
  console.log('[FCM SW] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('[FCM SW] Activated');
  clients.claim();
});

const firebaseConfig = {
  apiKey: "AIzaSyDARzl9s2dlvucXRKVw5_IvHQgW-TLPJvQ",
  authDomain: "shulepro-8b14c.firebaseapp.com",
  projectId: "shulepro-8b14c",
  storageBucket: "shulepro-8b14c.firebasestorage.app",
  messagingSenderId: "1018874559829",
  appId: "1:1018874559829:web:3d1632fb5146ac81a983dc",
  measurementId: "G-E5TBGR2WLM",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
  const notificationBody = payload.notification?.body || payload.data?.body || '';
  const icon = '/logo192.png';

  self.registration.showNotification(notificationTitle, {
    body: notificationBody,
    icon,
    badge: icon,
    data: payload.data || {},
    requireInteraction: true,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const type = data.type;

  let url = '/dashboard';
  if (type === 'announcement') url = '/dashboard/communication';
  else if (type === 'team_communication') url = '/dashboard/communication';
  else if (type === 'reminder') url = '/dashboard/reminders';
  else if (type === 'cell_meeting') url = '/dashboard/cells';
  else if (type === 'resource') url = '/dashboard/resources';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) clients.openWindow(url);
    })
  );
});
