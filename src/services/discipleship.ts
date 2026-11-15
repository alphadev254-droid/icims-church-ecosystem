import apiClient from "@/lib/api-client";

export interface DiscipleshipRequirement {
  id: string;
  name: string;
  description?: string | null;
  type: "checklist" | "approval" | "course" | "milestone" | "assessment";
  definitionId?: string | null;
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
  mentorAssignment?: DiscipleshipMentorAssignment | null;
  placement?: DiscipleshipPlacement | null;
  enrollments?: DiscipleshipClassEnrollment[];
  assessments?: Array<{ id: string; score: number; passed: boolean; gradedAt: string; assessment: { id: string; title: string } }>;
}

export interface DiscipleshipMentorAssignment {
  id: string;
  mentorUserId: string;
  status: string;
  assignedAt: string;
  nextFollowUpAt?: string | null;
  interactions?: Array<{ id: string; occurredAt: string; notes: string; concernFlag: boolean }>;
}

export interface DiscipleshipPlacement { id: string; teamId?: string | null; cellId?: string | null; status: string; placedAt?: string | null }
export interface DiscipleshipClassSession { id: string; title: string; startsAt: string; endsAt?: string | null; location?: string | null; checkInCode: string; status: string }
export interface DiscipleshipSessionAttendance { id: string; sessionId: string; enrollmentId: string; status: string; method: string; checkedInAt?: string | null }
export interface DiscipleshipClassEnrollment {
  id: string;
  journeyId: string;
  status: string;
  attendance: DiscipleshipSessionAttendance[];
  class?: DiscipleshipClass;
  journey?: { journeyCode: string; candidateUser: { firstName: string; lastName: string; email: string } };
}
export interface DiscipleshipClass {
  id: string;
  courseId: string;
  churchId?: string;
  title: string;
  startsAt: string;
  endsAt?: string | null;
  capacity?: number | null;
  status: string;
  reminderMinutes?: number;
  location?: string | null;
  course: { id: string; title: string };
  sessions?: DiscipleshipClassSession[];
  enrollments?: DiscipleshipClassEnrollment[];
  _count: { enrollments: number };
}

export interface DiscipleshipClassRoster extends DiscipleshipClass {
  sessions: DiscipleshipClassSession[];
  enrollments: DiscipleshipClassEnrollment[];
}

export interface DiscipleshipReport {
  totals: Record<string, number> & { intake: number; active: number; completed: number; withdrawn: number; completionRate: number; dropoutRate: number; averageCompletionDays: number; attendanceRate: number; unassignedMentors: number; overdueFollowUps: number; upcomingSessions: number; pendingPlacements: number };
  intakeTrend: Array<{ period: string; count: number }>;
  candidatesByStage: Array<{ stage: string; count: number }>;
  dropoutsByStage: Array<{ stage: string; count: number }>;
}

export interface DiscipleshipCourse {
  id: string;
  churchId: string;
  churchIds: string[];
  title: string;
  description?: string;
  status: string;
  materials: Array<{ id: string; title: string; kind: string; url?: string }>;
  classes: DiscipleshipClass[];
  assessments: Array<{ id: string; title: string; passScore: number; maxScore: number }>;
  personsInCharge?: Array<{ churchId: string; userId: string }>;
}

export interface DiscipleshipRequirementDefinition {
  id: string;
  churchIds: string[];
  type: "checklist" | "approval" | "milestone" | "assessment";
  title: string;
  description?: string | null;
  status: "draft" | "published" | "archived";
  passScore?: number | null;
  maxScore?: number | null;
  personsInCharge?: Array<{ churchId: string; userId: string }>;
}

export interface DiscipleshipIntakeCandidate {
  id: string;
  churchId: string;
  sourceType: "attendance" | "evangelism";
  sourceRecordId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status: "pending" | "contacted" | "consented" | "declined" | "converted";
  promptedAt: string;
  respondedAt?: string | null;
  assignedToId?: string | null;
  notes?: string | null;
}

export interface JourneyOperationsOptions {
  mentors: Array<{ id: string; firstName: string; lastName: string; email: string; role?: { name: string; displayName?: string | null } | null }>;
  teams: Array<{ id: string; name: string }>;
  cells: Array<{ id: string; name: string }>;
  classes: Array<{ id: string; courseId: string; title: string; startsAt: string; endsAt?: string | null; capacity?: number | null; status: string; course: { id: string; title: string }; _count: { enrollments: number } }>;
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
    payload: Record<string, unknown>,
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
  createCourse: async (payload: Record<string, unknown>): Promise<DiscipleshipCourse> => {
    const { data } = await apiClient.post("/discipleship/courses", payload);
    return data.data;
  },
  createClass: async (courseId: string, payload: Record<string, unknown>) => {
    const { data } = await apiClient.post(
      `/discipleship/courses/${courseId}/classes`,
      payload,
    );
    return data.data;
  },
  listRequirementDefinitions: async (includeDrafts = true): Promise<DiscipleshipRequirementDefinition[]> => {
    const { data } = await apiClient.get("/discipleship/requirement-definitions", { params: { includeDrafts } });
    return data.data;
  },
  createRequirementDefinition: async (payload: Record<string, unknown>): Promise<DiscipleshipRequirementDefinition> => {
    const { data } = await apiClient.post("/discipleship/requirement-definitions", payload);
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
  addMentorFollowUp: async (journeyId: string, payload: { notes: string; concernFlag?: boolean; nextFollowUpAt?: string }) => {
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
  getJourneyOperationsOptions: async (journeyId: string): Promise<JourneyOperationsOptions> => {
    const { data } = await apiClient.get(`/discipleship/journeys/${journeyId}/operations-options`);
    return data.data;
  },
  enrollCandidate: async (classId: string, payload: { journeyId: string; requirementId?: string }) => {
    const { data } = await apiClient.post(`/discipleship/classes/${classId}/enrollments`, payload);
    return data.data;
  },
  getClassRoster: async (classId: string): Promise<DiscipleshipClassRoster> => {
    const { data } = await apiClient.get(`/discipleship/classes/${classId}/roster`);
    return data.data;
  },
  recordSessionAttendance: async (sessionId: string, payload: { enrollmentId: string; status: "present" | "late" | "absent" | "excused"; method?: "manual" | "qr" | "sms_code" }) => {
    const { data } = await apiClient.post(`/discipleship/sessions/${sessionId}/attendance`, payload);
    return data;
  },
  checkInByCode: async (journeyId: string, code: string): Promise<{ courseCompleted: boolean }> => {
    const { data } = await apiClient.post("/discipleship/attendance/check-in", { journeyId, code });
    return data;
  },
  updateClassSessionStatus: async (sessionId: string, status: "scheduled" | "open" | "completed" | "cancelled") => {
    const { data } = await apiClient.patch(`/discipleship/sessions/${sessionId}/status`, { status });
    return data.data;
  },
  getReport: async (params?: {
    churchId?: string;
    from?: string;
    to?: string;
  }): Promise<DiscipleshipReport> => {
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
    sourceType: "direct" | "attendance" | "evangelism" | "transfer";
    sourceRecordId?: string;
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
  updateJourneyStatus: async (journeyId: string, payload: { status: "active" | "paused" | "withdrawn"; reason: string; version: number }) => {
    const { data } = await apiClient.patch(`/discipleship/journeys/${journeyId}/status`, payload);
    return data.data;
  },
  listIntakeCandidates: async (status?: string): Promise<DiscipleshipIntakeCandidate[]> => {
    const { data } = await apiClient.get("/discipleship/intake/prompts", { params: status && status !== "all" ? { status } : undefined });
    return data.data;
  },
  syncFirstTimers: async (): Promise<{ scanned: number; created: number }> => {
    const { data } = await apiClient.post("/discipleship/intake/sync-attendance");
    return data.data;
  },
  updateIntakeCandidate: async (id: string, payload: { status: DiscipleshipIntakeCandidate["status"]; notes?: string; assignedToId?: string }) => {
    const { data } = await apiClient.patch(`/discipleship/intake/prompts/${id}`, payload);
    return data.data as DiscipleshipIntakeCandidate;
  },
};
