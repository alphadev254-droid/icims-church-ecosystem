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
  digitalCheckInEnabled?: boolean;
  qrToken?: string | null;
  qrStatus?: 'draft' | 'active' | 'closed';
  qrActiveFrom?: string | null;
  qrActiveUntil?: string | null;
  qrRegeneratedAt?: string | null;
  church?: { id: string; name: string };
  _count?: { visitors: number; participants?: number };
}

export interface AttendanceParticipant {
  id: string;
  attendanceId: string;
  userId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  guestGender?: string | null;
  guestAgeBracket?: string | null;
  guestFirstTime?: boolean;
  invitedBy?: string | null;
  checkInMethod: string;
  status: string;
  checkedInAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    memberType?: string | null;
    gender?: string | null;
    dateOfBirth?: string | null;
    church?: { id: string; name: string } | null;
  } | null;
  ministryMember?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    memberType?: string | null;
    church?: { id: string; name: string } | null;
  } | null;
}

export interface AttendanceMemberSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  memberType?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  alreadyCheckedIn?: boolean;
}

export interface QrCheckInSession {
  id: string;
  date: string;
  serviceType: string;
  church: {
    id: string;
    name: string;
    ministryAdmin?: {
      subdomain?: string | null;
      churchProfile?: { logoUrl?: string | null; primaryColor?: string | null; tagline?: string | null } | null;
    } | null;
  };
  event?: { id: string; title: string; date: string; time?: string | null; location?: string | null } | null;
  qrStatus: 'draft' | 'active' | 'closed';
  qrActiveFrom?: string | null;
  qrActiveUntil?: string | null;
  isOpen: boolean;
  participantCount: number;
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
  getAll: async (params?: { serviceType?: string; churchId?: string; startDate?: string; endDate?: string; limit?: number; page?: number; export?: boolean }): Promise<AttendanceRecord[] | { data: AttendanceRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const { data } = await apiClient.get('/attendance', { params });
    // export=true now returns pagination wrapper; non-export returns data directly
    if (params?.export) return data;
    return data.data;
  },
  create: async (dto: CreateAttendanceDto): Promise<AttendanceRecord> => {
    const { data } = await apiClient.post('/attendance', dto);
    return data.data;
  },
  startQr: async (dto: { churchId: string; date: string; serviceType: string; eventId?: string; notes?: string; qrActiveFrom?: string | null; qrActiveUntil?: string | null }): Promise<AttendanceRecord> => {
    const { data } = await apiClient.post('/attendance/start-qr', dto);
    return data.data;
  },
  getById: async (id: string): Promise<AttendanceRecord> => {
    const { data } = await apiClient.get(`/attendance/${id}`);
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
  getParticipants: async (id: string, params?: { page?: number; limit?: number }): Promise<{ data: AttendanceParticipant[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const { data } = await apiClient.get(`/attendance/${id}/participants`, { params });
    return { data: data.data, pagination: data.pagination };
  },
  updateQrSettings: async (id: string, dto: { digitalCheckInEnabled?: boolean; qrStatus?: 'draft' | 'active' | 'closed'; qrActiveFrom?: string | null; qrActiveUntil?: string | null }): Promise<AttendanceRecord> => {
    const { data } = await apiClient.put(`/attendance/${id}/qr`, dto);
    return data.data;
  },
  activateQr: async (id: string): Promise<AttendanceRecord> => {
    const { data } = await apiClient.post(`/attendance/${id}/qr/activate`);
    return data.data;
  },
  closeQr: async (id: string): Promise<AttendanceRecord> => {
    const { data } = await apiClient.post(`/attendance/${id}/qr/close`);
    return data.data;
  },
  regenerateQr: async (id: string): Promise<AttendanceRecord> => {
    const { data } = await apiClient.post(`/attendance/${id}/qr/regenerate`);
    return data.data;
  },
  scanMemberQr: async (id: string, token: string): Promise<AttendanceParticipant> => {
    const { data } = await apiClient.post(`/attendance/${id}/scan-member`, { token });
    return data.data;
  },
  scanVisitor: async (id: string, dto: { guestName: string; guestEmail?: string; guestPhone?: string; guestGender?: string; guestAgeBracket?: string; guestFirstTime?: boolean; invitedBy?: string }): Promise<AttendanceParticipant> => {
    const { data } = await apiClient.post(`/attendance/${id}/scan-visitor`, dto);
    return data.data;
  },
  searchMembers: async (id: string, params: { q: string; page?: number; limit?: number }): Promise<{ data: AttendanceMemberSearchResult[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const { data } = await apiClient.get(`/attendance/${id}/member-search`, { params });
    return { data: data.data, pagination: data.pagination };
  },
  addManualMembers: async (id: string, userIds: string[]): Promise<{ data: AttendanceParticipant[]; created: number; skipped: number }> => {
    const { data } = await apiClient.post(`/attendance/${id}/manual-members`, { userIds });
    return { data: data.data, created: data.created ?? data.data.length, skipped: data.skipped ?? 0 };
  },
  addManualVisitor: async (id: string, dto: { guestName: string; guestEmail?: string; guestPhone?: string; guestGender?: string; guestAgeBracket?: string; guestFirstTime?: boolean; invitedBy?: string }): Promise<AttendanceParticipant> => {
    const { data } = await apiClient.post(`/attendance/${id}/manual-visitor`, dto);
    return data.data;
  },
  getQrCheckInSession: async (token: string): Promise<QrCheckInSession> => {
    const { data } = await apiClient.get(`/attendance/check-in/${token}`);
    return data.data;
  },
  checkInMemberByQr: async (token: string): Promise<AttendanceParticipant> => {
    const { data } = await apiClient.post(`/attendance/check-in/${token}/member`);
    return data.data;
  },
  checkInGuestByQr: async (token: string, dto: { guestName: string; guestEmail?: string; guestPhone?: string; guestGender?: string; guestAgeBracket?: string; guestFirstTime?: boolean; invitedBy?: string }): Promise<AttendanceParticipant> => {
    const { data } = await apiClient.post(`/attendance/check-in/${token}/guest`, dto);
    return data.data;
  },
  getServiceVisitors: async (params?: { churchId?: string; serviceType?: string; startDate?: string; endDate?: string; page?: number; limit?: number; export?: boolean }): Promise<any[] | { data: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const { data } = await apiClient.get('/attendance/visitors', { params });
    if (params?.export) return data;
    return data.data;
  },
};
