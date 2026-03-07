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
  status?: string;
  districts?: string[] | null;
  traditionalAuthorities?: string[] | null;
  regions?: string[] | null;
  createdAt: string;
  updatedAt: string;
  role?: { id: string; name: string; displayName: string } | null;
  church?: { name: string } | null;
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
  regions?: string[];
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleName?: string;
  districts?: string[];
  traditionalAuthorities?: string[];
  regions?: string[];
  status?: string;
  churchId?: string;
  password?: string;
}

interface PaginationResponse {
  data: AppUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const usersService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; churchId?: string; role?: string }): Promise<PaginationResponse> => {
    const { data } = await apiClient.get('/users', { params });
    return data;
  },
  getMembers: async (): Promise<AppUser[]> => {
    const { data } = await apiClient.get('/users?role=member');
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
