import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import apiClient from '@/lib/api-client';
import { Users, Building2, HandCoins, Calendar, TrendingUp, Globe, MapPin, Landmark, DollarSign, Ticket, Bell, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';

async function fetchStats(churchId?: string | null) {
  const params = churchId ? `?churchId=${churchId}` : '';
  const { data } = await apiClient.get(`/dashboard/stats${params}`);
  return data.data;
}

const ROLE_LABELS: Record<string, { scope: string; icon: typeof Globe }> = {
  ministry_admin:    { scope: 'Entire Ministry', icon: Globe },
  regional_admin:   { scope: 'Your Region',         icon: MapPin },
  district_admin: { scope: 'Your District',       icon: Landmark },
  branch_admin:       { scope: 'Your Branch',         icon: Building2 },
  member:            { scope: 'Your Church',         icon: Building2 },
};


export default function DashboardPage() {
  const { user } = useAuth();
  const { roleName: role, isNational, isLocal, hasPermission } = useRole();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.churchId],
    queryFn: () => fetchStats(user?.churchId),
    enabled: !!user,
  });

    const isMember = role === 'member';

  

  const { data: urgentComms = [] } = useQuery({
    queryKey: ['urgent-communications', user?.churchId],
    queryFn: async () => {
      const { data } = await apiClient.get('/announcements?priority=urgent');
      return data.data.slice(0, 3);
    },
    enabled: !!user && isMember,
  });

  const { data: recentResources = [] } = useQuery({
    queryKey: ['recent-resources', user?.churchId],
    queryFn: async () => {
      const { data } = await apiClient.get('/resources');
      return data.data.slice(0, 3);
    },
    enabled: !!user && isMember,
  });

  const roleLabel = ROLE_LABELS[role ?? 'member'];
  const ScopeIcon = roleLabel?.icon ?? Building2;

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  // Member-specific stats
  const memberStats = [
    { title: 'My Total Giving', value: `MWK ${Number(stats.myTotalDonations ?? 0).toLocaleString()}`, icon: HandCoins, change: 0 },
    { title: 'My Donations', value: stats.myDonationRecords ?? 0, icon: DollarSign, change: 0 },
    { title: 'Upcoming Events', value: stats.upcomingEvents ?? 0, icon: Calendar, change: 0 },
    { title: 'Total Events', value: stats.totalEvents ?? 0, icon: Ticket, change: 0 },
  ];

  // Admin stat cards
  const adminStats = [
    {
      title: 'Total Members',
      value: stats.totalMembers ?? 0,
      icon: Users,
      change: stats.memberGrowth ?? 0,
      show: hasPermission('members:read'),
    },
    {
      title: isLocal ? 'Active Members' : 'Churches',
      value: isLocal ? (stats.activeMembers ?? 0) : (stats.totalChurches ?? 0),
      icon: Building2,
      change: 0,
      show: hasPermission('churches:read') || isLocal,
    },
    {
      title: 'Total Giving (MWK)',
      value: `MWK ${Number(stats.totalDonations ?? 0).toLocaleString()}`,
      icon: HandCoins,
      change: stats.donationGrowth ?? 0,
      show: hasPermission('giving:read'),
    },
    {
      title: 'Avg. Attendance',
      value: stats.averageAttendance ?? 0,
      icon: Calendar,
      change: 5.2,
      show: hasPermission('attendance:read'),
    },
    {
      title: 'Upcoming Events',
      value: stats.upcomingEvents ?? 0,
      icon: Calendar,
      change: 0,
      show: hasPermission('events:read'),
    },
  ].filter(s => s.show);

  const statCards = isMember ? memberStats : adminStats;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
            Welcome back, {user?.firstName}
          </h1>
          <div className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm text-muted-foreground">
            <ScopeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>
              {roleLabel?.scope}
              {user?.church?.name && ` — ${user.church.name}`}
            </span>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground bg-muted px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full capitalize shrink-0">
          {role?.replace(/_/g, ' ')}
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map(s => (
          <Card key={s.title}>
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-2 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
              <s.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold font-heading">{s.value}</div>
              {s.change > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">{s.change}%</span> from last month
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {hasPermission('attendance:read') && stats.weeklyAttendance && stats.weeklyAttendance.length > 0 && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-sm sm:text-base">Weekly Attendance</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.weeklyAttendance}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6 }} />
                  <Bar dataKey="attendees" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {hasPermission('giving:read') && stats.monthlyGiving && stats.monthlyGiving.length > 0 && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-sm sm:text-base">Monthly Giving (MWK)</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats.monthlyGiving}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6 }} />
                  <Line type="monotone" dataKey="amount" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: 'hsl(var(--accent))' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {hasPermission('churches:read') && (
          <Card className="lg:col-span-2">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-sm sm:text-base">
                {isNational ? 'Ministry Overview' : 'Regional Overview'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="grid grid-cols-3 gap-3 sm:gap-6 text-center">
                <div>
                  <p className="text-xl sm:text-3xl font-bold font-heading text-accent">{stats.totalChurches ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Churches</p>
                </div>
                <div>
                  <p className="text-xl sm:text-3xl font-bold font-heading text-accent">{stats.totalMembers ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Members</p>
                </div>
                <div>
                  <p className="text-xl sm:text-3xl font-bold font-heading text-accent">
                    MWK {Number(stats.totalDonations ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Total Giving</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isMember && urgentComms.length > 0 && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                Urgent Communications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0 space-y-3">
              {urgentComms.map((comm: any) => (
                <div key={comm.id} className="border-l-2 border-destructive pl-3 py-1">
                  <p className="text-xs sm:text-sm font-medium">{comm.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{comm.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(comm.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {isMember && recentResources.length > 0 && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                This Week's Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0 space-y-3">
              {recentResources.map((resource: any) => (
                <div key={resource.id} className="border-l-2 border-accent pl-3 py-1">
                  <p className="text-xs sm:text-sm font-medium">{resource.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{resource.category} • {resource.type}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(resource.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
