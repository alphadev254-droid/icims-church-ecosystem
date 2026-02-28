import { storage } from './storage';
import type { User } from '@/types';

const CURRENT_USER_KEY = 'current_user';
const USERS_KEY = 'users';

// Demo user
const DEMO_USERS: User[] = [
  {
    id: '1',
    email: 'admin@icims.org',
    firstName: 'Admin',
    lastName: 'User',
    role: 'national_admin',
    churchId: 'c1',
    phone: '+254700000000',
    createdAt: '2023-01-01',
  },
];

function ensureUsers() {
  if (!storage.get<User[]>(USERS_KEY)) {
    storage.set(USERS_KEY, DEMO_USERS);
  }
}

export const authService = {
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> {
    ensureUsers();
    await new Promise(r => setTimeout(r, 500));
    const users = storage.get<User[]>(USERS_KEY) || [];
    const user = users.find(u => u.email === email);
    if (!user) return { success: false, message: 'Invalid email or password' };
    // In mock mode, any password works
    if (password.length < 4) return { success: false, message: 'Invalid email or password' };
    storage.set(CURRENT_USER_KEY, user);
    return { success: true, user };
  },

  async register(data: { email: string; password: string; firstName: string; lastName: string }): Promise<{ success: boolean; user?: User; message?: string }> {
    ensureUsers();
    await new Promise(r => setTimeout(r, 500));
    const users = storage.get<User[]>(USERS_KEY) || [];
    if (users.find(u => u.email === data.email)) {
      return { success: false, message: 'Email already registered' };
    }
    const user: User = {
      id: crypto.randomUUID(),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'member',
      churchId: 'c1',
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    storage.set(USERS_KEY, users);
    storage.set(CURRENT_USER_KEY, user);
    return { success: true, user };
  },

  getCurrentUser(): User | null {
    return storage.get<User>(CURRENT_USER_KEY);
  },

  logout(): void {
    storage.remove(CURRENT_USER_KEY);
  },

  isAuthenticated(): boolean {
    return !!storage.get<User>(CURRENT_USER_KEY);
  },
};
