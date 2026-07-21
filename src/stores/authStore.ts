import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/api-client';
import { getNavForPermissions, getAllowedRoutesFromPermissions, type NavItem } from './permissions';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  title?: string | null;
  ministryName?: string | null;
  subdomain?: string | null;
  roleName: string;
  roleDisplayName?: string | null;
  role?: string;
  roleId?: string | null;
  phone?: string | null;
  avatar?: string | null;
  churchId?: string | null;
  accountCountry?: string | null;
  isSystemAdmin?: boolean;
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

  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; redirectTo?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string; isNewRegistration?: boolean; subdomain?: string | null }>;
  registerMember: (data: MemberRegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setLoading: (v: boolean) => void;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  title?: string;
  titleOther?: string;
  ministryName?: string;
  currentMembership?: number;
  numberOfBranches?: number;
  email: string;
  password: string;
  phone?: string;
  gender?: string;
  accountCountry?: string;
  anniversary?: string;
  inviteToken?: string;
}

export interface MemberRegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  maritalStatus: string;
  weddingDate?: string;
  residentialNeighbourhood?: string;
  membershipType: string;
  serviceInterest?: string;
  baptizedByImmersion?: boolean;
  inviteToken: string;
  expectedChurchId?: string;
}

function applyPermissions(permissions: string[], user: AuthUser) {
  return {
    allowedRoutes: getAllowedRoutesFromPermissions(permissions, user),
    navItems: getNavForPermissions(permissions, user),
  };
}

function getDefaultRedirect(user: AuthUser, navItems: NavItem[], allowedRoutes: string[]) {
  if (user.roleName === 'system_admin') return '/admin';
  return navItems[0]?.to ?? allowedRoutes[0] ?? '/dashboard';
}

function clearClientStoredData() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.clear();
  } catch {
    // ignore storage access failures
  }

  try {
    sessionStorage.clear();
  } catch {
    // ignore storage access failures
  }

  window.dispatchEvent(new Event('auth:clear-client-cache'));
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
            const isSystemAdmin = data.user.roleName === 'system_admin';
            const applied = applyPermissions(permissions, data.user);
            set({
              user: { ...data.user, isSystemAdmin },
              ...applied,
              isLoading: false,
            });
            return { success: true, redirectTo: getDefaultRedirect(data.user, applied.navItems, applied.allowedRoutes) };
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
            return {
              success: true,
              isNewRegistration: true,
              subdomain: data.user.subdomain ?? null,
            };
          }
          return { success: false, message: data.message };
        } catch (err: any) {
          return { success: false, message: err.response?.data?.message || 'Registration failed' };
        }
      },

      registerMember: async (formData) => {
        try {
          const { data } = await apiClient.post('/auth/register/member', formData);
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
        clearClientStoredData();
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
        } catch (err: any) {
          // 403 = suspended/inactive — clear session
          if (err.response?.status === 403) {
            set({ user: null, allowedRoutes: ['/dashboard'], navItems: [], isLoading: false });
            clearClientStoredData();
          } else {
            set({ user: null, isLoading: false });
          }
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
    clearClientStoredData();
  });
}
