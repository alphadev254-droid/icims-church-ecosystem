import apiClient from '@/lib/api-client';

export const walletService = {
  getBalance: async () => {
    const { data } = await apiClient.get('/wallet/balance');
    return data.data;
  },
  getTransactions: async () => {
    const { data } = await apiClient.get('/wallet/transactions');
    return data.data;
  },
  getWithdrawals: async (params?: { startDate?: string; endDate?: string }) => {
    const { data } = await apiClient.get('/wallet/withdrawals', { params });
    return data.data;
  },
  requestWithdrawal: async (payload: {
    amount: number;
    method: 'mobile_money' | 'bank_transfer';
    mobileOperator?: 'airtel' | 'tnm';
    mobileNumber?: string;
    bankCode?: string;
    accountName?: string;
    accountNumber?: string;
  }) => {
    const { data } = await apiClient.post('/wallet/withdraw', payload);
    return data.data;
  },
};
