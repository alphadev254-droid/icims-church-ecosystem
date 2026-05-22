import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard';
import { membersService } from '@/services/members';
import { givingService } from '@/services/giving';
import { attendanceService } from '@/services/attendance';
import { kpiService, KPI, CreateKPIData } from '@/services/kpi';
import { churchesService } from '@/services/churches';
import { transactionsService } from '@/services/transactions';
import { cellsService } from '@/services/cells';
import { teamsService } from '@/services/teams';
import { useAuth } from '@/contexts/AuthContext';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { useRole } from '@/hooks/useRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Users, HandCoins, ClipboardList, Calendar, Download, FileText, Lock, Target, Plus, RefreshCw, Pencil, StopCircle, PlayCircle, UserX, Group, CreditCard, Handshake, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [deleteKpi, setDeleteKpi] = useState<KPI | null>(null);
  const [kpiDialogOpen, setKpiDialogOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KPI | null>(null);
  
  // Filter states
  const [memberChurchFilter, setMemberChurchFilter] = useState('all');
  const [givingCampaignFilter, setGivingCampaignFilter] = useState('all');
  const [givingChurchFilter, setGivingChurchFilter] = useState('all');
  const [attendanceServiceFilter, setAttendanceServiceFilter] = useState('all');
  const [attendanceChurchFilter, setAttendanceChurchFilter] = useState('all');
  // New report filters
  const [inactiveMemberChurchFilter, setInactiveMemberChurchFilter] = useState('all');
  const [pledgeChurchFilter, setPledgeChurchFilter] = useState('all');
  const [pledgeStatusFilter, setPledgeStatusFilter] = useState('all');
  const [txChurchFilter, setTxChurchFilter] = useState('all');
  const [txTypeFilter, setTxTypeFilter] = useState('all');
  const [txStartDate, setTxStartDate] = useState('');
  const [txEndDate, setTxEndDate] = useState('');
  const [givingByMemberChurchFilter, setGivingByMemberChurchFilter] = useState('all');
  const [givingByMemberStartDate, setGivingByMemberStartDate] = useState('');
  const [givingByMemberEndDate, setGivingByMemberEndDate] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState('all');
  const [memberCellFilter, setMemberCellFilter] = useState('all');
  const [memberTeamFilter, setMemberTeamFilter] = useState('all');
  const [givingCellFilter, setGivingCellFilter] = useState('all');
  const [batchSizeMap, setBatchSizeMap] = useState<Record<string, number>>({});
  const [batchPageMap, setBatchPageMap] = useState<Record<string, number>>({});
  const [batchTotalPagesMap, setBatchTotalPagesMap] = useState<Record<string, number>>({});

  // ── Batch-export helpers ─────────────────────────────────────────────────────
  const getBatchParams = (title: string) => {
    const bSize = batchSizeMap[title] ?? 0;
    const bPage = batchPageMap[title] ?? 1;
    return bSize > 0 ? { limit: bSize, page: bPage, export: true } : { export: true };
  };
  const handleBatchResponse = (title: string, response: any) => {
    if (response?.pagination?.totalPages) {
      setBatchTotalPagesMap(prev => ({ ...prev, [title]: response.pagination.totalPages }));
    }
  };

  const [cellChurchFilter, setCellChurchFilter] = useState('all');
  const [cellGroupCellFilter, setCellGroupCellFilter] = useState('all');
  const [cellGroupStartDate, setCellGroupStartDate] = useState('');
  const [cellGroupEndDate, setCellGroupEndDate] = useState('');
  const [givingCategoryFilter, setGivingCategoryFilter] = useState('all');
  const [givingStartDate, setGivingStartDate] = useState('');
  const [givingEndDate, setGivingEndDate] = useState('');
  const [attendanceStartDate, setAttendanceStartDate] = useState('');
  const [attendanceEndDate, setAttendanceEndDate] = useState('');
  const [pledgeStartDate, setPledgeStartDate] = useState('');
  const [pledgeEndDate, setPledgeEndDate] = useState('');
  const [visitorChurchFilter, setVisitorChurchFilter] = useState('all');
  const [visitorCellFilter, setVisitorCellFilter] = useState('all');
  const [visitorStartDate, setVisitorStartDate] = useState('');
  const [visitorEndDate, setVisitorEndDate] = useState('');
  const [churchVisitorChurchFilter, setChurchVisitorChurchFilter] = useState('all');
  const [churchVisitorServiceType, setChurchVisitorServiceType] = useState('all');
  const [churchVisitorStartDate, setChurchVisitorStartDate] = useState('');
  const [churchVisitorEndDate, setChurchVisitorEndDate] = useState('');

  // ── Fetch batch total-pages when filters change ──────────────────────────
  // Proactively fetch totalPages so page nav shows "P1 of 47" immediately
  // instead of only after the first export.
  useEffect(() => {
    const timer = setTimeout(async () => {
      const cards = Object.entries(batchSizeMap).filter(([_, s]) => s > 0);
      if (cards.length === 0) return;

      await Promise.allSettled(
        cards.map(async ([title, limit]) => {
          let response: any;
          const page = 1;

          switch (title) {
            case 'Membership Report': {
              const p: any = { limit, page, export: true };
              if (memberChurchFilter !== 'all') p.churchId = memberChurchFilter;
              if (memberStatusFilter !== 'all') p.status = memberStatusFilter;
              if (memberCellFilter !== 'all') p.cellId = memberCellFilter;
              if (memberTeamFilter !== 'all') p.teamId = memberTeamFilter;
              response = await membersService.getAll(p);
              break;
            }
            case 'Giving Report': {
              const p: any = {
                limit, page, export: true,
                category: givingCategoryFilter !== 'all' ? givingCategoryFilter : undefined,
                cellId: givingCellFilter !== 'all' ? givingCellFilter : undefined,
                startDate: givingStartDate || undefined,
                endDate: givingEndDate || undefined,
              };
              response = await givingService.getDonations(
                givingCampaignFilter !== 'all' ? givingCampaignFilter : undefined,
                givingChurchFilter !== 'all' ? givingChurchFilter : undefined,
                p,
              );
              break;
            }
            case 'Attendance Report': {
              const p: any = { limit, page, export: true };
              if (attendanceServiceFilter !== 'all') p.serviceType = attendanceServiceFilter;
              if (attendanceChurchFilter !== 'all') p.churchId = attendanceChurchFilter;
              if (attendanceStartDate) p.startDate = attendanceStartDate;
              if (attendanceEndDate) p.endDate = attendanceEndDate;
              response = await attendanceService.getAll(p);
              break;
            }
            case 'Inactive Members Report': {
              const p: any = { limit, page, export: true, status: 'inactive' };
              if (inactiveMemberChurchFilter !== 'all') p.churchId = inactiveMemberChurchFilter;
              response = await membersService.getAll(p);
              break;
            }
            case 'Pledge Report': {
              const p: any = { limit, page, export: true };
              if (pledgeChurchFilter !== 'all') p.churchId = pledgeChurchFilter;
              if (pledgeStatusFilter !== 'all') p.status = pledgeStatusFilter;
              if (pledgeStartDate) p.startDate = pledgeStartDate;
              if (pledgeEndDate) p.endDate = pledgeEndDate;
              response = await givingService.getMinistryPledges(p);
              break;
            }
            case 'Transaction Report': {
              const p: any = { limit, page, export: true };
              if (txChurchFilter !== 'all') p.churchId = txChurchFilter;
              if (txTypeFilter !== 'all') p.type = txTypeFilter;
              if (txStartDate) p.startDate = txStartDate;
              if (txEndDate) p.endDate = txEndDate;
              response = await transactionsService.exportAll(p);
              break;
            }
            case 'Cell Groups Report': {
              const p: any = { limit, page, export: true };
              if (cellChurchFilter !== 'all') p.churchId = cellChurchFilter;
              if (cellGroupCellFilter !== 'all') p.cellId = cellGroupCellFilter;
              if (cellGroupStartDate) p.startDate = cellGroupStartDate;
              if (cellGroupEndDate) p.endDate = cellGroupEndDate;
              response = await cellsService.getAll(p);
              break;
            }
            case 'Cell Visitors Report': {
              const p: any = { limit, page, export: true };
              if (visitorChurchFilter !== 'all') p.churchId = visitorChurchFilter;
              if (visitorCellFilter !== 'all') p.cellId = visitorCellFilter;
              if (visitorStartDate) p.startDate = visitorStartDate;
              if (visitorEndDate) p.endDate = visitorEndDate;
              response = await cellsService.getVisitors(p);
              break;
            }
            case 'Church Visitors Report': {
              const p: any = { limit, page, export: true };
              if (churchVisitorChurchFilter !== 'all') p.churchId = churchVisitorChurchFilter;
              if (churchVisitorServiceType !== 'all') p.serviceType = churchVisitorServiceType;
              if (churchVisitorStartDate) p.startDate = churchVisitorStartDate;
              if (churchVisitorEndDate) p.endDate = churchVisitorEndDate;
              response = await attendanceService.getServiceVisitors(p);
              break;
            }
            default:
              return;
          }

          // Extract pagination — response is either { data, pagination } or raw array
          const pagination =
            response?.pagination ??
            (response as any)?.pagination;

          if (pagination?.totalPages != null) {
            setBatchTotalPagesMap(prev => ({ ...prev, [title]: pagination.totalPages }));
          }
        })
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [
    batchSizeMap,
    memberChurchFilter, memberStatusFilter, memberCellFilter, memberTeamFilter,
    givingCategoryFilter, givingCampaignFilter, givingChurchFilter, givingCellFilter,
    givingStartDate, givingEndDate,
    attendanceServiceFilter, attendanceChurchFilter, attendanceStartDate, attendanceEndDate,
    inactiveMemberChurchFilter,
    pledgeChurchFilter, pledgeStatusFilter, pledgeStartDate, pledgeEndDate,
    txChurchFilter, txTypeFilter, txStartDate, txEndDate,
    cellChurchFilter, cellGroupCellFilter, cellGroupStartDate, cellGroupEndDate,
    visitorChurchFilter, visitorCellFilter, visitorStartDate, visitorEndDate,
    churchVisitorChurchFilter, churchVisitorServiceType, churchVisitorStartDate, churchVisitorEndDate,
  ]);

  const { data: stats } = useQuery({ queryKey: ['dashboard-stats'], queryFn: () => dashboardService.getStats(), enabled: !!user && hasReports });
  const { data: churches = [] } = useQuery({ queryKey: ['churches'], queryFn: () => churchesService.getAll(), enabled: hasReports });
  const { data: campaigns = [] } = useQuery({ queryKey: ['campaigns'], queryFn: () => givingService.getCampaigns(), enabled: hasReports });
  const { data: simpleCells = [] } = useQuery({ queryKey: ['cells-simple'], queryFn: () => cellsService.getSimple(), enabled: hasReports });
  const { data: teams = [] } = useQuery({ queryKey: ['teams-report', memberChurchFilter], queryFn: () => teamsService.getAll(memberChurchFilter !== 'all' ? memberChurchFilter : undefined), enabled: hasReports });

  // Flatten grouped campaigns if needed
  const flatCampaigns = Array.isArray(campaigns) && (campaigns as any[])[0]?.label
    ? (campaigns as any[]).flatMap((group: any) => group.posts || [])
    : (campaigns as any[]);
  const { data: kpisData = [], isLoading: kl } = useQuery({ queryKey: ['kpis'], queryFn: () => kpiService.getAll(), enabled: hasReports });
  const kpis = kpisData as KPI[];

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
    const batchParams = getBatchParams('Membership Report');
    const response = await membersService.getAll({
      ...(memberChurchFilter !== 'all' ? { churchId: memberChurchFilter } : {}),
      ...(memberStatusFilter !== 'all' ? { status: memberStatusFilter } : {}),
      ...(memberCellFilter !== 'all' ? { cellId: memberCellFilter } : {}),
      ...(memberTeamFilter !== 'all' ? { teamId: memberTeamFilter } : {}),
      ...batchParams,
    });
    handleBatchResponse('Membership Report', response);
    const members: any[] = Array.isArray(response) ? response : (response as any)?.data ?? [];
    downloadCSV(
      'members-report.csv',
      members.map(m => [
        m.firstName,
        m.lastName,
        m.email ?? '',
        m.phone ?? '',
        m.gender ?? '',
        m.dateOfBirth ? new Date(m.dateOfBirth).toLocaleDateString() : '',
        m.maritalStatus ?? '',
        m.weddingDate ? new Date(m.weddingDate).toLocaleDateString() : '',
        m.residentialNeighbourhood ?? '',
        m.serviceInterest ?? '',
        m.membershipType ?? '',
        m.baptizedByImmersion ? 'Yes' : 'No',
        m.church?.name ?? '',
        m.roleName ?? '',
        m.status,
        Array.isArray((m as any).cells) ? (m as any).cells.map((c: any) => c.name).join('; ') : '',
        Array.isArray(m.teams) ? m.teams.join('; ') : '',
        new Date(m.createdAt).toLocaleDateString()
      ]),
      [
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Gender',
        'Date of Birth',
        'Marital Status',
        'Wedding Date',
        'Neighbourhood',
        'Service Interest',
        'Membership Type',
        'Baptized',
        'Church',
        'Role',
        'Status',
        'Cell',
        'Teams',
        'Joined'
      ],
    );
  };

  const handleExportGiving = async () => {
    const batchParams = getBatchParams('Giving Report');
    const response = await givingService.getDonations(
      givingCampaignFilter !== 'all' ? givingCampaignFilter : undefined,
      givingChurchFilter !== 'all' ? givingChurchFilter : undefined,
      {
        category: givingCategoryFilter !== 'all' ? givingCategoryFilter : undefined,
        cellId: givingCellFilter !== 'all' ? givingCellFilter : undefined,
        startDate: givingStartDate || undefined,
        endDate: givingEndDate || undefined,
        ...batchParams,
      }
    );
    handleBatchResponse('Giving Report', response);
    const donations: any[] = Array.isArray(response) ? response : (response as any)?.data ?? [];
    
    downloadCSV(
      'giving-report.csv',
      donations.map((d: any) => [
        d.isAnonymous ? 'Anonymous' : d.isGuest ? (d.guestName || 'Guest') : `${d.user?.firstName ?? ''} ${d.user?.lastName ?? ''}`.trim() || d.donorName || '',
        d.isAnonymous ? '' : d.isGuest ? (d.guestEmail || '') : (d.user?.email || d.donorEmail || ''),
        d.isAnonymous ? '' : d.isGuest ? (d.guestPhone || '') : (d.user?.phone || ''),
        d.isAnonymous ? 'Anonymous' : d.isGuest ? 'Guest' : 'Member',
        d.amount.toString(),
        d.currency,
        d.campaign?.name || '',
        d.campaign?.category || '',
        d.cell?.name || '',
        d.church?.name || '',
        d.paymentMethod || 'N/A',
        d.isManual ? 'Manual' : 'Online',
        d.reference || '',
        d.status,
        new Date(d.createdAt).toLocaleDateString()
      ]),
      ['Name', 'Email', 'Phone', 'Type', 'Amount', 'Currency', 'Campaign', 'Category', 'Cell', 'Church', 'Method', 'Entry', 'Reference', 'Status', 'Date'],
    );
  };

  const handleExportAttendance = async () => {
    const batchParams = getBatchParams('Attendance Report');
    const params: any = { ...batchParams };
    if (attendanceServiceFilter !== 'all') params.serviceType = attendanceServiceFilter;
    if (attendanceChurchFilter !== 'all') params.churchId = attendanceChurchFilter;
    if (attendanceStartDate) params.startDate = attendanceStartDate;
    if (attendanceEndDate) params.endDate = attendanceEndDate;
    
    const response = await attendanceService.getAll(params);
    handleBatchResponse('Attendance & Service Report', response);
    const attendance: any[] = Array.isArray(response) ? response : (response as any)?.data ?? [];
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
        ((a as any).newVisitors ?? 0).toString(),
        (a as any).notes ?? ''
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

  // ── New report export handlers ─────────────────────────────────────────────

  const handleExportInactiveMembers = async () => {
    const batchParams = getBatchParams('Inactive Members Report');
    const response = await membersService.getAll({
      ...(inactiveMemberChurchFilter !== 'all' ? { churchId: inactiveMemberChurchFilter } : {}),
      status: 'inactive',
      ...batchParams,
    } as any);
    handleBatchResponse('Inactive Members Report', response);
    const members: any[] = Array.isArray(response) ? response : (response as any)?.data ?? [];
    downloadCSV(
      'inactive-members-report.csv',
      members.map((m: any) => [
        m.firstName, m.lastName, m.email ?? '', m.phone ?? '',
        m.gender ?? '', m.membershipType ?? '',
        m.baptizedByImmersion ? 'Yes' : 'No',
        m.church?.name ?? '',
        Array.isArray(m.cells) ? m.cells.map((c: any) => c.name).join('; ') : '',
        m.residentialNeighbourhood ?? '',
        m.roleName ?? '', m.status, new Date(m.createdAt).toLocaleDateString(),
      ]),
      ['First Name', 'Last Name', 'Email', 'Phone', 'Gender', 'Membership Type', 'Baptized', 'Church', 'Cell', 'Neighbourhood', 'Role', 'Status', 'Joined'],
    );
  };

  const handleExportPledges = async () => {
    const batchParams = getBatchParams('Pledge Report');
    const response = await givingService.getMinistryPledges({
      ...(pledgeChurchFilter !== 'all' ? { churchId: pledgeChurchFilter } : {}),
      ...(pledgeStatusFilter !== 'all' ? { status: pledgeStatusFilter } : {}),
      ...(pledgeStartDate ? { startDate: pledgeStartDate } : {}),
      ...(pledgeEndDate ? { endDate: pledgeEndDate } : {}),
      ...batchParams,
    });
    handleBatchResponse('Pledge Report', response);
    const pledges: any[] = (response as any)?.data ?? [];
    downloadCSV(
      'pledges-report.csv',
      pledges.map((p: any) => [
        p.user ? `${p.user.firstName} ${p.user.lastName}` : (p.pledgerName || 'Walk-in'),
        p.user?.email || p.pledgerEmail || '',
        p.user?.phone || p.pledgerPhone || '',
        p.campaign?.name || '',
        p.campaign?.category || '',
        p.church?.name || '',
        p.pledgedAmount.toString(),
        p.amountPaid.toString(),
        (p.pledgedAmount - p.amountPaid).toString(),
        p.currency,
        p.status,
        p.fulfillmentDeadline ? new Date(p.fulfillmentDeadline).toLocaleDateString() : '',
        new Date(p.createdAt).toLocaleDateString(),
      ]),
      ['Name', 'Email', 'Phone', 'Campaign', 'Category', 'Church', 'Pledged', 'Paid', 'Outstanding', 'Currency', 'Status', 'Deadline', 'Date'],
    );
  };

  const handleExportTransactions = async () => {
    const batchParams = getBatchParams('Transaction Report');
    const params: any = { ...batchParams };
    if (txChurchFilter !== 'all') params.churchId = txChurchFilter;
    if (txTypeFilter !== 'all') params.type = txTypeFilter;
    if (txStartDate) params.startDate = txStartDate;
    if (txEndDate) params.endDate = txEndDate;
    const response = await transactionsService.exportAll(params);
    handleBatchResponse('Transaction Report', response);
    const transactions: any[] = (response as any)?.data ?? [];
    downloadCSV(
      'transactions-report.csv',
      transactions.map((t: any) => [
        t.user ? `${t.user.firstName} ${t.user.lastName}` : (t.guestName || 'Guest'),
        t.user?.email || t.guestEmail || '',
        t.amount.toString(),
        t.baseAmount?.toString() || '',
        t.currency,
        t.type,
        t.campaignName || '',
        t.campaignCategory || '',
        t.paymentMethod,
        t.status,
        t.gateway || '',
        t.church?.name || '',
        t.isManual ? 'Manual' : 'Online',
        t.reference || '',
        t.paidAt ? new Date(t.paidAt).toLocaleDateString() : '',
        new Date(t.createdAt).toLocaleDateString(),
      ]),
      ['Name', 'Email', 'Amount', 'Base Amount', 'Currency', 'Type', 'Campaign', 'Category', 'Method', 'Status', 'Gateway', 'Church', 'Entry', 'Reference', 'Paid At', 'Date'],
    );
  };

  const handleExportGivingByMember = async () => {
    const params: any = {};
    if (givingByMemberChurchFilter !== 'all') params.churchId = givingByMemberChurchFilter;
    if (givingByMemberStartDate) params.startDate = givingByMemberStartDate;
    if (givingByMemberEndDate) params.endDate = givingByMemberEndDate;
    const data = await transactionsService.getGivingByMember(params);
    downloadCSV(
      'giving-by-member-report.csv',
      (data || []).map((r: any) => [
        r.firstName, r.lastName, r.email, r.phone || '',
        r.gender || '', r.membershipType || '', r.status || '',
        r.cell || '', r.church,
        r.totalGiven.toString(), r.donationCount.toString(),
      ]),
      ['First Name', 'Last Name', 'Email', 'Phone', 'Gender', 'Membership Type', 'Status', 'Cell', 'Church', 'Total Given', 'Giving Count'],
    );
  };

  const handleExportCellGroups = async () => {
    const batchParams = getBatchParams('Cell Groups Report');
    const params: any = { ...batchParams };
    if (cellChurchFilter !== 'all') params.churchId = cellChurchFilter;
    if (cellGroupCellFilter !== 'all') params.cellId = cellGroupCellFilter;
    if (cellGroupStartDate) params.startDate = cellGroupStartDate;
    if (cellGroupEndDate) params.endDate = cellGroupEndDate;
    const response = await cellsService.getAll(params);
    handleBatchResponse('Cell Group Report', response);
    const cells: any[] = (response as any)?.data ?? [];
    const hasDates = !!(cellGroupStartDate || cellGroupEndDate);
    downloadCSV(
      'cell-groups-report.csv',
      cells.map((c: any) => [
        c.name,
        c.zone || '',
        c.church?.name || '',
        c.leaderName || '',
        c._count?.members?.toString() || '0',
        hasDates ? (c.meetingsInPeriod ?? 0).toString() : (c._count?.meetings ?? 0).toString(),
        (c.totalVisitors ?? 0).toString(),
        c.attendanceRate != null ? `${c.attendanceRate}%` : 'N/A',
        c.conversionRate != null ? `${c.conversionRate}%` : 'N/A',
        c.lastMeetingDate ? new Date(c.lastMeetingDate).toLocaleDateString() : 'Never',
        c.status,
        c.meetingDay || '',
        c.meetingTime || '',
        c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
      ]),
      ['Cell Name', 'Zone', 'Church', 'Leader', 'Active Members',
        hasDates ? 'Meetings (Period)' : 'Total Meetings',
        'Total Visitors', 'Attendance Rate', 'Conversion Rate',
        'Last Meeting', 'Status', 'Meeting Day', 'Meeting Time', 'Established'],
    );
  };

  const handleExportChurchVisitors = async () => {
    const batchParams = getBatchParams('Church Visitors Report');
    const response = await attendanceService.getServiceVisitors({
      ...(churchVisitorChurchFilter !== 'all' ? { churchId: churchVisitorChurchFilter } : {}),
      ...(churchVisitorServiceType !== 'all' ? { serviceType: churchVisitorServiceType } : {}),
      ...(churchVisitorStartDate ? { startDate: churchVisitorStartDate } : {}),
      ...(churchVisitorEndDate ? { endDate: churchVisitorEndDate } : {}),
      ...batchParams,
    });
    handleBatchResponse('Church Visitors Report', response);
    const visitors: any[] = Array.isArray(response) ? response : (response as any)?.data ?? [];
    downloadCSV(
      'church-visitors-report.csv',
      visitors.map((v: any) => [
        v.name || '',
        v.phone || '',
        v.email || '',
        v.gender || '',
        v.ageBracket || '',
        v.residentialArea || '',
        v.howHeard || '',
        v.notes || '',
        v.attendance?.church?.name || '',
        v.attendance?.serviceType || '',
        v.attendance?.date ? new Date(v.attendance.date).toLocaleDateString() : '',
      ]),
      ['Name', 'Phone', 'Email', 'Gender', 'Age Bracket', 'Residential Area', 'How Heard', 'Notes', 'Church', 'Service Type', 'Service Date'],
    );
  };

  const handleExportVisitors = async () => {
    const batchParams = getBatchParams('Cell Visitors Report');
    const response = await cellsService.getVisitors({
      ...(visitorChurchFilter !== 'all' ? { churchId: visitorChurchFilter } : {}),
      ...(visitorCellFilter !== 'all' ? { cellId: visitorCellFilter } : {}),
      ...(visitorStartDate ? { startDate: visitorStartDate } : {}),
      ...(visitorEndDate ? { endDate: visitorEndDate } : {}),
      ...batchParams,
    });
    handleBatchResponse('Cell Visitors Report', response);
    const visitors: any[] = (response as any)?.data ?? [];
    downloadCSV(
      'visitors-report.csv',
      visitors.map((v: any) => [
        v.visitorName || '',
        v.visitorPhone || '',
        v.visitorEmail || '',
        v.isFirstTime ? 'First Time' : 'Returning',
        v.meeting?.cell?.name || '',
        v.meeting?.cell?.zone || '',
        v.meeting?.cell?.church?.name || '',
        v.meeting?.date ? new Date(v.meeting.date).toLocaleDateString() : '',
        v.meeting?.topic || '',
        v.notes || '',
      ]),
      ['Name', 'Phone', 'Email', 'Visit Type', 'Cell', 'Zone', 'Church', 'Meeting Date', 'Meeting Topic', 'Notes'],
    );
  };

  const reportCards = [
    {
      title: 'Membership Report',
      description: 'Complete list of all registered members — filter by status, cell, team, or church.',
      icon: Users,
      onExport: handleExportMembers,
      filterComponent: (
        <div className="space-y-2 mb-3">
          <div>
            <Label className="text-xs">Filter by Church</Label>
            <Select value={memberChurchFilter} onValueChange={v => { setMemberChurchFilter(v); setMemberCellFilter('all'); setMemberTeamFilter('all'); }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Churches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {(churches as any[]).map(church => (
                  <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={memberStatusFilter} onValueChange={setMemberStatusFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Cell</Label>
            <Select value={memberCellFilter} onValueChange={setMemberCellFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Cells" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cells</SelectItem>
                {(simpleCells as any[])
                  .filter((c: any) => memberChurchFilter === 'all' || c.churchId === memberChurchFilter)
                  .map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Team</Label>
            <Select value={memberTeamFilter} onValueChange={setMemberTeamFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Teams" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {(teams as any[]).map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
    },
    {
      title: 'Giving Report',
      description: 'All giving records including type, method, amount, and status.',
      icon: HandCoins,
      onExport: handleExportGiving,
      filterComponent: (
        <div className="space-y-2 mb-3">
          <div>
            <Label className="text-xs">Filter by Category</Label>
            <Select value={givingCategoryFilter} onValueChange={setGivingCategoryFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="tithe">Tithe</SelectItem>
                <SelectItem value="offering">Offering</SelectItem>
                <SelectItem value="fellowship_offering">Fellowship Offering</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="welfare">Welfare</SelectItem>
                <SelectItem value="missions">Missions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Campaign</Label>
            <Select value={givingCampaignFilter} onValueChange={setGivingCampaignFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Campaigns" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {(flatCampaigns as any[]).map(campaign => (
                  <SelectItem key={campaign.id} value={campaign.id}>{campaign.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Church</Label>
            <Select value={givingChurchFilter} onValueChange={setGivingChurchFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Churches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {(churches as any[]).map(church => (
                  <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {givingCategoryFilter === 'fellowship_offering' && (
            <div>
              <Label className="text-xs">Filter by Cell</Label>
              <Select value={givingCellFilter} onValueChange={setGivingCellFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Cells" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cells</SelectItem>
                  {(simpleCells as any[])
                    .filter((c: any) => givingChurchFilter === 'all' || c.churchId === givingChurchFilter)
                    .map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" className="h-8 text-xs" value={givingStartDate} onChange={e => setGivingStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" className="h-8 text-xs" value={givingEndDate} onChange={e => setGivingEndDate(e.target.value)} />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Giving by Member',
      description: 'Total giving per member — top contributors and stewardship overview.',
      icon: Handshake,
      onExport: handleExportGivingByMember,
      filterComponent: (
        <div className="space-y-2 mb-3">
          <div>
            <Label className="text-xs">Filter by Church</Label>
            <Select value={givingByMemberChurchFilter} onValueChange={setGivingByMemberChurchFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Churches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {(churches as any[]).map(church => (
                  <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" className="h-8 text-xs" value={givingByMemberStartDate} onChange={e => setGivingByMemberStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" className="h-8 text-xs" value={givingByMemberEndDate} onChange={e => setGivingByMemberEndDate(e.target.value)} />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Pledge Report',
      description: 'All pledges with outstanding balances, status, and deadlines.',
      icon: Target,
      onExport: handleExportPledges,
      filterComponent: (
        <div className="space-y-2 mb-3">
          <div>
            <Label className="text-xs">Filter by Status</Label>
            <Select value={pledgeStatusFilter} onValueChange={setPledgeStatusFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Church</Label>
            <Select value={pledgeChurchFilter} onValueChange={setPledgeChurchFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Churches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {(churches as any[]).map(church => (
                  <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" className="h-8 text-xs" value={pledgeStartDate} onChange={e => setPledgeStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" className="h-8 text-xs" value={pledgeEndDate} onChange={e => setPledgeEndDate(e.target.value)} />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Attendance Report',
      description: 'Service attendance records with visitor counts and notes.',
      icon: ClipboardList,
      onExport: handleExportAttendance,
      filterComponent: (
        <div className="space-y-2 mb-3">
          <div>
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
                <SelectItem value="Event">Event</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Church</Label>
            <Select value={attendanceChurchFilter} onValueChange={setAttendanceChurchFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Churches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {(churches as any[]).map(church => (
                  <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" className="h-8 text-xs" value={attendanceStartDate} onChange={e => setAttendanceStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" className="h-8 text-xs" value={attendanceEndDate} onChange={e => setAttendanceEndDate(e.target.value)} />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Cell Groups Report',
      description: 'All cell groups with leader, member counts, meetings, attendance & conversion rates.',
      icon: Group,
      onExport: handleExportCellGroups,
      filterComponent: (
        <div className="space-y-2 mb-3">
          <div>
            <Label className="text-xs">Filter by Church</Label>
            <Select value={cellChurchFilter} onValueChange={v => { setCellChurchFilter(v); setCellGroupCellFilter('all'); }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Churches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {(churches as any[]).map(church => (
                  <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Cell</Label>
            <Select value={cellGroupCellFilter} onValueChange={setCellGroupCellFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Cells" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cells</SelectItem>
                {(simpleCells as any[])
                  .filter((c: any) => cellChurchFilter === 'all' || c.churchId === cellChurchFilter)
                  .map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}{c.zone ? ` — ${c.zone}` : ''}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Activity Date Range <span className="text-muted-foreground">(scopes meeting count)</span></Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Input type="date" className="h-8 text-xs" value={cellGroupStartDate} onChange={e => setCellGroupStartDate(e.target.value)} placeholder="From" />
              <Input type="date" className="h-8 text-xs" value={cellGroupEndDate} onChange={e => setCellGroupEndDate(e.target.value)} placeholder="To" />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Cell Visitors Report',
      description: 'Visitors recorded at cell meetings — first-time and returning guests with contact details.',
      icon: UserCheck,
      onExport: handleExportVisitors,
      filterComponent: (
        <div className="space-y-2 mb-3">
          <div>
            <Label className="text-xs">Filter by Church</Label>
            <Select value={visitorChurchFilter} onValueChange={setVisitorChurchFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Churches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {(churches as any[]).map(church => (
                  <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Cell</Label>
            <Select value={visitorCellFilter} onValueChange={setVisitorCellFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Cells" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cells</SelectItem>
                {simpleCells.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}{c.zone ? ` — ${c.zone}` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" className="h-8 text-xs" value={visitorStartDate} onChange={e => setVisitorStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" className="h-8 text-xs" value={visitorEndDate} onChange={e => setVisitorEndDate(e.target.value)} />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Church Visitors Report',
      description: 'Detailed visitors from church service attendance — with gender, age, area, and how they heard.',
      icon: UserCheck,
      onExport: handleExportChurchVisitors,
      filterComponent: (
        <div className="space-y-2 mb-3">
          <div>
            <Label className="text-xs">Filter by Church</Label>
            <Select value={churchVisitorChurchFilter} onValueChange={setChurchVisitorChurchFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Churches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {(churches as any[]).map(church => (
                  <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Service Type</Label>
            <Select value={churchVisitorServiceType} onValueChange={setChurchVisitorServiceType}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Services" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="Sunday Service">Sunday Service</SelectItem>
                <SelectItem value="Midweek Service">Midweek Service</SelectItem>
                <SelectItem value="Prayer Meeting">Prayer Meeting</SelectItem>
                <SelectItem value="Youth Service">Youth Service</SelectItem>
                <SelectItem value="Special Event">Special Event</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" className="h-8 text-xs" value={churchVisitorStartDate} onChange={e => setChurchVisitorStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" className="h-8 text-xs" value={churchVisitorEndDate} onChange={e => setChurchVisitorEndDate(e.target.value)} />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Transactions Report',
      description: 'All payment transactions — tickets, giving, and subscriptions.',
      icon: CreditCard,
      onExport: handleExportTransactions,
      filterComponent: (
        <div className="space-y-2 mb-3">
          <div>
            <Label className="text-xs">Filter by Type</Label>
            <Select value={txTypeFilter} onValueChange={setTxTypeFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="donation">Giving</SelectItem>
                <SelectItem value="event_ticket">Event Ticket</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Filter by Church</Label>
            <Select value={txChurchFilter} onValueChange={setTxChurchFilter}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Churches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {(churches as any[]).map(church => (
                  <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" className="h-8 text-xs" value={txStartDate} onChange={e => setTxStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" className="h-8 text-xs" value={txEndDate} onChange={e => setTxEndDate(e.target.value)} />
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl sm:text-2xl font-bold">Reports</h1>
        <p className="text-xs text-muted-foreground">Generate and export comprehensive reports across all modules</p>
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
                <CardContent className="p-3 flex items-center gap-2">
                  <div className="p-1.5 bg-accent/10 rounded-md shrink-0">
                    <Icon className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                    <p className="text-base font-bold font-heading truncate">{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* KPI Section */}
      <Card>
        <div className="flex items-center gap-3 px-6 py-4">
          <div className="p-2 bg-accent/10 rounded-md shrink-0">
            <Target className="h-4 w-4 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">KPI Targets</CardTitle>
            <p className="text-xs text-muted-foreground">Track performance against your goals</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
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
                  <DialogContent className="max-w-sm sm:max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create KPI Target</DialogTitle>
                    </DialogHeader>
                    <KPIForm onClose={() => setKpiDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              )}
              {hasPermission('reports:update') && (
                <Dialog open={!!editingKpi} onOpenChange={(open) => !open && setEditingKpi(null)}>
                  <DialogContent className="max-w-sm sm:max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit KPI Target</DialogTitle>
                    </DialogHeader>
                    <KPIForm kpi={editingKpi!} onClose={() => setEditingKpi(null)} />
                  </DialogContent>
                </Dialog>
              )}
            </div>
        </div>
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
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                          <span>{kpi.period}</span>
                          <span>{new Date(kpi.startDate).toLocaleDateString()} - {new Date(kpi.endDate).toLocaleDateString()}</span>
                          {kpi.church && <span>{kpi.church.name}</span>}
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
                            onClick={() => setDeleteKpi(kpi)}
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

      {/* Delete KPI Dialog */}
      <AlertDialog open={!!deleteKpi} onOpenChange={() => setDeleteKpi(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete KPI</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteKpi?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteKpi) {
                  deleteKpiMutation.mutate(deleteKpi.id);
                  setDeleteKpi(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {reportCards.map(card => {
              const Icon = card.icon;
              const bSize = batchSizeMap[card.title] ?? 0;
              const bPage = batchPageMap[card.title] ?? 1;
              const bTotalPages = batchTotalPagesMap[card.title] ?? 0;
              const setBSize = (v: number) => { setBatchSizeMap(p => ({ ...p, [card.title]: v })); setBatchPageMap(p => ({ ...p, [card.title]: 1 })); };
              const setBPage = (v: number) => setBatchPageMap(p => ({ ...p, [card.title]: Math.max(1, v) }));
              const fromRow = bSize > 0 ? (bPage - 1) * bSize + 1 : 0;
              const toRow = bSize > 0 ? bPage * bSize : 0;
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
                    <div className="flex items-center gap-1.5 pt-1 border-t">
                      <Select value={String(bSize)} onValueChange={v => setBSize(Number(v))}>
                        <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">All records</SelectItem>
                          <SelectItem value="500">Batch: 500 rows</SelectItem>
                          <SelectItem value="1000">Batch: 1,000 rows</SelectItem>
                          <SelectItem value="2000">Batch: 2,000 rows</SelectItem>
                          <SelectItem value="5000">Batch: 5,000 rows</SelectItem>
                        </SelectContent>
                      </Select>
                      {bSize > 0 && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7 p-0" disabled={bPage <= 1} onClick={() => setBPage(bPage - 1)}>
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          <span className="text-xs font-medium px-0.5 text-muted-foreground">
                            P{bPage}{bTotalPages > 0 ? ` of ${bTotalPages}` : ''}
                          </span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 p-0" disabled={bTotalPages > 0 && bPage >= bTotalPages} onClick={() => setBPage(bPage + 1)}>
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={card.onExport}
                    >
                      <Download className="h-3.5 w-3.5" />
                      {bSize > 0
                        ? `Export Batch ${bPage} (rows ${fromRow.toLocaleString()}-${toRow.toLocaleString()})${bTotalPages > 0 ? ` · P${bPage} of ${bTotalPages}` : ''}`
                        : 'Export CSV'}
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

  // Fetch all accessible events for dropdown — lightweight simple mode
  const { data: events = [] } = useQuery({
    queryKey: ['events-simple'],
    queryFn: () => eventsService.getSimple(),
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
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div>
        <Label className="text-xs sm:text-sm">Church <span className="text-destructive">*</span></Label>
        <Select value={churchId} onValueChange={setChurchId} required>
          <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue placeholder="Select a church" /></SelectTrigger>
          <SelectContent>
            {(churches as any[]).map(church => (
              <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs sm:text-sm">KPI Name</Label>
        <Input className="h-8 text-xs sm:h-10 sm:text-sm" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Q1 Attendance Goal" required />
      </div>
      <div>
        <Label className="text-xs sm:text-sm">Description (Optional)</Label>
        <Textarea className="text-xs sm:text-sm" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this KPI" rows={2} />
      </div>
      <div className="flex items-center justify-between p-2 sm:p-3 border rounded-md">
        <div>
          <Label className="text-xs sm:text-sm font-medium">Recurring KPI</Label>
          <p className="text-xs text-muted-foreground">Auto-create this KPI for next period</p>
        </div>
        <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
      </div>
      {isRecurring && (
        <>
          <div>
            <Label className="text-xs sm:text-sm">Period <span className="text-destructive">*</span></Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-0.5">Dates will auto-fill for current {period} period</p>
          </div>
          <Alert className="border-green-200 bg-green-50 py-2">
            <p className="text-xs text-green-800">Select your start date and end date will auto-calculate based on the period.</p>
          </Alert>
        </>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label className="text-xs sm:text-sm">Category</Label>
          <Select value={category} onValueChange={(v) => { setCategory(v); setMetricType(metricOptions[v][0].value); }}>
            <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Attendance">Attendance</SelectItem>
              <SelectItem value="Giving">Giving</SelectItem>
              <SelectItem value="Membership">Membership</SelectItem>
              <SelectItem value="Events">Events</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs sm:text-sm">Metric Type</Label>
          <Select value={metricType} onValueChange={setMetricType}>
            <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
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
            <Label className="text-xs sm:text-sm">Attendance Type</Label>
            <Select value={attendanceType} onValueChange={setAttendanceType}>
              <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular Service</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {attendanceType === 'event' && (
            <div>
              <Label className="text-xs sm:text-sm">Select Event (Optional)</Label>
              <Select value={eventId || 'all'} onValueChange={(v) => setEventId(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue placeholder="All Events" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {(events as any[]).map(event => (
                    <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-0.5">Leave empty to track all event attendance</p>
            </div>
          )}
        </>
      )}
      <div>
        <Label className="text-xs sm:text-sm">Target Value</Label>
        <Input className="h-8 text-xs sm:h-10 sm:text-sm" type="number" value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder="1000" required />
        <p className="text-xs text-muted-foreground mt-0.5">Unit: {currentUnit}</p>
      </div>
      {!isRecurring && (
        <div>
          <Label className="text-xs sm:text-sm">Period</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label className="text-xs sm:text-sm">Start Date</Label>
          <Input className="h-8 text-xs sm:h-10 sm:text-sm" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
          {isRecurring && <p className="text-xs text-muted-foreground mt-0.5">Choose your period start</p>}
        </div>
        <div>
          <Label className="text-xs sm:text-sm">End Date</Label>
          <Input className="h-8 text-xs sm:h-10 sm:text-sm" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required disabled={isRecurring} />
          {isRecurring && <p className="text-xs text-muted-foreground mt-0.5">Auto-calculated</p>}
        </div>
      </div>
      <div className="flex gap-2 pt-1 sm:pt-2">
        <Button type="button" size="sm" variant="outline" onClick={onClose} className="flex-1 sm:h-10 sm:text-sm">Cancel</Button>
        <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 sm:h-10 sm:text-sm">
          {kpi ? (updateMutation.isPending ? 'Updating...' : 'Update KPI') : (createMutation.isPending ? 'Creating...' : 'Create KPI')}
        </Button>
      </div>
    </form>
  );
}
