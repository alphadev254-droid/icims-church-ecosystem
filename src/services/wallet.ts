import apiClient from '@/lib/api-client';

export type WithdrawalFeePreview = {
  amount: number;
  fee: number;
  gatewayFeeAmount: number;
  gatewayFeeRate: number;
  bankFixedFeeAmount: number;
  systemFeeAmount: number;
  systemFeeRate: number;
  netAmount: number;
  payoutAmount: number;
  availableBalance: number;
  hasEnoughBalance: boolean;
  shortfall: number;
  currency: string;
};

export type WithdrawalPayload = {
  amount: number;
  method: 'mobile_money' | 'bank_transfer';
  mobileOperator?: 'airtel' | 'tnm';
  mobileNumber?: string;
  bankCode?: string;
  accountName?: string;
  accountNumber?: string;
};

export type PayoutHistoryItem = {
  id: string;
  amount: number;
  requestedAmount?: number;
  fee: number;
  gatewayFeeAmount?: number;
  gatewayFeeRate?: number | null;
  bankFixedFeeAmount?: number;
  systemFeeAmount?: number;
  systemFeeRate?: number | null;
  totalDebitAmount?: number;
  netAmount: number;
  payoutAmount: number;
  currency: string;
  method: string;
  status: string;
  gateway?: string;
  payoutType?: string;
  reconciliationStatus?: string;
  createdAt: string;
};

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
    return data.data as PayoutHistoryItem[];
  },
  getWithdrawalFeePreview: async (params: WithdrawalPayload) => {
    const { data } = await apiClient.get('/wallet/withdraw/fees', { params });
    return data.data as WithdrawalFeePreview;
  },
  requestWithdrawal: async (payload: WithdrawalPayload & { otpCode: string }) => {
    const { data } = await apiClient.post('/wallet/withdraw', payload);
    return data.data;
  },
  sendWithdrawalOtp: async (payload: WithdrawalPayload) => {
    const { data } = await apiClient.post('/wallet/withdraw/otp', payload);
    return data as { success: boolean; message?: string; expiresInSeconds?: number; data?: WithdrawalFeePreview };
  },
  getSupportedBanks: async () => {
    const { data } = await apiClient.get('/wallet/supported-banks');
    return data.data;
  },
};
