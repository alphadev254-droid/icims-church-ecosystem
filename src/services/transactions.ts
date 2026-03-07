import apiClient from '@/lib/api-client';

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'cash' | 'mobile_money' | 'card' | 'bank_transfer';
  userId: string;
  churchId: string;
  type: 'event_ticket' | 'donation' | 'subscription';
  isManual: boolean;
  systemFeeAmount?: number;
  subaccountName?: string;
  cardLast4?: string;
  cardBank?: string;
  baseAmount?: number;
  convenienceFee?: number;
  taxAmount?: number;
  totalAmount?: number;
  gateway?: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  church?: {
    name: string;
  };
}

interface PaginationResponse {
  data: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const transactionsService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; type?: string; status?: string; paymentMethod?: string; churchId?: string; startDate?: string; endDate?: string }): Promise<PaginationResponse> => {
    const { data } = await apiClient.get('/transactions', { params });
    return data;
  },
  getOne: async (id: string): Promise<Transaction> => {
    const { data } = await apiClient.get(`/transactions/${id}`);
    return data.data;
  },
  updateStatus: async (id: string, status: Transaction['status']): Promise<Transaction> => {
    const { data } = await apiClient.patch(`/transactions/${id}/status`, { status });
    return data.data;
  },
};
