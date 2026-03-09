import apiClient from '@/lib/api-client';

export interface TeamCommunication {
  id: string;
  title: string;
  content: string;
  teamId: string;
  authorId: string;
  mediaUrls?: { url: string; type: string; name: string; size: number }[];
  createdAt: string;
  updatedAt: string;
  canEdit?: boolean;
  team: {
    id: string;
    name: string;
    color?: string;
  };
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface CreateTeamCommunicationData {
  title: string;
  content: string;
  teamId: string;
  mediaUrls?: { url: string; type: string; name: string; size: number }[];
}

export const teamCommunicationService = {
  getAll: async (teamId?: string): Promise<TeamCommunication[]> => {
    const params = teamId ? { teamId } : {};
    const { data } = await apiClient.get('/team-communications', { params });
    return data;
  },

  getPostableTeams: async (): Promise<{ id: string; name: string; color?: string; church: { id: string; name: string } }[]> => {
    const { data } = await apiClient.get('/team-communications/postable-teams');
    return data;
  },

  create: async (communicationData: CreateTeamCommunicationData & { files?: File[] }): Promise<TeamCommunication> => {
    const formData = new FormData();
    formData.append('title', communicationData.title);
    formData.append('content', communicationData.content);
    formData.append('teamId', communicationData.teamId);
    
    // Append files if any
    if (communicationData.files) {
      communicationData.files.forEach(file => {
        formData.append('files', file);
      });
    }

    const { data } = await apiClient.post('/team-communications', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  update: async (id: string, communicationData: Partial<CreateTeamCommunicationData> & { files?: File[]; existingMedia?: any[] }): Promise<TeamCommunication> => {
    const formData = new FormData();
    
    if (communicationData.title) formData.append('title', communicationData.title);
    if (communicationData.content) formData.append('content', communicationData.content);
    
    // Append existing media as JSON
    if (communicationData.existingMedia) {
      formData.append('existingMediaUrls', JSON.stringify(communicationData.existingMedia));
    }
    
    // Append new files if any
    if (communicationData.files && communicationData.files.length > 0) {
      communicationData.files.forEach(file => {
        formData.append('files', file);
      });
    }

    const { data } = await apiClient.put(`/team-communications/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/team-communications/${id}`);
  }
};
