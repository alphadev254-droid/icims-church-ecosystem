import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let messaging: Messaging | null = null;
try {
  messaging = getMessaging(app);
} catch {
  console.warn('[Firebase] Messaging not supported in this browser');
}

/**
 * Request notification permission and get the FCM registration token.
 * @param vapidKey - VAPID key for push subscription.
 * @returns The FCM token string, or null if permission denied / error.
 */
export async function getFcmToken(vapidKey: string): Promise<string | null> {
  if (!messaging) return null;

  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[Firebase] Notification permission denied');
      return null;
    }

    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (error) {
    console.error('[Firebase] Failed to get FCM token:', error);
    return null;
  }
}

/**
 * Register a callback for foreground push messages.
 * Returns an unsubscribe function.
 */
export function onForegroundMessage(callback: (payload: any) => void): () => void {
  if (!messaging) return () => {};

  const unsubscribe = onMessage(messaging, (payload) => {
    callback(payload);
  });
  return unsubscribe;
}

export { messaging };
