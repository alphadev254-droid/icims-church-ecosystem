import api from '@/lib/api-client';

export interface Reminder {
  id: string;
  userId: string;
  type: 'birthday' | 'wedding' | 'member_anniversary' | 'church_founded' | 'event';
  originalDate: string;
  upcomingDate: string;
  daysUntil: number;
  age?: number;
  years?: number;
  churchId: string;
  ministryAdminId?: string;
  eventId?: string;
  eventTitle?: string;
  lastNotified?: string;
  notifyAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  church: {
    id: string;
    name: string;
  };
  event?: {
    id: string;
    title: string;
    date: string;
    location?: string;
    contactEmail?: string;
    contactPhone?: string;
    imageUrl?: string;
  };
}

export interface ReminderStats {
  total: number;
  birthdays: number;
  weddings: number;
  memberAnniversaries: number;
  churchFounded: number;
  events: number;
}

export interface RemindersResponse {
  success: boolean;
  data: Reminder[];
  stats: ReminderStats;
}

export interface ScheduledReminder {
  id: string;
  churchId: string;
  campaignId?: string | null;
  eventId?: string | null;
  type: 'giving' | 'pledge' | 'event';
  audience: 'all_members' | 'active_pledges' | 'overdue_pledges' | 'not_given_this_month' | 'event_members';
  channelEmail: boolean;
  channelPush: boolean;
  title: string;
  message: string;
  scheduleKind: 'monthly_days' | 'pledge_deadline';
  scheduleDays: number[];
  deadlineOffsets: number[];
  isActive: boolean;
  lastRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { logs: number };
}

export interface ScheduledReminderPayload {
  churchId: string;
  campaignId?: string | null;
  eventId?: string | null;
  type: 'giving' | 'pledge' | 'event';
  audience: 'all_members' | 'active_pledges' | 'overdue_pledges' | 'not_given_this_month' | 'event_members';
  channelEmail: boolean;
  channelPush: boolean;
  title: string;
  message: string;
  scheduleKind: 'monthly_days' | 'pledge_deadline';
  scheduleDays?: number[];
  deadlineOffsets?: number[];
  isActive?: boolean;
}

export interface ScheduledReminderLog {
  id: string;
  reminderId: string;
  userId?: string | null;
  recipientEmail?: string | null;
  channel: string;
  status: string;
  scheduledFor: string;
  sentAt?: string | null;
  error?: string | null;
  createdAt: string;
  reminder: ScheduledReminder;
}

export interface ScheduledReminderLogsResponse {
  success: boolean;
  data: ScheduledReminderLog[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const getUpcomingReminders = async (params?: {
  days?: number;
  type?: string;
  churchId?: string;
}): Promise<RemindersResponse> => {
  const response = await api.get('/reminders/upcoming', { params });
  return response.data;
};

export const getTodayReminders = async (): Promise<{ success: boolean; data: Reminder[] }> => {
  const response = await api.get('/reminders/today');
  return response.data;
};

export const getScheduledReminders = async (params?: { churchId?: string }): Promise<{ success: boolean; data: ScheduledReminder[] }> => {
  const response = await api.get('/reminders/scheduled', { params });
  return response.data;
};

export const createScheduledReminder = async (payload: ScheduledReminderPayload): Promise<{ success: boolean; data: ScheduledReminder }> => {
  const response = await api.post('/reminders/scheduled', payload);
  return response.data;
};

export const updateScheduledReminder = async (id: string, payload: Partial<ScheduledReminderPayload>): Promise<{ success: boolean; data: ScheduledReminder }> => {
  const response = await api.put(`/reminders/scheduled/${id}`, payload);
  return response.data;
};

export const deleteScheduledReminder = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/reminders/scheduled/${id}`);
  return response.data;
};

export const getScheduledReminderLogs = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  channel?: string;
  reminderId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ScheduledReminderLogsResponse> => {
  const response = await api.get('/reminders/scheduled/logs', { params });
  return response.data;
};
