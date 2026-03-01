import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { membersService, type Member } from '@/services/members';
import { useRole } from '@/hooks/useRole';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Users, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional(),
  status: z.enum(['active', 'inactive', 'pending']).default('pending'),
});
type FormValues = z.infer<typeof schema>;

function MemberForm({ defaultValues, onSubmit, isPending, submitLabel }: {
  defaultValues?: Partial<FormValues>;
  onSubmit: (v: FormValues) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'pending', ...defaultValues },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>First Name</Label>
          <Input {...register('firstName')} />
          {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <Label>Last Name</Label>
          <Input {...register('lastName')} />
          {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>}
        </div>
      </div>
      <div>
        <Label>Phone</Label>
        <Input {...register('phone')} />
        {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
      </div>
      <div>
        <Label>Email <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input type="email" {...register('email')} />
        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Gender</Label>
          <Select defaultValue={defaultValues?.gender ?? ''} onValueChange={v => setValue('gender', v as any)}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select defaultValue={defaultValues?.status ?? 'pending'} onValueChange={v => setValue('status', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
        {isPending ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}

export default function MembersPage() {
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deleteMember, setDeleteMember] = useState<Member | null>(null);
  const { hasPermission } = useRole();
  const qc = useQueryClient();

  const { data: members = [], isLoading } = useQuery({ queryKey: ['members'], queryFn: membersService.getAll });

  const createMutation = useMutation({
    mutationFn: membersService.create,
    onSuccess: () => { toast.success('Member added'); qc.invalidateQueries({ queryKey: ['members'] }); setCreateOpen(false); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add member'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => membersService.update(id, dto),
    onSuccess: () => { toast.success('Member updated'); qc.invalidateQueries({ queryKey: ['members'] }); setEditMember(null); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });
  const deleteMutation = useMutation({
    mutationFn: membersService.delete,
    onSuccess: () => { toast.success('Member removed'); qc.invalidateQueries({ queryKey: ['members'] }); setDeleteMember(null); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const filtered = members.filter(m =>
    `${m.firstName} ${m.lastName} ${m.email ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const canCreate = hasPermission('members:create');
  const canUpdate = hasPermission('members:update');
  const canDelete = hasPermission('members:delete');

  const statusVariant = (s: string): 'default' | 'secondary' | 'outline' =>
    s === 'active' ? 'default' : s === 'pending' ? 'secondary' : 'outline';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Members</h1>
          <p className="text-sm text-muted-foreground">{members.length} total members</p>
        </div>
        {canCreate && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                <Plus className="h-4 w-4" /> Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">Add New Member</DialogTitle></DialogHeader>
              <MemberForm onSubmit={v => createMutation.mutate(v)} isPending={createMutation.isPending} submitLabel="Add Member" />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." className="pl-9" />
      </div>

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
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden md:table-cell">Gender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  {(canUpdate || canDelete) && <TableHead className="w-20">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.firstName} {m.lastName}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{m.email ?? '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{m.phone}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground capitalize">{m.gender ?? '—'}</TableCell>
                    <TableCell><Badge variant={statusVariant(m.status)}>{m.status}</Badge></TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</TableCell>
                    {(canUpdate || canDelete) && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {canUpdate && (
                            <button onClick={() => setEditMember(m)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => setDeleteMember(m)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />No members found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editMember} onOpenChange={open => !open && setEditMember(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Edit Member</DialogTitle></DialogHeader>
          {editMember && (
            <MemberForm
              defaultValues={{ firstName: editMember.firstName, lastName: editMember.lastName, phone: editMember.phone, email: editMember.email ?? '', gender: (editMember.gender as any) ?? undefined, status: editMember.status }}
              onSubmit={v => updateMutation.mutate({ id: editMember.id, dto: v })}
              isPending={updateMutation.isPending}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteMember} onOpenChange={open => !open && setDeleteMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{deleteMember?.firstName} {deleteMember?.lastName}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMember && deleteMutation.mutate(deleteMember.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
