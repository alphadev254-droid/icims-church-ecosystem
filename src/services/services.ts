import apiClient from '@/lib/api-client';

export interface ChurchService {
  id: string;
  churchId: string;
  title: string;
  type?: string | null;
  startsAt: string;
  endsAt?: string | null;
  location?: string | null;
  description?: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  church?: { id: string; name: string };
  linkedChurches?: Array<{ churchId: string; church?: { id: string; name: string } | null }>;
  attendance?: { id: string } | null;
  program?: { id: string } | null;
}

export type ServiceInput = Pick<
  ChurchService,
  'churchId' | 'title' | 'startsAt' | 'status'
> &
  Partial<Pick<ChurchService, 'type' | 'endsAt' | 'location' | 'description'>> & {
    churchIds?: string[];
  };

export const servicesService = {
  list: async (churchId?: string): Promise<ChurchService[]> =>
    (
      await apiClient.get('/services', {
        params: churchId ? { churchId } : undefined,
      })
    ).data.data,
  listPage: async (params: { churchId?: string; startDate?: string; endDate?: string; search?: string; page: number }): Promise<{ items: ChurchService[]; total: number; hasMore: boolean }> => {
    const response = (await apiClient.get('/services', { params })).data;
    return { items: response.data, total: response.total, hasMore: response.hasMore };
  },
  create: async (input: ServiceInput): Promise<ChurchService> =>
    (await apiClient.post('/services', input)).data.data,
  update: async (id: string, input: ServiceInput): Promise<ChurchService> =>
    (await apiClient.put(`/services/${id}`, input)).data.data,
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/services/${id}`);
  },
};
