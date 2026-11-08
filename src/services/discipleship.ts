import apiClient from "@/lib/api-client";

export interface DiscipleshipRequirement {
  id: string;
  name: string;
  description?: string | null;
  type: "checklist" | "approval" | "course" | "milestone" | "assessment";
  courseId?: string | null;
  classId?: string | null;
  course?: { id: string; title: string; status: string } | null;
  class?: { id: string; title: string; startsAt: string; status: string } | null;
  isRequired: boolean;
  position: number;
  status?: "pending" | "completed" | "waived";
  completedAt?: string | null;
  completionNote?: string | null;
}

export interface DiscipleshipStage {
  id: string;
  name: string;
  description?: string | null;
  position: number;
  status?: "not_started" | "active" | "blocked" | "completed" | "skipped";
  requirements: DiscipleshipRequirement[];
}

export interface DiscipleshipWorkflow {
  id: string;
  churchId: string;
  name: string;
  description?: string | null;
  status: "draft" | "published" | "archived";
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
  candidateUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    membershipType?: string;
  };
  church: { id: string; name: string };
  workflow: { id: string; name: string; version: number };
  stages: Array<{ id: string; name: string; position: number }>;
}

export interface JourneyDetail extends JourneyListItem {
  candidate: {
    preferredLanguage?: string | null;
    referralSource?: string | null;
  };
  currentStageId?: string | null;
  currentStage?: DiscipleshipStage | null;
  stages: DiscipleshipStage[];
  blockingRequirements: DiscipleshipRequirement[];
  availableActions: {
    canCompleteRequirement: boolean;
    canAdvance: boolean;
    canCompleteJourney: boolean;
  };
  auditEvents: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    actor: { firstName: string; lastName: string };
  }>;
  mentorAssignment?: any;
  placement?: any;
  enrollments?: any[];
  assessments?: any[];
}

export interface DiscipleshipCourse {
  id: string;
  churchId: string;
  title: string;
  description?: string;
  status: string;
  materials: Array<{ id: string; title: string; kind: string; url?: string }>;
  classes: any[];
  assessments: any[];
}

export const discipleshipService = {
  listWorkflows: async (params?: {
    churchId?: string;
    includeDrafts?: boolean;
  }): Promise<DiscipleshipWorkflow[]> => {
    const { data } = await apiClient.get("/discipleship/workflows", { params });
    return data.data;
  },
  createWorkflow: async (payload: {
    churchId?: string;
    churchIds?: string[];
    name: string;
    description?: string;
    isDefault?: boolean;
    publish?: boolean;
    stages: Array<{
      name: string;
      description?: string;
      requirements: Array<{
        name: string;
        description?: string;
        type: DiscipleshipRequirement["type"];
        courseId?: string;
        classId?: string;
        isRequired: boolean;
      }>;
    }>;
  }): Promise<DiscipleshipWorkflow> => {
    const { data } = await apiClient.post("/discipleship/workflows", payload);
    return data.data;
  },
  updateWorkflow: async (
    id: string,
    payload: any,
  ): Promise<DiscipleshipWorkflow> => {
    const { data } = await apiClient.put(
      `/discipleship/workflows/${id}`,
      payload,
    );
    return data.data;
  },
  listCourses: async (includeDrafts = true): Promise<DiscipleshipCourse[]> => {
    const { data } = await apiClient.get("/discipleship/courses", {
      params: { includeDrafts },
    });
    return data.data;
  },
  createCourse: async (payload: any): Promise<DiscipleshipCourse> => {
    const { data } = await apiClient.post("/discipleship/courses", payload);
    return data.data;
  },
  createClass: async (courseId: string, payload: any) => {
    const { data } = await apiClient.post(
      `/discipleship/courses/${courseId}/classes`,
      payload,
    );
    return data.data;
  },
  assignMentor: async (
    journeyId: string,
    payload: { mentorUserId: string; nextFollowUpAt?: string },
  ) => {
    const { data } = await apiClient.post(
      `/discipleship/journeys/${journeyId}/mentor`,
      payload,
    );
    return data.data;
  },
  addMentorFollowUp: async (journeyId: string, payload: any) => {
    const { data } = await apiClient.post(
      `/discipleship/journeys/${journeyId}/mentor/follow-ups`,
      payload,
    );
    return data.data;
  },
  savePlacement: async (
    journeyId: string,
    payload: { teamId?: string; cellId?: string },
  ) => {
    const { data } = await apiClient.put(
      `/discipleship/journeys/${journeyId}/placement`,
      payload,
    );
    return data.data;
  },
  getReport: async (params?: {
    churchId?: string;
    from?: string;
    to?: string;
  }) => {
    const { data } = await apiClient.get("/discipleship/reports/summary", {
      params,
    });
    return data.data;
  },
  listJourneys: async (params?: {
    search?: string;
    status?: string;
    churchId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: JourneyListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    summary: { total: number; active: number; paused: number; completed: number; withdrawn: number; averageActiveProgress: number };
  }> => {
    const { data } = await apiClient.get("/discipleship/journeys", { params });
    return data;
  },
  createJourney: async (payload: {
    churchId: string;
    workflowId: string;
    consentStatus: "yes";
    sourceType: "direct";
    candidate: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      preferredLanguage?: string;
      referralSource?: string;
    };
    notes?: string;
  }): Promise<{ id: string }> => {
    const { data } = await apiClient.post("/discipleship/journeys", payload);
    return data.data;
  },
  getJourney: async (id: string): Promise<JourneyDetail> => {
    const { data } = await apiClient.get(`/discipleship/journeys/${id}`);
    return data.data;
  },
  completeRequirement: async (
    journeyId: string,
    requirementId: string,
    version: number,
    details?: Record<string, unknown>,
  ) => {
    const { data } = await apiClient.post(
      `/discipleship/journeys/${journeyId}/requirements/${requirementId}/complete`,
      { version, ...details },
    );
    return data.data;
  },
  advance: async (journeyId: string, version: number) => {
    const { data } = await apiClient.post(
      `/discipleship/journeys/${journeyId}/advance`,
      { version },
    );
    return data.data;
  },
};
