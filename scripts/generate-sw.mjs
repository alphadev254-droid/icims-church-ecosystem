/**
 * Generates public/firebase-messaging-sw.js from environment variables.
 * Runs as a prebuild step so the service worker never contains hardcoded keys.
 */
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Load .env so the service worker gets VITE_* vars
config({ path: resolve(root, '.env') });

const apiKey = process.env.VITE_FIREBASE_API_KEY;
const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = process.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.VITE_FIREBASE_APP_ID;
const measurementId = process.env.VITE_FIREBASE_MEASUREMENT_ID;

if (!apiKey) {
  console.warn('[generate-sw] VITE_FIREBASE_API_KEY not set — using fallback. Set env vars in .env');
}

const swContent = `importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
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
  apiKey: ${JSON.stringify(apiKey || '')},
  authDomain: ${JSON.stringify(authDomain || '')},
  projectId: ${JSON.stringify(projectId || '')},
  storageBucket: ${JSON.stringify(storageBucket || '')},
  messagingSenderId: ${JSON.stringify(messagingSenderId || '')},
  appId: ${JSON.stringify(appId || '')},
  measurementId: ${JSON.stringify(measurementId || '')},
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
  const notificationBody = payload.notification?.body || payload.data?.body || '';
  const icon = 'https://media.aircnc.co.ke/media-images/e295d9c1-36d8-474a-a897-5d84f99e57fc.webp';

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
`;

const outPath = resolve(root, 'public', 'firebase-messaging-sw.js');
writeFileSync(outPath, swContent, 'utf-8');
console.log('[generate-sw] Generated public/firebase-messaging-sw.js from env vars');
