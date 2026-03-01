import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { givingService, type Donation } from '@/services/giving';
import { useRole } from '@/hooks/useRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChurchSelect } from '@/components/ChurchSelect';
import { Plus, HandCoins, TrendingUp, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  memberName: z.string().min(1, 'Donor name required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['tithe', 'offering', 'pledge', 'special']),
  method: z.enum(['cash', 'card', 'mobile_money', 'bank_transfer']),
  status: z.enum(['completed', 'pending', 'failed']).default('completed'),
  reference: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  churchId: z.string().min(1, 'Church selection required'),
});
type FormValues = z.infer<typeof schema>;

function GivingForm({ defaultValues, onSubmit, isPending, submitLabel }: {
  defaultValues?: Partial<FormValues>;
  onSubmit: (v: FormValues) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'tithe', method: 'cash', status: 'completed', reference: '', notes: '', ...defaultValues },
  });
  
  const churchId = watch('churchId');
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <ChurchSelect 
        value={churchId} 
        onValueChange={value => setValue('churchId', value)}
      />
      {errors.churchId && <p className="text-xs text-destructive mt-1">{errors.churchId.message}</p>}
      
      <div>
        <Label>Donor Name</Label>
        <Input {...register('memberName')} />
        {errors.memberName && <p className="text-xs text-destructive mt-1">{errors.memberName.message}</p>}
      </div>
      <div>
        <Label>Amount (MWK)</Label>
        <Input type="number" min={1} {...register('amount')} />
        {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Type</Label>
          <Select defaultValue={defaultValues?.type ?? 'tithe'} onValueChange={v => setValue('type', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tithe">Tithe</SelectItem>
              <SelectItem value="offering">Offering</SelectItem>
              <SelectItem value="pledge">Pledge</SelectItem>
              <SelectItem value="special">Special</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Method</Label>
          <Select defaultValue={defaultValues?.method ?? 'cash'} onValueChange={v => setValue('method', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="mobile_money">Mobile Money</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Status</Label>
        <Select defaultValue={defaultValues?.status ?? 'completed'} onValueChange={v => setValue('status', v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Reference <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input {...register('reference')} placeholder="Receipt or transaction ref" />
      </div>
      <div>
        <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Textarea {...register('notes')} rows={2} />
      </div>
      <Button type="submit" disabled={isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
        {isPending ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}

export default function GivingPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editDonation, setEditDonation] = useState<Donation | null>(null);
  const [deleteDonation, setDeleteDonation] = useState<Donation | null>(null);
  const { hasPermission } = useRole();
  const qc = useQueryClient();

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['donations'],
    queryFn: givingService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: givingService.create,
    onSuccess: () => { toast.success('Donation recorded'); qc.invalidateQueries({ queryKey: ['donations'] }); setCreateOpen(false); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to record donation'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => givingService.update(id, dto),
    onSuccess: () => { toast.success('Donation updated'); qc.invalidateQueries({ queryKey: ['donations'] }); setEditDonation(null); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });
  const deleteMutation = useMutation({
    mutationFn: givingService.delete,
    onSuccess: () => { toast.success('Donation deleted'); qc.invalidateQueries({ queryKey: ['donations'] }); setDeleteDonation(null); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const canCreate = hasPermission('giving:create');
  const canUpdate = hasPermission('giving:update');
  const canDelete = hasPermission('giving:delete');

  const completed = donations.filter(d => d.status === 'completed');
  const total = completed.reduce((s, d) => s + Number(d.amount), 0);
  const tithes = completed.filter(d => d.type === 'tithe').reduce((s, d) => s + Number(d.amount), 0);
  const offerings = completed.filter(d => d.type === 'offering').reduce((s, d) => s + Number(d.amount), 0);

  const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' =>
    s === 'completed' ? 'default' : s === 'pending' ? 'secondary' : 'destructive';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Giving & Donations</h1>
          <p className="text-sm text-muted-foreground">{donations.length} transactions</p>
        </div>
        {canCreate && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                <Plus className="h-4 w-4" /> Record Donation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-heading">Record Donation</DialogTitle></DialogHeader>
              <GivingForm onSubmit={v => createMutation.mutate(v)} isPending={createMutation.isPending} submitLabel="Record Donation" />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { title: 'Total Giving', value: `MWK ${total.toLocaleString()}`, icon: HandCoins },
          { title: 'Tithes', value: `MWK ${tithes.toLocaleString()}`, icon: TrendingUp },
          { title: 'Offerings', value: `MWK ${offerings.toLocaleString()}`, icon: HandCoins },
        ].map(s => (
          <Card key={s.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold font-heading">{s.value}</div>
            </CardContent>
          </Card>
        ))}
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
                  <TableHead>Donor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                  {(canUpdate || canDelete) && <TableHead className="w-20">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.memberName}</TableCell>
                    <TableCell>MWK {Number(d.amount).toLocaleString()}</TableCell>
                    <TableCell className="hidden sm:table-cell capitalize">{d.type}</TableCell>
                    <TableCell className="hidden md:table-cell capitalize">{d.method.replace('_', ' ')}</TableCell>
                    <TableCell><Badge variant={statusVariant(d.status)}>{d.status}</Badge></TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{new Date(d.date).toLocaleDateString()}</TableCell>
                    {(canUpdate || canDelete) && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {canUpdate && (
                            <button onClick={() => setEditDonation(d)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => setDeleteDonation(d)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {donations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No donations recorded yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editDonation} onOpenChange={open => !open && setEditDonation(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Edit Donation</DialogTitle></DialogHeader>
          {editDonation && (
            <GivingForm
              defaultValues={{
                memberName: editDonation.memberName,
                amount: Number(editDonation.amount),
                type: editDonation.type,
                method: editDonation.method,
                status: editDonation.status,
                reference: editDonation.reference ?? '',
                notes: editDonation.notes ?? '',
                churchId: editDonation.churchId,
              }}
              onSubmit={v => updateMutation.mutate({ id: editDonation.id, dto: v })}
              isPending={updateMutation.isPending}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteDonation} onOpenChange={open => !open && setDeleteDonation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Donation</AlertDialogTitle>
            <AlertDialogDescription>
              Delete the donation of <strong>MWK {deleteDonation ? Number(deleteDonation.amount).toLocaleString() : ''}</strong> from <strong>{deleteDonation?.memberName}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDonation && deleteMutation.mutate(deleteDonation.id)}
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
