import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService, type AttendanceVisitor } from '@/services/attendance';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, UserCheck, Trash2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { HOW_HEARD, AGE_BRACKETS, GENDER_LABELS, HOW_HEARD_LABELS } from './constants';

interface Props {
  record: any;
  canUpdate: boolean;
  onClose: () => void;
}

const PAGE_SIZE = 20;

export function VisitorsManageDialog({ record, canUpdate, onClose }: Props) {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<AttendanceVisitor>({ name: '' });
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<(AttendanceVisitor & { id?: string })[]>([]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['attendance-visitors', record.id, page],
    queryFn: () => attendanceService.getVisitors(record.id, { page, limit: PAGE_SIZE }),
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
    mutationFn: (v: AttendanceVisitor) => attendanceService.addVisitor(record.id, v),
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
    mutationFn: (visitorId: string) => attendanceService.deleteVisitor(record.id, visitorId),
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
              <div><Label className="text-xs">Phone</Label><Input className="h-8 text-sm mt-0.5" value={draft.phone ?? ''} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} placeholder="+265 ..." /></div>
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

        {canUpdate && !addOpen && (
          <Button variant="outline" size="sm" className="gap-1 mt-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Visitor
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
