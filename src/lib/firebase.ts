import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage, type Messaging } from 'firebase/messaging';

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

let messagingPromise: Promise<Messaging | null> | null = null;

function isExpectedMessagingError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    error.name === 'AbortError' ||
    message.includes('indexeddb') ||
    message.includes('unsupported browser') ||
    message.includes('messaging/unsupported-browser')
  );
}

function logMessagingError(context: string, error: unknown) {
  if (isExpectedMessagingError(error)) {
    console.warn(`[Firebase] ${context}. Push notifications will be skipped in this browser.`, error);
    return;
  }

  console.error(`[Firebase] ${context}:`, error);
}

async function getMessagingInstance(): Promise<Messaging | null> {
  if (messagingPromise) return messagingPromise;

  messagingPromise = isSupported()
    .then((supported) => (supported ? getMessaging(app) : null))
    .catch((error) => {
      logMessagingError('Messaging support check failed', error);
      return null;
    });

  return messagingPromise;
}

/**
 * Request notification permission and get the FCM registration token.
 * @param vapidKey - VAPID key for push subscription.
 * @returns The FCM token string, or null if permission denied / error.
 */
export async function getFcmToken(vapidKey: string): Promise<string | null> {
  if (!('Notification' in window)) return null;

  const messaging = await getMessagingInstance();
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
    logMessagingError('Failed to get FCM token', error);
    return null;
  }
}

/**
 * Register a callback for foreground push messages.
 * Returns an unsubscribe function.
 */
export function onForegroundMessage(callback: (payload: any) => void): () => void {
  let unsubscribe: (() => void) | null = null;
  let cancelled = false;

  getMessagingInstance()
    .then((messaging) => {
      if (!messaging || cancelled) return;

      unsubscribe = onMessage(messaging, (payload) => {
        callback(payload);
      });
    })
    .catch((error) => {
      logMessagingError('Foreground listener registration failed', error);
    });

  return () => {
    cancelled = true;
    unsubscribe?.();
  };
}
