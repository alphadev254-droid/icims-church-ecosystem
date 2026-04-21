import {
  Home, Calendar, HandCoins, ClipboardList, MessageSquare,
  BookOpen, Building2, TrendingUp, BarChart3, Settings, Shield, UserCog, Package2, Receipt, Wallet, Users, Bell, type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from './authStore';

export type UserRole =
  | 'system_admin'
  | 'ministry_admin'
  | 'regional_admin'
  | 'district_admin'
  | 'branch_admin'
  | 'member';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

// Each nav item is shown when the user has the listed permission
// Organized in logical groups: Overview → Church Management → People → Activities → Finance → Analytics → System
const PERMISSION_TO_NAV: Array<{ permission: string; item: NavItem }> = [
  // Overview
  { permission: 'dashboard:read',     item: { to: '/dashboard',               label: 'Dashboard',     icon: Home } },
  
  // Church Management
  { permission: 'churches:read',      item: { to: '/dashboard/churches',      label: 'Branches',      icon: Building2 } },
  
  // People Management
  { permission: 'users:read',         item: { to: '/dashboard/users',         label: 'Users',         icon: UserCog } },
  { permission: 'teams:read',         item: { to: '/dashboard/teams',         label: 'Teams',         icon: Users } },
  { permission: 'cells:read',         item: { to: '/dashboard/cells',         label: 'Cells',         icon: Users } },
  
  // Activities & Engagement
  { permission: 'events:read',        item: { to: '/dashboard/events',        label: 'Events',        icon: Calendar } },
  { permission: 'attendance:read',    item: { to: '/dashboard/attendance',    label: 'Attendance',    icon: ClipboardList } },
  { permission: 'reminders:read',     item: { to: '/dashboard/reminders',     label: 'Reminders',     icon: Bell } },
  
  // Communication & Resources
  { permission: 'communication:read', item: { to: '/dashboard/communication', label: 'Communication', icon: MessageSquare } },
  { permission: 'resources:read',     item: { to: '/dashboard/resources',     label: 'Resources',     icon: BookOpen } },
  
  // Finance
  { permission: 'giving:read',        item: { to: '/dashboard/giving',        label: 'Giving',        icon: HandCoins } },
  { permission: 'transactions:read',  item: { to: '/dashboard/transactions',  label: 'Transactions',  icon: Receipt } },
  { permission: 'withdrawals:read',   item: { to: '/dashboard/withdrawals',   label: 'Withdrawals',   icon: Wallet } },
  
  // Analytics & Reports
  { permission: 'performance:read',   item: { to: '/dashboard/performance',   label: 'Performance',   icon: TrendingUp } },
  { permission: 'reports:read',       item: { to: '/dashboard/reports',       label: 'Reports',       icon: BarChart3 } },
  
  // System & Configuration
  { permission: 'roles:manage',       item: { to: '/dashboard/roles',         label: 'Roles',         icon: Shield } },
  { permission: 'packages:read',      item: { to: '/dashboard/packages',      label: 'Packages',      icon: Package2 } },
  { permission: 'settings:read',      item: { to: '/dashboard/settings',      label: 'Settings',      icon: Settings } },
];

/** Build sidebar nav items from the user's permission array */
export function getNavForPermissions(permissions: string[], user?: { accountCountry?: string | null; roleName?: string } | null): NavItem[] {
  const permSet = new Set(permissions);
  const currentUser = user ?? useAuthStore.getState().user;
  
  return PERMISSION_TO_NAV
    .filter(({ permission, item }) => {
      if (!permSet.has(permission)) return false;
      
      // Hide users from members
      if (item.to === '/dashboard/users') {
        return currentUser?.roleName !== 'member';
      }

      // Hide withdrawals for non-Malawi accounts and members
      if (item.to === '/dashboard/withdrawals') {
        return currentUser?.accountCountry === 'Malawi' && currentUser?.roleName !== 'member';
      }
      
      // Hide transactions from members
      if (item.to === '/dashboard/transactions') {
        return currentUser?.roleName !== 'member';
      }
      
      // Show teams to all users (members see read-only view of their teams)
      if (item.to === '/dashboard/teams') {
        return true;
      }

      // Show cells to all users (members see their cell, leaders manage it)
      if (item.to === '/dashboard/cells') {
        return true;
      }
      
      // Show reminders for all users (page handles upgrade prompt)
      
      return true;
    })
    .map(({ item }) => item);
}

/** Build allowed route list from the user's permission array */
export function getAllowedRoutesFromPermissions(permissions: string[], user?: { accountCountry?: string | null; roleName?: string } | null): string[] {
  const permSet = new Set(permissions);
  const currentUser = user ?? useAuthStore.getState().user;
  const routes = ['/dashboard']; // always include root dashboard
  
  for (const { permission, item } of PERMISSION_TO_NAV) {
    if (permSet.has(permission) && !routes.includes(item.to)) {
      // Hide withdrawals route for non-Malawi accounts and members
      if (item.to === '/dashboard/withdrawals' && (currentUser?.accountCountry !== 'Malawi' || currentUser?.roleName === 'member')) {
        continue;
      }
      // Hide users route from members
      if (item.to === '/dashboard/users' && currentUser?.roleName === 'member') {
        continue;
      }
      // Hide transactions route from members
      if (item.to === '/dashboard/transactions' && currentUser?.roleName === 'member') {
        continue;
      }
      // Show teams route to all users (members see read-only view)
      if (item.to === '/dashboard/teams') {
        routes.push(item.to);
        continue;
      }
      // Show cells route to all users
      if (item.to === '/dashboard/cells') {
        routes.push(item.to);
        continue;
      }
      routes.push(item.to);
    }
  }
  return routes;
}
