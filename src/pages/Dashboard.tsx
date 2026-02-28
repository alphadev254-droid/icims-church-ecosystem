import { useEffect, useState } from 'react';
import { dashboardApi } from '@/services/api';
import type { DashboardStats } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Church, HandCoins, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const attendanceData = [
  { week: 'Week 1', attendees: 220 },
  { week: 'Week 2', attendees: 258 },
  { week: 'Week 3', attendees: 230 },
  { week: 'Week 4', attendees: 245 },
];

const givingData = [
  { month: 'Sep', amount: 85000 },
  { month: 'Oct', amount: 92000 },
  { month: 'Nov', amount: 78000 },
  { month: 'Dec', amount: 120000 },
  { month: 'Jan', amount: 95000 },
  { month: 'Feb', amount: 100500 },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    dashboardApi.getStats().then(res => {
      if (res.success) setStats(res.data);
    });
  }, []);

  if (!stats) {
    return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;
  }

  const statCards = [
    { title: 'Total Members', value: stats.totalMembers, icon: Users, change: stats.memberGrowth, up: true },
    { title: 'Churches', value: stats.totalChurches, icon: Church, change: 0, up: true },
    { title: 'Total Giving', value: `KES ${stats.totalDonations.toLocaleString()}`, icon: HandCoins, change: stats.donationGrowth, up: true },
    { title: 'Avg. Attendance', value: stats.averageAttendance, icon: Calendar, change: 5.2, up: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Welcome back, {user?.firstName}</h1>
        <p className="text-sm text-muted-foreground">Here's what's happening across your churches.</p>
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
                  {s.up ? <TrendingUp className="h-3 w-3 text-success" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
                  <span className={s.up ? 'text-success' : 'text-destructive'}>{s.change}%</span> from last month
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', color: 'hsl(var(--foreground))' }} />
                <Bar dataKey="attendees" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Giving (KES)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={givingData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', color: 'hsl(var(--foreground))' }} />
                <Line type="monotone" dataKey="amount" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: 'hsl(var(--accent))' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
