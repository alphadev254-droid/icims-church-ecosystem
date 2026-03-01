/**
 * AuthContext — thin bridge over the Zustand auth store.
 * Keeps all existing useAuth() call sites working unchanged
 * while the real state lives in useAuthStore (with cookie auth + persist).
 */
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useAuthStore, type RegisterData, type AuthUser } from '@/stores/authStore';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, login, register, logout, fetchMe } = useAuthStore();

  // On every app load, re-validate the httpOnly cookie and refresh user data
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
