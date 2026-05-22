import apiClient from '@/lib/api-client';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface GenerateLinkDto {
  churchId: string;
  serviceType?: string;
  validFrom?: string;   // ISO string — defaults to now on backend
  expiresAt: string;    // ISO string — required
  usageLimit?: number;  // null/omitted = unlimited
  accessCode?: string;  // 4-digit access code (optional)
}

export interface SharedAccessLink {
  id: string;
  token: string;
  type: string;
  churchId: string;
  serviceType: string | null;
  validFrom: string;
  expiresAt: string;
  isActive: boolean;
  useCount: number;
  usageLimit: number | null;
  createdAt: string;
  url: string;
  church: { id: string; name: string };
  accessCode?: string | null;       // plain code returned on generation only
  hasAccessCode?: boolean;          // whether a code was set
}

export interface ValidateLinkResult {
  valid: boolean;
  type?: string;
  serviceType?: string | null;
  church?: { id: string; name: string };
  hasAccessCode?: boolean;
  message?: string;
}

export interface PublicAttendanceSubmission {
  date: string;
  maleCount?: number;
  femaleCount?: number;
  children?: number;
  youth?: number;
  youngAdults?: number;
  adults?: number;
  seniors?: number;
  newVisitors?: number;
  notes?: string;
  visitors?: Array<{
    name: string;
    phone?: string;
    email?: string;
    residentialArea?: string;
    gender?: string;
    ageBracket?: string;
    howHeard?: string;
    notes?: string;
  }>;
}

// ─── Service ───────────────────────────────────────────────────────────────

export const sharedAccessService = {
  /** Protected — Generate a new shared access link */
  generateLink: async (dto: GenerateLinkDto): Promise<SharedAccessLink> => {
    const { data } = await apiClient.post('/shared-access/generate', dto);
    return data.data;
  },

  /** Protected — List all links created by the current admin */
  getMyLinks: async (): Promise<SharedAccessLink[]> => {
    const { data } = await apiClient.get('/shared-access/my-links');
    return data.data;
  },

  /** Protected — Revoke a link (set isActive = false) */
  revokeLink: async (id: string): Promise<void> => {
    await apiClient.delete(`/shared-access/${id}/revoke`);
  },

  /** Protected — Permanently delete a link */
  deleteLink: async (id: string): Promise<void> => {
    await apiClient.delete(`/shared-access/${id}/delete`);
  },

  /** Protected — Activate a deactivated link */
  activateLink: async (id: string): Promise<void> => {
    await apiClient.patch(`/shared-access/${id}/activate`);
  },

  /** Public — Validate a token before showing the form */
  validateLink: async (token: string): Promise<ValidateLinkResult> => {
    const { data } = await apiClient.get(`/public/shared-access/validate/${token}`);
    if (data.valid && data.data) {
      return {
        valid: true,
        type: data.data.type,
        serviceType: data.data.serviceType,
        church: data.data.church,
        hasAccessCode: data.data.hasAccessCode,
      };
    }
    return { valid: false, message: data.message };
  },

  /** Public — Verify a 4-digit access code for a token */
  verifyCode: async (token: string, code: string): Promise<{ valid: boolean; message?: string }> => {
    const { data } = await apiClient.post(`/public/shared-access/${token}/verify-code`, { code });
    return data;
  },

  /** Public — Submit attendance via a valid token */
  submitAttendance: async (token: string, formData: PublicAttendanceSubmission): Promise<any> => {
    const { data } = await apiClient.post(`/public/shared-access/submit/${token}`, formData);
    return data;
  },

  /** Public — Get attendance records for a link token */
  getAttendanceByLink: async (token: string): Promise<any[]> => {
    const { data } = await apiClient.get(`/public/shared-access/${token}/attendance`);
    return data.data;
  },

  /** Public — Update an attendance record linked to a token */
  updateAttendance: async (token: string, id: string, formData: any): Promise<any> => {
    const { data } = await apiClient.put(`/public/shared-access/${token}/attendance/${id}`, formData);
    return data;
  },

  /** Public — Get visitors for an attendance record linked to a token */
  getVisitors: async (token: string, id: string, params?: { page?: number; limit?: number }): Promise<any> => {
    const { data } = await apiClient.get(`/public/shared-access/${token}/attendance/${id}/visitors`, { params });
    return data;
  },

  /** Public — Add a visitor to an attendance record linked to a token */
  addVisitor: async (token: string, id: string, visitor: any): Promise<any> => {
    const { data } = await apiClient.post(`/public/shared-access/${token}/attendance/${id}/visitors`, visitor);
    return data;
  },

  /** Public — Delete a visitor from an attendance record linked to a token */
  deleteVisitor: async (token: string, id: string, visitorId: string): Promise<any> => {
    const { data } = await apiClient.delete(`/public/shared-access/${token}/attendance/${id}/visitors/${visitorId}`);
    return data;
  },
};
