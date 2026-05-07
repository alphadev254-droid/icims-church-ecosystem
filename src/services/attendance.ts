import apiClient from '@/lib/api-client';

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
}

export interface CreateAttendanceDto {
  date: string;
  totalAttendees: number;
  newVisitors?: number;
  serviceType?: string;
  notes?: string;
  eventId?: string;
  churchId: string;
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
};
