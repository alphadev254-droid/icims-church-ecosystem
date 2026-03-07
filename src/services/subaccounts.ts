import apiClient from '@/lib/api-client';

export interface Subaccount {
  id: string;
  churchId: string;
  subaccountCode: string;
  businessName: string;
  settlementBank: string;
  accountNumber: string;
  percentageCharge: number;
  description?: string;
  active: boolean;
  createdAt: string;
}

export interface CreateSubaccountDto {
  churchId: string;
  businessName: string;
  settlementBank: string;
  accountNumber: string;
  percentageCharge?: number;
  description?: string;
}

export interface UpdateSubaccountDto {
  businessName?: string;
  settlementBank?: string;
  accountNumber?: string;
  percentageCharge?: number;
  active?: boolean;
}

export interface Bank {
  name: string;
  code: string;
}

export const subaccountsService = {
  async create(dto: CreateSubaccountDto): Promise<Subaccount> {
    const { data } = await apiClient.post('/subaccounts', dto);
    return data.data;
  },

  async update(id: string, dto: UpdateSubaccountDto): Promise<Subaccount> {
    const { data } = await apiClient.put(`/subaccounts/${id}`, dto);
    return data.data;
  },

  async getByChurch(churchId: string): Promise<Subaccount | null> {
    try {
      const { data } = await apiClient.get(`/subaccounts/church/${churchId}`);
      return data.data;
    } catch {
      return null;
    }
  },

  async getBanks(): Promise<Bank[]> {
    const { data } = await apiClient.get('/subaccounts/banks');
    return data.data;
  },
};
