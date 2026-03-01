import apiClient from '@/lib/api-client';

export interface ChurchEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'service' | 'meeting' | 'conference' | 'outreach' | 'fellowship';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  attendeeCount: number;
  churchId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  type: ChurchEvent['type'];
  status?: ChurchEvent['status'];
  attendeeCount?: number;
  churchId: string;
}

export type UpdateEventDto = Partial<CreateEventDto>;

export const eventsService = {
  getAll: async (): Promise<ChurchEvent[]> => {
    const { data } = await apiClient.get('/events');
    return data.data;
  },
  getOne: async (id: string): Promise<ChurchEvent> => {
    const { data } = await apiClient.get(`/events/${id}`);
    return data.data;
  },
  create: async (dto: CreateEventDto): Promise<ChurchEvent> => {
    const { data } = await apiClient.post('/events', dto);
    return data.data;
  },
  update: async (id: string, dto: UpdateEventDto): Promise<ChurchEvent> => {
    const { data } = await apiClient.put(`/events/${id}`, dto);
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/events/${id}`);
  },
};
