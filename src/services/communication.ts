import apiClient from '@/lib/api-client';

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
};
