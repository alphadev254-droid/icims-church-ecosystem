import apiClient from '@/lib/api-client';

export interface Member {
  id: string;
  memberId?: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  status: 'active' | 'inactive' | 'pending';
  roles: string[];
  familyId?: string | null;
  churchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberDto {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  status?: 'active' | 'inactive' | 'pending';
  roles?: string[];
}

export type UpdateMemberDto = Partial<CreateMemberDto>;

export const membersService = {
  getAll: async (params?: { churchId?: string }): Promise<Member[]> => {
    const { data } = await apiClient.get('/users', { params: { role: 'member', ...params } });
    return data.data;
  },
  getOne: async (id: string): Promise<Member> => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data.data;
  },
  create: async (dto: CreateMemberDto): Promise<Member> => {
    const { data } = await apiClient.post('/users', dto);
    return data.data;
  },
  update: async (id: string, dto: UpdateMemberDto): Promise<Member> => {
    const { data } = await apiClient.put(`/users/${id}`, dto);
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
