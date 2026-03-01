import apiClient from '@/lib/api-client';

export interface Donation {
  id: string;
  memberId?: string | null;
  memberName: string;
  amount: number;
  type: 'tithe' | 'offering' | 'pledge' | 'special';
  method: 'cash' | 'card' | 'mobile_money' | 'bank_transfer';
  status: 'completed' | 'pending' | 'failed';
  reference?: string | null;
  notes?: string | null;
  date: string;
  churchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDonationDto {
  memberName: string;
  amount: number;
  type: Donation['type'];
  method: Donation['method'];
  status?: Donation['status'];
  reference?: string;
  notes?: string;
  date?: string;
  churchId: string;
}

export type UpdateDonationDto = Partial<CreateDonationDto>;

export const givingService = {
  getAll: async (): Promise<Donation[]> => {
    const { data } = await apiClient.get('/giving');
    return data.data;
  },
  getOne: async (id: string): Promise<Donation> => {
    const { data } = await apiClient.get(`/giving/${id}`);
    return data.data;
  },
  create: async (dto: CreateDonationDto): Promise<Donation> => {
    const { data } = await apiClient.post('/giving', dto);
    return data.data;
  },
  update: async (id: string, dto: UpdateDonationDto): Promise<Donation> => {
    const { data } = await apiClient.put(`/giving/${id}`, dto);
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/giving/${id}`);
  },
};
