import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { cellsService, type Cell } from '@/services/cells';
import { churchesService } from '@/services/churches';
import { useRole } from '@/hooks/useRole';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ChurchSelect } from '@/components/ChurchSelect';
import { Plus, Users, Calendar, MapPin, Pencil, Trash2, Eye, Lock, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { STALE_TIME } from '@/lib/query-config';
import { useDebounce } from '@/hooks/use-debounce';

const MEETING_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

// ─── Cell Form ────────────────────────────────────────────────────────────────

function CellForm({ defaultValues, onSubmit, isPending, submitLabel }: {
  defaultValues?: Partial<Cell>;
  onSubmit: (v: any) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const [form, setForm] = useState({
    churchId: defaultValues?.churchId ?? '',
    name: defaultValues?.name ?? '',
    zone: defaultValues?.zone ?? '',
    meetingDay: defaultValues?.meetingDay ?? '',
    meetingTime: defaultValues?.meetingTime ?? '',
  });

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      {!defaultValues?.id && <ChurchSelect value={form.churchId} onValueChange={v => setForm(f => ({ ...f, churchId: v }))} />}
      <div>
        <Label>Cell Name *</Label>
        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Sunrise Cell" required />
      </div>
      <div>
        <Label>Zone / Area</Label>
        <Input value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))} placeholder="e.g. Area 47" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Meeting Day</Label>
          <Select value={form.meetingDay} onValueChange={v => setForm(f => ({ ...f, meetingDay: v }))}>
            <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
            <SelectContent>{MEETING_DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Meeting Time</Label>
          <Input type="time" value={form.meetingTime} onChange={e => setForm(f => ({ ...f, meetingTime: e.target.value }))} />
        </div>
      </div>
      <Button type="submit" disabled={isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
        {isPending ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CellsPage() {
  const { hasPermission, role } = useRole();
  const navigate = useNavigate();
  const hasCellFeature = useHasFeature('cell_management');
  const user = useAuthStore(s => s.user);
  const qc = useQueryClient();
  const isMember = role === 'member';

  const [createOpen, setCreateOpen] = useState(false);
  const [editCell, setEditCell] = useState<Cell | null>(null);
  const [deleteCell, setDeleteCell] = useState<Cell | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [churchFilter, setChurchFilter] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 350);

  const canCreate = hasPermission('cells:create');
  const canManage = hasPermission('cells:update');
  const canDelete = hasPermission('cells:delete');

  const { data: cellsResponse, isLoading } = useQuery({
    queryKey: ['cells', debouncedSearch, statusFilter, churchFilter, page],
    queryFn: () => cellsService.getAll({
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      churchId: churchFilter || undefined,
      page,
      limit: 50,
    }),
    staleTime: STALE_TIME.DEFAULT,
  });
  const cells: Cell[] = cellsResponse?.data ?? [];
  const pagination = cellsResponse?.pagination;

  const { data: overviewStats } = useQuery({
    queryKey: ['cells-overview-stats'],
    queryFn: () => cellsService.getOverviewStats(),
    enabled: !isMember,
    staleTime: STALE_TIME.DEFAULT,
  });

  const { data: churches = [] } = useQuery({
    queryKey: ['churches-for-cells-filter'],
    queryFn: churchesService.getAll,
    enabled: !isMember,
    staleTime: STALE_TIME.DEFAULT,
  });

  const createMutation = useMutation({
    mutationFn: cellsService.create,
    onSuccess: () => { toast.success('Cell created'); qc.invalidateQueries({ queryKey: ['cells'] }); setCreateOpen(false); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create cell'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => cellsService.update(id, dto),
    onSuccess: () => { toast.success('Cell updated'); qc.invalidateQueries({ queryKey: ['cells'] }); setEditCell(null); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update cell'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cellsService.delete(id),
    onSuccess: () => { toast.success('Cell deleted'); qc.invalidateQueries({ queryKey: ['cells'] }); setDeleteCell(null); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete cell'),
  });

  if (!isMember && !hasCellFeature) {
    return (
      <div className="space-y-6">
        <div><h1 className="font-heading text-2xl font-bold">Cells & Fellowships</h1></div>
        <div className="border rounded-lg p-6 bg-amber-50 border-amber-200 flex items-start gap-3">
          <Lock className="h-4 w-4 text-amber-600 mt-0.5" />
          <p className="text-sm text-amber-800">Cell Management is not available in your current package. <Link to="/dashboard/packages" className="font-medium underline">Upgrade now</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">Cells & Fellowships</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {pagination ? `${pagination.total} cells` : `${cells.length} cells`}
          </p>
        </div>
        {canCreate && (
          <Button size="sm" className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New Cell
          </Button>
        )}
      </div>

      {/* Search + filter — non-members only */}
      {!isMember && (
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input className="pl-8 h-8 text-xs sm:h-9 sm:text-sm" placeholder="Search by name or zone..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          {churches.length > 1 && (
            <Select value={churchFilter || 'all'} onValueChange={v => { setChurchFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="h-8 w-40 text-xs sm:h-9 sm:text-sm"><SelectValue placeholder="All Churches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {(churches as any[]).map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={statusFilter || 'all'} onValueChange={v => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="h-8 w-28 text-xs sm:h-9 sm:text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Overview stats — non-members only */}
      {!isMember && overviewStats && (
        <div className="space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {[
              { label: 'Total Cells',     value: overviewStats.totalCells },
              { label: 'Active Cells',    value: overviewStats.activeCells },
              { label: 'Total Members',   value: overviewStats.totalMembers },
              { label: 'Total Meetings',  value: overviewStats.totalMeetings },
              { label: 'Attendance Rate', value: `${overviewStats.attendanceRate}%` },
              { label: 'Total Visitors',  value: overviewStats.totalVisitors },
              { label: 'Conversion Rate', value: `${overviewStats.cumulativeConversionRate ?? 0}%`, highlight: true },
            ].map(s => (
              <Card key={s.label} className={(s as any).highlight ? 'border-accent' : ''}>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-xl font-bold ${(s as any).highlight ? 'text-accent' : ''}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Ranking lists */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Top by members */}
            {overviewStats.topByMembers?.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Most Members</CardTitle></CardHeader>
                <CardContent className="space-y-1.5">
                  {overviewStats.topByMembers.map((c: any, i: number) => (
                    <div key={c.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                        <button onClick={() => navigate(`/dashboard/cells/${c.id}`)} className="text-sm font-medium truncate hover:text-accent text-left">{c.name}</button>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">{c.count}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Top by meetings */}
            {overviewStats.topByMeetings?.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Most Meetings</CardTitle></CardHeader>
                <CardContent className="space-y-1.5">
                  {overviewStats.topByMeetings.map((c: any, i: number) => (
                    <div key={c.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                        <button onClick={() => navigate(`/dashboard/cells/${c.id}`)} className="text-sm font-medium truncate hover:text-accent text-left">{c.name}</button>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">{c.count}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Top by attendance rate */}
            {overviewStats.topByAttendanceRate?.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Best Attendance Rate</CardTitle></CardHeader>
                <CardContent className="space-y-1.5">
                  {overviewStats.topByAttendanceRate.map((c: any, i: number) => (
                    <div key={c.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                        <button onClick={() => navigate(`/dashboard/cells/${c.id}`)} className="text-sm font-medium truncate hover:text-accent text-left">{c.name}</button>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0 text-green-600 border-green-300">{c.attendanceRate}%</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Top by giving */}
            {overviewStats.topByGiving?.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Most Giving</CardTitle></CardHeader>
                <CardContent className="space-y-1.5">
                  {overviewStats.topByGiving.map((c: any, i: number) => (
                    <div key={c.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                        <button onClick={() => navigate(`/dashboard/cells/${c.id}`)} className="text-sm font-medium truncate hover:text-accent text-left">{c.name}</button>
                      </div>
                      <span className="text-xs font-medium shrink-0">{c.total.toLocaleString()}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : cells.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>{canCreate ? 'No cells yet. Create your first cell!' : 'No cells found.'}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cells.map((cell: Cell) => (
            <Card key={cell.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{cell.name}</CardTitle>
                    {cell.zone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {cell.zone}
                      </p>
                    )}
                  </div>
                  <Badge variant={cell.status === 'active' ? 'default' : 'secondary'} className="text-xs capitalize">{cell.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Quick stats row */}
                <div className="grid grid-cols-4 gap-1 text-center">
                  <div className="rounded bg-muted/50 px-1 py-1">
                    <p className="text-sm font-bold">{cell._count?.members ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Members</p>
                  </div>
                  <div className="rounded bg-muted/50 px-1 py-1">
                    <p className="text-sm font-bold">{cell._count?.meetings ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Meetings</p>
                  </div>
                  <div className="rounded bg-muted/50 px-1 py-1">
                    <p className={`text-sm font-bold ${(cell as any).attendanceRate != null ? ((cell as any).attendanceRate >= 70 ? 'text-green-600' : (cell as any).attendanceRate >= 40 ? 'text-yellow-600' : 'text-red-500') : ''}`}>
                      {(cell as any).attendanceRate != null ? `${(cell as any).attendanceRate}%` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">Attendance</p>
                  </div>
                  <div className="rounded bg-muted/50 px-1 py-1">
                    <p className={`text-sm font-bold ${(cell as any).conversionRate != null ? 'text-accent' : ''}`}>
                      {(cell as any).conversionRate != null ? `${(cell as any).conversionRate}%` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">Conversion</p>
                  </div>
                </div>

                {/* Leader + last meeting */}
                <div className="space-y-0.5">
                  {cell.members && cell.members.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">
                      Leader: {cell.members[0]?.user?.firstName} {cell.members[0]?.user?.lastName}
                    </p>
                  )}
                  {(cell as any).lastMeetingDate && (
                    <p className="text-xs text-muted-foreground">
                      Last met: {new Date((cell as any).lastMeetingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  {cell.meetingDay && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {cell.meetingDay}{cell.meetingTime ? ` · ${cell.meetingTime}` : ''}
                    </p>
                  )}
                </div>

                <div className="flex gap-1.5 pt-1">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1" onClick={() => navigate(`/dashboard/cells/${cell.id}`)}>
                    <Eye className="h-3 w-3" /> View
                  </Button>
                  {(isMember ? (cell as any).isLeader : canManage) && (
                    <button onClick={() => setEditCell(cell)} className="p-1.5 text-muted-foreground hover:text-foreground border rounded">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {!isMember && canDelete && (
                    <button onClick={() => setDeleteCell(cell)} className="p-1.5 text-muted-foreground hover:text-destructive border rounded">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isMember && pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{pagination.total} total · page {pagination.page} of {pagination.pages}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Create Cell</DialogTitle></DialogHeader>
          <CellForm onSubmit={v => createMutation.mutate(v)} isPending={createMutation.isPending} submitLabel="Create Cell" />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editCell} onOpenChange={open => !open && setEditCell(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Edit Cell</DialogTitle></DialogHeader>
          {editCell && (
            <CellForm defaultValues={editCell} onSubmit={v => updateMutation.mutate({ id: editCell.id, dto: v })} isPending={updateMutation.isPending} submitLabel="Update Cell" />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteCell} onOpenChange={open => !open && setDeleteCell(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cell</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete <strong>{deleteCell?.name}</strong>? This will remove all members and meeting records. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteCell && deleteMutation.mutate(deleteCell.id)}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cell Detail */}
    </div>
  );
}
