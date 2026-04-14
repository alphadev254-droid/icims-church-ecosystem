import apiClient from '@/lib/api-client';

export interface ContentViewer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  avatar?: string | null;
  viewedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'prayer_request' | 'newsletter';
  priority: 'normal' | 'urgent';
  churchId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  church?: {
    id: string;
    name: string;
  };
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  type: Announcement['type'];
  priority?: Announcement['priority'];
  churchId: string;
}

export type UpdateAnnouncementDto = Partial<CreateAnnouncementDto>;

export const communicationService = {
  getAll: async (params?: { churchId?: string }): Promise<Announcement[]> => {
    const { data } = await apiClient.get('/announcements', { params });
    return data.data;
  },
  create: async (dto: CreateAnnouncementDto): Promise<Announcement> => {
    const { data } = await apiClient.post('/announcements', dto);
    return data.data;
  },
  update: async (id: string, dto: UpdateAnnouncementDto): Promise<Announcement> => {
    const { data } = await apiClient.put(`/announcements/${id}`, dto);
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/announcements/${id}`);
  },
  recordView: async (id: string): Promise<void> => {
    await apiClient.post(`/announcements/${id}/view`);
  },
  getViewStats: async (id: string): Promise<{ count: number }> => {
    const { data } = await apiClient.get(`/announcements/${id}/view-stats`);
    return data.data;
  },
  getViewers: async (id: string, search?: string): Promise<ContentViewer[]> => {
    const { data } = await apiClient.get(`/announcements/${id}/viewers`, { params: search ? { search } : undefined });
    return data.data;
  },
};
