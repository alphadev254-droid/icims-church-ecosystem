import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { attendanceService } from '@/services/attendance';
import { churchesService } from '@/services/churches';
import { useRole } from '@/hooks/useRole';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ClipboardList, TrendingUp, Users, Trash2, Lock, Pencil, UserCheck, Eye } from 'lucide-react';
import { ExportImportButtons } from '@/components/ExportImportButtons';
import { toast } from 'sonner';
import { STALE_TIME } from '@/lib/query-config';
import { RegularServiceForm } from '@/components/attendance/RegularServiceForm';
import { EditAttendanceForm } from '@/components/attendance/EditAttendanceForm';
import { VisitorsManageDialog } from '@/components/attendance/VisitorsManageDialog';
import { ViewAttendanceDialog } from '@/components/attendance/ViewAttendanceDialog';

export default function AttendancePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<{ id: string; date: string; serviceType: string } | null>(null);
  const [visitorsRecord, setVisitorsRecord] = useState<any | null>(null);
  const [viewRecord, setViewRecord] = useState<any | null>(null);
  const [churchFilter, setChurchFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ church: 'all', serviceType: 'all', startDate: '', endDate: '' });
  const { hasPermission } = useRole();
  const hasAttendanceFeature = useHasFeature('attendance_tracking');
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

  const createAttendanceMutation = useMutation({
    mutationFn: attendanceService.create,
    onSuccess: () => {
      toast.success('Attendance recorded');
      qc.invalidateQueries({ queryKey: ['attendance'] });
      setDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to record attendance'),
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Attendance</h1>
          <p className="text-sm text-muted-foreground">{totalServices} service records</p>
        </div>
        <div className="flex gap-2">
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                <Plus className="h-4 w-4" /> Record Attendance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">Record Attendance</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Attendance Type</Label>
                  <Select defaultValue="service" onValueChange={(v: any) => {
                    if (v === 'event') {
                      navigate('/dashboard/event-attendance');
                      setDialogOpen(false);
                    }
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">Regular Service</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <RegularServiceForm
                  onSubmit={(data) => createAttendanceMutation.mutate(data)}
                  isPending={createAttendanceMutation.isPending}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Services</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold font-heading">{totalServices}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Attendance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold font-heading">{avgAttendance}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total New Visitors</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold font-heading">{totalVisitors}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
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
              <div>
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
              <div>
                <Label className="text-sm">Start Date</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm">End Date</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
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
                  {(canUpdate || canDelete) && <TableHead className="w-20">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map(r => (
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
                    {(canUpdate || canDelete) && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setViewRecord(r)}
                            className="p-1.5 text-muted-foreground hover:text-accent transition-colors"
                            title="View details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setVisitorsRecord(r)}
                            className="p-1.5 text-muted-foreground hover:text-accent transition-colors"
                            title="View / manage visitors"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                          </button>
                          {canUpdate && (
                            <button
                              onClick={() => setEditRecord(r)}
                              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setDeleteRecord({ id: r.id, date: new Date(r.date).toLocaleDateString(), serviceType: r.serviceType })}
                              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {records.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={(canUpdate || canDelete) ? 14 : 13} className="text-center py-10 text-muted-foreground">
                      <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      {canCreate ? 'No records yet. Record your first service attendance.' : 'No attendance records.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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

      {/* View Attendance Dialog */}
      {viewRecord && (
        <ViewAttendanceDialog
          record={viewRecord}
          onClose={() => setViewRecord(null)}
        />
      )}

      {/* Visitors Manage Dialog */}
      {visitorsRecord && (
        <VisitorsManageDialog
          record={visitorsRecord}
          canUpdate={canUpdate}
          onClose={() => setVisitorsRecord(null)}
        />
      )}

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
    </div>
  );
}
