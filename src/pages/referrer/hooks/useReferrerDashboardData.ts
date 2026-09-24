import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function useReferrerDashboardData() {
  return useQuery({
    queryKey: ['referrer-dashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/referrals/me');
      return response.data.data;
    },
  });
}

export function useReferrerReferralsData() {
  return useQuery({
    queryKey: ['referrer-referrals'],
    queryFn: async () => {
      const response = await apiClient.get('/referrals/me/referrals');
      return response.data.data;
    },
  });
}

export function useReferrerWalletData() {
  return useQuery({
    queryKey: ['referrer-wallet'],
    queryFn: async () => {
      const response = await apiClient.get('/referrals/me/wallet');
      return response.data.data;
    },
  });
}
