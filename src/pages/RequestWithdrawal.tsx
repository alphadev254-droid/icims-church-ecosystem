import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { walletService } from '@/services/wallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const withdrawalSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  method: z.enum(['mobile_money', 'bank_transfer']),
  mobileOperator: z.enum(['airtel', 'tnm']).optional(),
  mobileNumber: z.string().optional(),
  bankCode: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
}).refine(
  (data) => {
    if (data.method === 'mobile_money') {
      return !!data.mobileOperator && !!data.mobileNumber;
    }
    if (data.method === 'bank_transfer') {
      return !!data.bankCode && !!data.accountName && !!data.accountNumber;
    }
    return true;
  },
  { message: 'Missing required fields for withdrawal method' }
);

type WithdrawalForm = z.infer<typeof withdrawalSchema>;

export default function RequestWithdrawalPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();

  // Block access for non-Malawi accounts
  if (user?.accountCountry !== 'Malawi') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Withdrawals Not Available</h2>
            <p className="text-muted-foreground">Withdrawals are only available for Malawi accounts.</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<WithdrawalForm>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: { method: 'mobile_money', mobileOperator: 'airtel' },
  });

  const method = watch('method');

  const { data: balance } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: walletService.getBalance,
  });

  const withdrawMutation = useMutation({
    mutationFn: walletService.requestWithdrawal,
    onSuccess: () => {
      toast.success('Withdrawal request submitted successfully');
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
      qc.invalidateQueries({ queryKey: ['withdrawals'] });
      navigate(-1);
    },
    onError: (err: any) => {
      const errorData = err.response?.data;
      let errorMessage = 'Failed to request withdrawal';
      
      if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (typeof errorData === 'object') {
        const errors = [];
        for (const [key, value] of Object.entries(errorData)) {
          if (Array.isArray(value)) {
            errors.push(...value);
          }
        }
        if (errors.length > 0) {
          errorMessage = errors.join('. ');
        }
      }
      
      toast.error(errorMessage);
    },
  });

  const formatCurrency = (amount: number) => `MWK ${amount.toLocaleString()}`;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold">Request Withdrawal</h1>
          <p className="text-sm text-muted-foreground">Withdraw funds from your wallet</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-heading">
            {balance ? formatCurrency(balance.balance) : 'MWK 0'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(data => withdrawMutation.mutate(data))} className="space-y-6">
            <div>
              <Label>Amount *</Label>
              <Input 
                type="number" 
                step="0.01" 
                {...register('amount', { valueAsNumber: true })} 
                placeholder="Enter amount"
                className="mt-1.5"
              />
              {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
            </div>

            <div>
              <Label>Withdrawal Method *</Label>
              <Select value={method} onValueChange={(v: any) => setValue('method', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {method === 'mobile_money' && (
              <>
                <div>
                  <Label>Mobile Operator *</Label>
                  <Select defaultValue="airtel" onValueChange={(v: any) => setValue('mobileOperator', v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="airtel">Airtel Money</SelectItem>
                      <SelectItem value="tnm">TNM Mpamba</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mobile Number *</Label>
                  <Input 
                    {...register('mobileNumber')} 
                    placeholder="e.g. 0991234567" 
                    className="mt-1.5"
                  />
                </div>
              </>
            )}

            {method === 'bank_transfer' && (
              <>
                <div>
                  <Label>Bank Code *</Label>
                  <Input {...register('bankCode')} placeholder="Bank code" className="mt-1.5" />
                </div>
                <div>
                  <Label>Account Name *</Label>
                  <Input {...register('accountName')} placeholder="Account holder name" className="mt-1.5" />
                </div>
                <div>
                  <Label>Account Number *</Label>
                  <Input {...register('accountNumber')} placeholder="Account number" className="mt-1.5" />
                </div>
              </>
            )}

            {errors.root && <p className="text-xs text-destructive">{errors.root.message}</p>}

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/withdrawals')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={withdrawMutation.isPending} 
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {withdrawMutation.isPending ? 'Processing...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
