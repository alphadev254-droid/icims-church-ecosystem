import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceService, type AttendanceRecord } from '@/services/attendance';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Loader2, Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 70;

type VisitorForm = {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestGender: string;
  guestAgeBracket: string;
  guestFirstTime: boolean;
  invitedBy: string;
};

const emptyVisitorForm: VisitorForm = {
  guestName: '',
  guestEmail: '',
  guestPhone: '',
  guestGender: '',
  guestAgeBracket: '',
  guestFirstTime: false,
  invitedBy: '',
};

export function AddAttendeesDialog({
  record,
  open,
  initialTab = 'members',
  onClose,
}: {
  record: AttendanceRecord;
  open: boolean;
  initialTab?: 'members' | 'guest';
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [tab, setTab] = useState(initialTab);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visitorForm, setVisitorForm] = useState<VisitorForm>(emptyVisitorForm);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, open]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const membersQuery = useQuery({
    queryKey: ['attendance-member-search', record.id, debouncedQuery, page],
    queryFn: () => attendanceService.searchMembers(record.id, { q: debouncedQuery, page, limit: PAGE_SIZE }),
    enabled: open && tab === 'members' && debouncedQuery.length >= 3,
  });

  const refreshAttendance = () => {
    qc.invalidateQueries({ queryKey: ['attendance'] });
    qc.invalidateQueries({ queryKey: ['attendance-detail', record.id] });
    qc.invalidateQueries({ queryKey: ['attendance-participants', record.id] });
  };

  const addMembers = useMutation({
    mutationFn: () => attendanceService.addManualMembers(record.id, Array.from(selectedIds)),
    onSuccess: (response) => {
      refreshAttendance();
      setSelectedIds(new Set());
      membersQuery.refetch();
      toast.success(`${response.created} member${response.created === 1 ? '' : 's'} marked present${response.skipped ? `, ${response.skipped} skipped` : ''}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add members'),
  });

  const addGuest = useMutation({
    mutationFn: () => attendanceService.addManualVisitor(record.id, {
      guestName: visitorForm.guestName.trim(),
      guestEmail: visitorForm.guestEmail.trim() || undefined,
      guestPhone: visitorForm.guestPhone.trim() || undefined,
      guestGender: visitorForm.guestGender || undefined,
      guestAgeBracket: visitorForm.guestAgeBracket || undefined,
      guestFirstTime: visitorForm.guestFirstTime,
      invitedBy: visitorForm.invitedBy.trim() || undefined,
    }),
    onSuccess: () => {
      refreshAttendance();
      setVisitorForm(emptyVisitorForm);
      toast.success('Guest marked present');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add guest'),
  });

  const members = membersQuery.data?.data ?? [];
  const pagination = membersQuery.data?.pagination;
  const selectedCount = selectedIds.size;
  const canGoNext = !!pagination && page < pagination.totalPages;
  const hasSearch = debouncedQuery.length >= 3;

  const selectedLabel = useMemo(() => (
    selectedCount ? `${selectedCount} selected` : 'Select members to add'
  ), [selectedCount]);

  const toggleMember = (id: string, checked: boolean) => {
    setSelectedIds(current => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Add Attendance</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(value) => setTab(value as 'members' | 'guest')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="guest">Guest</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Search member</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Type at least 3 letters, name, email, or phone"
                  className="pl-9"
                  autoComplete="off"
                />
              </div>
              <p className="text-xs text-muted-foreground">Search is limited to members of {record.church?.name || 'this church'}.</p>
            </div>

            <div className="rounded-lg border">
              <div className="flex items-center justify-between border-b px-3 py-2 text-xs text-muted-foreground">
                <span>{selectedLabel}</span>
                {pagination && <span>{pagination.total} match{pagination.total === 1 ? '' : 'es'}</span>}
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {!hasSearch ? (
                  <div className="px-4 py-10 text-center text-sm text-muted-foreground">Start typing to search members.</div>
                ) : membersQuery.isLoading ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                  </div>
                ) : members.length ? (
                  members.map(member => {
                    const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unnamed member';
                    return (
                      <label
                        key={member.id}
                        className={`grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] gap-3 border-b px-3 py-2 last:border-b-0 sm:grid-cols-[auto_minmax(150px,1fr)_minmax(180px,1.3fr)_minmax(120px,.8fr)_auto] sm:items-center ${member.alreadyCheckedIn ? 'bg-muted/40 text-muted-foreground' : ''}`}
                      >
                        <Checkbox
                          checked={selectedIds.has(member.id)}
                          disabled={member.alreadyCheckedIn}
                          onCheckedChange={checked => toggleMember(member.id, checked === true)}
                          className="mt-1 sm:mt-0"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {name}
                            {member.memberType === 'child' && <span className="ml-1 text-xs text-muted-foreground">(child)</span>}
                          </p>
                          <p className="truncate text-xs text-muted-foreground sm:hidden">{member.email || 'No email'} · {member.phone || 'No phone'}</p>
                        </div>
                        <p className="hidden truncate text-xs text-muted-foreground sm:block">{member.email || '-'}</p>
                        <p className="hidden truncate text-xs text-muted-foreground sm:block">{member.phone || '-'}</p>
                        {member.alreadyCheckedIn && <Badge variant="outline" className="w-fit">Present</Badge>}
                      </label>
                    );
                  })
                ) : (
                  <div className="px-4 py-10 text-center text-sm text-muted-foreground">No matching members found.</div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1 || membersQuery.isLoading} onClick={() => setPage(value => Math.max(1, value - 1))}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled={!canGoNext || membersQuery.isLoading} onClick={() => setPage(value => value + 1)}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
                {pagination && <span className="text-xs text-muted-foreground">Page {pagination.page} of {Math.max(pagination.totalPages, 1)}</span>}
              </div>
              <Button disabled={!selectedCount || addMembers.isPending} onClick={() => addMembers.mutate()}>
                {addMembers.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Mark Selected Present
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="guest" className="mt-4">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!visitorForm.guestName.trim()) {
                  toast.error('Guest name is required');
                  return;
                }
                addGuest.mutate();
              }}
            >
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input value={visitorForm.guestName} onChange={event => setVisitorForm(form => ({ ...form, guestName: event.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <Select value={visitorForm.guestGender || undefined} onValueChange={value => setVisitorForm(form => ({ ...form, guestGender: value }))}>
                    <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Age</Label>
                  <Select value={visitorForm.guestAgeBracket || undefined} onValueChange={value => setVisitorForm(form => ({ ...form, guestAgeBracket: value }))}>
                    <SelectTrigger><SelectValue placeholder="Age" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-12">0-12</SelectItem>
                      <SelectItem value="13-17">13-17</SelectItem>
                      <SelectItem value="18-35">18-35</SelectItem>
                      <SelectItem value="36-59">36-59</SelectItem>
                      <SelectItem value="60+">60+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={visitorForm.guestPhone} onChange={event => setVisitorForm(form => ({ ...form, guestPhone: event.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={visitorForm.guestEmail} onChange={event => setVisitorForm(form => ({ ...form, guestEmail: event.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Invited by</Label>
                <Input value={visitorForm.invitedBy} onChange={event => setVisitorForm(form => ({ ...form, invitedBy: event.target.value }))} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={visitorForm.guestFirstTime} onCheckedChange={checked => setVisitorForm(form => ({ ...form, guestFirstTime: checked === true }))} />
                First time visiting
              </label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={addGuest.isPending}>
                  {addGuest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Guest
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
