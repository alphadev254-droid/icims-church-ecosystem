import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cellsService, type CellMember } from '@/services/cells';
import { useRole } from '@/hooks/useRole';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ExportImportButtons } from '@/components/ExportImportButtons';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { STALE_TIME } from '@/lib/query-config';

type AttendanceStatus = 'present' | 'absent' | 'excused';
type FilterType = 'all' | 'present' | 'absent' | 'excused' | 'guest';

interface AttendanceRow {
  key: string;
  isGuest: boolean;
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isLeader?: boolean;
  isAssistant?: boolean;
  visitorName?: string;
  visitorPhone?: string;
  visitorEmail?: string;
  isFirstTime?: boolean;
  status: AttendanceStatus;
  notes?: string;
}

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: 'bg-green-100 text-green-700 border-green-300',
  absent:  'bg-red-100 text-red-700 border-red-300',
  excused: 'bg-yellow-100 text-yellow-700 border-yellow-300',
};

// ─── Excuse Dialog ────────────────────────────────────────────────────────────

function ExcuseDialog({ name, reason, onSave, onCancel }: {
  name: string; reason: string;
  onSave: (r: string) => void; onCancel: () => void;
}) {
  const [value, setValue] = useState(reason);
  return (
    <Dialog open onOpenChange={open => !open && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Excuse Reason</DialogTitle>
          <p className="text-sm text-muted-foreground">{name}</p>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div>
            <Label>Reason <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea className="mt-1" rows={3} placeholder="e.g. Sick, travelling..." value={value} onChange={e => setValue(e.target.value)} autoFocus />
          </div>
          <div className="flex justify-end">
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => onSave(value)}>
              Save & Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CellAttendancePage() {
  const { id: cellId, meetingId } = useParams<{ id: string; meetingId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasPermission } = useRole();
  const canManage = hasPermission('cells:update');

  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [seeded, setSeeded] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [saved, setSaved] = useState(false);
  const [excuseKey, setExcuseKey] = useState<string | null>(null);

  const { data: cell, isLoading: cellLoading } = useQuery({
    queryKey: ['cell-detail', cellId],
    queryFn: () => cellsService.getOne(cellId!),
    enabled: !!cellId,
    staleTime: STALE_TIME.DEFAULT,
  });

  const { data: existingAttendance = [], isLoading: attLoading } = useQuery({
    queryKey: ['meeting-attendance', meetingId],
    queryFn: () => cellsService.getAttendance(meetingId!),
    enabled: !!meetingId,
    staleTime: 0,
  });

  // Fix: getMeetings now returns { data, pagination } — extract data array
  const { data: meetingsResponse } = useQuery({
    queryKey: ['cell-meetings', cellId],
    queryFn: () => cellsService.getMeetings(cellId!),
    enabled: !!cellId,
    staleTime: STALE_TIME.DEFAULT,
  });
  const meetingsList = meetingsResponse?.data ?? [];
  const meeting = meetingsList.find((m: any) => m.id === meetingId);

  const members: CellMember[] = cell?.members ?? [];

  // Seed rows once both cell + attendance loaded
  useEffect(() => {
    if (seeded || cellLoading || attLoading || members.length === 0) return;

    const savedMap = new Map<string, any>();
    const savedGuests: any[] = [];
    (existingAttendance as any[]).forEach(a => {
      if (a.isVisitor) savedGuests.push(a);
      else if (a.userId) savedMap.set(a.userId, a);
    });

    const memberRows: AttendanceRow[] = members.map(m => {
      const saved = savedMap.get(m.userId);
      return {
        key: m.userId,
        isGuest: false,
        userId: m.userId,
        firstName: m.user?.firstName,
        lastName: m.user?.lastName,
        email: m.user?.email,
        phone: m.user?.phone ?? saved?.user?.phone,
        isLeader: m.isLeader,
        isAssistant: m.isAssistant,
        status: (saved?.status as AttendanceStatus) ?? 'absent',
        notes: saved?.notes ?? '',
      };
    });

    const guestRows: AttendanceRow[] = savedGuests.map((g, i) => ({
      key: `guest-saved-${i}`,
      isGuest: true,
      visitorName: g.visitorName ?? '',
      visitorPhone: g.visitorPhone ?? '',
      visitorEmail: g.visitorEmail ?? '',
      isFirstTime: g.isFirstTime ?? true,
      status: 'present' as AttendanceStatus,
      notes: '',
    }));

    setRows([...memberRows, ...guestRows]);
    setSeeded(true);
  }, [cellLoading, attLoading, members.length, existingAttendance, seeded]);

  const setStatus = (key: string, status: AttendanceStatus) => {
    if (status === 'excused') {
      setRows(r => r.map(row => row.key === key ? { ...row, status } : row));
      setExcuseKey(key);
    } else {
      const updated = rows.map(row => row.key === key ? { ...row, status, notes: '' } : row);
      setRows(updated);
      autoSave(updated);
    }
    setSaved(false);
  };

  const saveExcuseReason = (reason: string) => {
    const updated = rows.map(row => row.key === excuseKey ? { ...row, notes: reason } : row);
    setRows(updated);
    setExcuseKey(null);
    autoSave(updated);
  };

  const cancelExcuse = (wasAlreadyExcused: boolean) => {
    if (!wasAlreadyExcused) {
      setRows(r => r.map(row => row.key === excuseKey ? { ...row, status: 'absent', notes: '' } : row));
    }
    setExcuseKey(null);
  };

  const updateGuest = (key: string, field: keyof AttendanceRow, value: any) => {
    setRows(r => r.map(row => row.key === key ? { ...row, [field]: value } : row));
    setSaved(false);
  };

  const addGuest = () => {
    setRows(r => [...r, { key: `guest-new-${Date.now()}`, isGuest: true, visitorName: '', visitorPhone: '', visitorEmail: '', isFirstTime: true, status: 'present', notes: '' }]);
    setSaved(false);
  };

  const removeGuest = (key: string) => { setRows(r => r.filter(row => row.key !== key)); setSaved(false); };

  const mutation = useMutation({
    mutationFn: (currentRows: typeof rows) => {
      const records = currentRows.map(row => row.isGuest
        ? { isVisitor: true, status: row.status, visitorName: row.visitorName, visitorPhone: row.visitorPhone, visitorEmail: row.visitorEmail || undefined, isFirstTime: row.isFirstTime ?? true, notes: row.notes || undefined }
        : { userId: row.userId, status: row.status, isVisitor: false, notes: row.notes || undefined }
      );
      return cellsService.submitAttendance(meetingId!, records);
    },
    onSuccess: () => {
      toast.success('Attendance saved');
      setSaved(true);
      qc.invalidateQueries({ queryKey: ['cell-meetings', cellId] });
      qc.invalidateQueries({ queryKey: ['meeting-attendance', meetingId] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const autoSave = (currentRows: typeof rows) => mutation.mutate(currentRows);

  const exportData = rows.map(r => ({
    Name: r.isGuest ? (r.visitorName ?? '') : `${r.firstName} ${r.lastName}`,
    Email: r.isGuest ? (r.visitorEmail ?? '') : (r.email ?? ''),
    Phone: r.isGuest ? (r.visitorPhone ?? '') : (r.phone ?? ''),
    Type: r.isGuest ? 'Guest' : (r.isLeader ? 'Leader' : r.isAssistant ? 'Assistant' : 'Member'),
    Status: r.status,
    ExcuseReason: r.status === 'excused' ? (r.notes ?? '') : '',
    FirstTime: r.isGuest ? (r.isFirstTime ? 'Yes' : 'No') : '',
  }));

  const exportHeaders = [
    { label: 'Name', key: 'Name' },
    { label: 'Email', key: 'Email' },
    { label: 'Phone', key: 'Phone' },
    { label: 'Type', key: 'Type' },
    { label: 'Status', key: 'Status' },
    { label: 'Excuse Reason', key: 'ExcuseReason' },
    { label: 'First Time', key: 'FirstTime' },
  ];

  const filteredRows = rows.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'guest') return r.isGuest;
    return r.status === filter;
  });

  const presentCount = rows.filter(r => r.status === 'present').length;
  const absentCount  = rows.filter(r => !r.isGuest && r.status === 'absent').length;
  const excusedCount = rows.filter(r => r.status === 'excused').length;
  const guestCount   = rows.filter(r => r.isGuest).length;

  const excuseRow = excuseKey ? rows.find(r => r.key === excuseKey) : null;
  const excuseRowWasAlreadyExcused = excuseRow?.status === 'excused' && !!excuseRow?.notes;

  if (cellLoading || attLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/cells/${cellId}`)} className="gap-1.5 shrink-0">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-lg sm:text-xl font-bold">Attendance</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {cell?.name}
            {meeting && <> · {new Date(meeting.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</>}
            {meeting?.topic && <> · {meeting.topic}</>}
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => mutation.mutate(rows)}
            disabled={mutation.isPending}
            size="sm"
            className="shrink-0 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {mutation.isPending ? 'Saving...' : saved ? 'Saved ✓' : 'Save'}
          </Button>
        )}
      </div>

      {/* Summary — large tap-friendly cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Present',  value: presentCount, color: 'text-green-600', filter: 'present' as FilterType },
          { label: 'Absent',   value: absentCount,  color: 'text-red-500',   filter: 'absent' as FilterType },
          { label: 'Excused',  value: excusedCount, color: 'text-yellow-500',filter: 'excused' as FilterType },
          { label: 'Guests',   value: guestCount,   color: 'text-blue-500',  filter: 'guest' as FilterType },
        ].map(s => (
          <button
            key={s.label}
            onClick={() => setFilter(f => f === s.filter ? 'all' : s.filter)}
            className={`border rounded-lg p-2 sm:p-3 text-center transition-colors ${filter === s.filter ? 'border-accent bg-accent/5' : 'hover:bg-muted/50'}`}
          >
            <p className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {filter === 'all' ? `${rows.length} total` : `${filteredRows.length} of ${rows.length}`}
          {filter !== 'all' && <button onClick={() => setFilter('all')} className="ml-1 text-accent underline">clear</button>}
        </p>
        <div className="flex gap-2">
          <ExportImportButtons data={exportData} filename={`attendance-${meetingId}`} headers={exportHeaders} pdfTitle={`Attendance — ${cell?.name ?? ''}`} />
          {canManage && (
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={addGuest}>
              <Plus className="h-3.5 w-3.5" /> Add Guest
            </Button>
          )}
        </div>
      </div>

      {/* Attendance table */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-xs sm:text-sm min-w-[700px]">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Name</th>
              <th className="text-left px-3 py-2 font-medium">Email</th>
              <th className="text-left px-3 py-2 font-medium">Phone</th>
              <th className="text-left px-3 py-2 font-medium">Type</th>
              <th className="text-left px-3 py-2 font-medium">Status</th>
              <th className="text-left px-3 py-2 font-medium">Excuse Reason</th>
              <th className="text-left px-3 py-2 font-medium">First Visit</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredRows.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground text-xs">No records match this filter.</td></tr>
            )}
            {filteredRows.map(row => (
              <tr key={row.key} className={`hover:bg-muted/30 ${row.status === 'present' ? 'bg-green-50/30' : row.status === 'excused' ? 'bg-yellow-50/30' : ''}`}>
                {/* Name */}
                <td className="px-3 py-1.5 font-medium whitespace-nowrap">
                  {row.isGuest && canManage ? (
                    <Input value={row.visitorName ?? ''} onChange={e => updateGuest(row.key, 'visitorName', e.target.value)} placeholder="Guest name *" className="h-7 text-xs w-36" />
                  ) : (
                    <span>{row.isGuest ? (row.visitorName || '—') : `${row.firstName} ${row.lastName}`}</span>
                  )}
                </td>

                {/* Email */}
                <td className="px-3 py-1.5 text-muted-foreground">
                  {row.isGuest && canManage ? (
                    <Input value={row.visitorEmail ?? ''} onChange={e => updateGuest(row.key, 'visitorEmail', e.target.value)} placeholder="Email" className="h-7 text-xs w-36" />
                  ) : (
                    <span>{row.isGuest ? (row.visitorEmail || '—') : (row.email ?? '—')}</span>
                  )}
                </td>

                {/* Phone */}
                <td className="px-3 py-1.5 whitespace-nowrap">
                  {row.isGuest && canManage ? (
                    <Input value={row.visitorPhone ?? ''} onChange={e => updateGuest(row.key, 'visitorPhone', e.target.value)} placeholder="Phone" className="h-7 text-xs w-28" />
                  ) : (
                    <span className="text-muted-foreground">
                      {row.isGuest ? (row.visitorPhone || '—') : (row.phone ? <a href={`tel:${row.phone}`} className="hover:text-accent">{row.phone}</a> : '—')}
                    </span>
                  )}
                </td>

                {/* Type */}
                <td className="px-3 py-1.5">
                  {row.isGuest
                    ? <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 bg-blue-50">Guest</Badge>
                    : row.isLeader
                    ? <Badge className="text-xs bg-accent/10 text-accent border-accent/30">Leader</Badge>
                    : row.isAssistant
                    ? <Badge variant="outline" className="text-xs">Asst.</Badge>
                    : <Badge variant="outline" className="text-xs">Member</Badge>}
                </td>

                {/* Status */}
                <td className="px-3 py-1.5">
                  {canManage ? (
                    <div className="flex gap-1">
                      {(['present', 'absent', 'excused'] as const).map(s => (
                        <button key={s} onClick={() => setStatus(row.key, s)}
                          className={`px-2 py-0.5 text-xs rounded border transition-colors capitalize ${row.status === s ? STATUS_STYLES[s] : 'border-border text-muted-foreground hover:bg-muted'}`}>
                          {s.charAt(0).toUpperCase()}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Badge variant="outline" className={`text-xs capitalize ${STATUS_STYLES[row.status]}`}>{row.status}</Badge>
                  )}
                </td>

                {/* Excuse reason */}
                <td className="px-3 py-1.5 max-w-[140px]">
                  {row.status === 'excused' && (
                    <button
                      onClick={() => canManage && setExcuseKey(row.key)}
                      className={`text-xs text-left truncate block max-w-full ${canManage ? 'text-yellow-700 hover:underline cursor-pointer' : 'text-muted-foreground cursor-default'}`}
                      title={row.notes || 'No reason given'}
                    >
                      {row.notes || <span className="italic text-muted-foreground">{canManage ? 'Add reason' : 'No reason'}</span>}
                    </button>
                  )}
                </td>

                {/* First visit */}
                <td className="px-3 py-1.5">
                  {row.isGuest && (
                    <label className="flex items-center gap-1 text-xs cursor-pointer">
                      <input type="checkbox" checked={row.isFirstTime ?? true} onChange={e => updateGuest(row.key, 'isFirstTime', e.target.checked)} disabled={!canManage} className="h-3 w-3" />
                      {row.isFirstTime ? 'Yes' : 'No'}
                    </label>
                  )}
                </td>

                {/* Remove guests */}
                <td className="px-2 py-1.5">
                  {row.isGuest && canManage && (
                    <button onClick={() => removeGuest(row.key)} className="p-1 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Excuse dialog */}
      {excuseKey && excuseRow && (
        <ExcuseDialog
          name={excuseRow.isGuest ? (excuseRow.visitorName || 'Guest') : `${excuseRow.firstName} ${excuseRow.lastName}`}
          reason={excuseRow.notes ?? ''}
          onSave={saveExcuseReason}
          onCancel={() => cancelExcuse(excuseRowWasAlreadyExcused)}
        />
      )}
    </div>
  );
}
