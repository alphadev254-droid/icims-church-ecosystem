import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard';
import { attendanceService } from '@/services/attendance';
import { useAuth } from '@/contexts/AuthContext';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Minus, Users, HandCoins, ClipboardList, Calendar, Lock } from 'lucide-react';
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
      target: 4,
      progress: Math.min(100, Math.round(((stats.upcomingEvents ?? 0) / 4) * 100)),
      trend: (stats.upcomingEvents ?? 0) >= 2 ? 'up' : 'flat',
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
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Performance</h1>
        <p className="text-sm text-muted-foreground">KPI tracking and ministry performance overview</p>
      </div>

      {/* Health score */}
      <Card className="bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Overall Church Health Score</p>
            <div className={`text-5xl font-bold font-heading mt-1 ${healthColor}`}>{healthScore}<span className="text-2xl text-muted-foreground">/100</span></div>
          </div>
          <div className="w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius={48}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 7, fill: 'hsl(var(--muted-foreground))' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} />
                <Radar dataKey="score" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold font-heading">{kpi.value}</div>
                {kpi.target && (
                  <p className="text-xs text-muted-foreground mt-0.5">Target: {kpi.target}</p>
                )}
                {/* Progress bar */}
                <div className="mt-3">
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
                  <div className={`flex items-center gap-1 mt-2 text-xs ${trendColor(kpi.trend)}`}>
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
          <CardHeader>
            <CardTitle className="text-base">Attendance Trend (Last {chartData.length} Services)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6 }} />
                <Line type="monotone" dataKey="attendees" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: 'hsl(var(--accent))' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Ministry targets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ministry Targets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { ministry: 'Youth Ministry', target: 'Grow youth attendance by 20%', status: 'on-track', progress: 72 },
              { ministry: 'Outreach', target: '2 community outreach events per month', status: 'behind', progress: 45 },
              { ministry: 'Giving', target: 'Increase tithe participation by 15%', status: 'on-track', progress: 81 },
              { ministry: 'Bible Study', target: '80% of members in a study group', status: 'behind', progress: 38 },
            ].map(item => (
              <div key={item.ministry} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.ministry}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      item.status === 'on-track'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}>{item.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{item.target}</p>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.progress >= 70 ? 'bg-green-500' : 'bg-yellow-500'}`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold w-10 text-right">{item.progress}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
