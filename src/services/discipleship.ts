import apiClient from '@/lib/api-client';

export interface DiscipleshipRequirement {
  id: string;
  name: string;
  description?: string | null;
  type: 'checklist' | 'approval' | 'course' | 'milestone' | 'assessment';
  isRequired: boolean;
  position: number;
  status?: 'pending' | 'completed' | 'waived';
  completedAt?: string | null;
  completionNote?: string | null;
}

export interface DiscipleshipStage {
  id: string;
  name: string;
  description?: string | null;
  position: number;
  status?: 'not_started' | 'active' | 'blocked' | 'completed' | 'skipped';
  requirements: DiscipleshipRequirement[];
}

export interface DiscipleshipWorkflow {
  id: string;
  churchId: string;
  name: string;
  description?: string | null;
  status: 'draft' | 'published' | 'archived';
  version: number;
  isDefault: boolean;
  church?: { id: string; name: string };
  stages: DiscipleshipStage[];
}

export interface JourneyListItem {
  id: string;
  journeyCode: string;
  status: string;
  progressPercent: number;
  version: number;
  startedAt: string;
  updatedAt: string;
  candidateUser: { id: string; firstName: string; lastName: string; email: string; phone?: string | null; membershipType?: string };
  church: { id: string; name: string };
  workflow: { id: string; name: string; version: number };
  stages: Array<{ id: string; name: string; position: number }>;
}

export interface JourneyDetail extends JourneyListItem {
  candidate: { preferredLanguage?: string | null; referralSource?: string | null };
  currentStageId?: string | null;
  currentStage?: DiscipleshipStage | null;
  stages: DiscipleshipStage[];
  blockingRequirements: DiscipleshipRequirement[];
  availableActions: { canCompleteRequirement: boolean; canAdvance: boolean; canCompleteJourney: boolean };
  auditEvents: Array<{ id: string; action: string; entityType: string; createdAt: string; actor: { firstName: string; lastName: string } }>;
}

export const discipleshipService = {
  listWorkflows: async (params?: { churchId?: string; includeDrafts?: boolean }): Promise<DiscipleshipWorkflow[]> => {
    const { data } = await apiClient.get('/discipleship/workflows', { params });
    return data.data;
  },
  createWorkflow: async (payload: {
    churchId: string; name: string; description?: string; isDefault?: boolean; publish?: boolean;
    stages: Array<{ name: string; description?: string; requirements: Array<{ name: string; description?: string; type: DiscipleshipRequirement['type']; isRequired: boolean }> }>;
  }): Promise<DiscipleshipWorkflow> => {
    const { data } = await apiClient.post('/discipleship/workflows', payload);
    return data.data;
  },
  listJourneys: async (params?: { search?: string; status?: string; churchId?: string; page?: number; limit?: number }): Promise<{ data: JourneyListItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const { data } = await apiClient.get('/discipleship/journeys', { params });
    return data;
  },
  createJourney: async (payload: {
    churchId: string; workflowId: string; consentStatus: 'yes'; sourceType: 'direct';
    candidate: { firstName: string; lastName: string; email: string; phone?: string; preferredLanguage?: string; referralSource?: string };
    notes?: string;
  }): Promise<{ id: string }> => {
    const { data } = await apiClient.post('/discipleship/journeys', payload);
    return data.data;
  },
  getJourney: async (id: string): Promise<JourneyDetail> => {
    const { data } = await apiClient.get(`/discipleship/journeys/${id}`);
    return data.data;
  },
  completeRequirement: async (journeyId: string, requirementId: string, version: number, note?: string) => {
    const { data } = await apiClient.post(`/discipleship/journeys/${journeyId}/requirements/${requirementId}/complete`, { version, note });
    return data.data;
  },
  advance: async (journeyId: string, version: number) => {
    const { data } = await apiClient.post(`/discipleship/journeys/${journeyId}/advance`, { version });
    return data.data;
  },
};
