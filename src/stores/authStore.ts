import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/api-client';
import { getNavForPermissions, getAllowedRoutesFromPermissions, type NavItem } from './permissions';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
  role?: string;
  roleId?: string | null;
  phone?: string | null;
  avatar?: string | null;
  churchId?: string | null;
  accountCountry?: string | null;
  church?: {
    id: string;
    name: string;
    level: string;
    package: string;
    location: string;
  } | null;
  createdAt: string;
  permissions: string[];
  package?: {
    id: string;
    name: string;
    displayName: string;
    features: Array<{
      limitValue: number | null;
      feature: {
        name: string;
        displayName: string;
        category: string;
      };
    }>;
  } | null;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  // Persisted — rebuilt from permissions on login; controls nav & route guards
  allowedRoutes: string[];
  navItems: NavItem[];

  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setLoading: (v: boolean) => void;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  gender?: string;
  accountCountry?: string;
  anniversary?: string;
  inviteToken?: string;
}

function applyPermissions(permissions: string[], user: AuthUser) {
  return {
    allowedRoutes: getAllowedRoutesFromPermissions(permissions, user),
    navItems: getNavForPermissions(permissions, user),
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      allowedRoutes: ['/dashboard'],
      navItems: [],

      setLoading: (v) => set({ isLoading: v }),

      login: async (email, password) => {
        try {
          const { data } = await apiClient.post('/auth/login', { email, password });
          if (data.success) {
            const permissions: string[] = data.user.permissions ?? [];
            set({
              user: data.user,
              ...applyPermissions(permissions, data.user),
              isLoading: false,
            });
            return { success: true };
          }
          return { success: false, message: data.message };
        } catch (err: any) {
          return { success: false, message: err.response?.data?.message || 'Login failed' };
        }
      },

      register: async (formData) => {
        try {
          const { data } = await apiClient.post('/auth/register', formData);
          if (data.success) {
            const permissions: string[] = data.user.permissions ?? [];
            set({
              user: data.user,
              ...applyPermissions(permissions, data.user),
              isLoading: false,
            });
            return { success: true };
          }
          return { success: false, message: data.message };
        } catch (err: any) {
          return { success: false, message: err.response?.data?.message || 'Registration failed' };
        }
      },

      logout: async () => {
        try { await apiClient.post('/auth/logout'); } catch { /* ignore */ }
        set({ user: null, allowedRoutes: ['/dashboard'], navItems: [], isLoading: false });
      },

      fetchMe: async () => {
        try {
          const { data } = await apiClient.get('/auth/me');
          if (data.success) {
            const permissions: string[] = data.user.permissions ?? [];
            set({
              user: data.user,
              ...applyPermissions(permissions, data.user),
              isLoading: false,
            });
          } else {
            set({ user: null, isLoading: false });
          }
        } catch {
          set({ user: null, isLoading: false });
        }
      },
    }),
    {
      name: 'icims-auth',
      partialize: (state) => ({
        user: state.user,
        allowedRoutes: state.allowedRoutes,
        navItems: state.navItems,
      }),
    }
  )
);

// Listen for 401 events from the API client interceptor
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.setState({ user: null, allowedRoutes: ['/dashboard'], navItems: [] });
  });
}
