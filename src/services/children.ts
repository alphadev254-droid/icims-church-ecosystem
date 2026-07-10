import apiClient from '@/lib/api-client';

export interface ChildGuardianLink {
  id: string;
  childId: string;
  guardianId: string;
  relationship: string;
  isPrimary: boolean;
  canPickup: boolean;
  emergencyContact: boolean;
  guardian?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    churchId?: string | null;
  };
}

export interface Child {
  id: string;
  userId?: string | null;
  churchId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  age?: number | null;
  gender?: 'male' | 'female' | 'other' | null;
  phone?: string | null;
  status: 'active' | 'inactive';
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; memberType: string; loginEnabled: boolean } | null;
  church?: { id: string; name: string };
  guardians?: ChildGuardianLink[];
}

export interface ChildPayload {
  churchId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  age?: number | null;
  gender?: 'male' | 'female' | 'other' | null;
  phone?: string | null;
  status?: 'active' | 'inactive';
  notes?: string | null;
  guardianId?: string;
  relationship?: string;
  isPrimary?: boolean;
  canPickup?: boolean;
  emergencyContact?: boolean;
}

export interface GuardianPayload {
  guardianId: string;
  relationship?: string;
  isPrimary?: boolean;
  canPickup?: boolean;
  emergencyContact?: boolean;
}

function calculateAge(value?: string | null): number | null {
  if (!value) return null;
  const dateOnly = value.split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);
  const dob = year && month && day ? new Date(year, month - 1, day) : new Date(value);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasBirthdayPassed) age -= 1;
  return age >= 0 ? age : null;
}

function normalizeChild(child: Child): Child {
  return {
    ...child,
    age: child.dateOfBirth ? calculateAge(child.dateOfBirth) : child.age ?? null,
  };
}

export const childrenService = {
  async list(params?: { churchId?: string; guardianId?: string; search?: string; unlinked?: boolean; page?: number; limit?: number }): Promise<{
    data: Child[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { data } = await apiClient.get('/children', { params });
    return { ...data, data: (data.data || []).map(normalizeChild) };
  },

  async get(id: string): Promise<Child> {
    const { data } = await apiClient.get(`/children/${id}`);
    return normalizeChild(data.data);
  },

  async create(payload: ChildPayload): Promise<Child> {
    const { data } = await apiClient.post('/children', payload);
    return normalizeChild(data.data);
  },

  async update(id: string, payload: Partial<Omit<ChildPayload, 'guardianId'>>): Promise<Child> {
    const { data } = await apiClient.put(`/children/${id}`, payload);
    return normalizeChild(data.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/children/${id}`);
  },

  async linkGuardian(childId: string, payload: GuardianPayload): Promise<ChildGuardianLink> {
    const { data } = await apiClient.post(`/children/${childId}/guardians`, payload);
    return data.data;
  },

  async updateGuardian(childId: string, guardianId: string, payload: Omit<Partial<GuardianPayload>, 'guardianId'>): Promise<ChildGuardianLink> {
    const { data } = await apiClient.put(`/children/${childId}/guardians/${guardianId}`, payload);
    return data.data;
  },

  async unlinkGuardian(childId: string, guardianId: string): Promise<void> {
    await apiClient.delete(`/children/${childId}/guardians/${guardianId}`);
  },
};
