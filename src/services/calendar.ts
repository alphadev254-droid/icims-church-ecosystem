import apiClient from '@/lib/api-client';

export type CalendarActivityType =
  | 'event'
  | 'attendance'
  | 'cell_meeting'
  | 'reminder'
  | 'giving_deadline'
  | 'pledge_due';

export interface CalendarActivity {
  id: string;
  sourceId: string;
  type: CalendarActivityType;
  title: string;
  startsAt: string;
  endsAt?: string | null;
  churchId: string;
  churchName?: string | null;
  description?: string | null;
  status?: string | null;
  meta?: Record<string, unknown>;
}

export interface CalendarActivityFilters {
  startDate: string;
  endDate: string;
  churchId?: string;
  types?: CalendarActivityType[];
  statuses?: string[];
}

export const calendarService = {
  getActivities: async (filters: CalendarActivityFilters): Promise<CalendarActivity[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: CalendarActivity[] }>('/calendar/activities', {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        churchId: filters.churchId,
        types: filters.types?.join(','),
        statuses: filters.statuses?.join(','),
      },
    });
    return data.data;
  },
};
