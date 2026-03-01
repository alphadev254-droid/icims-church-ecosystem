import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { attendanceService } from '@/services/attendance';
import { useRole } from '@/hooks/useRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChurchSelect } from '@/components/ChurchSelect';
import { Plus, ClipboardList, TrendingUp, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const schema = z.object({
  date: z.string().min(1, 'Date required'),
  serviceType: z.string().min(1, 'Service type required'),
  totalAttendees: z.coerce.number().int().positive('Must be a positive number'),
  newVisitors: z.coerce.number().int().min(0).default(0),
  notes: z.string().optional(),
  churchId: z.string().min(1, 'Church selection required'),
});
type FormValues = z.infer<typeof schema>;

export default function AttendancePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<{ id: string; date: string; serviceType: string } | null>(null);
  const { hasPermission } = useRole();
  const qc = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: attendanceService.getAll,
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { serviceType: 'Sunday Service', newVisitors: 0 },
  });

  const churchId = watch('churchId');

  const createMutation = useMutation({
    mutationFn: attendanceService.create,
    onSuccess: () => {
      toast.success('Attendance recorded');
      qc.invalidateQueries({ queryKey: ['attendance'] });
      setDialogOpen(false);
      reset();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to record attendance'),
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

  const canCreate = hasPermission('attendance:create');
  const canDelete = hasPermission('attendance:update');

  // Summary stats
  const totalServices = records.length;
  const totalAttendees = records.reduce((s, r) => s + r.totalAttendees, 0);
  const totalVisitors = records.reduce((s, r) => s + (r.newVisitors ?? 0), 0);
  const avgAttendance = totalServices ? Math.round(totalAttendees / totalServices) : 0;

  // Chart data — last 8 records reversed to show oldest first
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
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                <Plus className="h-4 w-4" /> Record Attendance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading">Record Attendance</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(v => createMutation.mutate(v))} className="space-y-4">
                <ChurchSelect 
                  value={churchId} 
                  onValueChange={value => setValue('churchId', value)}
                />
                {errors.churchId && <p className="text-xs text-destructive mt-1">{errors.churchId.message}</p>}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input type="date" {...register('date')} />
                    {errors.date && <p className="text-xs text-destructive mt-1">{errors.date.message}</p>}
                  </div>
                  <div>
                    <Label>Service Type</Label>
                    <Select defaultValue="Sunday Service" onValueChange={v => setValue('serviceType', v)}>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Total Attendees</Label>
                    <Input type="number" min={1} {...register('totalAttendees')} />
                    {errors.totalAttendees && <p className="text-xs text-destructive mt-1">{errors.totalAttendees.message}</p>}
                  </div>
                  <div>
                    <Label>New Visitors</Label>
                    <Input type="number" min={0} {...register('newVisitors')} />
                  </div>
                </div>
                <div>
                  <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input {...register('notes')} />
                </div>
                <Button type="submit" disabled={createMutation.isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  {createMutation.isPending ? 'Saving...' : 'Save Record'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary cards */}
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

      {/* Chart */}
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

      {/* Records table */}
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
                  <TableHead>Service Type</TableHead>
                  <TableHead className="text-right">Attendees</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">New Visitors</TableHead>
                  <TableHead className="hidden md:table-cell">Notes</TableHead>
                  {canDelete && <TableHead className="w-16">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{new Date(r.date).toLocaleDateString()}</TableCell>
                    <TableCell>{r.serviceType}</TableCell>
                    <TableCell className="text-right font-semibold">{r.totalAttendees}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell text-muted-foreground">{r.newVisitors ?? 0}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{r.notes ?? '—'}</TableCell>
                    {canDelete && (
                      <TableCell>
                        <button
                          onClick={() => setDeleteRecord({ id: r.id, date: new Date(r.date).toLocaleDateString(), serviceType: r.serviceType })}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {records.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canDelete ? 6 : 5} className="text-center py-10 text-muted-foreground">
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

      {/* Delete confirmation */}
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
