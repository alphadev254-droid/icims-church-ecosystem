import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/contexts/ThemeContext';
import { SubscriptionCheck } from '@/components/SubscriptionCheck';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Church, LogOut, Sun, Moon, Menu, User, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Suspense, useState } from 'react';
import { SystemNotificationBell } from './SystemNotificationBell';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

function DashboardPageLoader() {
  return (
    <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navItems = useAuthStore(s => s.navItems);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('dashboard-sidebar-collapsed') === 'true');

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed(collapsed => {
      const next = !collapsed;
      localStorage.setItem('dashboard-sidebar-collapsed', String(next));
      return next;
    });
  };

  const STATIC_BASE = (import.meta.env.VITE_STATIC_URL || 'http://localhost:5000').replace(/['"]|\/$|^\/api$/g, '');
  const avatarUrl = user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${STATIC_BASE}${user.avatar}`) : null;
  const roleLabel = user?.roleName === 'referrer'
    ? 'Marketer'
    : user?.roleDisplayName || user?.roleName?.replace(/_/g, ' ');
  const showApprovalNotice = user?.roleName === 'member' && user.membershipApprovalStatus && user.membershipApprovalStatus !== 'approved';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const pageTitles: Record<string, string> = {
    '/dashboard/referrals/profile': 'Marketer Profile',
    '/dashboard/referrals': 'Marketer Dashboard',
    '/dashboard/referrals/my-referrals': 'Partnered Ministries',
    '/dashboard/referrals/wallet': 'Wallet',
    '/dashboard/referrals/payout-settings': 'Payout Settings',
    '/dashboard/attendance': 'Check-in',
    '/dashboard/services': 'Services',
    '/dashboard/resource-booking': 'Asset and Facility Booking',
    '/dashboard/discipleship/journeys': 'Discipleship Journeys',
    '/dashboard/discipleship/workflows': 'Discipleship Workflows',
    '/dashboard/discipleship/programs': 'Discipleship Courses & Classes',
    '/dashboard/discipleship/reports': 'Discipleship Reports',
  };

  const currentPageTitle = pageTitles[location.pathname] || (location.pathname === '/dashboard'
    ? 'Dashboard'
    : location.pathname.split('/').pop()?.replace(/-/g, ' '));

  const isActive = (path: string) => {
    const matchingItems = navItems.filter(item =>
      location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
    );
    const closestMatch = matchingItems.sort((a, b) => b.to.length - a.to.length)[0];
    return closestMatch?.to === path;
  };

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <>
      <div className={`flex h-14 items-center border-b border-sidebar-border ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
        {!collapsed && (
          <Link to="/" className="flex min-w-0 items-center gap-2" aria-label="ICIMS home">
            <Church className="h-6 w-6 text-sidebar-primary" />
            <span className="font-heading text-lg font-bold text-sidebar-foreground">ICIMS</span>
          </Link>
        )}
        {!collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleSidebarCollapsed}
                className="hidden h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground lg:flex"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Collapse sidebar</TooltipContent>
          </Tooltip>
        )}
        {collapsed && (
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className={`flex-1 space-y-1 overflow-y-auto ${collapsed ? 'p-2' : 'p-3'}`}>
        {navItems.map(item => {
          const showUserSubnav = item.to === '/dashboard/users' && user?.permissions?.includes('registration_requests:read');
          const usersSectionActive = location.pathname === '/dashboard/users' || location.pathname.startsWith('/dashboard/users/');
          const showDiscipleshipSubnav = item.to === '/dashboard/discipleship';
          const discipleshipSectionActive = location.pathname === '/dashboard/discipleship' || location.pathname.startsWith('/dashboard/discipleship/');
          const canReadDiscipleshipWorkflows = user?.permissions?.includes('discipleship_workflows:read');
          const canReadDiscipleshipCourses = user?.permissions?.includes('discipleship_courses:read');
          const canReadDiscipleshipReports = user?.permissions?.includes('discipleship_reports:read');

          return (
            <div key={item.to}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    aria-label={collapsed ? item.label : undefined}
                    className={`flex items-center rounded-md py-2.5 text-sm font-medium transition-colors ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} ${
                      isActive(item.to)
                        ? 'bg-sidebar-accent text-sidebar-primary'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    }`}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
              </Tooltip>
              {!collapsed && showUserSubnav && usersSectionActive && (
                <div className="ml-7 mt-1 space-y-1 border-l border-sidebar-border pl-2">
                  <Link
                    to="/dashboard/users"
                    onClick={() => setSidebarOpen(false)}
                    className={`block rounded-md px-3 py-1.5 text-xs transition-colors ${
                      location.pathname === '/dashboard/users'
                        ? 'bg-sidebar-accent text-sidebar-primary'
                        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    }`}
                  >
                    All Users
                  </Link>
                  <Link
                    to="/dashboard/users/registration-requests"
                    onClick={() => setSidebarOpen(false)}
                    className={`block rounded-md px-3 py-1.5 text-xs transition-colors ${
                      location.pathname === '/dashboard/users/registration-requests'
                        ? 'bg-sidebar-accent text-sidebar-primary'
                        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    }`}
                  >
                    Registration Requests
                  </Link>
                </div>
              )}
              {!collapsed && showDiscipleshipSubnav && discipleshipSectionActive && (
                <div className="ml-7 mt-1 space-y-1 border-l border-sidebar-border pl-2">
                  <Link
                    to="/dashboard/discipleship/journeys"
                    onClick={() => setSidebarOpen(false)}
                    className={`block rounded-md px-3 py-1.5 text-xs transition-colors ${
                      location.pathname.startsWith('/dashboard/discipleship/journeys')
                        ? 'bg-sidebar-accent text-sidebar-primary'
                        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    }`}
                  >
                    Journeys
                  </Link>
                  {canReadDiscipleshipWorkflows && (
                    <Link
                      to="/dashboard/discipleship/workflows"
                      onClick={() => setSidebarOpen(false)}
                      className={`block rounded-md px-3 py-1.5 text-xs transition-colors ${
                        location.pathname === '/dashboard/discipleship/workflows'
                          ? 'bg-sidebar-accent text-sidebar-primary'
                          : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                      }`}
                    >
                      Workflows
                    </Link>
                  )}
                  {canReadDiscipleshipCourses && <Link to="/dashboard/discipleship/programs" onClick={() => setSidebarOpen(false)} className={`block rounded-md px-3 py-1.5 text-xs transition-colors ${location.pathname === '/dashboard/discipleship/programs' ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}>Courses & classes</Link>}
                  {canReadDiscipleshipReports && <Link to="/dashboard/discipleship/reports" onClick={() => setSidebarOpen(false)} className={`block rounded-md px-3 py-1.5 text-xs transition-colors ${location.pathname === '/dashboard/discipleship/reports' ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}>Reports</Link>}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Pinned footer — always visible, never scrolls away */}
      <div className={`border-t border-sidebar-border ${collapsed ? 'p-2' : 'space-y-1 p-3'}`}>
        {!collapsed && <div className="px-3 py-2 text-sm text-sidebar-foreground/70 min-w-0">
          <div className="font-medium text-sidebar-foreground truncate">{user?.firstName} {user?.lastName}</div>
          <div className="text-xs truncate">{user?.email}</div>
          <div className="text-xs text-sidebar-primary mt-0.5 truncate">{roleLabel}</div>
          {user?.church && (
            <div className="text-xs text-sidebar-foreground/50 mt-0.5 truncate">{user.church.name}</div>
          )}
        </div>}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className={`flex w-full items-center rounded-md py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'}`}
              aria-label={collapsed ? 'Sign out' : undefined}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Sign out</TooltipContent>}
        </Tooltip>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 flex min-h-0 overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className={`relative hidden min-h-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent collapsed={sidebarCollapsed} />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-60 flex flex-col bg-sidebar">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-foreground/30" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="min-h-0 min-w-0 flex-1 flex flex-col overflow-hidden">
        <header className="h-14 shrink-0 border-b border-border bg-background flex items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="truncate font-heading text-base font-semibold capitalize sm:text-lg">
              {currentPageTitle}
            </h2>
          </div>
          
          <div className="flex items-center gap-1">
          {user?.permissions?.includes('system_notifications:read') && <SystemNotificationBell />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          {showApprovalNotice && (
            <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100">
              {user?.membershipApprovalStatus === 'rejected'
                ? 'Your registration was not approved. Please contact your church office if you believe this was a mistake.'
                : 'Your membership is awaiting activation by your church. Some member features may be limited until approval.'}
            </div>
          )}
          <SubscriptionCheck />
          <Suspense fallback={<DashboardPageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

