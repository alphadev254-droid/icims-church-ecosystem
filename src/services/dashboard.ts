import apiClient from '@/lib/api-client';

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalChurches: number;
  totalDonations: number;
  totalDonationRecords: number;
  totalEvents: number;
  upcomingEvents: number;
  recentDonationAmount: number;
  averageAttendance: number;
  memberGrowth: number;
  donationGrowth: number;
}

export const dashboardService = {
  getStats: async (churchId?: string | null): Promise<DashboardStats> => {
    const params = churchId ? `?churchId=${churchId}` : '';
    const { data } = await apiClient.get(`/dashboard/stats${params}`);
    return data.data;
  },
};
