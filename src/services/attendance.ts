import apiClient from '@/lib/api-client';

export interface AttendanceRecord {
  id: string;
  eventId?: string | null;
  churchId: string;
  date: string;
  totalAttendees: number;
  newVisitors: number;
  serviceType: string;
  notes?: string | null;
  createdAt: string;
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
  getAll: async (params?: { serviceType?: string }): Promise<AttendanceRecord[]> => {
    const { data } = await apiClient.get('/attendance', { params });
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
