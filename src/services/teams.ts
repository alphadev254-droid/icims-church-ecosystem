import apiClient from '@/lib/api-client';

export interface Team {
  id: string;
  name: string;
  description?: string;
  churchId: string;
  color?: string;
  church: { id: string; name: string };
  memberCount: number;
  leaders: { id: string; firstName: string; lastName: string; email: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  membershipType?: string;
  maritalStatus?: string;
  serviceInterest?: string;
  inTeam: boolean;
  isLeader: boolean;
}

export const teamsService = {
  getAll: async (churchId?: string): Promise<Team[]> => {
    const params = churchId ? { churchId } : {};
    const { data } = await apiClient.get('/teams', { params });
    return data;
  },

  create: async (team: { name: string; description?: string; churchId: string; color?: string }): Promise<Team> => {
    const { data } = await apiClient.post('/teams', team);
    return data;
  },

  update: async (id: string, team: { name?: string; description?: string; color?: string }): Promise<Team> => {
    const { data } = await apiClient.put(`/teams/${id}`, team);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/teams/${id}`);
  },

  getMembers: async (teamId: string, search?: string, limit = 100, offset = 0, minAge?: number, maxAge?: number): Promise<{ data: TeamMember[]; total: number; limit: number; offset: number }> => {
    const { data } = await apiClient.get(`/teams/${teamId}/members`, { params: { search, limit, offset, minAge, maxAge } });
    return data;
  },

  addMember: async (teamId: string, userId: string, isLeader = false): Promise<void> => {
    await apiClient.post(`/teams/${teamId}/members`, { userId, isLeader });
  },

  removeMember: async (teamId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/teams/${teamId}/members/${userId}`);
  },

  updateLeader: async (teamId: string, userId: string, isLeader: boolean): Promise<void> => {
    await apiClient.put(`/teams/${teamId}/members/${userId}/leader`, { isLeader });
  },
};
