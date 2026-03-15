import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard';
import { attendanceService } from '@/services/attendance';
import { useAuth } from '@/contexts/AuthContext';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Minus, Users, HandCoins, ClipboardList, Calendar, Lock, UserCheck, UserPlus, TrendingUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';


type TrendDir = 'up' | 'down' | 'flat';

function trendIcon(dir: TrendDir) {
  if (dir === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (dir === 'down') return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function trendColor(dir: TrendDir) {
  if (dir === 'up') return 'text-green-500';
  if (dir === 'down') return 'text-destructive';
  return 'text-muted-foreground';
}

interface KPI {
  label: string;
  value: string | number;
  target?: string | number;
  progress: number; // 0-100
  trend: TrendDir;
  change?: string;
  icon: typeof Users;
}

export default function PerformancePage() {
  const { user } = useAuth();
  const hasPerformance = useHasFeature('performance_dashboard');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.churchId],
    queryFn: () => dashboardService.getStats(user?.churchId),
    enabled: !!user && hasPerformance,
  });

  const { data: attendanceRaw = [], isLoading: attLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: attendanceService.getAll,
    enabled: hasPerformance,
  });

  if (!hasPerformance) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Performance</h1>
          <p className="text-sm text-muted-foreground">KPI tracking and ministry performance overview</p>
        </div>
        <Alert className="border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Performance Dashboard is not available in your current package.{' '}
            <Link to="/dashboard/packages" className="font-medium underline">
              Upgrade now
            </Link>{' '}
            to unlock advanced performance tracking.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const attendance = attendanceRaw.slice(0, 12).reverse();
  const isLoading = statsLoading || attLoading;

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  // Derived KPIs from real data
  const kpis: KPI[] = [
    {
      label: 'Total Members',
      value: stats.totalMembers,
      target: Math.round(stats.totalMembers * 1.15),
      progress: Math.min(100, Math.round((stats.totalMembers / (stats.totalMembers * 1.15)) * 100)),
      trend: stats.memberGrowth > 0 ? 'up' : stats.memberGrowth < 0 ? 'down' : 'flat',
      change: stats.memberGrowth ? `${stats.memberGrowth}%` : undefined,
      icon: Users,
    },
    {
      label: 'Avg. Attendance',
      value: stats.averageAttendance,
      target: Math.round(stats.totalMembers * 0.7),
      progress: stats.totalMembers > 0
        ? Math.min(100, Math.round((stats.averageAttendance / (stats.totalMembers * 0.7)) * 100))
        : 0,
      trend: stats.averageAttendance >= stats.totalMembers * 0.6 ? 'up' : 'down',
      icon: ClipboardList,
    },
    {
      label: 'Monthly Giving (MWK)',
      value: `MWK ${Number(stats.totalDonations).toLocaleString()}`,
      target: `MWK ${Number(Math.round(stats.totalDonations * 1.1)).toLocaleString()}`,
      progress: Math.min(100, Math.round((stats.totalDonations / (stats.totalDonations * 1.1)) * 100)),
      trend: stats.donationGrowth > 0 ? 'up' : stats.donationGrowth < 0 ? 'down' : 'flat',
      change: stats.donationGrowth ? `${stats.donationGrowth}%` : undefined,
      icon: HandCoins,
    },
    {
      label: 'Upcoming Events',
      value: stats.upcomingEvents ?? 0,
      progress: 100,
      trend: 'flat',
      icon: Calendar,
    },
  ];

  // Radar data — 0-100 scores per KPI
  const radarData = kpis.map(k => ({
    subject: k.label.replace(' (MWK)', ''),
    score: k.progress,
  }));

  // Attendance trend chart
  const chartData = attendance.map((r: any) => ({
    date: new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    attendees: r.totalAttendees,
  }));

  // Overall health score
  const healthScore = Math.round(kpis.reduce((s, k) => s + k.progress, 0) / kpis.length);
  const healthColor = healthScore >= 80 ? 'text-green-500' : healthScore >= 60 ? 'text-yellow-500' : 'text-destructive';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-xl sm:text-2xl font-bold">Performance</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">KPI tracking and ministry performance overview</p>
      </div>

      {/* Health score */}
      <Card className="bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20">
        <CardContent className="p-4 sm:p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Overall Church Health Score</p>
            <div className={`text-4xl sm:text-5xl font-bold font-heading mt-1 ${healthColor}`}>
              {healthScore}<span className="text-xl sm:text-2xl text-muted-foreground">/100</span>
            </div>
          </div>
          <div className="w-24 h-24 sm:w-36 sm:h-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius={40}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 6, fill: 'hsl(var(--muted-foreground))' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} />
                <Radar dataKey="score" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">{kpi.label}</p>
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                </div>
                <div className="text-lg sm:text-2xl font-bold font-heading">{kpi.value}</div>
                {kpi.target && (
                  <p className="text-xs sm:text-sm text-muted-foreground">Target: {kpi.target}</p>
                )}
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{kpi.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        kpi.progress >= 80 ? 'bg-green-500' : kpi.progress >= 60 ? 'bg-yellow-500' : 'bg-destructive'
                      }`}
                      style={{ width: `${kpi.progress}%` }}
                    />
                  </div>
                </div>
                {kpi.change && (
                  <div className={`flex items-center gap-1 mt-1.5 text-xs ${trendColor(kpi.trend)}`}>
                    {trendIcon(kpi.trend)}
                    {kpi.change} from last month
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Attendance trend */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base">Attendance Trend (Last {chartData.length} Services)</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ResponsiveContainer width="100%" height={200} className="sm:[&]:!h-[260px]">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }} />
                <Line type="monotone" dataKey="attendees" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: 'hsl(var(--accent))' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Additional Insights */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Members</p>
              <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            </div>
            <div className="text-lg sm:text-2xl font-bold font-heading">{stats.activeMembers}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">of {stats.totalMembers} total</p>
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Retention</span>
                <span className="font-medium">{stats.retentionRate}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.retentionRate}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">New Members</p>
              <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            </div>
            <div className="text-lg sm:text-2xl font-bold font-heading">{stats.newMembersThisMonth}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">this month</p>
            {stats.memberGrowth !== 0 && (
              <div className={`flex items-center gap-1 mt-1.5 text-xs ${trendColor(stats.memberGrowth > 0 ? 'up' : 'down')}`}>
                {trendIcon(stats.memberGrowth > 0 ? 'up' : 'down')}
                {Math.abs(stats.memberGrowth)}% vs last month
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">New Visitors</p>
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            </div>
            <div className="text-lg sm:text-2xl font-bold font-heading">{stats.totalNewVisitors}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">total recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Attendance Rate</p>
              <TrendingUpDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            </div>
            <div className="text-lg sm:text-2xl font-bold font-heading">{stats.attendanceRate}%</div>
            <p className="text-xs sm:text-sm text-muted-foreground">avg vs total members</p>
            <div className="mt-2">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${stats.attendanceRate >= 70 ? 'bg-green-500' : stats.attendanceRate >= 50 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                  style={{ width: `${Math.min(100, stats.attendanceRate)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
