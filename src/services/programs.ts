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
}

export interface Program {
  id: string;
  title: string;
  description?: string | null;
  items: ProgramItem[];
}

export const programsService = {
  get: async (target: ProgramTarget, id: string): Promise<Program | null> =>
    (await apiClient.get(`/${target}/${id}/program`)).data.data,
  save: async (
    target: ProgramTarget,
    id: string,
    input: Pick<Program, 'title' | 'description' | 'items'>,
  ): Promise<Program> =>
    (await apiClient.put(`/${target}/${id}/program`, input)).data.data,
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
