import {
  Home, Calendar, HandCoins, ClipboardList, MessageSquare,
  BookOpen, Building2, TrendingUp, BarChart3, Settings, Shield, UserCog, Package2, Receipt, Wallet, Users, Bell, type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from './authStore';

export type UserRole =
  | 'national_admin'
  | 'regional_leader'
  | 'district_overseer'
  | 'local_admin'
  | 'member';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

// Each nav item is shown when the user has the listed permission
const PERMISSION_TO_NAV: Array<{ permission: string; item: NavItem }> = [
  { permission: 'dashboard:read',     item: { to: '/dashboard',               label: 'Dashboard',     icon: Home } },
  { permission: 'churches:read',      item: { to: '/dashboard/churches',      label: 'Branches',      icon: Building2 } },
  { permission: 'events:read',        item: { to: '/dashboard/events',        label: 'Events',        icon: Calendar } },
  { permission: 'reminders:read',     item: { to: '/dashboard/reminders',     label: 'Reminders',     icon: Bell } },
  { permission: 'giving:read',        item: { to: '/dashboard/giving',        label: 'Giving',        icon: HandCoins } },
  { permission: 'attendance:read',    item: { to: '/dashboard/attendance',    label: 'Attendance',    icon: ClipboardList } },
  { permission: 'communication:read', item: { to: '/dashboard/communication', label: 'Communication', icon: MessageSquare } },
  { permission: 'resources:read',     item: { to: '/dashboard/resources',     label: 'Resources',     icon: BookOpen } },
  { permission: 'performance:read',   item: { to: '/dashboard/performance',   label: 'Performance',   icon: TrendingUp } },
  { permission: 'reports:read',       item: { to: '/dashboard/reports',       label: 'Reports',       icon: BarChart3 } },
  { permission: 'transactions:read',  item: { to: '/dashboard/transactions',  label: 'Transactions',  icon: Receipt } },
  { permission: 'withdrawals:read',   item: { to: '/dashboard/withdrawals',   label: 'Withdrawals',   icon: Wallet } },
  { permission: 'settings:read',      item: { to: '/dashboard/settings',      label: 'Settings',      icon: Settings } },
  { permission: 'users:read',         item: { to: '/dashboard/users',         label: 'Users',         icon: UserCog } },
  { permission: 'roles:manage',       item: { to: '/dashboard/roles',         label: 'Roles',         icon: Shield } },
  { permission: 'teams:read',         item: { to: '/dashboard/teams',         label: 'Teams',         icon: Users } },
  { permission: 'packages:read',      item: { to: '/dashboard/packages',      label: 'Packages',      icon: Package2 } },
];

/** Build sidebar nav items from the user's permission array */
export function getNavForPermissions(permissions: string[]): NavItem[] {
  const permSet = new Set(permissions);
  const user = useAuthStore.getState().user;
  
  return PERMISSION_TO_NAV
    .filter(({ permission, item }) => {
      if (!permSet.has(permission)) return false;
      
      // Hide withdrawals for non-Malawi accounts
      if (item.to === '/dashboard/withdrawals') {
        return user?.accountCountry === 'Malawi';
      }
      
      // Hide transactions from members
      if (item.to === '/dashboard/transactions') {
        return user?.roleName !== 'member';
      }
      
      // Hide teams from members only (show regardless of package - page handles upgrade prompt)
      if (item.to === '/dashboard/teams') {
        return user?.roleName !== 'member';
      }
      
      // Show reminders for all users (page handles upgrade prompt)
      
      return true;
    })
    .map(({ item }) => item);
}

/** Build allowed route list from the user's permission array */
export function getAllowedRoutesFromPermissions(permissions: string[]): string[] {
  const permSet = new Set(permissions);
  const user = useAuthStore.getState().user;
  const routes = ['/dashboard']; // always include root dashboard
  
  for (const { permission, item } of PERMISSION_TO_NAV) {
    if (permSet.has(permission) && !routes.includes(item.to)) {
      // Hide withdrawals route for non-Malawi accounts
      if (item.to === '/dashboard/withdrawals' && user?.accountCountry !== 'Malawi') {
        continue;
      }
      // Hide transactions route from members
      if (item.to === '/dashboard/transactions' && user?.roleName === 'member') {
        continue;
      }
      // Hide teams route from members only
      if (item.to === '/dashboard/teams' && user?.roleName === 'member') {
        continue;
      }
      routes.push(item.to);
    }
  }
  return routes;
}
