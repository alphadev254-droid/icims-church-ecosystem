import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { subaccountsService } from '@/services/subaccounts';
import { churchesService } from '@/services/churches';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Building2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const subaccountSchema = z.object({
  businessName: z.string().min(1, 'Business name required'),
  settlementBank: z.string().min(1, 'Bank code required'),
  accountNumber: z.string().min(1, 'Account number required'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof subaccountSchema>;

export default function SubaccountPage() {
  const { churchId } = useParams<{ churchId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { hasPermission } = useRole();
  const [isEditing, setIsEditing] = useState(false);

  const canUpdate = hasPermission('subaccounts:update');

  const { data: church } = useQuery({
    queryKey: ['church', churchId],
    queryFn: () => churchesService.getOne(churchId!),
    enabled: !!churchId && user?.accountCountry === 'Kenya',
  });

  const { data: subaccount, isLoading } = useQuery({
    queryKey: ['subaccount', churchId],
    queryFn: () => subaccountsService.getByChurch(churchId!),
    enabled: !!churchId && user?.accountCountry === 'Kenya',
  });

  const { data: banks = [] } = useQuery({
    queryKey: ['banks'],
    queryFn: () => subaccountsService.getBanks(),
    enabled: user?.accountCountry === 'Kenya',
  });

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormValues>({
    resolver: zodResolver(subaccountSchema),
    values: subaccount ? {
      businessName: subaccount.businessName,
      settlementBank: subaccount.settlementBank,
      accountNumber: subaccount.accountNumber,
      description: subaccount.description || '',
    } : undefined,
  });

  const selectedBank = watch('settlementBank');

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => subaccountsService.create({ 
      churchId: churchId!, 
      businessName: data.businessName,
      settlementBank: data.settlementBank,
      accountNumber: data.accountNumber,
      description: data.description,
    }),
    onSuccess: () => {
      toast.success('Account created successfully');
      qc.invalidateQueries({ queryKey: ['subaccount', churchId] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Failed to create account'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) => subaccountsService.update(subaccount!.id, data),
    onSuccess: () => {
      toast.success('Account updated successfully');
      qc.invalidateQueries({ queryKey: ['subaccount', churchId] });
      setIsEditing(false);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Failed to update account'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (active: boolean) => subaccountsService.update(subaccount!.id, { active }),
    onSuccess: () => {
      toast.success(`Account ${subaccount?.active ? 'deactivated' : 'activated'}`);
      qc.invalidateQueries({ queryKey: ['subaccount', churchId] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Failed to update status'),
  });

  const onSubmit = (data: FormValues) => {
    if (subaccount) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // Block access for non-Kenya accounts (after all hooks)
  if (user?.accountCountry !== 'Kenya') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Not Available</h2>
            <p className="text-muted-foreground mb-4">Subaccounts are only available for Kenya accounts.</p>
            <Button onClick={() => navigate('/dashboard/churches')}>Back to Branches</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/churches')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">Account Management</h1>
          {church && <p className="text-xs sm:text-sm text-muted-foreground">{church.name}</p>}
        </div>
      </div>

      {subaccount && !isEditing ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Account Details
              </CardTitle>
              <div className="flex items-center gap-2">
                {subaccount.active ? (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" /> Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-destructive">
                    <XCircle className="h-4 w-4" /> Inactive
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-xs sm:text-sm text-muted-foreground">Business Name</Label>
                <p className="text-sm sm:text-base font-medium">{subaccount.businessName}</p>
              </div>
              <div>
                <Label className="text-xs sm:text-sm text-muted-foreground">Account Code</Label>
                <p className="font-mono text-xs sm:text-sm">{subaccount.subaccountCode}</p>
              </div>
              <div>
                <Label className="text-xs sm:text-sm text-muted-foreground">Settlement Bank</Label>
                <p className="text-sm sm:text-base font-medium">{banks.find(b => b.code === subaccount.settlementBank)?.name || subaccount.settlementBank}</p>
              </div>
              <div>
                <Label className="text-xs sm:text-sm text-muted-foreground">Account Number</Label>
                <p className="text-sm sm:text-base font-medium">{subaccount.accountNumber}</p>
              </div>
              <div>
                <Label className="text-xs sm:text-sm text-muted-foreground">Created</Label>
                <p className="text-xs sm:text-sm">{new Date(subaccount.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            {subaccount.description && (
              <div>
                <Label className="text-xs sm:text-sm text-muted-foreground">Description</Label>
                <p className="text-xs sm:text-sm">{subaccount.description}</p>
              </div>
            )}
            {canUpdate && (
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button className="h-8 text-xs sm:h-9 sm:text-sm" onClick={() => setIsEditing(true)}>Edit Account</Button>
                <Button
                  variant="outline"
                  className="h-8 text-xs sm:h-9 sm:text-sm"
                  onClick={() => toggleActiveMutation.mutate(!subaccount.active)}
                  disabled={toggleActiveMutation.isPending}
                >
                  {subaccount.active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{subaccount ? 'Edit Account' : 'Create Account'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <Label className="text-xs sm:text-sm">Business Name *</Label>
                <Input className="h-8 text-xs sm:h-10 sm:text-sm" {...register('businessName')} placeholder="e.g. St. Peter Church" />
                {errors.businessName && <p className="text-xs text-destructive mt-1">{errors.businessName.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs sm:text-sm">Settlement Bank *</Label>
                  <select {...register('settlementBank')} className="flex h-8 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Select bank</option>
                    {banks.map(bank => (
                      <option key={bank.code} value={bank.code}>{bank.name} ({bank.code})</option>
                    ))}
                  </select>
                  {errors.settlementBank && <p className="text-xs text-destructive mt-1">{errors.settlementBank.message}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{banks.find(b => b.code === 'MPS') ? 'Use M-PESA for mobile money' : 'Bank account or M-PESA'}</p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Account Number *</Label>
                  <Input className="h-8 text-xs sm:h-10 sm:text-sm" {...register('accountNumber')} placeholder={selectedBank === 'MPESA' || selectedBank === 'MPPAYBILL' || selectedBank === 'MPTILL' ? 'e.g. 0714991414 or 0113765448' : 'Account number'} />
                  {errors.accountNumber && <p className="text-xs text-destructive mt-1">{errors.accountNumber.message}</p>}
                  {(selectedBank === 'MPESA' || selectedBank === 'MPPAYBILL' || selectedBank === 'MPTILL') && <p className="text-xs text-muted-foreground mt-1">Enter phone number (e.g. 0714991414)</p>}
                </div>
              </div>

              <div>
                <Label className="text-xs sm:text-sm">Description (Optional)</Label>
                <Textarea className="text-xs sm:text-sm" {...register('description')} placeholder="Additional notes" rows={3} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" className="h-8 text-xs sm:h-9 sm:text-sm" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : subaccount ? 'Update' : 'Create'}
                </Button>
                {subaccount && (
                  <Button type="button" variant="outline" className="h-8 text-xs sm:h-9 sm:text-sm" onClick={() => { setIsEditing(false); reset(); }}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
