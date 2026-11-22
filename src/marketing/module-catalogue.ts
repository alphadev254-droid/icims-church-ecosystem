import {
  Baby, Bell, BookOpen, Building2, CalendarDays, CalendarRange, ChartNoAxesCombined,
  Church, ClipboardCheck, GraduationCap, HandCoins, HeartHandshake, Megaphone,
  PanelsTopLeft, QrCode, Receipt, ShieldCheck, Ticket, Users, UsersRound, Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { FeatureTopic } from './topic-content';

interface MinistryModule {
  title: string;
  benefit: string;
  icon: LucideIcon;
  topic?: FeatureTopic['slug'];
}

interface ModuleGroup {
  title: string;
  modules: MinistryModule[];
}

export const moduleGroups: ModuleGroup[] = [
  {
    title: 'People and discipleship',
    modules: [
      { title: 'Membership Management', icon: Users, topic: 'membership', benefit: 'Keep one membership register for contact details, branch assignments and ministry involvement. Review new registrations without chasing forms.' },
      { title: 'Children & Dependents', icon: Baby, topic: 'children', benefit: 'Keep a separate children’s register. Link each child to their parents or guardians and find emergency or pickup contact details when you need them.' },
      { title: 'Discipleship', icon: GraduationCap, topic: 'discipleship', benefit: 'Give first-time visitors a clear next step. Record consent, assign mentors and track Foundation School, class attendance, assessments and progress toward placement.' },
      { title: 'Teams', icon: UsersRound, benefit: 'See who serves in each ministry team. Keep team rosters current so leaders know who to reach when organizing ministry work.' },
      { title: 'Cells & Fellowships', icon: HeartHandshake, benefit: 'Organize small groups, record their meetings and attendance, and give church leaders a clearer picture of participation.' },
    ],
  },
  {
    title: 'Services, events and scheduling',
    modules: [
      { title: 'Ministry Calendar', icon: CalendarDays, topic: 'calendar', benefit: 'See events, services, cell meetings, reminders and giving deadlines in one month or agenda view, so branch teams can plan around each other.' },
      { title: 'Events & Ticketing', icon: Ticket, topic: 'events', benefit: 'Plan conferences, outreach and meetings, share event details, and manage tickets and arrivals from the same event record.' },
      { title: 'Service Check-in & Attendance', icon: QrCode, topic: 'attendance', benefit: 'Check people in with QR codes and review service turnout. First-time visitor records give welcome teams a list to follow up with.' },
      { title: 'Asset & Facility Booking', icon: CalendarRange, topic: 'asset-booking', benefit: 'Reserve halls, rooms, vehicles and equipment for a service or event. See who booked what and use conflict checks and approval rules to avoid double bookings.' },
      { title: 'Reminders', icon: Bell, benefit: 'Set reminders for events, birthdays, anniversaries and pledges so teams can follow up when it matters.' },
    ],
  },
  {
    title: 'Giving and financial oversight',
    modules: [
      { title: 'Giving & Campaigns', icon: HandCoins, topic: 'giving', benefit: 'Record tithes and offerings, or share a public giving campaign. Follow contributions against the campaign instead of reconciling separate lists.' },
      { title: 'Pledges', icon: ClipboardCheck, benefit: 'See amounts promised, paid and outstanding. Filter by church or campaign so finance teams know where to follow up.' },
      { title: 'Transactions', icon: Receipt, benefit: 'Review giving, ticket and payment records in one place when reconciling collections or checking a specific payment.' },
      { title: 'Wallets & Withdrawals', icon: Wallet, benefit: 'Track balances, payout requests, fees and withdrawal history to see what has been requested and what has been paid.' },
    ],
  },
  {
    title: 'Communication and ministry oversight',
    modules: [
      { title: 'Church & Branch Management', icon: Church, topic: 'multi-branch', benefit: 'Keep branch records connected under one ministry. Let branch staff run local operations while authorized leaders review activity across locations.' },
      { title: 'Staff Accounts & Permissions', icon: ShieldCheck, benefit: 'Give staff access to the churches and tasks they handle, from check-in and member records to finance and administration.' },
      { title: 'Announcements & Newsletters', icon: Megaphone, benefit: 'Send announcements, newsletters or prayer requests to the relevant audience, and schedule messages around upcoming ministry activity.' },
      { title: 'Ministry Communication & Resources', icon: BookOpen, benefit: 'Share documents and other ministry resources with the right churches so teams can find materials without searching old message threads.' },
      { title: 'Public Church Website', icon: PanelsTopLeft, benefit: 'Give visitors one place to find service information, ministries, events, sermons, giving and ways to get in touch.' },
      { title: 'Reports & Analytics', icon: ChartNoAxesCombined, benefit: 'Review membership, attendance and giving across your permitted churches. Export supported reports for leadership or finance meetings.' },
      { title: 'Performance Dashboard', icon: Building2, benefit: 'Track ministry indicators in a shared dashboard so leaders can spot changes in activity and decide where to follow up.' },
    ],
  },
];
