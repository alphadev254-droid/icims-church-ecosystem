import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard';
import { membersService } from '@/services/members';
import { givingService } from '@/services/giving';
import { attendanceService } from '@/services/attendance';
import { kpiService, KPI, CreateKPIData } from '@/services/kpi';
import { churchesService } from '@/services/churches';
import { useAuth } from '@/contexts/AuthContext';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { useRole } from '@/hooks/useRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Users, HandCoins, ClipboardList, Calendar, Download, FileText, Lock, Target, Plus, RefreshCw, Pencil, StopCircle, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsService } from '@/services/events';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

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
  const { hasPermission } = useRole();
  const queryClient = useQueryClient();
  const [kpiDialogOpen, setKpiDialogOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KPI | null>(null);
  
  // Filter states
  const [memberChurchFilter, setMemberChurchFilter] = useState('all');
  const [givingCategoryFilter, setGivingCategoryFilter] = useState('all');
  const [attendanceServiceFilter, setAttendanceServiceFilter] = useState('all');

  const { data: stats } = useQuery({ queryKey: ['dashboard-stats', user?.churchId], queryFn: () => dashboardService.getStats(user?.churchId), enabled: !!user && hasReports });
  const { data: churches = [] } = useQuery({ queryKey: ['churches'], queryFn: churchesService.getAll, enabled: hasReports });
  const { data: campaigns = [] } = useQuery({ queryKey: ['campaigns'], queryFn: givingService.getCampaigns, enabled: hasReports });
  const { data: kpis = [], isLoading: kl } = useQuery({ queryKey: ['kpis'], queryFn: kpiService.getAll, enabled: hasReports });

  const calculateMutation = useMutation({
    mutationFn: kpiService.calculate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      toast.success('KPIs updated successfully');
    },
  });

  const deleteKpiMutation = useMutation({
    mutationFn: kpiService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      toast.success('KPI deleted');
    },
  });

  const toggleRecurringMutation = useMutation({
    mutationFn: ({ id, recurringActive }: { id: string; recurringActive: boolean }) =>
      kpiService.update(id, { recurringActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      toast.success('Recurring status updated');
    },
  });

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

  if (!hasPermission('reports:read')) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Generate and export comprehensive reports across all modules</p>
        </div>
        <Alert className="border-red-200 bg-red-50">
          <Lock className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You do not have permission to access Reports & Analytics.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isLoading = false;

  const handleExportMembers = async () => {
    const response = await membersService.getAll(memberChurchFilter !== 'all' ? { churchId: memberChurchFilter } : undefined);
    const members = response || [];
    downloadCSV(
      'members-report.csv',
      members.map(m => [m.memberId ?? '', m.firstName, m.lastName, m.email ?? '', m.phone, m.status, new Date(m.createdAt).toLocaleDateString()]),
      ['Member ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Status', 'Joined'],
    );
  };

  const handleExportGiving = async () => {
    const response = await givingService.getDonations(givingCategoryFilter !== 'all' ? givingCategoryFilter : undefined);
    const donations = response || [];
    downloadCSV(
      'giving-report.csv',
      donations.map(d => [
        d.user?.firstName + ' ' + d.user?.lastName || d.donorName || 'Anonymous',
        d.amount.toString(),
        d.currency,
        d.campaign?.name || '',
        d.campaign?.category || '',
        d.paymentMethod || 'N/A',
        d.status,
        new Date(d.createdAt).toLocaleDateString()
      ]),
      ['Member', 'Amount', 'Currency', 'Campaign', 'Category', 'Method', 'Status', 'Date'],
    );
  };

  const handleExportAttendance = async () => {
    const response = await attendanceService.getAll(attendanceServiceFilter !== 'all' ? { serviceType: attendanceServiceFilter } : undefined);
    const attendance = response || [];
    downloadCSV(
      'attendance-report.csv',
      attendance.map(a => [
        new Date(a.date).toLocaleDateString(),
        (a as any).church?.name || '',
        a.serviceType,
        a.totalAttendees.toString(),
        ((a as any).maleCount ?? 0).toString(),
        ((a as any).femaleCount ?? 0).toString(),
        ((a as any).children ?? 0).toString(),
        ((a as any).youth ?? 0).toString(),
        ((a as any).youngAdults ?? 0).toString(),
        ((a as any).adults ?? 0).toString(),
        ((a as any).seniors ?? 0).toString(),
        (a.newVisitors ?? 0).toString(),
        a.notes ?? ''
      ]),
      ['Date', 'Church', 'Service Type', 'Total', 'Male', 'Female', 'Children', 'Youth', 'Young Adults', 'Adults', 'Seniors', 'New Visitors', 'Notes'],
    );
  };

  const handleExportKPIs = () => {
    downloadCSV(
      'kpi-report.csv',
      (kpis as KPI[]).map(k => {
        const achievement = k.targetValue > 0 ? Math.round((k.currentValue / k.targetValue) * 100) : 0;
        return [
          k.name,
          k.description || '',
          k.category,
          k.metricType,
          k.attendanceType || 'N/A',
          k.targetValue.toString(),
          k.currentValue.toString(),
          `${achievement}%`,
          k.unit,
          k.period,
          new Date(k.startDate).toLocaleDateString(),
          new Date(k.endDate).toLocaleDateString(),
          k.isRecurring ? 'Yes' : 'No',
          k.recurringActive ? 'Active' : 'Paused',
          k.status,
          k.church?.name || 'All Churches',
        ];
      }),
      ['KPI Name', 'Description', 'Category', 'Metric Type', 'Attendance Type', 'Target', 'Current', 'Achievement', 'Unit', 'Period', 'Start Date', 'End Date', 'Recurring', 'Recurring Status', 'Status', 'Church'],
    );
  };

  const reportCards = [
    {
      title: 'Membership Report',
      description: 'Complete list of all registered members with status and contact info.',
      icon: Users,
      count: stats?.totalMembers || 0,
      unit: 'members',
      onExport: handleExportMembers,
      filterComponent: (
        <div className="mb-3">
          <Label className="text-xs">Filter by Church</Label>
          <Select value={memberChurchFilter} onValueChange={setMemberChurchFilter}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Churches" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Churches</SelectItem>
              {(churches as any[]).map(church => (
                <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      title: 'Giving Report',
      description: 'All donation records including type, method, amount, and status.',
      icon: HandCoins,
      count: stats?.totalDonations ? Math.round(stats.totalDonations) : 0,
      unit: 'MWK',
      onExport: handleExportGiving,
      filterComponent: (
        <div className="mb-3">
          <Label className="text-xs">Filter by Campaign</Label>
          <Select value={givingCategoryFilter} onValueChange={setGivingCategoryFilter}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Campaigns" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {(campaigns as any[]).map(campaign => (
                <SelectItem key={campaign.id} value={campaign.id}>{campaign.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      title: 'Attendance Report',
      description: 'Service attendance records with visitor counts and notes.',
      icon: ClipboardList,
      count: stats?.averageAttendance || 0,
      unit: 'avg',
      onExport: handleExportAttendance,
      filterComponent: (
        <div className="mb-3">
          <Label className="text-xs">Filter by Service Type</Label>
          <Select value={attendanceServiceFilter} onValueChange={setAttendanceServiceFilter}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Services" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="Sunday Service">Sunday Service</SelectItem>
              <SelectItem value="Midweek Service">Midweek Service</SelectItem>
              <SelectItem value="Prayer Meeting">Prayer Meeting</SelectItem>
              <SelectItem value="Youth Service">Youth Service</SelectItem>
              <SelectItem value="Special Service">Special Service</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
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

      {/* KPI Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-md">
                <Target className="h-4 w-4 text-accent" />
              </div>
              <div>
                <CardTitle className="text-base">KPI Targets</CardTitle>
                <p className="text-xs text-muted-foreground">Track performance against your goals</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => calculateMutation.mutate()}
                disabled={calculateMutation.isPending}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${calculateMutation.isPending ? 'animate-spin' : ''}`} />
                Update
              </Button>
              {hasPermission('reports:create') && (
                <Dialog open={kpiDialogOpen} onOpenChange={setKpiDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-3.5 w-3.5 mr-1.5" /> New KPI
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create KPI Target</DialogTitle>
                    </DialogHeader>
                    <KPIForm onClose={() => setKpiDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              )}
              {hasPermission('reports:update') && (
                <Dialog open={!!editingKpi} onOpenChange={(open) => !open && setEditingKpi(null)}>
                  <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit KPI Target</DialogTitle>
                    </DialogHeader>
                    <KPIForm kpi={editingKpi!} onClose={() => setEditingKpi(null)} />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {kl ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
          ) : kpis.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No KPIs yet. Create your first target to track performance.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(kpis as KPI[]).map(kpi => {
                const achievement = kpi.targetValue > 0 ? (kpi.currentValue / kpi.targetValue) * 100 : 0;
                const status = achievement >= 100 ? 'achieved' : achievement >= 75 ? 'on-track' : achievement >= 50 ? 'at-risk' : 'behind';
                const statusColors = {
                  achieved: 'text-green-600',
                  'on-track': 'text-blue-600',
                  'at-risk': 'text-amber-600',
                  behind: 'text-red-600',
                };
                return (
                  <div key={kpi.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{kpi.name}</h4>
                          <span className="text-xs px-2 py-0.5 bg-muted rounded">{kpi.category}</span>
                          {kpi.status === 'completed' && (
                            <span className="text-xs px-2 py-0.5 bg-gray-200 rounded">Completed</span>
                          )}
                          {kpi.isRecurring && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                              🔄 Recurring ({kpi.period})
                            </span>
                          )}
                        </div>
                        {kpi.description && <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{kpi.period}</span>
                          <span>•</span>
                          <span>{new Date(kpi.startDate).toLocaleDateString()} - {new Date(kpi.endDate).toLocaleDateString()}</span>
                          {kpi.church && (
                            <>
                              <span>•</span>
                              <span>{kpi.church.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {kpi.isRecurring && kpi.status === 'active' && hasPermission('reports:update') && (
                          <button
                            onClick={() => toggleRecurringMutation.mutate({ id: kpi.id, recurringActive: !kpi.recurringActive })}
                            className="text-xs text-muted-foreground hover:text-accent"
                            title={kpi.recurringActive ? 'Stop Recurring' : 'Resume Recurring'}
                          >
                            {kpi.recurringActive ? <StopCircle className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
                          </button>
                        )}
                        {kpi.status !== 'completed' && hasPermission('reports:update') && (
                          <button
                            onClick={() => setEditingKpi(kpi)}
                            className="text-xs text-muted-foreground hover:text-accent"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {hasPermission('reports:delete') && (
                          <button
                            onClick={() => deleteKpiMutation.mutate(kpi.id)}
                            className="text-xs text-muted-foreground hover:text-destructive"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {kpi.currentValue.toLocaleString()} / {kpi.targetValue.toLocaleString()} {kpi.unit}
                        </span>
                        <span className={`font-semibold ${statusColors[status]}`}>
                          {Math.round(achievement)}%
                        </span>
                      </div>
                      <Progress value={Math.min(achievement, 100)} className="h-2" />
                    </div>
                  </div>
                );
              })}
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-2"
                onClick={handleExportKPIs}
                disabled={kpis.length === 0}
              >
                <Download className="h-3.5 w-3.5" /> Export KPI Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
                    {(card as any).filterComponent}
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
        </>
      )}
    </div>
  );
}

function KPIForm({ kpi, onClose }: { kpi?: KPI | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: churches = [] } = useQuery({ queryKey: ['churches'], queryFn: churchesService.getAll });
  const [name, setName] = useState(kpi?.name || '');
  const [description, setDescription] = useState(kpi?.description || '');
  const [category, setCategory] = useState(kpi?.category || 'Attendance');
  const [metricType, setMetricType] = useState(kpi?.metricType || 'total_attendance');
  const [attendanceType, setAttendanceType] = useState(kpi?.attendanceType || 'regular');
  const [eventId, setEventId] = useState(kpi?.eventId || '');
  const [isRecurring, setIsRecurring] = useState(kpi?.isRecurring || false);
  const [targetValue, setTargetValue] = useState(kpi?.targetValue?.toString() || '');
  const [period, setPeriod] = useState(kpi?.period || 'monthly');
  const [startDate, setStartDate] = useState(kpi?.startDate?.split('T')[0] || '');
  const [endDate, setEndDate] = useState(kpi?.endDate?.split('T')[0] || '');
  const [churchId, setChurchId] = useState(kpi?.churchId || user?.churchId || '');

  // Auto-fill end date when recurring is enabled and start date changes
  useEffect(() => {
    if (isRecurring && startDate) {
      const start = new Date(startDate);
      let end = new Date(start);
      
      if (period === 'monthly') {
        end.setMonth(end.getMonth() + 1);
        end.setDate(end.getDate() - 1); // One day before next month
      } else if (period === 'quarterly') {
        end.setMonth(end.getMonth() + 3);
        end.setDate(end.getDate() - 1); // One day before next quarter
      } else if (period === 'yearly') {
        end.setFullYear(end.getFullYear() + 1);
        end.setDate(end.getDate() - 1); // One day before next year
      }
      
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [isRecurring, period, startDate]);

  // Reset to regular attendance when recurring is enabled
  useEffect(() => {
    if (isRecurring && attendanceType === 'event') {
      setAttendanceType('regular');
      setEventId('');
    }
  }, [isRecurring]);

  // Fetch all accessible events (backend filters by user's accessible churches)
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: eventsService.getAll,
    enabled: category === 'Attendance' && attendanceType === 'event',
  });

  const metricOptions: Record<string, { value: string; label: string; unit: string }[]> = {
    Attendance: [
      { value: 'total_attendance', label: 'Total Attendance', unit: 'people' },
      { value: 'average_attendance', label: 'Average Attendance', unit: 'people' },
    ],
    Giving: [
      { value: 'total_giving', label: 'Total Giving', unit: 'MWK' },
    ],
    Membership: [
      { value: 'new_members', label: 'New Members', unit: 'people' },
    ],
    Events: [
      { value: 'event_count', label: 'Event Count', unit: 'events' },
    ],
  };

  const currentMetrics = metricOptions[category] || [];
  const currentUnit = currentMetrics.find(m => m.value === metricType)?.unit || 'people';

  const createMutation = useMutation({
    mutationFn: (data: CreateKPIData) => kpiService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      toast.success('KPI created successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create KPI');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateKPIData) => kpiService.update(kpi!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      toast.success('KPI updated successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update KPI');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      name,
      description: description || undefined,
      category,
      metricType,
      targetValue: parseFloat(targetValue),
      unit: currentUnit,
      period,
      startDate,
      endDate,
      churchId,
      isRecurring,
    };
    
    // Add attendance-specific fields
    if (category === 'Attendance') {
      data.attendanceType = attendanceType;
      if (attendanceType === 'event' && eventId) {
        data.eventId = eventId;
      }
    }
    
    if (kpi) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Church <span className="text-destructive">*</span></Label>
        <Select value={churchId} onValueChange={setChurchId} required>
          <SelectTrigger><SelectValue placeholder="Select a church" /></SelectTrigger>
          <SelectContent>
            {(churches as any[]).map(church => (
              <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>KPI Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Q1 Attendance Goal" required />
      </div>
      <div>
        <Label>Description (Optional)</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this KPI" rows={2} />
      </div>
      <div className="flex items-center justify-between p-3 border rounded-md">
        <div>
          <Label className="text-sm font-medium">Recurring KPI</Label>
          <p className="text-xs text-muted-foreground">Auto-create this KPI for next period</p>
        </div>
        <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
      </div>
      {isRecurring && (
        <>
          <div>
            <Label>Period <span className="text-destructive">*</span></Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Dates will auto-fill for current {period} period</p>
          </div>
          <Alert className="border-green-200 bg-green-50">
            <p className="text-xs text-green-800">
              Select your start date and end date will auto-calculate based on the period.
            </p>
          </Alert>
        </>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => { setCategory(v); setMetricType(metricOptions[v][0].value); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Attendance">Attendance</SelectItem>
              <SelectItem value="Giving">Giving</SelectItem>
              <SelectItem value="Membership">Membership</SelectItem>
              <SelectItem value="Events">Events</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Metric Type</Label>
          <Select value={metricType} onValueChange={setMetricType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {currentMetrics.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {category === 'Attendance' && !isRecurring && (
        <>
          <div>
            <Label>Attendance Type</Label>
            <Select value={attendanceType} onValueChange={setAttendanceType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular Service</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {attendanceType === 'event' && (
            <div>
              <Label>Select Event (Optional)</Label>
              <Select value={eventId || 'all'} onValueChange={(v) => setEventId(v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="All Events" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {(events as any[]).map(event => (
                    <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Leave empty to track all event attendance</p>
            </div>
          )}
        </>
      )}
      <div>
        <Label>Target Value</Label>
        <Input type="number" value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder="1000" required />
        <p className="text-xs text-muted-foreground mt-1">Unit: {currentUnit}</p>
      </div>
      {!isRecurring && (
        <div>
          <Label>Period</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start Date</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
          {isRecurring && <p className="text-xs text-muted-foreground mt-1">Choose your period start</p>}
        </div>
        <div>
          <Label>End Date</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required disabled={isRecurring} />
          {isRecurring && <p className="text-xs text-muted-foreground mt-1">Auto-calculated</p>}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1">
          {kpi ? (updateMutation.isPending ? 'Updating...' : 'Update KPI') : (createMutation.isPending ? 'Creating...' : 'Create KPI')}
        </Button>
      </div>
    </form>
  );
}
