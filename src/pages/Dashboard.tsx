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
  national_admin:    { scope: 'Entire Ministry', icon: Globe },
  regional_leader:   { scope: 'Your Region',         icon: MapPin },
  district_overseer: { scope: 'Your District',       icon: Landmark },
  local_admin:       { scope: 'Your Branch',         icon: Building2 },
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
      value: stats.totalMembers,
      icon: Users,
      change: stats.memberGrowth,
      show: hasPermission('members:read'),
    },
    {
      title: isLocal ? 'Active Members' : 'Churches',
      value: isLocal ? stats.activeMembers : stats.totalChurches,
      icon: Building2,
      change: 0,
      show: hasPermission('churches:read') || isLocal,
    },
    {
      title: 'Total Giving (MWK)',
      value: `MWK ${Number(stats.totalDonations ?? 0).toLocaleString()}`,
      icon: HandCoins,
      change: stats.donationGrowth,
      show: hasPermission('giving:read'),
    },
    {
      title: 'Avg. Attendance',
      value: stats.averageAttendance,
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Welcome back, {user?.firstName}
          </h1>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
            <ScopeIcon className="h-4 w-4" />
            <span>
              {roleLabel?.scope}
              {user?.church?.name && ` — ${user.church.name}`}
            </span>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full capitalize">
          {role?.replace(/_/g, ' ')}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(s => (
          <Card key={s.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-heading">{s.value}</div>
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
        {hasPermission('attendance:read') && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weekly Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { week: 'Week 1', attendees: 220 },
                  { week: 'Week 2', attendees: 258 },
                  { week: 'Week 3', attendees: 230 },
                  { week: 'Week 4', attendees: stats.averageAttendance },
                ]}>
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

        {hasPermission('giving:read') && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Giving (MWK)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={[
                  { month: 'Sep', amount: 850000 },
                  { month: 'Oct', amount: 920000 },
                  { month: 'Nov', amount: 780000 },
                  { month: 'Dec', amount: 1200000 },
                  { month: 'Jan', amount: 950000 },
                  { month: 'Feb', amount: Math.round(stats.totalDonations) },
                ]}>
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
            <CardHeader>
              <CardTitle className="text-base">
                {isNational ? 'Ministry Overview' : 'Regional Overview'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-3xl font-bold font-heading text-accent">{stats.totalChurches}</p>
                  <p className="text-xs text-muted-foreground mt-1">Churches</p>
                </div>
                <div>
                  <p className="text-3xl font-bold font-heading text-accent">{stats.totalMembers}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Members</p>
                </div>
                <div>
                  <p className="text-3xl font-bold font-heading text-accent">
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
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-destructive" />
                Urgent Communications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {urgentComms.map((comm: any) => (
                <div key={comm.id} className="border-l-2 border-destructive pl-3 py-1">
                  <p className="text-sm font-medium">{comm.title}</p>
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
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                This Week's Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentResources.map((resource: any) => (
                <div key={resource.id} className="border-l-2 border-accent pl-3 py-1">
                  <p className="text-sm font-medium">{resource.title}</p>
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
