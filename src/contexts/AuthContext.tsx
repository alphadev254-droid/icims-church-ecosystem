/**
 * AuthContext — thin bridge over the Zustand auth store.
 * Keeps all existing useAuth() call sites working unchanged
 * while the real state lives in useAuthStore (with cookie auth + persist).
 */
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { useAuthStore, type RegisterData, type MemberRegisterData, type AuthUser } from '@/stores/authStore';
import { getFcmToken, onForegroundMessage } from '@/lib/firebase';
import { registerPushToken } from '@/services/pushTokens';
import { toast } from 'sonner';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; redirectTo?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
  registerMember: (data: MemberRegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BJv-iKvfMlyjzTR6rNXTYwxZ8TEvYhhKsC1RXXvcGmHT7ioGSfG6TEOTLpt8AExnaaKHiMjEd07V5rxwXhaC9EA';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, login, register, registerMember, logout: storeLogout, fetchMe } = useAuthStore();
  const fcmTokenRef = useRef<string | null>(null);

  // On every app load, re-validate the httpOnly cookie and refresh user data
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Obtain the FCM token once on mount — persists across sessions
  useEffect(() => {
    getFcmToken(VAPID_KEY).then(token => {
      if (token) fcmTokenRef.current = token;
    });
  }, []);

  // Register/refresh token with backend when user becomes available (login)
  // Does NOT unregister on logout — notifications persist across sessions
  useEffect(() => {
    if (!user || !fcmTokenRef.current) return;

    registerPushToken({ token: fcmTokenRef.current, platform: 'web' })
      .catch(err => console.warn('[Auth] Push registration failed:', err));
  }, [user]);

  // Listen for foreground messages and show a toast
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      const title = payload.notification?.title || payload.data?.title || 'New Notification';
      const body = payload.notification?.body || payload.data?.body || '';
      if (title) {
        toast(title, { description: body, duration: 5000 });
      }
    });
    return unsubscribe;
  }, []);

  // Logout does NOT unregister push token — notifications persist across sessions
  const logout = async () => {
    await storeLogout();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, registerMember, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
