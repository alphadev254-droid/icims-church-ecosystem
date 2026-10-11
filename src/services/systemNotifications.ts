import apiClient from '@/lib/api-client';

export type CampaignChannels = { inApp: true; email: boolean; push: boolean };
export type CampaignFilters = { ministryIds?: string[]; country?: string; status?: string };

export interface SystemCampaign {
  id: string;
  title: string;
  summary?: string | null;
  message: string;
  category: string;
  priority: string;
  visibilityPolicy: string;
  audienceType: 'all_ministries' | 'selected_ministries' | 'filtered';
  audienceFilters: CampaignFilters;
  channels: CampaignChannels;
  actionLabel?: string | null;
  actionUrl?: string | null;
  status: string;
  sentAt?: string | null;
  createdAt: string;
  _count?: { recipients: number };
  createdBy?: { firstName: string; lastName: string };
  recipients?: SystemNotification[];
}

export interface SystemNotification {
  id: string;
  readAt?: string | null;
  acknowledgedAt?: string | null;
  createdAt: string;
  recipientName?: string;
  recipientEmail?: string;
  emailStatus?: string;
  campaign: Pick<SystemCampaign, 'id' | 'title' | 'summary' | 'message' | 'category' | 'priority' | 'visibilityPolicy' | 'actionLabel' | 'actionUrl' | 'sentAt' | 'createdAt'>;
}

export const systemCampaignApi = {
  list: () => apiClient.get<{ success: boolean; data: SystemCampaign[] }>('/admin/campaigns'),
  get: (id: string) => apiClient.get<{ success: boolean; data: SystemCampaign }>(`/admin/campaigns/${id}`),
  preview: (data: { audienceType: SystemCampaign['audienceType']; audienceFilters: CampaignFilters }) =>
    apiClient.post<{ success: boolean; data: { count: number; sample: Array<{ id: string; name: string; email: string; ministryName?: string; country?: string }> } }>('/admin/campaigns/audience-preview', data),
  create: (data: Omit<SystemCampaign, 'id' | 'status' | 'sentAt' | 'createdAt' | '_count' | 'createdBy' | 'recipients'>) =>
    apiClient.post<{ success: boolean; data: SystemCampaign }>('/admin/campaigns', data),
  update: (id: string, data: Omit<SystemCampaign, 'id' | 'status' | 'sentAt' | 'createdAt' | '_count' | 'createdBy' | 'recipients'>) =>
    apiClient.put<{ success: boolean; data: SystemCampaign }>(`/admin/campaigns/${id}`, data),
  send: (id: string) => apiClient.post<{ success: boolean; data: SystemCampaign; message: string }>(`/admin/campaigns/${id}/send`),
  remove: (id: string) => apiClient.delete(`/admin/campaigns/${id}`),
};

export const systemNotificationApi = {
  list: (params?: { page?: number; limit?: number; unread?: boolean }) => apiClient.get<{ success: boolean; data: SystemNotification[]; pagination: { page: number; total: number; totalPages: number } }>('/system-notifications', { params }),
  unreadCount: () => apiClient.get<{ success: boolean; data: { unread: number; urgent: number } }>('/system-notifications/unread-count'),
  markRead: (id: string) => apiClient.post(`/system-notifications/${id}/read`),
  markAllRead: () => apiClient.post('/system-notifications/read-all'),
};
