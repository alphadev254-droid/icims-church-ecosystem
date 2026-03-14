export type UserRole =
  | 'ministry_admin'
  | 'regional_admin'
  | 'district_admin'
  | 'branch_admin'
  | 'member';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  churchId: string;
  avatar?: string;
  phone?: string;
  createdAt: string;
}

export interface Church {
  id: string;
  name: string;
  level: 'national' | 'regional' | 'district' | 'local';
  parentId?: string;
  location: string;
  leaderId: string;
  memberCount: number;
  createdAt: string;
}

export interface Member {
  id: string;
  userId: string;
  churchId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  familyId?: string;
  roles: string[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  churchId: string;
  date: string;
  time: string;
  location: string;
  type: 'service' | 'meeting' | 'conference' | 'outreach' | 'fellowship';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  attendeeCount: number;
  createdBy: string;
}

export interface Donation {
  id: string;
  memberId: string;
  memberName: string;
  churchId: string;
  amount: number;
  type: 'tithe' | 'offering' | 'pledge' | 'special';
  date: string;
  method: 'cash' | 'card' | 'mobile_money' | 'bank_transfer';
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
}

export interface Attendance {
  id: string;
  eventId: string;
  churchId: string;
  date: string;
  totalAttendees: number;
  newVisitors: number;
  serviceType: string;
}

export interface DashboardStats {
  totalMembers: number;
  totalChurches: number;
  totalDonations: number;
  totalEvents: number;
  recentDonationAmount: number;
  averageAttendance: number;
  memberGrowth: number;
  donationGrowth: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
