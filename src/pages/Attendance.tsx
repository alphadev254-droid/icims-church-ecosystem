import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { attendanceService } from '@/services/attendance';
import { useRole } from '@/hooks/useRole';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChurchSelect } from '@/components/ChurchSelect';
import { Plus, ClipboardList, TrendingUp, Users, Trash2, Lock, Pencil } from 'lucide-react';
import { ExportImportButtons } from '@/components/ExportImportButtons';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { STALE_TIME } from '@/lib/query-config';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function AttendancePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<{ id: string; date: string; serviceType: string } | null>(null);
  const { hasPermission } = useRole();
  const hasAttendanceFeature = useHasFeature('attendance_tracking');
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: attendanceService.getAll,
    staleTime: STALE_TIME.DEFAULT,
  });

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

  const chartData = [...records].reverse().slice(-8).map(r => ({
    date: new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    attendees: r.totalAttendees,
    visitors: r.newVisitors ?? 0,
  }));

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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6 }} />
                <Bar dataKey="attendees" name="Attendees" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="visitors" name="New Visitors" fill="hsl(var(--accent) / 0.4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

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
                    <TableCell className="text-right hidden xl:table-cell text-muted-foreground">{r.newVisitors ?? 0}</TableCell>
                    {(canUpdate || canDelete) && (
                      <TableCell>
                        <div className="flex items-center gap-1">
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Attendance</DialogTitle>
          </DialogHeader>
          {editRecord && (
            <RegularServiceForm
              key={editRecord.id}
              defaultValues={{
                churchId: editRecord.churchId,
                date: new Date(editRecord.date).toISOString().split('T')[0],
                serviceType: editRecord.serviceType,
                maleCount: (editRecord as any).maleCount ?? 0,
                femaleCount: (editRecord as any).femaleCount ?? 0,
                children: (editRecord as any).children ?? 0,
                youth: (editRecord as any).youth ?? 0,
                youngAdults: (editRecord as any).youngAdults ?? 0,
                adults: (editRecord as any).adults ?? 0,
                seniors: (editRecord as any).seniors ?? 0,
                newVisitors: editRecord.newVisitors ?? 0,
                notes: editRecord.notes ?? '',
              }}
              onSubmit={(data) => updateAttendanceMutation.mutate({ id: editRecord.id, data })}
              isPending={updateAttendanceMutation.isPending}
              submitLabel="Update Record"
            />
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
    </div>
  );
}

function RegularServiceForm({ onSubmit, isPending, defaultValues, submitLabel = 'Save Record' }: { 
  onSubmit: (data: any) => void; 
  isPending: boolean;
  defaultValues?: any;
  submitLabel?: string;
}) {
  const [churchId, setChurchId] = useState(defaultValues?.churchId ?? '');
  const [date, setDate] = useState(defaultValues?.date ?? '');
  const [serviceType, setServiceType] = useState(defaultValues?.serviceType ?? 'Sunday Service');
  const [maleCount, setMaleCount] = useState(defaultValues?.maleCount?.toString() ?? '');
  const [femaleCount, setFemaleCount] = useState(defaultValues?.femaleCount?.toString() ?? '');
  const [children, setChildren] = useState(defaultValues?.children?.toString() ?? '');
  const [youth, setYouth] = useState(defaultValues?.youth?.toString() ?? '');
  const [youngAdults, setYoungAdults] = useState(defaultValues?.youngAdults?.toString() ?? '');
  const [adults, setAdults] = useState(defaultValues?.adults?.toString() ?? '');
  const [seniors, setSeniors] = useState(defaultValues?.seniors?.toString() ?? '');
  const [newVisitors, setNewVisitors] = useState(defaultValues?.newVisitors?.toString() ?? '0');
  const [notes, setNotes] = useState(defaultValues?.notes ?? '');

  const totalAttendees = (parseInt(maleCount) || 0) + (parseInt(femaleCount) || 0);
  const ageGroupTotal = (parseInt(children) || 0) + (parseInt(youth) || 0) + (parseInt(youngAdults) || 0) + (parseInt(adults) || 0) + (parseInt(seniors) || 0);
  const ageGroupMismatch = ageGroupTotal > 0 && ageGroupTotal !== totalAttendees;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ageGroupMismatch) {
      toast.error(`Age groups total (${ageGroupTotal}) must equal total attendees (${totalAttendees})`);
      return;
    }
    onSubmit({
      churchId,
      date,
      serviceType,
      totalAttendees,
      maleCount: parseInt(maleCount) || 0,
      femaleCount: parseInt(femaleCount) || 0,
      children: parseInt(children) || 0,
      youth: parseInt(youth) || 0,
      youngAdults: parseInt(youngAdults) || 0,
      adults: parseInt(adults) || 0,
      seniors: parseInt(seniors) || 0,
      newVisitors: parseInt(newVisitors),
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ChurchSelect value={churchId} onValueChange={setChurchId} />
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        <div>
          <Label>Service Type</Label>
          <Select value={serviceType} onValueChange={setServiceType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Sunday Service">Sunday Service</SelectItem>
              <SelectItem value="Midweek Service">Midweek Service</SelectItem>
              <SelectItem value="Prayer Meeting">Prayer Meeting</SelectItem>
              <SelectItem value="Youth Service">Youth Service</SelectItem>
              <SelectItem value="Special Service">Special Service</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label className="text-sm font-medium">Gender Breakdown</Label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <Label className="text-xs">Male</Label>
            <Input type="number" min={0} value={maleCount} onChange={e => setMaleCount(e.target.value)} required />
          </div>
          <div>
            <Label className="text-xs">Female</Label>
            <Input type="number" min={0} value={femaleCount} onChange={e => setFemaleCount(e.target.value)} required />
          </div>
        </div>
      </div>

      <div className="p-3 bg-muted rounded-md">
        <Label className="text-sm text-muted-foreground">Total Attendees (Auto-calculated)</Label>
        <div className="text-2xl font-bold">{totalAttendees}</div>
      </div>

      <div>
        <Label className="text-sm font-medium">Age Groups (Optional)</Label>
        <div className="grid grid-cols-3 gap-3 mt-2">
          <div>
            <Label className="text-xs">Children (0-12)</Label>
            <Input type="number" min={0} value={children} onChange={e => setChildren(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Youth (13-17)</Label>
            <Input type="number" min={0} value={youth} onChange={e => setYouth(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Young Adults (18-35)</Label>
            <Input type="number" min={0} value={youngAdults} onChange={e => setYoungAdults(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Adults (36-59)</Label>
            <Input type="number" min={0} value={adults} onChange={e => setAdults(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Seniors (60+)</Label>
            <Input type="number" min={0} value={seniors} onChange={e => setSeniors(e.target.value)} />
          </div>
        </div>
        {ageGroupMismatch && (
          <p className="text-xs text-destructive mt-2">
            Age groups total ({ageGroupTotal}) must equal total attendees ({totalAttendees})
          </p>
        )}
      </div>
      
      <div>
        <Label>New Visitors</Label>
        <Input type="number" min={0} value={newVisitors} onChange={e => setNewVisitors(e.target.value)} />
      </div>
      
      <div>
        <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      
      <Button type="submit" disabled={isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
        {isPending ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}
