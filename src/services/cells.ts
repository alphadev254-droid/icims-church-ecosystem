import apiClient from '@/lib/api-client';

export interface Cell {
  id: string;
  churchId: string;
  name: string;
  zone?: string | null;
  meetingDay?: string | null;
  meetingTime?: string | null;
  status: string;
  createdAt: string;
  church?: { id: string; name: string };
  members?: CellMember[];
  _count?: { members: number; meetings: number };
  // injected for member view
  isLeader?: boolean;
  isAssistant?: boolean;
}

export interface CellMember {
  id: string;
  cellId: string;
  userId: string;
  joinedAt: string;
  status: string;
  tags?: string | null;
  isLeader: boolean;
  isAssistant: boolean;
  user?: { id: string; firstName: string; lastName: string; email?: string; phone?: string; avatar?: string | null };
}

export interface CellMeeting {
  id: string;
  cellId: string;
  date: string;
  topic?: string | null;
  notes?: string | null;
  presentCount?: number;
  visitorCount?: number;
}

export interface CellAttendanceRecord {
  id?: string;
  userId?: string | null;
  status: 'present' | 'absent' | 'excused';
  isVisitor?: boolean;
  visitorName?: string;
  visitorPhone?: string;
  visitorEmail?: string;
  isFirstTime?: boolean;
  invitedByUserId?: string;
  notes?: string;
  user?: { id: string; firstName: string; lastName: string } | null;
}

export interface CellStats {
  totalMembers: number;
  totalMeetings: number;
  attendanceRate: number;
  totalVisitors: number;
}

const BASE = '/cells';

export const cellsService = {
  getAll: async (params?: { churchId?: string; search?: string; status?: string; page?: number; limit?: number }): Promise<{ data: Cell[]; pagination?: { total: number; page: number; limit: number; pages: number } }> => {
    const { data } = await apiClient.get(BASE, { params });
    // Members get plain array, admins get { data, pagination }
    if (Array.isArray(data.data)) return { data: data.data };
    return data;
  },

  getOverviewStats: async (): Promise<any> => {
    const { data } = await apiClient.get(`${BASE}/overview-stats`);
    return data.data;
  },

  getSimple: async (): Promise<{ id: string; name: string; zone?: string | null }[]> => {
    const { data } = await apiClient.get(`${BASE}/simple`);
    return data.data;
  },

  getOne: async (id: string): Promise<Cell> => {
    const { data } = await apiClient.get(`${BASE}/${id}`);
    return data.data;
  },

  create: async (dto: { churchId: string; name: string; zone?: string; meetingDay?: string; meetingTime?: string }): Promise<Cell> => {
    const { data } = await apiClient.post(BASE, dto);
    return data.data;
  },

  update: async (id: string, dto: Partial<{ name: string; zone: string; meetingDay: string; meetingTime: string; status: string }>): Promise<Cell> => {
    const { data } = await apiClient.put(`${BASE}/${id}`, dto);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },

  getStats: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`${BASE}/${id}/stats`);
    return data.data;
  },

  getFinanceStats: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`${BASE}/${id}/finance-stats`);
    return data.data;
  },

  getDonations: async (id: string, params?: { search?: string; status?: string; paymentMethod?: string; page?: number; limit?: number }): Promise<{
    data: any[];
    pagination: { total: number; page: number; limit: number; pages: number };
    summary: { currency: string; total: number; count: number }[];
  }> => {
    const { data } = await apiClient.get(`${BASE}/${id}/donations`, { params });
    return data;
  },

  // Members (paginated)
  getMembers: async (id: string, params?: { search?: string; status?: string; role?: string; joinedFrom?: string; joinedTo?: string; page?: number; limit?: number }): Promise<{
    data: CellMember[];
    pagination: { total: number; page: number; limit: number; pages: number };
  }> => {
    const { data } = await apiClient.get(`${BASE}/${id}/members`, { params });
    return data;
  },

  getChurchMembers: async (cellId: string, params?: { search?: string; page?: number; limit?: number }): Promise<{
    data: { id: string; firstName: string; lastName: string; email: string; phone?: string | null }[];
    pagination: { total: number; page: number; limit: number; pages: number };
  }> => {
    const { data } = await apiClient.get(`${BASE}/${cellId}/church-members`, { params });
    return data;
  },

  addMember: async (cellId: string, dto: { userId: string; isLeader?: boolean; isAssistant?: boolean; status?: string; tags?: string[] }): Promise<CellMember> => {
    const { data } = await apiClient.post(`${BASE}/${cellId}/members`, dto);
    return data.data;
  },

  updateMember: async (cellId: string, memberId: string, dto: Partial<{ isLeader: boolean; isAssistant: boolean; status: string; tags: string[] }>): Promise<CellMember> => {
    const { data } = await apiClient.put(`${BASE}/${cellId}/members/${memberId}`, dto);
    return data.data;
  },

  removeMember: async (cellId: string, memberId: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${cellId}/members/${memberId}`);
  },

  // Meetings
  getMeetings: async (cellId: string, params?: { dateFrom?: string; dateTo?: string; page?: number; limit?: number }): Promise<{
    data: CellMeeting[];
    pagination: { total: number; page: number; limit: number; pages: number };
  }> => {
    const { data } = await apiClient.get(`${BASE}/${cellId}/meetings`, { params });
    return data;
  },

  createMeeting: async (cellId: string, dto: { date: string; topic?: string; notes?: string }): Promise<CellMeeting> => {
    const { data } = await apiClient.post(`${BASE}/${cellId}/meetings`, dto);
    return data.data;
  },

  // Attendance
  getAttendance: async (meetingId: string): Promise<CellAttendanceRecord[]> => {
    const { data } = await apiClient.get(`${BASE}/meetings/${meetingId}/attendance`);
    return data.data;
  },

  submitAttendance: async (meetingId: string, records: CellAttendanceRecord[]): Promise<void> => {
    await apiClient.post(`${BASE}/meetings/${meetingId}/attendance`, { records });
  },
};
