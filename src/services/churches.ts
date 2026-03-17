import apiClient from '@/lib/api-client';

export interface Church {
  id: string;
  name: string;
  level: 'national' | 'regional' | 'district' | 'local';
  package: 'basic' | 'standard' | 'premium';
  location: string;
  country: string;
  region?: string | null;
  district?: string | null;
  traditionalAuthority?: string | null;
  village?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  pastorName?: string | null;
  logoUrl?: string | null;
  memberCount: number;
  yearFounded?: number | null;
  parentId?: string | null;
  leaderId?: string | null;
  branchCode?: string | null;
  inviteToken?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { members: number; users: number; events?: number };
  children?: Church[];
}

export interface CreateChurchDto {
  name: string;
  location?: string;
  country?: string;
  region?: string;
  district?: string;
  traditionalAuthority?: string;
  village?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  pastorName?: string;
  yearFounded?: number;
  parentId?: string;
}

export type UpdateChurchDto = Partial<CreateChurchDto>;

export const churchesService = {
  getAll: async (): Promise<Church[]> => {
    const { data } = await apiClient.get('/churches');
    return data.data;
  },
  getOne: async (id: string): Promise<Church> => {
    const { data } = await apiClient.get(`/churches/${id}`);
    return data.data;
  },
  create: async (dto: CreateChurchDto | FormData): Promise<Church> => {
    const isFormData = dto instanceof FormData;
    const { data } = await apiClient.post('/churches', dto, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return data.data;
  },
  update: async (id: string, dto: UpdateChurchDto | FormData): Promise<Church> => {
    const isFormData = dto instanceof FormData;
    const { data } = await apiClient.put(`/churches/${id}`, dto, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/churches/${id}`);
  },
  generateInviteLink: async (id: string): Promise<{ id: string; name: string; inviteToken: string }> => {
    const { data } = await apiClient.post(`/churches/${id}/generate-invite`);
    return data.data;
  },
};
