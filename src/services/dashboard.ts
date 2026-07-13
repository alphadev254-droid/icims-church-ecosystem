import apiClient from '@/lib/api-client';

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalChurches: number;
  totalChildren?: number;
  totalCells?: number;
  totalTeams?: number;
  totalDonations: number;
  upcomingEvents: number;
  averageAttendance: number;
  memberGrowth: number;
  donationGrowth: number;
  totalNewVisitors: number;
  retentionRate: number;
  attendanceRate: number;
  newMembersThisMonth: number;
  currency?: string;
  myTotalDonations?: number;
  myDonationRecords?: number;
  totalEvents?: number;
  weeklyAttendance?: { week: string; attendees: number; date: string }[];
  monthlyGiving?: { month: string; amount: number }[];
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get('/dashboard/stats');
    return data.data;
  },
};
