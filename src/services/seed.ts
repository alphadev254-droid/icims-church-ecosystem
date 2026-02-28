import { storage } from './storage';
import type { Member, Event, Donation, Attendance } from '@/types';

const uid = () => crypto.randomUUID();

export function seedData() {
  const members: Member[] = [
    { id: uid(), userId: '1', churchId: 'c1', firstName: 'Grace', lastName: 'Muthoni', email: 'grace@church.org', phone: '+254712345678', status: 'active', joinDate: '2023-01-15', roles: ['choir'] },
    { id: uid(), userId: '2', churchId: 'c1', firstName: 'James', lastName: 'Ochieng', email: 'james@church.org', phone: '+254723456789', status: 'active', joinDate: '2022-06-20', roles: ['usher', 'deacon'] },
    { id: uid(), userId: '3', churchId: 'c1', firstName: 'Faith', lastName: 'Wanjiru', email: 'faith@church.org', phone: '+254734567890', status: 'active', joinDate: '2023-03-10', roles: ['youth_leader'] },
    { id: uid(), userId: '4', churchId: 'c1', firstName: 'David', lastName: 'Kamau', email: 'david@church.org', phone: '+254745678901', status: 'active', joinDate: '2021-11-05', roles: ['elder'] },
    { id: uid(), userId: '5', churchId: 'c1', firstName: 'Mary', lastName: 'Akinyi', email: 'mary@church.org', phone: '+254756789012', status: 'pending', joinDate: '2024-01-20', roles: [] },
    { id: uid(), userId: '6', churchId: 'c1', firstName: 'Peter', lastName: 'Njoroge', email: 'peter@church.org', phone: '+254767890123', status: 'active', joinDate: '2022-09-12', roles: ['finance'] },
    { id: uid(), userId: '7', churchId: 'c2', firstName: 'Sarah', lastName: 'Otieno', email: 'sarah@church.org', phone: '+254778901234', status: 'active', joinDate: '2023-05-08', roles: ['women_ministry'] },
    { id: uid(), userId: '8', churchId: 'c2', firstName: 'John', lastName: 'Kiprop', email: 'john@church.org', phone: '+254789012345', status: 'inactive', joinDate: '2020-02-14', roles: ['deacon'] },
  ];

  const events: Event[] = [
    { id: uid(), title: 'Sunday Worship Service', description: 'Weekly worship gathering', churchId: 'c1', date: '2026-03-02', time: '09:00', location: 'Main Sanctuary', type: 'service', status: 'upcoming', attendeeCount: 250, createdBy: '1' },
    { id: uid(), title: 'Youth Conference 2026', description: 'Annual youth empowerment conference', churchId: 'c1', date: '2026-04-15', time: '08:00', location: 'Conference Hall', type: 'conference', status: 'upcoming', attendeeCount: 0, createdBy: '1' },
    { id: uid(), title: 'Board Meeting', description: 'Quarterly church board meeting', churchId: 'c1', date: '2026-03-10', time: '14:00', location: 'Board Room', type: 'meeting', status: 'upcoming', attendeeCount: 12, createdBy: '4' },
    { id: uid(), title: 'Community Outreach', description: 'Community feeding program', churchId: 'c1', date: '2026-02-22', time: '07:00', location: 'Community Center', type: 'outreach', status: 'completed', attendeeCount: 85, createdBy: '3' },
    { id: uid(), title: 'Prayer Night', description: 'Monthly prayer vigil', churchId: 'c1', date: '2026-03-07', time: '20:00', location: 'Chapel', type: 'fellowship', status: 'upcoming', attendeeCount: 0, createdBy: '1' },
  ];

  const donations: Donation[] = [
    { id: uid(), memberId: '1', memberName: 'Grace Muthoni', churchId: 'c1', amount: 5000, type: 'tithe', date: '2026-02-25', method: 'mobile_money', status: 'completed' },
    { id: uid(), memberId: '2', memberName: 'James Ochieng', churchId: 'c1', amount: 10000, type: 'tithe', date: '2026-02-25', method: 'bank_transfer', status: 'completed' },
    { id: uid(), memberId: '4', memberName: 'David Kamau', churchId: 'c1', amount: 25000, type: 'offering', date: '2026-02-23', method: 'card', status: 'completed' },
    { id: uid(), memberId: '3', memberName: 'Faith Wanjiru', churchId: 'c1', amount: 3000, type: 'tithe', date: '2026-02-20', method: 'cash', status: 'completed' },
    { id: uid(), memberId: '6', memberName: 'Peter Njoroge', churchId: 'c1', amount: 50000, type: 'pledge', date: '2026-02-18', method: 'bank_transfer', status: 'pending' },
    { id: uid(), memberId: '7', memberName: 'Sarah Otieno', churchId: 'c2', amount: 7500, type: 'special', date: '2026-02-15', method: 'mobile_money', status: 'completed' },
  ];

  const attendance: Attendance[] = [
    { id: uid(), eventId: 'e1', churchId: 'c1', date: '2026-02-23', totalAttendees: 245, newVisitors: 12, serviceType: 'Sunday Service' },
    { id: uid(), eventId: 'e1', churchId: 'c1', date: '2026-02-16', totalAttendees: 230, newVisitors: 8, serviceType: 'Sunday Service' },
    { id: uid(), eventId: 'e1', churchId: 'c1', date: '2026-02-09', totalAttendees: 258, newVisitors: 15, serviceType: 'Sunday Service' },
    { id: uid(), eventId: 'e1', churchId: 'c1', date: '2026-02-02', totalAttendees: 220, newVisitors: 5, serviceType: 'Sunday Service' },
  ];

  storage.set('members', members);
  storage.set('events', events);
  storage.set('donations', donations);
  storage.set('attendance', attendance);
}
