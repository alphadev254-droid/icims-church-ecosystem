import apiClient from '@/lib/api-client';

export type ProgramTarget = 'services' | 'events';

export interface ProgramPerson {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
}

export interface ProgramItem {
  id?: string;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  userId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  user?: ProgramPerson | null;
  emailStatus?: 'no_email' | 'not_sent' | 'queued' | 'sent' | 'failed' | 'changed';
  lastEmailAt?: string | null;
}

export interface ProgramNotification {
  id: string;
  itemId: string;
  kind: 'assignment' | 'removal';
  recipient: string;
  name: string;
  itemTitle: string;
  status: 'queued' | 'sent' | 'failed';
  error?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

export interface Program {
  id: string;
  title: string;
  description?: string | null;
  items: ProgramItem[];
  notifications: ProgramNotification[];
}

export const programsService = {
  get: async (target: ProgramTarget, id: string): Promise<Program | null> =>
    (await apiClient.get(`/${target}/${id}/program`)).data.data,
  save: async (
    target: ProgramTarget,
    id: string,
    input: Pick<Program, 'title' | 'description' | 'items'> & { notifyPrevious?: boolean },
  ): Promise<{ program: Program; notificationWarnings: number }> => {
    const response = (await apiClient.put(`/${target}/${id}/program`, input)).data;
    return { program: response.data, notificationWarnings: response.notificationWarnings || 0 };
  },
  sendAssignment: async (target: ProgramTarget, id: string, itemId: string): Promise<void> => {
    await apiClient.post(`/${target}/${id}/program/items/${itemId}/email`);
  },
  remove: async (target: ProgramTarget, id: string): Promise<void> => {
    await apiClient.delete(`/${target}/${id}/program`);
  },
  searchPeople: async (
    target: ProgramTarget,
    id: string,
    q: string,
  ): Promise<ProgramPerson[]> =>
    (await apiClient.get(`/${target}/${id}/program/people`, { params: { q } }))
      .data.data,
};
