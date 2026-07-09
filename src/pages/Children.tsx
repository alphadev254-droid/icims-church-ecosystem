import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Baby, Link2, Pencil, Plus, Search, Trash2, Unlink, Users } from 'lucide-react';
import { childrenService, type Child } from '@/services/children';
import { usersService, type AppUser } from '@/services/users';
import { churchesService } from '@/services/churches';
import { useDebounce } from '@/hooks/use-debounce';
import { useRole } from '@/hooks/useRole';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const PAGE_SIZE = 50;

function childName(child: Child) {
  return `${child.firstName} ${child.lastName}`.trim();
}

function guardianName(user?: AppUser | Child['guardians'][number]['guardian']) {
  return user ? `${user.firstName} ${user.lastName}`.trim() : '';
}

function ChildForm({ child, defaultChurchId, onSubmit, isPending }: {
  child?: Child | null;
  defaultChurchId?: string;
  onSubmit: (payload: any) => void;
  isPending?: boolean;
}) {
  const [churchId, setChurchId] = useState(child?.churchId ?? defaultChurchId ?? '');
  const [firstName, setFirstName] = useState(child?.firstName ?? '');
  const [lastName, setLastName] = useState(child?.lastName ?? '');
  const [age, setAge] = useState(child?.age != null ? String(child.age) : '');
  const [gender, setGender] = useState(child?.gender ?? '');
  const [phone, setPhone] = useState(child?.phone ?? '');
  const [notes, setNotes] = useState(child?.notes ?? '');
  const [status, setStatus] = useState(child?.status ?? 'active');

  const { data: churches = [] } = useQuery({ queryKey: ['churches'], queryFn: churchesService.getAll });

  return (
    <div className="space-y-3">
      {!child && (
        <div>
          <Label>Church</Label>
          <Select value={churchId} onValueChange={setChurchId}>
            <SelectTrigger><SelectValue placeholder="Select church" /></SelectTrigger>
            <SelectContent>
              {churches.map(church => (
                <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>First Name</Label>
          <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
        </div>
        <div>
          <Label>Last Name</Label>
          <Input value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Age</Label>
          <Input type="number" min="0" value={age} onChange={e => setAge(e.target.value)} />
        </div>
        <div>
          <Label>Sex</Label>
          <Select value={gender || undefined} onValueChange={setGender}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Phone</Label>
        <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Optional" />
      </div>
      {child && (
        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label>Notes</Label>
        <Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      <Button
        className="w-full"
        disabled={!firstName || !lastName || (!child && !churchId) || isPending}
        onClick={() => onSubmit({
          ...(child ? {} : { churchId }),
          firstName,
          lastName,
          age: age ? Number(age) : null,
          gender: gender || null,
          phone: phone || null,
          notes: notes || null,
          ...(child ? { status } : {}),
        })}
      >
        {isPending ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
}

function GuardianLinkDialog({ child, open, onOpenChange }: { child: Child | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [guardianId, setGuardianId] = useState('');
  const [relationship, setRelationship] = useState('guardian');
  const debounced = useDebounce(search, 300);

  const { data } = useQuery({
    queryKey: ['guardian-picker', child?.churchId, debounced],
    queryFn: () => usersService.getAll({ churchId: child!.churchId, role: 'member', search: debounced || undefined, limit: 25 }),
    enabled: !!child && open,
  });

  const members = data?.data ?? [];
  const mutation = useMutation({
    mutationFn: () => childrenService.linkGuardian(child!.id, { guardianId, relationship, isPrimary: false, canPickup: true }),
    onSuccess: () => {
      toast.success('Guardian linked');
      qc.invalidateQueries({ queryKey: ['children'] });
      setGuardianId('');
      setRelationship('guardian');
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to link guardian'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Link Guardian</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Search Member</Label>
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, email, phone..." />
          </div>
          <div>
            <Label>Member</Label>
            <Select value={guardianId} onValueChange={setGuardianId}>
              <SelectTrigger><SelectValue placeholder="Select guardian" /></SelectTrigger>
              <SelectContent>
                {members.map(member => (
                  <SelectItem key={member.id} value={member.id}>{guardianName(member)} - {member.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Relationship</Label>
            <Input value={relationship} onChange={e => setRelationship(e.target.value)} />
          </div>
          <Button className="w-full" disabled={!guardianId || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Linking...' : 'Link Guardian'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ChildrenPage() {
  const qc = useQueryClient();
  const { hasPermission } = useRole();
  const [search, setSearch] = useState('');
  const [churchId, setChurchId] = useState('all');
  const [unlinkedOnly, setUnlinkedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editChild, setEditChild] = useState<Child | null>(null);
  const [deleteChild, setDeleteChild] = useState<Child | null>(null);
  const [linkChild, setLinkChild] = useState<Child | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const canCreate = hasPermission('children:create');
  const canUpdate = hasPermission('children:update');
  const canDelete = hasPermission('children:delete');

  const { data: churches = [] } = useQuery({ queryKey: ['churches'], queryFn: churchesService.getAll });
  const defaultChurchId = churches[0]?.id;

  const queryParams = useMemo(() => ({
    churchId: churchId !== 'all' ? churchId : undefined,
    search: debouncedSearch || undefined,
    unlinked: unlinkedOnly || undefined,
    page,
    limit: PAGE_SIZE,
  }), [churchId, debouncedSearch, unlinkedOnly, page]);

  const { data, isLoading } = useQuery({
    queryKey: ['children', queryParams],
    queryFn: () => childrenService.list(queryParams),
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => childrenService.create(payload),
    onSuccess: () => {
      toast.success('Child created');
      qc.invalidateQueries({ queryKey: ['children'] });
      setCreateOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create child'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => childrenService.update(id, payload),
    onSuccess: () => {
      toast.success('Child updated');
      qc.invalidateQueries({ queryKey: ['children'] });
      setEditChild(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update child'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => childrenService.delete(id),
    onSuccess: () => {
      toast.success('Child deleted');
      qc.invalidateQueries({ queryKey: ['children'] });
      setDeleteChild(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete child'),
  });

  const unlinkMutation = useMutation({
    mutationFn: ({ childId, guardianId }: { childId: string; guardianId: string }) => childrenService.unlinkGuardian(childId, guardianId),
    onSuccess: () => {
      toast.success('Guardian unlinked');
      qc.invalidateQueries({ queryKey: ['children'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to unlink guardian'),
  });

  const children = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Baby className="h-5 w-5 text-accent" /> Children
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Manage dependents and guardian links</p>
        </div>
        {canCreate && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5"><Plus className="h-4 w-4" /> Add Child</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Add Child</DialogTitle></DialogHeader>
              <ChildForm defaultChurchId={defaultChurchId} onSubmit={payload => createMutation.mutate(payload)} isPending={createMutation.isPending} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search children..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={churchId} onValueChange={v => { setChurchId(v); setPage(1); }}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All churches</SelectItem>
            {churches.map(church => <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <Checkbox checked={unlinkedOnly} onCheckedChange={v => { setUnlinkedOnly(Boolean(v)); setPage(1); }} />
          No guardian
        </label>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Loading children...</div>
      ) : children.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">No children found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {children.map(child => (
            <Card key={child.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{childName(child)}</p>
                    <p className="text-xs text-muted-foreground">{child.church?.name}</p>
                  </div>
                  <Badge variant={child.status === 'active' ? 'default' : 'secondary'}>{child.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {child.age != null && <span>{child.age} yrs</span>}
                  {child.gender && <span className="capitalize">{child.gender}</span>}
                  {child.phone && <span>{child.phone}</span>}
                </div>
                <div className="rounded-md border p-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium flex items-center gap-1"><Users className="h-3 w-3" /> Guardians</p>
                    {canUpdate && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setLinkChild(child)}>
                        <Link2 className="h-3 w-3" /> Link
                      </Button>
                    )}
                  </div>
                  {!child.guardians || child.guardians.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No guardian linked.</p>
                  ) : (
                    child.guardians.map(link => (
                      <div key={link.id} className="flex items-center justify-between gap-2 text-xs">
                        <span>
                          <span className="font-medium">{guardianName(link.guardian)}</span>
                          <span className="text-muted-foreground"> - {link.relationship}</span>
                          {link.isPrimary && <Badge variant="outline" className="ml-1 text-[10px]">Primary</Badge>}
                        </span>
                        {canUpdate && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            disabled={unlinkMutation.isPending}
                            onClick={() => unlinkMutation.mutate({ childId: child.id, guardianId: link.guardianId })}
                          >
                            <Unlink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {(canUpdate || canDelete) && (
                  <div className="flex gap-2">
                    {canUpdate && (
                      <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => setEditChild(child)}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button size="sm" variant="outline" className="flex-1 gap-1 text-destructive" onClick={() => setDeleteChild(child)}>
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={!!editChild} onOpenChange={open => !open && setEditChild(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Child</DialogTitle></DialogHeader>
          {editChild && (
            <ChildForm
              child={editChild}
              onSubmit={payload => updateMutation.mutate({ id: editChild.id, payload })}
              isPending={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <GuardianLinkDialog child={linkChild} open={!!linkChild} onOpenChange={open => !open && setLinkChild(null)} />

      <AlertDialog open={!!deleteChild} onOpenChange={open => !open && setDeleteChild(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete child?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes {deleteChild ? childName(deleteChild) : 'this child'} and all guardian links.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteChild && deleteMutation.mutate(deleteChild.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
