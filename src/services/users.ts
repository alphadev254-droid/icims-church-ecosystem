import apiClient from '@/lib/api-client';

export interface AppUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  roleName: string;
  roleId?: string | null;
  churchId?: string | null;
  districts?: string[] | null;
  traditionalAuthorities?: string[] | null;
  createdAt: string;
  updatedAt: string;
  role?: { id: string; name: string; displayName: string } | null;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleName?: string;
  districts?: string[];
  traditionalAuthorities?: string[];
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleName?: string;
  districts?: string[];
  traditionalAuthorities?: string[];
}

export const usersService = {
  getAll: async (): Promise<AppUser[]> => {
    const { data } = await apiClient.get('/users');
    return data.data;
  },
  create: async (dto: CreateUserDto): Promise<AppUser> => {
    const { data } = await apiClient.post('/users', dto);
    return data.data;
  },
  update: async (id: string, dto: UpdateUserDto): Promise<AppUser> => {
    const { data } = await apiClient.put(`/users/${id}`, dto);
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
