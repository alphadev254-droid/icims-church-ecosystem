import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cellsService, type CellMember, type CellMeeting } from '@/services/cells';
import { usersService } from '@/services/users';
import { useRole } from '@/hooks/useRole';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Users, Calendar, MapPin, UserPlus, Plus, Trash2, ClipboardList, ChevronLeft, ChevronRight, Search, AlertTriangle, TrendingUp, TrendingDown, Minus, Pencil } from 'lucide-react';
import { ExportImportButtons } from '@/components/ExportImportButtons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { STALE_TIME } from '@/lib/query-config';
import { useDebounce } from '@/hooks/use-debounce';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

export default function CellDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasPermission, role } = useRole();
  const currentUserId = useAuthStore(s => s.user?.id);
  const canManage = hasPermission('cells:update');
  const isMember = role === 'member';

  const [tab, setTab] = useState<'members' | 'meetings' | 'stats' | 'transactions'>('members');
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMeetingOpen, setNewMeetingOpen] = useState(false);
  const [editMember, setEditMember] = useState<CellMember | null>(null);
  const [addMemberQuery, setAddMemberQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isLeader, setIsLeader] = useState(false);
  const [isAssistant, setIsAssistant] = useState(false);
  const [meetingForm, setMeetingForm] = useState({ date: '', topic: '', notes: '' });

  // Transactions tab state
  const [txSearch, setTxSearch] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [txMethod, setTxMethod] = useState('');
  const [txPage, setTxPage] = useState(1);
  const debouncedTxSearch = useDebounce(txSearch, 350);

  // Members tab state
  const [memberSearch, setMemberSearch] = useState('');
  const [memberStatus, setMemberStatus] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [memberJoinedFrom, setMemberJoinedFrom] = useState('');
  const [memberJoinedTo, setMemberJoinedTo] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const debouncedMemberSearch = useDebounce(memberSearch, 350);

  // Meetings tab state
  const [meetingDateFrom, setMeetingDateFrom] = useState('');
  const [meetingDateTo, setMeetingDateTo] = useState('');
  const [meetingPage, setMeetingPage] = useState(1);

  const { data: cell, isLoading } = useQuery({
    queryKey: ['cell-detail', id],
    queryFn: () => cellsService.getOne(id!),
    enabled: !!id,
    staleTime: STALE_TIME.DEFAULT,
  });

  // Paginated members
  const { data: membersResponse, isLoading: membersLoading } = useQuery({
    queryKey: ['cell-members', id, debouncedMemberSearch, memberStatus, memberRole, memberJoinedFrom, memberJoinedTo, memberPage],
    queryFn: () => cellsService.getMembers(id!, {
      search: debouncedMemberSearch || undefined,
      status: memberStatus || undefined,
      role: memberRole || undefined,
      joinedFrom: memberJoinedFrom || undefined,
      joinedTo: memberJoinedTo || undefined,
      page: memberPage,
      limit: 50,
    }),
    enabled: !!id && tab === 'members',
    staleTime: STALE_TIME.DEFAULT,
  });
  const members: CellMember[] = membersResponse?.data ?? [];
  const membersPagination = membersResponse?.pagination;

  // Paginated meetings
  const { data: meetingsResponse, isLoading: meetingsLoading } = useQuery({
    queryKey: ['cell-meetings', id, meetingDateFrom, meetingDateTo, meetingPage],
    queryFn: () => cellsService.getMeetings(id!, {
      dateFrom: meetingDateFrom || undefined,
      dateTo: meetingDateTo || undefined,
      page: meetingPage,
      limit: 50,
    }),
    enabled: !!id && tab === 'meetings',
    staleTime: STALE_TIME.DEFAULT,
  });
  const meetings: CellMeeting[] = meetingsResponse?.data ?? [];
  const meetingsPagination = meetingsResponse?.pagination;

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['cell-stats', id],
    queryFn: () => cellsService.getStats(id!),
    enabled: !!id && tab === 'stats',
    staleTime: STALE_TIME.DEFAULT,
  });

  const { data: txResponse, isLoading: txLoading } = useQuery({
    queryKey: ['cell-donations', id, debouncedTxSearch, txStatus, txMethod, txPage],
    queryFn: () => cellsService.getDonations(id!, {
      search: debouncedTxSearch || undefined,
      status: txStatus || undefined,
      paymentMethod: txMethod || undefined,
      page: txPage,
      limit: 100,
    }),
    enabled: !!id && tab === 'transactions',
    staleTime: STALE_TIME.DEFAULT,
  });
  const txDonations = txResponse?.data ?? [];
  const txPagination = txResponse?.pagination;
  const txSummary = txResponse?.summary ?? [];

  const { data: financeStats } = useQuery({
    queryKey: ['cell-finance-stats', id],
    queryFn: () => cellsService.getFinanceStats(id!),
    enabled: !!id && tab === 'transactions',
    staleTime: STALE_TIME.DEFAULT,
  });

  const { data: memberSearchResults } = useQuery({
    queryKey: ['user-search-cell', addMemberQuery],
    queryFn: () => usersService.getAll({ search: addMemberQuery || undefined, role: 'member', limit: 20 }),
    enabled: addMemberOpen && addMemberQuery.length > 0,
    staleTime: 0,
  });

  const addMemberMutation = useMutation({
    mutationFn: () => cellsService.addMember(id!, { userId: selectedUserId, isLeader, isAssistant }),
    onSuccess: () => {
      toast.success('Member added');
      qc.invalidateQueries({ queryKey: ['cell-members', id] });
      qc.invalidateQueries({ queryKey: ['cell-detail', id] });
      setAddMemberOpen(false);
      setSelectedUserId(''); setIsLeader(false); setIsAssistant(false); setAddMemberQuery('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add member'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => cellsService.removeMember(id!, memberId),
    onSuccess: () => { toast.success('Member removed'); qc.invalidateQueries({ queryKey: ['cell-members', id] }); qc.invalidateQueries({ queryKey: ['cell-detail', id] }); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to remove member'),
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ memberId, dto }: { memberId: string; dto: any }) => cellsService.updateMember(id!, memberId, dto),
    onSuccess: () => {
      toast.success('Member updated');
      qc.invalidateQueries({ queryKey: ['cell-members', id] });
      qc.invalidateQueries({ queryKey: ['cell-detail', id] });
      setEditMember(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update member'),
  });

  const createMeetingMutation = useMutation({
    mutationFn: () => cellsService.createMeeting(id!, meetingForm),
    onSuccess: () => {
      toast.success('Meeting created');
      qc.invalidateQueries({ queryKey: ['cell-meetings', id] });
      qc.invalidateQueries({ queryKey: ['cell-detail', id] });
      setNewMeetingOpen(false);
      setMeetingForm({ date: '', topic: '', notes: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create meeting'),
  });

  // Switch to meetings tab if read-only member — only once when determined
  // Must be before any early returns (Rules of Hooks)
  useEffect(() => {
    if (isMember && tab === 'members') {
      setTab('meetings');
    }
  }, [isMember]); // eslint-disable-line react-hooks/exhaustive-deps

  const memberExportData = members.map(m => ({
    firstName: m.user?.firstName ?? '',
    lastName: m.user?.lastName ?? '',
    email: m.user?.email ?? '',
    phone: m.user?.phone ?? '',
    role: m.isLeader ? 'Leader' : m.isAssistant ? 'Assistant' : 'Member',
    status: m.status,
    joined: new Date(m.joinedAt).toLocaleDateString(),
  }));

  const memberExportHeaders = [
    { label: 'First Name', key: 'firstName' },
    { label: 'Last Name', key: 'lastName' },
    { label: 'Email', key: 'email' },
    { label: 'Phone', key: 'phone' },
    { label: 'Role', key: 'role' },
    { label: 'Status', key: 'status' },
    { label: 'Date Joined', key: 'joined' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!cell) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/cells')} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to Cells
        </Button>
        <p className="text-muted-foreground">Cell not found.</p>
      </div>
    );
  }

  const leader = cell?.members?.find((m: any) => m.isLeader);
  const assistant = cell?.members?.find((m: any) => m.isAssistant);

  // For members: only the cell leader can manage (add/remove/edit members, record meetings)
  // For admins: use permission-based canManage
  const isLeaderOfThisCell = isMember && members.some(m => m.userId === currentUserId && m.isLeader);
  const effectiveCanManage = isMember ? isLeaderOfThisCell : canManage;

  // Normal members (non-leader) only see Meetings tab, read-only
  const isReadOnlyMember = isMember && !isLeaderOfThisCell;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/cells')} className="gap-1.5 mt-0.5 shrink-0">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-xl sm:text-2xl font-bold">{cell.name}</h1>
            <Badge variant={cell.status === 'active' ? 'default' : 'secondary'} className="capitalize">{cell.status}</Badge>
          </div>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
            {cell.zone && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{cell.zone}</span>}
            {cell.meetingDay && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{cell.meetingDay}{cell.meetingTime ? ` · ${cell.meetingTime}` : ''}</span>}
            {cell.church && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{cell.church.name}</span>}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Members</p><p className="text-xl font-bold">{cell._count?.members ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Meetings</p><p className="text-xl font-bold">{cell._count?.meetings ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Leader</p><p className="text-sm font-medium truncate">{leader ? `${leader.user?.firstName} ${leader.user?.lastName}` : '—'}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Assistant</p><p className="text-sm font-medium truncate">{assistant ? `${assistant.user?.firstName} ${assistant.user?.lastName}` : '—'}</p></CardContent></Card>
      </div>

      {/* Tabs */}
      <div className="border-b overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {([
            ...(!isReadOnlyMember ? ['members'] : []),
            'meetings',
            ...(!isMember ? ['transactions', 'stats'] : isLeaderOfThisCell ? ['stats'] : []),
          ] as const).map(t => (
            <button key={t} onClick={() => setTab(t as any)}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm capitalize border-b-2 transition-colors whitespace-nowrap ${tab === t ? 'border-accent text-accent font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Members Tab */}
      {tab === 'members' && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="space-y-2">
            {/* Row 1: search + status + role */}
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input className="pl-8 h-8 text-xs" placeholder="Search name, email, phone..." value={memberSearch} onChange={e => { setMemberSearch(e.target.value); setMemberPage(1); }} />
              </div>
              <Select value={memberStatus || 'active'} onValueChange={v => { setMemberStatus(v === 'active' ? '' : v); setMemberPage(1); }}>
                <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="new_convert">New Convert</SelectItem>
                </SelectContent>
              </Select>
              <Select value={memberRole || 'all'} onValueChange={v => { setMemberRole(v === 'all' ? '' : v); setMemberPage(1); }}>
                <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="leader">Leader</SelectItem>
                  <SelectItem value="assistant">Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Row 2: date filter + actions */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Joined:</span>
              <Input type="date" className="h-8 w-32 text-xs" value={memberJoinedFrom} onChange={e => { setMemberJoinedFrom(e.target.value); setMemberPage(1); }} />
              <span className="text-xs text-muted-foreground">–</span>
              <Input type="date" className="h-8 w-32 text-xs" value={memberJoinedTo} onChange={e => { setMemberJoinedTo(e.target.value); setMemberPage(1); }} />
              <div className="flex items-center gap-2 ml-auto">
                {effectiveCanManage && (
                  <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => setAddMemberOpen(true)}>
                    <UserPlus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Add Member</span>
                  </Button>
                )}
                {members.length > 0 && (
                  <ExportImportButtons
                    data={memberExportData}
                    filename={`cell-members-${cell?.name ?? id}`}
                    headers={memberExportHeaders}
                    pdfTitle={`${cell?.name ?? 'Cell'} — Members`}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Count */}
          <p className="text-xs text-muted-foreground">
            {membersPagination ? `${membersPagination.total} members` : ''}
            {membersPagination && membersPagination.pages > 1 ? ` · page ${membersPagination.page} of ${membersPagination.pages}` : ''}
          </p>

          {membersLoading ? (
            <div className="flex justify-center py-8"><div className="h-5 w-5 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No members found.</p>
          ) : (
            <div className="divide-y border rounded-lg">
              {members.map((m: CellMember) => (
                <div key={m.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{m.user?.firstName} {m.user?.lastName}</p>
                    <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
                    {m.isLeader && <Badge className="text-xs bg-accent/10 text-accent border-accent/30">Leader</Badge>}
                    {m.isAssistant && <Badge variant="outline" className="text-xs hidden sm:inline-flex">Asst.</Badge>}
                    <Badge variant="outline" className="text-xs capitalize">{m.status}</Badge>
                    <span className="text-xs text-muted-foreground hidden md:inline">
                      {new Date(m.joinedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {effectiveCanManage && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditMember(m)} className="p-1 text-muted-foreground hover:text-foreground" title="Edit role">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => removeMemberMutation.mutate(m.id)} className="p-1 text-muted-foreground hover:text-destructive" title="Remove">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {membersPagination && membersPagination.pages > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{membersPagination.total} total</span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={memberPage <= 1} onClick={() => setMemberPage(p => p - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={memberPage >= membersPagination.pages} onClick={() => setMemberPage(p => p + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Meetings Tab */}
      {tab === 'meetings' && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Date:</span>
            <Input type="date" className="h-8 w-32 text-xs" value={meetingDateFrom} onChange={e => { setMeetingDateFrom(e.target.value); setMeetingPage(1); }} />
            <span className="text-xs text-muted-foreground">–</span>
            <Input type="date" className="h-8 w-32 text-xs" value={meetingDateTo} onChange={e => { setMeetingDateTo(e.target.value); setMeetingPage(1); }} />
            {effectiveCanManage && (
              <Button size="sm" variant="outline" className="gap-1.5 h-8 ml-auto" onClick={() => setNewMeetingOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">New Meeting</span>
              </Button>
            )}
          </div>

          {/* Count */}
          <p className="text-xs text-muted-foreground">
            {meetingsPagination ? `${meetingsPagination.total} meetings` : ''}
            {meetingsPagination && meetingsPagination.pages > 1 ? ` · page ${meetingsPagination.page} of ${meetingsPagination.pages}` : ''}
          </p>

          {meetingsLoading ? (
            <div className="flex justify-center py-8"><div className="h-5 w-5 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>
          ) : meetings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No meetings recorded yet.</p>
          ) : (
            <div className="divide-y border rounded-lg">
              {(meetings as CellMeeting[]).map(m => (
                <div key={m.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    {m.topic && <p className="text-xs text-muted-foreground">{m.topic}</p>}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground shrink-0">
                    <span className="text-green-600 font-medium">{m.presentCount ?? 0} present</span>
                    <span className="hidden sm:inline">{m.visitorCount ?? 0} visitors</span>
                    {!isReadOnlyMember && (
                      <Button
                        size="sm" variant="outline" className="h-7 text-xs gap-1"
                        onClick={() => navigate(`/dashboard/cells/${id}/meetings/${m.id}/attendance`)}
                      >
                        <ClipboardList className="h-3 w-3" /> <span className="hidden sm:inline">Attendance</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {meetingsPagination && meetingsPagination.pages > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{meetingsPagination.total} total</span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={meetingPage <= 1} onClick={() => setMeetingPage(p => p - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={meetingPage >= meetingsPagination.pages} onClick={() => setMeetingPage(p => p + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {tab === 'transactions' && (
        <div className="space-y-4">
          {/* Finance stats */}
          {financeStats && (
            <div className="space-y-4">
              {/* KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">This Month</p>
                    <p className="text-lg font-bold">{financeStats.currency} {financeStats.thisMonthTotal.toLocaleString()}</p>
                    {financeStats.monthChange !== null && (
                      <p className={`text-xs flex items-center gap-0.5 ${financeStats.monthChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {financeStats.monthChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(financeStats.monthChange)}% vs last month
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Last Month</p>
                    <p className="text-lg font-bold">{financeStats.currency} {financeStats.lastMonthTotal.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Giving Participation</p>
                    <p className="text-lg font-bold">{financeStats.givingParticipationRate}%</p>
                    <p className="text-xs text-muted-foreground">{financeStats.uniqueDonorCount} of {stats?.totalMembers ?? '?'} members</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Avg per Contributor</p>
                    <p className="text-lg font-bold">{financeStats.currency} {financeStats.avgGivingPerContributor.toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Giving trend + top contributors */}
              <div className="grid sm:grid-cols-2 gap-4">
                {financeStats.givingTrend?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Giving Trend — Last 6 Months</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={financeStats.givingTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={m => m.slice(5)} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v: any) => [`${financeStats.currency} ${Number(v).toLocaleString()}`, 'Total']} />
                          <Line type="monotone" dataKey="total" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {financeStats.topContributors?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Top Contributors</CardTitle></CardHeader>
                    <CardContent>
                      <div className="divide-y">
                        {financeStats.topContributors.map((c: any, i: number) => (
                          <div key={i} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                              <p className="text-sm font-medium">{c.name}</p>
                            </div>
                            <p className="text-sm font-bold">{financeStats.currency} {c.total.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          {txSummary.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {txSummary.map((s: any) => (
                <div key={s.currency} className="border rounded-lg px-4 py-2 text-sm">
                  <span className="text-muted-foreground">{s.currency} </span>
                  <span className="font-bold">{s.total.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground ml-1">({s.count} donations)</span>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative w-full sm:flex-1 sm:min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-xs"
                placeholder="Search name or email..."
                value={txSearch}
                onChange={e => { setTxSearch(e.target.value); setTxPage(1); }}
              />
            </div>
            <Select value={txStatus || 'all'} onValueChange={v => { setTxStatus(v === 'all' ? '' : v); setTxPage(1); }}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={txMethod || 'all'} onValueChange={v => { setTxMethod(v === 'all' ? '' : v); setTxPage(1); }}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
            {txDonations.length > 0 && (
              <ExportImportButtons
                data={txDonations.map((d: any) => ({
                  donor: d.isAnonymous ? 'Anonymous' : d.isGuest ? (d.guestName ?? '') : `${d.user?.firstName ?? ''} ${d.user?.lastName ?? ''}`,
                  email: d.isAnonymous ? '' : d.isGuest ? (d.guestEmail ?? '') : (d.user?.email ?? ''),
                  campaign: d.campaign?.name ?? '',
                  category: d.campaign?.category ?? '',
                  amount: d.amount,
                  currency: d.currency,
                  method: d.paymentMethod ?? '',
                  status: d.status,
                  date: new Date(d.createdAt).toLocaleDateString(),
                }))}
                filename={`cell-donations-${cell?.name ?? id}`}
                headers={[
                  { label: 'Donor', key: 'donor' },
                  { label: 'Email', key: 'email' },
                  { label: 'Campaign', key: 'campaign' },
                  { label: 'Category', key: 'category' },
                  { label: 'Amount', key: 'amount' },
                  { label: 'Currency', key: 'currency' },
                  { label: 'Method', key: 'method' },
                  { label: 'Status', key: 'status' },
                  { label: 'Date', key: 'date' },
                ]}
                pdfTitle={`${cell?.name ?? 'Cell'} — Donations`}
              />
            )}
          </div>

          {/* Table */}
          {txLoading ? (
            <div className="flex justify-center py-10"><div className="h-5 w-5 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>
          ) : txDonations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No donations found.</p>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Donor</th>
                    <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Email</th>
                    <th className="text-left px-3 py-2 font-medium">Campaign</th>
                    <th className="text-left px-3 py-2 font-medium">Amount</th>
                    <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Method</th>
                    <th className="text-left px-3 py-2 font-medium">Status</th>
                    <th className="text-left px-3 py-2 font-medium hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {txDonations.map((d: any) => (
                    <tr key={d.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">
                        {d.isAnonymous ? 'Anonymous' : d.isGuest ? (d.guestName ?? '—') : `${d.user?.firstName ?? ''} ${d.user?.lastName ?? ''}`}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">
                        {d.isAnonymous ? '—' : d.isGuest ? (d.guestEmail ?? '—') : (d.user?.email ?? '—')}
                      </td>
                      <td className="px-3 py-2">
                        <p className="truncate max-w-[120px]">{d.campaign?.name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground capitalize">{d.campaign?.category}</p>
                      </td>
                      <td className="px-3 py-2 font-medium whitespace-nowrap">{d.currency} {d.amount.toLocaleString()}</td>
                      <td className="px-3 py-2 text-muted-foreground capitalize hidden md:table-cell">{d.paymentMethod ?? '—'}</td>
                      <td className="px-3 py-2">
                        <Badge variant={d.status === 'completed' ? 'default' : 'secondary'} className="text-xs px-1.5 py-0">{d.status}</Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {txPagination && txPagination.pages > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{txPagination.total} total · page {txPagination.page} of {txPagination.pages}</span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={txPage <= 1} onClick={() => setTxPage(p => p - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={txPage >= txPagination.pages} onClick={() => setTxPage(p => p + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && (
        <div className="space-y-6">
          {statsLoading ? (
            <div className="flex justify-center py-10"><div className="h-5 w-5 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>
          ) : stats ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Active Members</p><p className="text-2xl font-bold">{stats.totalMembers}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Meetings</p><p className="text-2xl font-bold">{stats.totalMeetings}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Attendance Rate</p><p className="text-2xl font-bold">{stats.attendanceRate}%</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Visitors</p><p className="text-2xl font-bold">{stats.totalVisitors}</p></CardContent></Card>
              </div>

              {/* Attendance trend chart */}
              {stats.attendanceTrend?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Attendance Trend — Last 8 Weeks</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={stats.attendanceTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip
                          formatter={(val: any, name: string) => [val, name.charAt(0).toUpperCase() + name.slice(1)]}
                          labelFormatter={l => `Date: ${l}`}
                        />
                        <Bar dataKey="present" fill="#22c55e" radius={[3,3,0,0]} name="present" />
                        <Bar dataKey="absent" fill="#ef4444" radius={[3,3,0,0]} name="absent" />
                        <Bar dataKey="excused" fill="#eab308" radius={[3,3,0,0]} name="excused" />
                        <Bar dataKey="visitors" fill="#3b82f6" radius={[3,3,0,0]} name="visitors" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-2 justify-center text-xs text-muted-foreground">
                      {[['#22c55e','Present'],['#ef4444','Absent'],['#eab308','Excused'],['#3b82f6','Visitors']].map(([c,l]) => (
                        <span key={l} className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: c }} />{l}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Member growth + consecutive absences */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Member growth */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Member Growth</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="border rounded-lg p-2">
                        <p className="text-lg font-bold text-green-600">+{stats.memberGrowth?.newThisMonth ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Joined this month</p>
                      </div>
                      <div className="border rounded-lg p-2">
                        <p className="text-lg font-bold text-red-500">-{stats.memberGrowth?.leftThisMonth ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Left this month</p>
                      </div>
                      <div className="border rounded-lg p-2">
                        <div className="flex items-center justify-center gap-1">
                          {(stats.memberGrowth?.netGrowth ?? 0) > 0
                            ? <TrendingUp className="h-4 w-4 text-green-600" />
                            : (stats.memberGrowth?.netGrowth ?? 0) < 0
                            ? <TrendingDown className="h-4 w-4 text-red-500" />
                            : <Minus className="h-4 w-4 text-muted-foreground" />}
                          <p className={`text-lg font-bold ${(stats.memberGrowth?.netGrowth ?? 0) > 0 ? 'text-green-600' : (stats.memberGrowth?.netGrowth ?? 0) < 0 ? 'text-red-500' : ''}`}>
                            {stats.memberGrowth?.netGrowth ?? 0}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">Net growth</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Last month: {stats.memberGrowth?.newLastMonth ?? 0} joined</p>
                  </CardContent>
                </Card>

                {/* Consecutive absences */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Consecutive Absences (3+)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!stats.consecutiveAbsences?.length ? (
                      <p className="text-xs text-muted-foreground py-2">No members with 3+ consecutive absences.</p>
                    ) : (
                      <div className="divide-y">
                        {stats.consecutiveAbsences.map((a: any) => (
                          <div key={a.userId} className="flex items-center justify-between py-2">
                            <div>
                              <p className="text-sm font-medium">{a.name}</p>
                              {a.phone && <p className="text-xs text-muted-foreground">{a.phone}</p>}
                            </div>
                            <Badge variant="destructive" className="text-xs">{a.missedCount} missed</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Top attendees + most absent */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">🏆 Top Attendees</CardTitle></CardHeader>
                  <CardContent>
                    {!stats.topAttendees?.length ? (
                      <p className="text-xs text-muted-foreground py-2">No attendance data yet.</p>
                    ) : (
                      <div className="divide-y">
                        {stats.topAttendees.map((m: any, i: number) => (
                          <div key={i} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                              <p className="text-sm font-medium">{m.name}</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="text-green-600 font-medium">{m.present} present</span>
                              <Badge variant="outline" className="text-xs px-1.5 py-0">{m.attendanceRate}%</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-red-500" />Most Absent</CardTitle></CardHeader>
                  <CardContent>
                    {!stats.mostAbsent?.length ? (
                      <p className="text-xs text-muted-foreground py-2">No absence data yet.</p>
                    ) : (
                      <div className="divide-y">
                        {stats.mostAbsent.map((m: any, i: number) => (
                          <div key={i} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                              <p className="text-sm font-medium">{m.name}</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              {m.absent > 0 && <span className="text-red-500 font-medium">{m.absent} absent</span>}
                              {m.excused > 0 && <span className="text-yellow-600">{m.excused} excused</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Age distribution */}
              {stats.ageDistribution?.some((b: any) => b.count > 0) && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Age Distribution</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.ageDistribution.filter((b: any) => b.count > 0).map((b: any) => {
                        const pct = stats.totalMembers > 0 ? Math.round((b.count / stats.totalMembers) * 100) : 0;
                        return (
                          <div key={b.range} className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-16 shrink-0">{b.range}</span>
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div className="bg-accent h-2 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-medium w-8 text-right">{b.count}</span>
                            <span className="text-xs text-muted-foreground w-8">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">No stats available yet.</p>
          )}
        </div>
      )}

      {/* Edit Member Dialog */}
      <Dialog open={!!editMember} onOpenChange={open => !open && setEditMember(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Member Role</DialogTitle></DialogHeader>
          {editMember && (
            <div className="space-y-4 pt-1">
              <p className="text-sm font-medium">{editMember.user?.firstName} {editMember.user?.lastName}</p>
              <div className="space-y-2">
                <label className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">Cell Leader</p>
                    <p className="text-xs text-muted-foreground">Responsible for leading this cell</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={editMember.isLeader}
                    onChange={e => setEditMember(m => m ? { ...m, isLeader: e.target.checked, isAssistant: e.target.checked ? false : m.isAssistant } : null)}
                  />
                </label>
                <label className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">Assistant Leader</p>
                    <p className="text-xs text-muted-foreground">Supports the cell leader</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={editMember.isAssistant}
                    onChange={e => setEditMember(m => m ? { ...m, isAssistant: e.target.checked, isLeader: e.target.checked ? false : m.isLeader } : null)}
                  />
                </label>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={editMember.status} onValueChange={v => setEditMember(m => m ? { ...m, status: v } : null)}>
                    <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="new_convert">New Convert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setEditMember(null)}>Cancel</Button>
                <Button
                  size="sm"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={updateMemberMutation.isPending}
                  onClick={() => updateMemberMutation.mutate({
                    memberId: editMember.id,
                    dto: { isLeader: editMember.isLeader, isAssistant: editMember.isAssistant, status: editMember.status },
                  })}
                >
                  {updateMemberMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Member to Cell</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Search Member</Label>
              <Input className="mt-1" placeholder="Name or email..." value={addMemberQuery} onChange={e => setAddMemberQuery(e.target.value)} />
              {memberSearchResults?.data && memberSearchResults.data.length > 0 && (
                <div className="border rounded-md mt-1 max-h-48 overflow-y-auto">
                  {memberSearchResults.data.map((u: any) => (
                    <button key={u.id} type="button"
                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-muted ${selectedUserId === u.id ? 'bg-accent/10' : ''}`}
                      onClick={() => { setSelectedUserId(u.id); setAddMemberQuery(`${u.firstName} ${u.lastName}`); }}>
                      <p className="font-medium">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={isLeader} onChange={e => setIsLeader(e.target.checked)} className="h-4 w-4" />
                Cell Leader
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={isAssistant} onChange={e => setIsAssistant(e.target.checked)} className="h-4 w-4" />
                Assistant Leader
              </label>
            </div>
            <Button className="w-full" disabled={!selectedUserId || addMemberMutation.isPending} onClick={() => addMemberMutation.mutate()}>
              {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Meeting Dialog */}
      <Dialog open={newMeetingOpen} onOpenChange={setNewMeetingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Meeting</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Date *</Label><Input className="mt-1" type="date" value={meetingForm.date} onChange={e => setMeetingForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div><Label>Topic</Label><Input className="mt-1" value={meetingForm.topic} onChange={e => setMeetingForm(f => ({ ...f, topic: e.target.value }))} placeholder="Meeting topic" /></div>
            <div><Label>Notes</Label><Textarea className="mt-1" rows={3} value={meetingForm.notes} onChange={e => setMeetingForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <Button className="w-full" disabled={!meetingForm.date || createMeetingMutation.isPending} onClick={() => createMeetingMutation.mutate()}>
              {createMeetingMutation.isPending ? 'Saving...' : 'Create Meeting'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
