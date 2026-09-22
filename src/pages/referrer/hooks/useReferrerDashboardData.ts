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
