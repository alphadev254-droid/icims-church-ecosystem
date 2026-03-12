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
  nationalAdminId?: string;
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
