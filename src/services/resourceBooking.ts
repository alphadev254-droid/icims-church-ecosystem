import apiClient from '@/lib/api-client';

export type BookableResource = {
  id: string; churchId: string; name: string; code?: string | null;
  category: string; description?: string | null; location?: string | null;
  images: string[];
  custodianName?: string | null; scope: 'own_church' | 'all_ministry';
  status: string; approvalRequired: boolean; bufferBeforeMinutes: number; bufferAfterMinutes: number;
};

export type ResourceBooking = {
  id: string; groupId: string; resourceId: string; churchId: string;
  activityType: string; activityId?: string | null; activityTitle: string;
  purpose?: string | null; startsAt: string; endsAt: string; status: string;
  decisionNote?: string | null; decidedAt?: string | null; createdAt: string;
  resource: Pick<BookableResource, 'id' | 'name' | 'category' | 'churchId' | 'location'>;
  requester: { id: string; firstName: string; lastName: string };
  decidedBy?: { id: string; firstName: string; lastName: string } | null;
};

export type ResourceInput = Omit<BookableResource, 'id' | 'images'>;
export type BookingInput = {
  churchId: string; resourceIds: string[]; activityType: 'manual' | 'service' | 'event';
  activityId?: string; activityTitle?: string; purpose?: string;
  startsAt?: string; endsAt?: string;
};
export type BookableActivityOption = { id: string; churchId: string; churchName: string; title: string; startsAt: string; endsAt?: string | null };

const root = '/resource-booking';
export const resourceBookingService = {
  resources: async (churchId?: string): Promise<BookableResource[]> =>
    (await apiClient.get(`${root}/resources`, { params: churchId ? { churchId } : undefined })).data.data,
  createResource: async (input: ResourceInput): Promise<BookableResource> =>
    (await apiClient.post(`${root}/resources`, input)).data.data,
  updateResource: async (id: string, input: Partial<ResourceInput>): Promise<BookableResource> =>
    (await apiClient.put(`${root}/resources/${id}`, input)).data.data,
  uploadResourceImage: async (id: string, file: File): Promise<BookableResource> => {
    const formData = new FormData();
    formData.append('image', file);
    return (await apiClient.post(`${root}/resources/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
  },
  removeResourceImage: async (id: string, url: string): Promise<BookableResource> =>
    (await apiClient.delete(`${root}/resources/${id}/images`, { data: { url } })).data.data,
  bookings: async (params?: Record<string, string | number>): Promise<{ data: ResourceBooking[]; pagination: { page: number; totalPages: number; total: number } }> =>
    (await apiClient.get(`${root}/bookings`, { params })).data,
  availability: async (input: { churchId: string; resourceIds: string[]; startsAt: string; endsAt: string }): Promise<Array<{ resourceId: string; available: boolean; conflict?: { activityTitle: string; startsAt: string; endsAt: string } }>> =>
    (await apiClient.post(`${root}/availability`, input)).data.data,
  activityWindow: async (input: { churchId: string; activityType: 'service' | 'event'; activityId: string }): Promise<{ activityTitle: string; startsAt: string; endsAt: string }> =>
    (await apiClient.get(`${root}/activity-window`, { params: input })).data.data,
  activities: async (churchId?: string): Promise<{ services: BookableActivityOption[]; events: BookableActivityOption[] }> =>
    (await apiClient.get(`${root}/activities`, { params: churchId ? { churchId } : undefined })).data.data,
  request: async (input: BookingInput): Promise<ResourceBooking[]> =>
    (await apiClient.post(`${root}/bookings`, input)).data.data,
  decide: async (id: string, decision: 'approved' | 'rejected', note?: string) =>
    (await apiClient.post(`${root}/bookings/${id}/decision`, { decision, note })).data.data,
  cancel: async (id: string, note?: string) => { await apiClient.post(`${root}/bookings/${id}/cancel`, { note }); },
  deleteResource: async (id: string): Promise<{ cancelled: number; keptForHistory: boolean }> =>
    (await apiClient.delete(`${root}/resources/${id}`)).data.data,
  block: async (id: string, input: { startsAt: string; endsAt: string; reason: string }) =>
    (await apiClient.post(`${root}/resources/${id}/block`, input)).data.data,
};
