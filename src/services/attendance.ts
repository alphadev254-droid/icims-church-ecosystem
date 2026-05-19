import apiClient from '@/lib/api-client';

export interface AttendanceVisitor {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  residentialArea?: string;
  gender?: string;
  ageBracket?: string;
  howHeard?: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  churchId: string;
  date: string;
  totalAttendees: number;
  maleCount?: number;
  femaleCount?: number;
  children?: number;
  youth?: number;
  youngAdults?: number;
  adults?: number;
  seniors?: number;
  newVisitors?: number;
  serviceType: string;
  notes?: string;
  eventId?: string;
  createdAt?: string;
  church?: { id: string; name: string };
  _count?: { visitors: number };
}

export interface CreateAttendanceDto {
  date: string;
  totalAttendees: number;
  newVisitors?: number;
  serviceType?: string;
  notes?: string;
  eventId?: string;
  churchId: string;
  visitors?: AttendanceVisitor[];
}

export const attendanceService = {
  getAll: async (params?: { serviceType?: string; churchId?: string; startDate?: string; endDate?: string; limit?: number; page?: number; export?: boolean }): Promise<AttendanceRecord[]> => {
    const { data } = await apiClient.get('/attendance', { params });
    // export=true returns { success, data: [] } without pagination wrapper
    return data.data;
  },
  create: async (dto: CreateAttendanceDto): Promise<AttendanceRecord> => {
    const { data } = await apiClient.post('/attendance', dto);
    return data.data;
  },
  update: async (id: string, dto: CreateAttendanceDto): Promise<AttendanceRecord> => {
    const { data } = await apiClient.put(`/attendance/${id}`, dto);
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/attendance/${id}`);
  },
  getVisitors: async (id: string, params?: { page?: number; limit?: number }): Promise<{ data: AttendanceVisitor[]; total: number; hasMore: boolean }> => {
    const { data } = await apiClient.get(`/attendance/${id}/visitors`, { params });
    return { data: data.data, total: data.total ?? data.data.length, hasMore: data.hasMore ?? false };
  },
  addVisitor: async (id: string, visitor: AttendanceVisitor): Promise<AttendanceVisitor> => {
    const { data } = await apiClient.post(`/attendance/${id}/visitors`, visitor);
    return data.data;
  },
  deleteVisitor: async (id: string, visitorId: string): Promise<void> => {
    await apiClient.delete(`/attendance/${id}/visitors/${visitorId}`);
  },
};
