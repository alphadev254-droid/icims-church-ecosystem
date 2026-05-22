import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService, type AttendanceVisitor } from '@/services/attendance';
import { sharedAccessService } from '@/services/sharedAccess';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, UserCheck, Trash2, ChevronDown, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { HOW_HEARD, AGE_BRACKETS, GENDER_LABELS, HOW_HEARD_LABELS } from './constants';

interface Props {
  record: any;
  canUpdate: boolean;
  onClose: () => void;
  token?: string; // When provided, use shared-access API instead of authenticated API
}

const PAGE_SIZE = 20;

const TEMPLATE_ROWS = [
  ['name', 'phone', 'email', 'residentialArea', 'gender', 'ageBracket', 'howHeard', 'notes'],
  ['John Banda', '+265999123456 or +254712345678', 'john@example.com', 'Area 25', 'male', '18-35', 'invited_by_friend', 'First visit'],
];

const FIELD_MAP: Record<string, keyof AttendanceVisitor> = {
  name: 'name', fullname: 'name', phone: 'phone', phonenumber: 'phone',
  email: 'email', emailaddress: 'email', residentialarea: 'residentialArea',
  area: 'residentialArea', gender: 'gender', agebracket: 'ageBracket',
  age: 'ageBracket', howheard: 'howHeard', howyouheard: 'howHeard', notes: 'notes',
};

export function VisitorsManageDialog({ record, canUpdate, onClose, token }: Props) {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<AttendanceVisitor>({ name: '' });
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<(AttendanceVisitor & { id?: string })[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number; errors: number } | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const getVisitorsApi = token
    ? (attId: string, params: { page: number; limit: number }) => sharedAccessService.getVisitors(token, attId, params)
    : (attId: string, params: { page: number; limit: number }) => attendanceService.getVisitors(attId, params);

  const addVisitorApi = token
    ? (attId: string, visitor: AttendanceVisitor) => sharedAccessService.addVisitor(token, attId, visitor)
    : (attId: string, visitor: AttendanceVisitor) => attendanceService.addVisitor(attId, visitor);

  const deleteVisitorApi = token
    ? (attId: string, visitorId: string) => sharedAccessService.deleteVisitor(token, attId, visitorId)
    : (attId: string, visitorId: string) => attendanceService.deleteVisitor(attId, visitorId);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['attendance-visitors', record.id, page, token],
    queryFn: () => getVisitorsApi(record.id, { page, limit: PAGE_SIZE }),
    staleTime: 0,
  });

  useEffect(() => {
    if (data?.data) {
      setAccumulated(prev => page === 1 ? data.data : [...prev, ...data.data]);
    }
  }, [data]);

  const total = data?.total ?? 0;
  const hasMore = data?.hasMore ?? false;

  const resetList = () => {
    setPage(1);
    setAccumulated([]);
    qc.removeQueries({ queryKey: ['attendance-visitors', record.id] });
  };

  const addMutation = useMutation({
    mutationFn: (v: AttendanceVisitor) => addVisitorApi(record.id, v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      resetList();
      setAddOpen(false);
      setDraft({ name: '' });
      toast.success('Visitor added');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add visitor'),
  });

  const removeMutation = useMutation({
    mutationFn: (visitorId: string) => deleteVisitorApi(record.id, visitorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      resetList();
      toast.success('Visitor removed');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to remove visitor'),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) { toast.error('Name is required'); return; }
    addMutation.mutate({ ...draft, name: draft.name.trim() });
  };

  const downloadTemplate = () => {
    const csv = TEMPLATE_ROWS.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'visitors-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      let rows: any[][] = [];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const xlsx = await import('xlsx');
        const ab = await file.arrayBuffer();
        const wb = xlsx.read(ab, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = xlsx.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      } else {
        const Papa = (await import('papaparse')).default;
        const text = await file.text();
        const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
        rows = result.data;
      }
      if (rows.length < 2) { toast.error('No data rows found in file'); return; }
      const headers = rows[0].map((h: any) => String(h ?? '').trim().toLowerCase().replace(/[\s_]+/g, ''));
      const dataRows = rows.slice(1).filter((r: any[]) => r.some((c: any) => String(c ?? '').trim()));
      if (dataRows.length === 0) { toast.error('No valid rows found'); return; }
      setUploadProgress({ done: 0, total: dataRows.length, errors: 0 });
      let errors = 0;
      for (const row of dataRows) {
        const visitor: AttendanceVisitor = { name: '' };
        headers.forEach((h: string, idx: number) => {
          const field = FIELD_MAP[h];
          if (field && row[idx] !== undefined && row[idx] !== null) {
            (visitor as any)[field] = String(row[idx]).trim();
          }
        });
        if (!visitor.name) { errors++; setUploadProgress(p => p ? { ...p, errors: p.errors + 1 } : null); continue; }
        try {
          await addVisitorApi(record.id, visitor);
          setUploadProgress(p => p ? { ...p, done: p.done + 1 } : null);
        } catch {
          errors++;
          setUploadProgress(p => p ? { ...p, errors: p.errors + 1 } : null);
        }
      }
      const succeeded = dataRows.length - errors;
      if (errors === 0) toast.success(`${succeeded} visitor${succeeded !== 1 ? 's' : ''} uploaded`);
      else toast.warning(`${succeeded} uploaded, ${errors} skipped (missing name or error)`);
      setTimeout(() => { setUploadProgress(null); resetList(); }, 1000);
    } catch {
      toast.error('Failed to parse file — ensure it is a valid CSV or XLSX');
      setUploadProgress(null);
    }
  };

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-accent" />
            Visitors — {record.serviceType} · {new Date(record.date).toLocaleDateString()}
          </DialogTitle>
        </DialogHeader>

        {/* header: total count */}
        {total > 0 && (
          <p className="text-xs text-muted-foreground mb-2">{accumulated.length} of {total} visitor{total !== 1 ? 's' : ''}</p>
        )}

        {isLoading && accumulated.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          </div>
        ) : accumulated.length === 0 && !addOpen ? (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
            No visitors recorded for this service.
          </div>
        ) : (
          <div className="space-y-2">
            {accumulated.map((v, i) => (
              <div key={v.id ?? i} className="flex items-start gap-3 border rounded-md px-3 py-2.5 bg-muted/20">
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-0.5 text-sm">
                  <div className="font-medium col-span-2 sm:col-span-1">{v.name}</div>
                  {v.phone && <div className="text-muted-foreground text-xs">{v.phone}</div>}
                  {v.email && <div className="text-muted-foreground text-xs">{v.email}</div>}
                  {v.residentialArea && <div className="text-muted-foreground text-xs col-span-2 sm:col-span-3">{v.residentialArea}</div>}
                  <div className="text-xs text-muted-foreground flex gap-3 col-span-2 sm:col-span-3 mt-0.5">
                    {v.gender && <span>{GENDER_LABELS[v.gender] ?? v.gender}</span>}
                    {v.ageBracket && <span>{v.ageBracket} yrs</span>}
                    {v.howHeard && <span>Via: {HOW_HEARD_LABELS[v.howHeard] ?? v.howHeard}</span>}
                  </div>
                  {v.notes && <div className="text-xs text-muted-foreground italic col-span-2 sm:col-span-3">{v.notes}</div>}
                </div>
                {canUpdate && (
                  <button
                    onClick={() => v.id && removeMutation.mutate(v.id)}
                    disabled={removeMutation.isPending}
                    className="mt-0.5 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    title="Remove visitor"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            {hasMore && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1"
                disabled={isFetching}
                onClick={() => setPage(p => p + 1)}
              >
                {isFetching ? 'Loading...' : <><ChevronDown className="h-3.5 w-3.5" /> Load more ({total - accumulated.length} remaining)</>}
              </Button>
            )}
          </div>
        )}

        {addOpen && (
          <form onSubmit={handleAdd} className="border rounded-lg p-4 space-y-3 mt-2">
            <p className="text-sm font-medium">Add New Visitor</p>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Full Name *</Label><Input className="h-8 text-sm mt-0.5" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. John Banda" /></div>
              <div><Label className="text-xs">Phone</Label><Input className="h-8 text-sm mt-0.5" value={draft.phone ?? ''} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} placeholder="+265 / +254 ..." /></div>
              <div><Label className="text-xs">Email</Label><Input className="h-8 text-sm mt-0.5" type="email" value={draft.email ?? ''} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} /></div>
              <div><Label className="text-xs">Residential Area</Label><Input className="h-8 text-sm mt-0.5" value={draft.residentialArea ?? ''} onChange={e => setDraft(d => ({ ...d, residentialArea: e.target.value }))} placeholder="e.g. Area 25" /></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Gender</Label>
                <Select value={draft.gender ?? ''} onValueChange={v => setDraft(d => ({ ...d, gender: v }))}>
                  <SelectTrigger className="h-8 text-sm mt-0.5"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Age Bracket</Label>
                <Select value={draft.ageBracket ?? ''} onValueChange={v => setDraft(d => ({ ...d, ageBracket: v }))}>
                  <SelectTrigger className="h-8 text-sm mt-0.5"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{AGE_BRACKETS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">How did you hear?</Label>
                <Select value={draft.howHeard ?? ''} onValueChange={v => setDraft(d => ({ ...d, howHeard: v }))}>
                  <SelectTrigger className="h-8 text-sm mt-0.5"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{HOW_HEARD.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Notes</Label><Input className="h-8 text-sm mt-0.5" value={draft.notes ?? ''} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} /></div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => { setAddOpen(false); setDraft({ name: '' }); }}>Cancel</Button>
              <Button type="submit" size="sm" disabled={addMutation.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {addMutation.isPending ? 'Adding...' : 'Add Visitor'}
              </Button>
            </div>
          </form>
        )}

        {/* Upload progress */}
        {uploadProgress && (
          <div className="mt-2 rounded-md border bg-muted/30 px-3 py-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Uploading visitors…</span>
              <span className="font-medium">{uploadProgress.done + uploadProgress.errors} / {uploadProgress.total}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${Math.round(((uploadProgress.done + uploadProgress.errors) / uploadProgress.total) * 100)}%` }}
              />
            </div>
            {uploadProgress.errors > 0 && (
              <p className="text-xs text-yellow-600">{uploadProgress.errors} row{uploadProgress.errors !== 1 ? 's' : ''} skipped</p>
            )}
          </div>
        )}

        {canUpdate && !addOpen && (
          <div className="flex flex-wrap gap-2 mt-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Visitor
            </Button>
            <Button
              variant="outline" size="sm" className="gap-1"
              onClick={() => uploadRef.current?.click()}
              disabled={!!uploadProgress}
            >
              <Upload className="h-3.5 w-3.5" /> Upload CSV / Excel
            </Button>
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={downloadTemplate}>
              <Download className="h-3.5 w-3.5" /> Download Template
            </Button>
            <input
              ref={uploadRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
