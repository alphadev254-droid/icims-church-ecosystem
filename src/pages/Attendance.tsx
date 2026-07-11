import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { attendanceService } from '@/services/attendance';
import { sharedAccessService } from '@/services/sharedAccess';
import { churchesService } from '@/services/churches';
import { useRole } from '@/hooks/useRole';
import { useAuthStore } from '@/stores/authStore';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, ClipboardList, TrendingUp, Users, Trash2, Lock, Pencil, Link2, Copy, CheckCircle2, CalendarClock, Ban, XCircle, Power, QrCode, UserPlus, Eye, Camera, MoreHorizontal } from 'lucide-react';
import { ExportImportButtons } from '@/components/ExportImportButtons';
import { toast } from 'sonner';
import { STALE_TIME } from '@/lib/query-config';
import { EditAttendanceForm } from '@/components/attendance/EditAttendanceForm';
import { AttendanceQrDialog } from '@/components/attendance/AttendanceQrDialog';
import { AddAttendeesDialog } from '@/components/attendance/AddAttendeesDialog';
import { ViewAttendanceDialog } from '@/components/attendance/ViewAttendanceDialog';

export default function AttendancePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [startQrOpen, setStartQrOpen] = useState(false);
  const [startQrChurchId, setStartQrChurchId] = useState('');
  const [startQrServiceType, setStartQrServiceType] = useState('Sunday Service');
  const [startQrDate, setStartQrDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [startQrUntil, setStartQrUntil] = useState('');
  const [editRecord, setEditRecord] = useState<any | null>(null);
  const [viewRecord, setViewRecord] = useState<any | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<{ id: string; date: string; serviceType: string } | null>(null);
  const [qrRecord, setQrRecord] = useState<any | null>(null);
  const [addAttendeesRecord, setAddAttendeesRecord] = useState<any | null>(null);
  const [scannerLinkRecord, setScannerLinkRecord] = useState<any | null>(null);
  const [rowLinkMode, setRowLinkMode] = useState<'entry' | 'scanner'>('scanner');
  const [scannerLink, setScannerLink] = useState('');
  const [scannerLinkValidFrom, setScannerLinkValidFrom] = useState('');
  const [scannerLinkExpiresAt, setScannerLinkExpiresAt] = useState('');
  const [scannerLinkUsageLimit, setScannerLinkUsageLimit] = useState('');
  const [scannerLinkAccessCode, setScannerLinkAccessCode] = useState('');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkChurchFilter, setLinkChurchFilter] = useState('all');
  const [linkServiceType, setLinkServiceType] = useState('Sunday Service');
  const [linkValidFrom, setLinkValidFrom] = useState('');
  const [linkExpiresAt, setLinkExpiresAt] = useState('');
  const [linkUsageLimit, setLinkUsageLimit] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [generatedAccessCode, setGeneratedAccessCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [linkAccessCode, setLinkAccessCode] = useState('');
  const [linksListOpen, setLinksListOpen] = useState(false);
  const [deactivateLinkId, setDeactivateLinkId] = useState<string | null>(null);
  const [deleteLinkId, setDeleteLinkId] = useState<string | null>(null);
  const [activateLinkId, setActivateLinkId] = useState<string | null>(null);
  const [churchFilter, setChurchFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ church: 'all', serviceType: 'all', startDate: '', endDate: '' });
  const { hasPermission } = useRole();
  const hasAttendanceFeature = useHasFeature('attendance_tracking');
  const user = useAuthStore(state => state.user);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: allRecords = [], isLoading } = useQuery({
    queryKey: ['attendance', appliedFilters.church, appliedFilters.serviceType, appliedFilters.startDate, appliedFilters.endDate],
    queryFn: () => {
      const params: any = {};
      if (appliedFilters.church !== 'all') params.churchId = appliedFilters.church;
      if (appliedFilters.serviceType !== 'all') params.serviceType = appliedFilters.serviceType;
      if (appliedFilters.startDate) params.startDate = appliedFilters.startDate;
      if (appliedFilters.endDate) params.endDate = appliedFilters.endDate;
      return attendanceService.getAll(params);
    },
    staleTime: STALE_TIME.DEFAULT,
  });

  const { data: churches = [] } = useQuery({
    queryKey: ['churches'],
    queryFn: churchesService.getAll,
  });

  const records = allRecords;

  const generateLinkMutation = useMutation({
    mutationFn: sharedAccessService.generateLink,
    onSuccess: (link) => {
      toast.success('Link generated successfully');
      setGeneratedLink(`${window.location.origin}/attendance/enter/${link.token}`);
      setGeneratedAccessCode(link.accessCode || '');
      qc.invalidateQueries({ queryKey: ['my-links'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to generate link'),
  });

  const { data: myLinks = [] } = useQuery({
    queryKey: ['my-links'],
    queryFn: sharedAccessService.getMyLinks,
    staleTime: 30000,
  });

  const revokeLinkMutation = useMutation({
    mutationFn: sharedAccessService.revokeLink,
    onSuccess: () => {
      toast.success('Link deactivated');
      qc.invalidateQueries({ queryKey: ['my-links'] });
      setDeactivateLinkId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to deactivate link'),
  });

  const activateLinkMutation = useMutation({
    mutationFn: sharedAccessService.activateLink,
    onSuccess: () => {
      toast.success('Link activated');
      qc.invalidateQueries({ queryKey: ['my-links'] });
      setActivateLinkId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to activate link'),
  });

  const deleteLinkMutation = useMutation({
    mutationFn: sharedAccessService.deleteLink,
    onSuccess: () => {
      toast.success('Link permanently deleted');
      qc.invalidateQueries({ queryKey: ['my-links'] });
      setDeleteLinkId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete link'),
  });

  const createAttendanceMutation = useMutation({
    mutationFn: attendanceService.create,
    onSuccess: () => {
      toast.success('Manual attendance started');
      qc.invalidateQueries({ queryKey: ['attendance'] });
      setDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to record attendance'),
  });

  const startQrMutation = useMutation({
    mutationFn: attendanceService.startQr,
    onSuccess: (record) => {
      toast.success('QR attendance started');
      qc.invalidateQueries({ queryKey: ['attendance'] });
      setStartQrOpen(false);
      setQrRecord(record);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to start QR attendance'),
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => attendanceService.update(id, data),
    onSuccess: () => {
      toast.success('Attendance updated');
      qc.invalidateQueries({ queryKey: ['attendance'] });
      setEditRecord(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update attendance'),
  });

  const deleteMutation = useMutation({
    mutationFn: attendanceService.delete,
    onSuccess: () => {
      toast.success('Record deleted');
      qc.invalidateQueries({ queryKey: ['attendance'] });
      setDeleteRecord(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const generateScannerLinkMutation = useMutation({
    mutationFn: ({ attendanceId, payload, mode }: { attendanceId: string; payload: any; mode: 'entry' | 'scanner' }) => (
      mode === 'scanner'
        ? sharedAccessService.generateScannerLink(attendanceId, payload)
        : sharedAccessService.generateEntryLink(attendanceId, payload)
    ),
    onSuccess: (link, variables) => {
      toast.success(variables.mode === 'scanner' ? 'Scanner link generated' : 'Attendance link generated');
      setScannerLink(`${window.location.origin}/attendance/${variables.mode === 'scanner' ? 'scan' : 'enter'}/${link.token}`);
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['my-links'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to generate link'),
  });
  const canCreate = hasPermission('attendance:create') && hasAttendanceFeature;
  const canUpdate = hasPermission('attendance:update') && hasAttendanceFeature;
  const canDelete = hasPermission('attendance:update') && hasAttendanceFeature;

  if (!hasAttendanceFeature) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Attendance</h1>
          <p className="text-sm text-muted-foreground">Track service attendance</p>
        </div>
        <Alert className="border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Attendance Tracking is not available in your current package.{' '}
            <Link to="/dashboard/packages" className="font-medium underline">Upgrade now</Link>
            {' '}to unlock attendance tracking features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalServices = records.length;
  const totalAttendees = records.reduce((s, r) => s + r.totalAttendees, 0);
  const totalVisitors = records.reduce((s, r) => s + (r.newVisitors ?? 0), 0);
  const avgAttendance = totalServices ? Math.round(totalAttendees / totalServices) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold">Attendance</h1>
          <p className="text-sm text-muted-foreground">{totalServices} service records</p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          <ExportImportButtons
            data={records.map(r => ({
              date: new Date(r.date).toLocaleDateString(),
              church: (r as any).church?.name || '',
              serviceType: r.serviceType,
              totalAttendees: r.totalAttendees,
              male: (r as any).maleCount ?? 0,
              female: (r as any).femaleCount ?? 0,
              children: (r as any).children ?? 0,
              youth: (r as any).youth ?? 0,
              youngAdults: (r as any).youngAdults ?? 0,
              adults: (r as any).adults ?? 0,
              seniors: (r as any).seniors ?? 0,
              newVisitors: r.newVisitors ?? 0,
              notes: r.notes || '',
            }))}
            filename="attendance"
            headers={[
              { label: 'Date', key: 'date' },
              { label: 'Church', key: 'church' },
              { label: 'Service Type', key: 'serviceType' },
              { label: 'Total Attendees', key: 'totalAttendees' },
              { label: 'Male', key: 'male' },
              { label: 'Female', key: 'female' },
              { label: 'Children (0-12)', key: 'children' },
              { label: 'Youth (13-17)', key: 'youth' },
              { label: 'Young Adults (18-35)', key: 'youngAdults' },
              { label: 'Adults (36-59)', key: 'adults' },
              { label: 'Seniors (60+)', key: 'seniors' },
              { label: 'New Visitors', key: 'newVisitors' },
              { label: 'Notes', key: 'notes' },
            ]}
            pdfTitle="Attendance Report"
          />
          {canCreate && (
            <Button
              className="min-w-[calc(50%-0.25rem)] flex-1 gap-1.5 bg-accent text-xs text-accent-foreground hover:bg-accent/90 sm:min-w-0 sm:flex-none sm:gap-2 sm:text-sm"
              onClick={() => {
                setStartQrChurchId(churchFilter !== 'all' ? churchFilter : (churches[0]?.id || ''));
                setStartQrServiceType('Sunday Service');
                setStartQrDate(new Date().toISOString().slice(0, 16));
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Start Manual Attendance</span><span className="sm:hidden">Start Manual</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Total Services</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="font-heading text-xl font-bold sm:text-2xl">{totalServices}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Avg. Attendance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="font-heading text-xl font-bold sm:text-2xl">{avgAttendance}</div></CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Total New Visitors</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="font-heading text-xl font-bold sm:text-2xl">{totalVisitors}</div></CardContent>
        </Card>
      </div>

      {/* Links Management */}
      {canCreate && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              Generated Links
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLinksListOpen(!linksListOpen)}
            >
              {linksListOpen ? 'Hide' : `Show (${myLinks.length})`}
            </Button>
          </CardHeader>
          {linksListOpen && (
            <CardContent>
              {myLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No links generated yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Church</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead className="hidden sm:table-cell">Created</TableHead>
                        <TableHead className="hidden sm:table-cell">Expires</TableHead>
                        <TableHead className="hidden sm:table-cell">Uses</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myLinks.map((link: any) => (
                        <TableRow key={link.id}>
                          <TableCell className="text-sm">{link.church?.name || '—'}</TableCell>
                          <TableCell className="text-sm">{link.serviceType || '—'}</TableCell>
                          <TableCell className="text-sm hidden sm:table-cell text-muted-foreground">
                            {new Date(link.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm hidden sm:table-cell text-muted-foreground">
                            {new Date(link.expiresAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm hidden sm:table-cell">
                            {link.useCount}{link.usageLimit ? `/${link.usageLimit}` : ''}
                          </TableCell>
                          <TableCell>
                            <Badge variant={link.isActive ? 'default' : 'secondary'} className="text-xs">
                              {link.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(link.url);
                                  toast.success('Link copied');
                                }}
                                className="p-1.5 text-muted-foreground hover:text-accent transition-colors"
                                title="Copy link"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              {link.isActive ? (
                                <button
                                  onClick={() => setDeactivateLinkId(link.id)}
                                  className="p-1.5 text-muted-foreground hover:text-amber-600 transition-colors"
                                  title="Deactivate"
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setActivateLinkId(link.id)}
                                  className="p-1.5 text-muted-foreground hover:text-green-600 transition-colors"
                                  title="Activate"
                                >
                                  <Power className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => setDeleteLinkId(link.id)}
                                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                                title="Delete permanently"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              <div className="min-w-0">
                <Label className="text-sm">Filter by Church</Label>
                <Select value={churchFilter} onValueChange={setChurchFilter}>
                  <SelectTrigger><SelectValue placeholder="All Churches" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Churches</SelectItem>
                    {churches.map((church: any) => (
                      <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0">
                <Label className="text-sm">Filter by Service Type</Label>
                <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                  <SelectTrigger><SelectValue placeholder="All Service Types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Service Types</SelectItem>
                    <SelectItem value="Sunday Service">Sunday Service</SelectItem>
                    <SelectItem value="Midweek Service">Midweek Service</SelectItem>
                    <SelectItem value="Prayer Meeting">Prayer Meeting</SelectItem>
                    <SelectItem value="Youth Service">Youth Service</SelectItem>
                    <SelectItem value="Special Service">Special Service</SelectItem>
                    <SelectItem value="Event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0">
                <Label className="text-sm">Start Date</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="min-w-0">
                <Label className="text-sm">End Date</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button 
                onClick={() => setAppliedFilters({ church: churchFilter, serviceType: serviceTypeFilter, startDate, endDate })}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Apply Filters
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setChurchFilter('all');
                  setServiceTypeFilter('all');
                  setStartDate('');
                  setEndDate('');
                  setAppliedFilters({ church: 'all', serviceType: 'all', startDate: '', endDate: '' });
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Church</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Male</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Female</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Children</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Youth</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Young Adults</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Adults</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Seniors</TableHead>
                  <TableHead className="text-right hidden xl:table-cell">Visitors</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map(r => {
                  const isQrAttendance = !!(r as any).qrToken || !!(r as any).digitalCheckInEnabled || ((r as any).qrStatus && (r as any).qrStatus !== 'draft');
                  return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{new Date(r.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm">{(r as any).church?.name || '—'}</TableCell>
                    <TableCell>{r.serviceType}</TableCell>
                    <TableCell className="text-right font-semibold">{r.totalAttendees}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell text-muted-foreground">{(r as any).maleCount ?? 0}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell text-muted-foreground">{(r as any).femaleCount ?? 0}</TableCell>
                    <TableCell className="text-right hidden md:table-cell text-muted-foreground">{(r as any).children ?? 0}</TableCell>
                    <TableCell className="text-right hidden md:table-cell text-muted-foreground">{(r as any).youth ?? 0}</TableCell>
                    <TableCell className="text-right hidden lg:table-cell text-muted-foreground">{(r as any).youngAdults ?? 0}</TableCell>
                    <TableCell className="text-right hidden lg:table-cell text-muted-foreground">{(r as any).adults ?? 0}</TableCell>
                    <TableCell className="text-right hidden lg:table-cell text-muted-foreground">{(r as any).seniors ?? 0}</TableCell>
                    <TableCell className="text-right hidden xl:table-cell text-muted-foreground">
                      {(r as any)._count?.visitors > 0
                        ? `${(r as any)._count.visitors} (detailed)`
                        : r.newVisitors ?? 0}
                    </TableCell>
                    <TableCell>
                      <div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5">
                              <MoreHorizontal className="h-4 w-4" />
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {isQrAttendance ? (
                              <>
                                <DropdownMenuItem onClick={() => navigate(`/dashboard/attendance/${r.id}`)}>
                                  <CalendarClock className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                {canUpdate && (
                                  <DropdownMenuItem onClick={() => navigate(`/dashboard/attendance/${r.id}/scan`)}>
                                    <Camera className="mr-2 h-4 w-4" />
                                    Scan QR
                                  </DropdownMenuItem>
                                )}
                                {canUpdate && (
                                  <DropdownMenuItem onClick={() => setQrRecord(r)}>
                                    <QrCode className="mr-2 h-4 w-4" />
                                    QR Controls
                                  </DropdownMenuItem>
                                )}
                                {canUpdate && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setScannerLinkRecord(r);
                                      setRowLinkMode('scanner');
                                      const existingLink = (r as any).sharedAccessLink;
                                      setScannerLink(existingLink?.type === 'attendance_scanner' ? `${window.location.origin}/attendance/scan/${existingLink.token}` : '');
                                      setScannerLinkValidFrom(new Date().toISOString().slice(0, 16));
                                      setScannerLinkExpiresAt(existingLink?.type === 'attendance_scanner' && existingLink.expiresAt ? new Date(existingLink.expiresAt).toISOString().slice(0, 16) : '');
                                      setScannerLinkUsageLimit('');
                                      setScannerLinkAccessCode('');
                                    }}
                                  >
                                    <Link2 className="mr-2 h-4 w-4" />
                                    Link
                                  </DropdownMenuItem>
                                )}
                                {canUpdate && (
                                  <DropdownMenuItem onClick={() => setAddAttendeesRecord(r)}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Add Attendees
                                  </DropdownMenuItem>
                                )}
                              </>
                            ) : (
                              <>
                                <DropdownMenuItem onClick={() => setViewRecord(r)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                {canUpdate && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setScannerLinkRecord(r);
                                      setRowLinkMode('entry');
                                      const existingLink = (r as any).sharedAccessLink;
                                      setScannerLink(existingLink?.type === 'attendance' ? `${window.location.origin}/attendance/enter/${existingLink.token}` : '');
                                      setScannerLinkValidFrom(new Date().toISOString().slice(0, 16));
                                      setScannerLinkExpiresAt(existingLink?.type === 'attendance' && existingLink.expiresAt ? new Date(existingLink.expiresAt).toISOString().slice(0, 16) : '');
                                      setScannerLinkUsageLimit('');
                                      setScannerLinkAccessCode('');
                                    }}
                                  >
                                    <Link2 className="mr-2 h-4 w-4" />
                                    Link
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                            {canUpdate && (
                              <DropdownMenuItem onClick={() => setEditRecord(r)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => setDeleteRecord({ id: r.id, date: new Date(r.date).toLocaleDateString(), serviceType: r.serviceType })}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );})}
                {records.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-10 text-muted-foreground">
                      <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      {canCreate ? 'No records yet. Start manual attendance or QR attendance.' : 'No attendance records.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (createAttendanceMutation.isPending) return;
          setDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Start Manual Attendance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create an empty attendance record. You can add attendees or generate the attendance link from the row actions.
            </p>
            <div className="space-y-1.5">
              <Label>Church</Label>
              <Select value={startQrChurchId} onValueChange={setStartQrChurchId} disabled={createAttendanceMutation.isPending}>
                <SelectTrigger><SelectValue placeholder="Select church" /></SelectTrigger>
                <SelectContent>
                  {churches.map((church: any) => (
                    <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Service Type</Label>
              <Select value={startQrServiceType} onValueChange={setStartQrServiceType} disabled={createAttendanceMutation.isPending}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sunday Service">Sunday Service</SelectItem>
                  <SelectItem value="Midweek Service">Midweek Service</SelectItem>
                  <SelectItem value="Prayer Meeting">Prayer Meeting</SelectItem>
                  <SelectItem value="Youth Service">Youth Service</SelectItem>
                  <SelectItem value="Special Service">Special Service</SelectItem>
                  <SelectItem value="Event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date / Time</Label>
              <Input type="datetime-local" value={startQrDate} onChange={e => setStartQrDate(e.target.value)} disabled={createAttendanceMutation.isPending} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={createAttendanceMutation.isPending}>Cancel</Button>
              <Button
                disabled={createAttendanceMutation.isPending || !startQrChurchId || !startQrDate}
                onClick={() => createAttendanceMutation.mutate({
                  churchId: startQrChurchId,
                  date: startQrDate,
                  serviceType: startQrServiceType,
                  totalAttendees: 0,
                  newVisitors: 0,
                })}
              >
                {createAttendanceMutation.isPending ? 'Starting...' : 'Start Manual Attendance'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={startQrOpen}
        onOpenChange={(open) => {
          if (startQrMutation.isPending) return;
          setStartQrOpen(open);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Start QR Attendance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create an attendance record starting at 0 and activate QR check-in immediately.
            </p>
            <div className="space-y-1.5">
              <Label>Church</Label>
              <Select value={startQrChurchId} onValueChange={setStartQrChurchId} disabled={startQrMutation.isPending}>
                <SelectTrigger><SelectValue placeholder="Select church" /></SelectTrigger>
                <SelectContent>
                  {churches.map((church: any) => (
                    <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Service Type</Label>
              <Select value={startQrServiceType} onValueChange={setStartQrServiceType} disabled={startQrMutation.isPending}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sunday Service">Sunday Service</SelectItem>
                  <SelectItem value="Midweek Service">Midweek Service</SelectItem>
                  <SelectItem value="Prayer Meeting">Prayer Meeting</SelectItem>
                  <SelectItem value="Youth Service">Youth Service</SelectItem>
                  <SelectItem value="Special Service">Special Service</SelectItem>
                  <SelectItem value="Event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Date / Time</Label>
                <Input type="datetime-local" value={startQrDate} onChange={e => setStartQrDate(e.target.value)} disabled={startQrMutation.isPending} />
              </div>
              <div className="space-y-1.5">
                <Label>Active until</Label>
                <Input type="datetime-local" value={startQrUntil} onChange={e => setStartQrUntil(e.target.value)} disabled={startQrMutation.isPending} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStartQrOpen(false)} disabled={startQrMutation.isPending}>Cancel</Button>
              <Button
                disabled={startQrMutation.isPending || !startQrChurchId || !startQrDate}
                onClick={() => startQrMutation.mutate({
                  churchId: startQrChurchId,
                  date: startQrDate,
                  serviceType: startQrServiceType,
                  qrActiveFrom: startQrDate,
                  qrActiveUntil: startQrUntil || null,
                })}
              >
                {startQrMutation.isPending ? 'Starting...' : 'Start and Open QR'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editRecord} onOpenChange={open => !open && setEditRecord(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Attendance</DialogTitle>
          </DialogHeader>
          {editRecord && (
            <EditAttendanceForm
              record={editRecord}
              onSubmit={(data) => updateAttendanceMutation.mutate({ id: editRecord.id, data })}
              isPending={updateAttendanceMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {qrRecord && (
        <AttendanceQrDialog
          record={qrRecord}
          subdomain={user?.subdomain}
          canUpdate={canUpdate}
          onClose={() => setQrRecord(null)}
        />
      )}

      {addAttendeesRecord && (
        <AddAttendeesDialog
          record={addAttendeesRecord}
          open={!!addAttendeesRecord}
          onClose={() => setAddAttendeesRecord(null)}
        />
      )}

      {viewRecord && (
        <ViewAttendanceDialog
          record={viewRecord}
          onClose={() => setViewRecord(null)}
        />
      )}

      <Dialog open={!!scannerLinkRecord} onOpenChange={open => { if (!open) setScannerLinkRecord(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{rowLinkMode === 'scanner' ? 'Scanner Link' : 'Attendance Link'}</DialogTitle>
          </DialogHeader>
          {scannerLink ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{rowLinkMode === 'scanner' ? 'Share this link with the person scanning attendee QR codes.' : 'Share this link with the person entering manual attendance for this record.'}</p>
              <div className="rounded-md border bg-muted p-3 text-xs break-all">{scannerLink}</div>
              <Button className="w-full" onClick={() => { navigator.clipboard.writeText(scannerLink); toast.success(rowLinkMode === 'scanner' ? 'Scanner link copied' : 'Attendance link copied'); }}>
                <Copy className="mr-2 h-4 w-4" /> Copy Link
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Valid From</Label>
                <Input type="datetime-local" value={scannerLinkValidFrom} onChange={e => setScannerLinkValidFrom(e.target.value)} />
              </div>
              <div>
                <Label>Expires At</Label>
                <Input type="datetime-local" value={scannerLinkExpiresAt} onChange={e => setScannerLinkExpiresAt(e.target.value)} />
              </div>
              <div>
                <Label>Usage Limit (optional)</Label>
                <Input type="number" min="1" placeholder="Leave empty for unlimited" value={scannerLinkUsageLimit} onChange={e => setScannerLinkUsageLimit(e.target.value)} />
              </div>
              <div>
                <Label>Access Code (optional 4-digit PIN)</Label>
                <Input type="text" inputMode="numeric" maxLength={4} pattern="[0-9]*" value={scannerLinkAccessCode} onChange={e => setScannerLinkAccessCode(e.target.value.replace(/\D/g, '').slice(0, 4))} />
              </div>
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={generateScannerLinkMutation.isPending}
                onClick={() => {
                  if (!scannerLinkRecord) return;
                  if (!scannerLinkValidFrom) { toast.error('Please set valid from date'); return; }
                  if (!scannerLinkExpiresAt) { toast.error('Please set expires at date'); return; }
                  generateScannerLinkMutation.mutate({
                    attendanceId: scannerLinkRecord.id,
                    payload: {
                      validFrom: new Date(scannerLinkValidFrom).toISOString(),
                      expiresAt: new Date(scannerLinkExpiresAt).toISOString(),
                      usageLimit: scannerLinkUsageLimit ? parseInt(scannerLinkUsageLimit) : undefined,
                      accessCode: scannerLinkAccessCode || undefined,
                    },
                    mode: rowLinkMode,
                  });
                }}
              >
                {generateScannerLinkMutation.isPending ? 'Generating...' : rowLinkMode === 'scanner' ? 'Generate Scanner Link' : 'Generate Attendance Link'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRecord} onOpenChange={open => !open && setDeleteRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>
              Delete the <strong>{deleteRecord?.serviceType}</strong> attendance record for <strong>{deleteRecord?.date}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRecord && deleteMutation.mutate(deleteRecord.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate Link Confirmation */}
      <AlertDialog open={!!deactivateLinkId} onOpenChange={open => !open && setDeactivateLinkId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Link</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke the link immediately. Users with this link will no longer be able to submit attendance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deactivateLinkId && revokeLinkMutation.mutate(deactivateLinkId)}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Link Confirmation */}
      <AlertDialog open={!!activateLinkId} onOpenChange={open => !open && setActivateLinkId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Link</AlertDialogTitle>
            <AlertDialogDescription>
              This will re-activate the link so users can submit attendance again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => activateLinkId && activateLinkMutation.mutate(activateLinkId)}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Link Confirmation */}
      <AlertDialog open={!!deleteLinkId} onOpenChange={open => !open && setDeleteLinkId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Link Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this link and all attendance records associated with it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteLinkId && deleteLinkMutation.mutate(deleteLinkId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generate Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Generate Attendance Link</DialogTitle>
          </DialogHeader>
          {!generatedLink ? (
            <div className="space-y-4">
              <div>
                <Label>Church</Label>
                <Select value={linkChurchFilter} onValueChange={setLinkChurchFilter}>
                  <SelectTrigger><SelectValue placeholder="Select Church" /></SelectTrigger>
                  <SelectContent>
                    {churches.map((church: any) => (
                      <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Service Type</Label>
                <Select value={linkServiceType} onValueChange={setLinkServiceType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sunday Service">Sunday Service</SelectItem>
                    <SelectItem value="Midweek">Midweek</SelectItem>
                    <SelectItem value="Crusade">Crusade</SelectItem>
                    <SelectItem value="Conference">Conference</SelectItem>
                    <SelectItem value="Special">Special</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valid From</Label>
                <Input type="datetime-local" value={linkValidFrom} onChange={e => setLinkValidFrom(e.target.value)} />
              </div>
              <div>
                <Label>Expires At</Label>
                <Input type="datetime-local" value={linkExpiresAt} onChange={e => setLinkExpiresAt(e.target.value)} />
              </div>
              <div>
                <Label>Usage Limit (optional)</Label>
                <Input type="number" min="1" placeholder="Leave empty for unlimited" value={linkUsageLimit} onChange={e => setLinkUsageLimit(e.target.value)} />
              </div>
              <div>
                <Label>Access Code (optional 4-digit PIN)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="[0-9]*"
                  placeholder="e.g. 1234"
                  value={linkAccessCode}
                  onChange={e => setLinkAccessCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  If set, the helper must enter this code before accessing the form.
                </p>
              </div>
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                onClick={() => {
                  if (linkChurchFilter === 'all') { toast.error('Please select a church'); return; }
                  if (!linkValidFrom) { toast.error('Please set valid from date'); return; }
                  if (!linkExpiresAt) { toast.error('Please set expires at date'); return; }
                  generateLinkMutation.mutate({
                    churchId: linkChurchFilter,
                    serviceType: linkServiceType,
                    validFrom: new Date(linkValidFrom).toISOString(),
                    expiresAt: new Date(linkExpiresAt).toISOString(),
                    usageLimit: linkUsageLimit ? parseInt(linkUsageLimit) : undefined,
                    accessCode: linkAccessCode || undefined,
                  });
                }}
                disabled={generateLinkMutation.isPending}
              >
                <CalendarClock className="h-4 w-4" />
                {generateLinkMutation.isPending ? 'Generating...' : 'Generate Link'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-3">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Link generated successfully! Share it with the helper.</span>
              </div>
              <div className="flex gap-2">
                <Input value={generatedLink} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {generatedAccessCode && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md p-3">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>Access Code: <strong className="text-base tracking-widest">{generatedAccessCode}</strong> — share this securely with the helper.</span>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setGeneratedLink('');
                  setGeneratedAccessCode('');
                  setLinkAccessCode('');
                  setCopied(false);
                  setLinkDialogOpen(false);
                }}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
