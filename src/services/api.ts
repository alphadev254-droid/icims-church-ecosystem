import { storage } from './storage';
import type { Member, Event, Donation, Attendance, DashboardStats, ApiResponse } from '@/types';
import { seedData } from './seed';

// Ensure seed data exists
function ensureSeeded() {
  if (!storage.get<Member[]>('members')) {
    seedData();
  }
}

// Simulate async API delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Generic CRUD
function createCrud<T extends { id: string }>(key: string) {
  return {
    async getAll(): Promise<ApiResponse<T[]>> {
      ensureSeeded();
      await delay();
      const items = storage.get<T[]>(key) || [];
      return { data: items, success: true };
    },

    async getById(id: string): Promise<ApiResponse<T | null>> {
      ensureSeeded();
      await delay();
      const items = storage.get<T[]>(key) || [];
      const item = items.find(i => i.id === id) || null;
      return { data: item, success: !!item, message: item ? undefined : 'Not found' };
    },

    async create(item: T): Promise<ApiResponse<T>> {
      ensureSeeded();
      await delay();
      const items = storage.get<T[]>(key) || [];
      items.push(item);
      storage.set(key, items);
      return { data: item, success: true, message: 'Created successfully' };
    },

    async update(id: string, updates: Partial<T>): Promise<ApiResponse<T | null>> {
      ensureSeeded();
      await delay();
      const items = storage.get<T[]>(key) || [];
      const index = items.findIndex(i => i.id === id);
      if (index === -1) return { data: null, success: false, message: 'Not found' };
      items[index] = { ...items[index], ...updates };
      storage.set(key, items);
      return { data: items[index], success: true, message: 'Updated successfully' };
    },

    async delete(id: string): Promise<ApiResponse<null>> {
      ensureSeeded();
      await delay();
      const items = storage.get<T[]>(key) || [];
      storage.set(key, items.filter(i => i.id !== id));
      return { data: null, success: true, message: 'Deleted successfully' };
    },
  };
}

export const membersApi = createCrud<Member>('members');
export const eventsApi = createCrud<Event>('events');
export const donationsApi = createCrud<Donation>('donations');
export const attendanceApi = createCrud<Attendance>('attendance');

export const dashboardApi = {
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    ensureSeeded();
    await delay();
    const members = storage.get<Member[]>('members') || [];
    const events = storage.get<Event[]>('events') || [];
    const donations = storage.get<Donation[]>('donations') || [];
    const attendance = storage.get<Attendance[]>('attendance') || [];

    const totalDonationAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    const avgAttendance = attendance.length
      ? Math.round(attendance.reduce((sum, a) => sum + a.totalAttendees, 0) / attendance.length)
      : 0;

    return {
      data: {
        totalMembers: members.length,
        totalChurches: 12,
        totalDonations: totalDonationAmount,
        totalEvents: events.length,
        recentDonationAmount: totalDonationAmount,
        averageAttendance: avgAttendance,
        memberGrowth: 12.5,
        donationGrowth: 8.3,
      },
      success: true,
    };
  },
};
