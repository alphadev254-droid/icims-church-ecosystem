import apiClient from '@/lib/api-client';

export type ReportType = 'membership' | 'giving' | 'giving_by_member' | 'pledges' | 'attendance' | 'cell_groups' | 'cell_visitors' | 'church_visitors' | 'transactions';
export type PeriodPreset = 'previous_week' | 'previous_month' | 'current_month_to_date' | 'last_30_days' | 'previous_quarter';

export interface ReportRecipients {
  includeMinistryAdmin: boolean;
  userIds: string[];
  emails: string[];
}

export interface ReportAutomationInput {
  reportType: ReportType;
  name: string;
  filters: Record<string, string | string[]>;
  periodPreset: PeriodPreset;
  frequency: 'weekly' | 'monthly';
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  timeOfDay: string;
  timezone: string;
  format: 'xlsx';
  recipients: ReportRecipients;
  isActive: boolean;
}

export interface ReportAutomation extends ReportAutomationInput {
  id: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  createdAt: string;
}

export interface ReportRecipientUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  church?: { id: string; name: string } | null;
}

export const reportAutomationService = {
  async context(): Promise<{ timezone: string }> {
    const { data } = await apiClient.get('/report-automations/context');
    return data.data;
  },
  async list(reportType?: ReportType): Promise<ReportAutomation[]> {
    const { data } = await apiClient.get('/report-automations', { params: reportType ? { reportType } : undefined });
    return data.data;
  },
  async recipients(search?: string): Promise<ReportRecipientUser[]> {
    const { data } = await apiClient.get('/report-automations/recipients', { params: search ? { search } : undefined });
    return data.data;
  },
  async create(input: ReportAutomationInput): Promise<ReportAutomation> {
    const { data } = await apiClient.post('/report-automations', input);
    return data.data;
  },
  async update(id: string, input: ReportAutomationInput): Promise<ReportAutomation> {
    const { data } = await apiClient.put(`/report-automations/${id}`, input);
    return data.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/report-automations/${id}`);
  },
};
