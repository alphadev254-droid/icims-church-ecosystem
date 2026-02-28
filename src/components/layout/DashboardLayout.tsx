import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  Church, Users, Calendar, HandCoins, BarChart3, Settings,
  LogOut, Sun, Moon, Menu, X, Home, MessageSquare, BookOpen,
  Building2, ClipboardList, TrendingUp
} from 'lucide-react';
import { useState } from 'react';

const sidebarLinks = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/dashboard/members', icon: Users, label: 'Members' },
  { to: '/dashboard/events', icon: Calendar, label: 'Events' },
  { to: '/dashboard/giving', icon: HandCoins, label: 'Giving' },
  { to: '/dashboard/attendance', icon: ClipboardList, label: 'Attendance' },
  { to: '/dashboard/communication', icon: MessageSquare, label: 'Communication' },
  { to: '/dashboard/resources', icon: BookOpen, label: 'Resources' },
  { to: '/dashboard/churches', icon: Building2, label: 'Churches' },
  { to: '/dashboard/performance', icon: TrendingUp, label: 'Performance' },
  { to: '/dashboard/reports', icon: BarChart3, label: 'Reports' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) =>
    path === '/dashboard' ? location.pathname === path : location.pathname.startsWith(path);

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
          <Church className="h-6 w-6 text-sidebar-primary" />
          <span className="font-heading text-lg font-bold text-sidebar-foreground">ICIMS</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {sidebarLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              isActive(link.to)
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
            }`}
          >
            <link.icon className="h-4 w-4 flex-shrink-0" />
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        <div className="px-3 py-2 text-sm text-sidebar-foreground/70">
          <div className="font-medium text-sidebar-foreground">{user?.firstName} {user?.lastName}</div>
          <div className="text-xs capitalize">{user?.role?.replace('_', ' ')}</div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-sidebar border-r border-sidebar-border">
        <SidebarContent />
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="font-heading text-lg font-semibold capitalize">
              {location.pathname === '/dashboard' ? 'Dashboard' : location.pathname.split('/').pop()?.replace('-', ' ')}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
