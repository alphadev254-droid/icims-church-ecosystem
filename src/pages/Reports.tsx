import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard';
import { membersService } from '@/services/members';
import { givingService } from '@/services/giving';
import { attendanceService } from '@/services/attendance';
import { useAuth } from '@/contexts/AuthContext';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, HandCoins, ClipboardList, Calendar, Download, FileText, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const PIE_COLORS = ['hsl(var(--accent))', '#3b82f6', '#f59e0b', '#10b981', '#ef4444'];

function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const content = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { user } = useAuth();
  const hasReports = useHasFeature('reports_analytics');

  const { data: stats } = useQuery({ queryKey: ['dashboard-stats', user?.churchId], queryFn: () => dashboardService.getStats(user?.churchId), enabled: !!user && hasReports });
  const { data: members = [], isLoading: ml } = useQuery({ queryKey: ['members'], queryFn: membersService.getAll, enabled: hasReports });
  const { data: donations = [], isLoading: dl } = useQuery({ queryKey: ['giving'], queryFn: givingService.getAll, enabled: hasReports });
  const { data: attendance = [], isLoading: al } = useQuery({ queryKey: ['attendance'], queryFn: attendanceService.getAll, enabled: hasReports });

  if (!hasReports) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Generate and export comprehensive reports across all modules</p>
        </div>
        <Alert className="border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Reports & Analytics is not available in your current package.{' '}
            <Link to="/dashboard/packages" className="font-medium underline">
              Upgrade now
            </Link>{' '}
            to unlock advanced reporting features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isLoading = ml || dl || al;

  // Membership by status
  const statusCount = (members as any[]).reduce((acc: Record<string, number>, m: any) => {
    acc[m.status] = (acc[m.status] ?? 0) + 1;
    return acc;
  }, {});
  const memberPieData = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

  // Giving by type
  const typeCount = (donations as any[]).reduce((acc: Record<string, number>, d: any) => {
    acc[d.type] = (acc[d.type] ?? 0) + d.amount;
    return acc;
  }, {});
  const givingPieData = Object.entries(typeCount).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Math.round(value as number),
  }));

  // Attendance bar (last 6)
  const attChartData = [...(attendance as any[])].reverse().slice(-6).map((r: any) => ({
    date: new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    attendees: r.totalAttendees,
  }));

  const handleExportMembers = () => {
    downloadCSV(
      'members-report.csv',
      (members as any[]).map(m => [m.memberId ?? '', m.firstName, m.lastName, m.email ?? '', m.phone, m.status, new Date(m.createdAt).toLocaleDateString()]),
      ['Member ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Status', 'Joined'],
    );
  };

  const handleExportGiving = () => {
    downloadCSV(
      'giving-report.csv',
      (donations as any[]).map(d => [d.memberName, d.amount, d.type, d.method, d.status, new Date(d.date).toLocaleDateString()]),
      ['Member', 'Amount (MWK)', 'Type', 'Method', 'Status', 'Date'],
    );
  };

  const handleExportAttendance = () => {
    downloadCSV(
      'attendance-report.csv',
      (attendance as any[]).map(a => [new Date(a.date).toLocaleDateString(), a.serviceType, a.totalAttendees, a.newVisitors ?? 0, a.notes ?? '']),
      ['Date', 'Service Type', 'Total Attendees', 'New Visitors', 'Notes'],
    );
  };

  const reportCards = [
    {
      title: 'Membership Report',
      description: 'Complete list of all registered members with status and contact info.',
      icon: Users,
      count: (members as any[]).length,
      unit: 'members',
      onExport: handleExportMembers,
    },
    {
      title: 'Giving Report',
      description: 'All donation records including type, method, amount, and status.',
      icon: HandCoins,
      count: (donations as any[]).length,
      unit: 'records',
      onExport: handleExportGiving,
    },
    {
      title: 'Attendance Report',
      description: 'Service attendance records with visitor counts and notes.',
      icon: ClipboardList,
      count: (attendance as any[]).length,
      unit: 'services',
      onExport: handleExportAttendance,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">Generate and export comprehensive reports across all modules</p>
      </div>

      {/* Summary banner */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Members', value: stats.totalMembers, icon: Users },
            { label: 'Total Giving', value: `MWK ${Number(stats.totalDonations).toLocaleString()}`, icon: HandCoins },
            { label: 'Avg. Attendance', value: stats.averageAttendance, icon: ClipboardList },
            { label: 'Upcoming Events', value: stats.upcomingEvents ?? 0, icon: Calendar },
          ].map(item => {
            const Icon = item.icon;
            return (
              <Card key={item.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-md">
                    <Icon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-lg font-bold font-heading">{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Export cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {reportCards.map(card => {
              const Icon = card.icon;
              return (
                <Card key={card.title}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent/10 rounded-md">
                        <Icon className="h-4 w-4 text-accent" />
                      </div>
                      <CardTitle className="text-sm">{card.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">{card.description}</p>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{card.count} {card.unit}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={card.onExport}
                      disabled={card.count === 0}
                    >
                      <Download className="h-3.5 w-3.5" /> Export CSV
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {memberPieData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Members by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={memberPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                        {memberPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {givingPieData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Giving by Type (MWK)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={givingPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                        {givingPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `MWK ${v.toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {attChartData.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Recent Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={attChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6 }} />
                      <Bar dataKey="attendees" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
