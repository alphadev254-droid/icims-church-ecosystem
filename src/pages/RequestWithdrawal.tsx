import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { walletService } from '@/services/wallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ShieldCheck, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

function getMobileOperatorFromNumber(value?: string): 'airtel' | 'tnm' | null {
  const digits = String(value || '').replace(/\D/g, '');
  const local = digits.startsWith('265') ? `0${digits.slice(3)}` : digits;
  if (local.startsWith('099') || local.startsWith('098')) return 'airtel';
  if (local.startsWith('088') || local.startsWith('089')) return 'tnm';
  return null;
}

const withdrawalSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  method: z.enum(['mobile_money', 'bank_transfer']),
  mobileOperator: z.enum(['airtel', 'tnm']).optional(),
  mobileNumber: z.string().optional(),
  bankCode: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.method === 'mobile_money') {
    if (!data.mobileOperator || !data.mobileNumber) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Missing required fields for withdrawal method' });
      return;
    }
    const detected = getMobileOperatorFromNumber(data.mobileNumber);
    if (!detected) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['mobileNumber'], message: 'Enter a valid Airtel Money or TNM Mpamba number.' });
      return;
    }
    if (detected !== data.mobileOperator) {
      const expected = data.mobileOperator === 'airtel' ? 'Airtel Money' : 'TNM Mpamba';
      const actual = detected === 'airtel' ? 'Airtel Money' : 'TNM Mpamba';
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mobileNumber'],
        message: `The selected operator is ${expected}, but the number looks like ${actual}. Please correct the operator or mobile number.`,
      });
    }
  }
  if (data.method === 'bank_transfer' && (!data.bankCode || !data.accountName || !data.accountNumber)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Missing required fields for withdrawal method' });
  }
});

type WithdrawalForm = z.infer<typeof withdrawalSchema>;
type WithdrawalOtpResult = { message?: string; expiresInSeconds?: number };
type SupportedBank = { uuid?: string; bank_uuid?: string; id?: string | number; name?: string };

export default function RequestWithdrawalPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiresIn, setOtpExpiresIn] = useState<number | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<WithdrawalForm>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: { method: 'mobile_money', mobileOperator: 'airtel' },
  });

  const method = watch('method');

  const { data: banks = [], isLoading: isLoadingBanks } = useQuery({
    queryKey: ['wallet-supported-banks'],
    queryFn: walletService.getSupportedBanks,
    enabled: user?.accountCountry === 'Malawi',
    staleTime: 5 * 60_000,
  });

  const { data: balance } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: walletService.getBalance,
    enabled: user?.accountCountry === 'Malawi',
  });

  const withdrawMutation = useMutation({
    mutationFn: walletService.requestWithdrawal,
    onSuccess: () => {
      toast.success('Withdrawal request submitted successfully');
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
      qc.invalidateQueries({ queryKey: ['withdrawals'] });
      navigate(-1);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      const errorData = (err.response?.data || {}) as Record<string, unknown>;
      let errorMessage = 'Failed to request withdrawal';
      if (errorData?.message) {
        errorMessage = String(errorData.message);
      } else {
        const msgs: string[] = [];
        for (const value of Object.values(errorData)) {
          if (Array.isArray(value)) msgs.push(...value.map(String));
        }
        if (msgs.length > 0) errorMessage = msgs.join('. ');
      }
      toast.error(errorMessage);
    },
  });

  const sendOtpMutation = useMutation({
    mutationFn: walletService.sendWithdrawalOtp,
    onSuccess: (result: WithdrawalOtpResult) => {
      setOtpSent(true);
      setOtpExpiresIn(result.expiresInSeconds ?? 300);
      toast.success(result.message || 'OTP sent to your email');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    },
  });

  const formatCurrency = (amount: number) => `MWK ${amount.toLocaleString()}`;

  // Block access for non-Malawi accounts (after all hooks)
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">Request Withdrawal</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Withdraw funds from your wallet</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold font-heading">
            {balance ? formatCurrency(balance.balance) : 'MWK 0'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(data => {
              if (!otpSent) {
                toast.error('Request an OTP code first');
                return;
              }
              if (!/^\d{6}$/.test(otpCode)) {
                toast.error('Enter the 6-digit OTP code');
                return;
              }
              withdrawMutation.mutate({ ...data, otpCode });
            })}
            className="space-y-4"
          >
            <div>
              <Label className="text-xs sm:text-sm">Amount *</Label>
              <Input 
                type="number" 
                step="0.01" 
                {...register('amount', { valueAsNumber: true })} 
                placeholder="Enter amount"
                className="mt-1.5 h-8 text-xs sm:h-10 sm:text-sm"
              />
              {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
            </div>

            <div>
              <Label className="text-xs sm:text-sm">Withdrawal Method *</Label>
              <Select value={method} onValueChange={(v) => setValue('method', v as WithdrawalForm['method'])}>
                <SelectTrigger className="mt-1.5 h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {method === 'mobile_money' && (
              <>
                <div>
                  <Label className="text-xs sm:text-sm">Mobile Operator *</Label>
                  <Select defaultValue="airtel" onValueChange={(v) => setValue('mobileOperator', v as WithdrawalForm['mobileOperator'])}>
                    <SelectTrigger className="mt-1.5 h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="airtel">Airtel Money</SelectItem>
                      <SelectItem value="tnm">TNM Mpamba</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Mobile Number *</Label>
                  <Input 
                    {...register('mobileNumber')} 
                    placeholder="e.g. 0991234567" 
                    className="mt-1.5 h-8 text-xs sm:h-10 sm:text-sm"
                  />
                  {errors.mobileNumber && <p className="text-xs text-destructive mt-1">{errors.mobileNumber.message}</p>}
                </div>
              </>
            )}

            {method === 'bank_transfer' && (
              <>
                <div>
                  <Label className="text-xs sm:text-sm">Bank *</Label>
                  <Select onValueChange={(v) => setValue('bankCode', v, { shouldValidate: true })}>
                    <SelectTrigger className="mt-1.5 h-8 text-xs sm:h-10 sm:text-sm">
                      <SelectValue placeholder={isLoadingBanks ? 'Loading banks...' : 'Select bank'} />
                    </SelectTrigger>
                    <SelectContent>
                      {(banks as SupportedBank[]).map((b) => {
                        const value = String(b.uuid || b.bank_uuid || b.id);
                        return (
                          <SelectItem key={value} value={value}>{b.name || value}</SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {errors.bankCode && <p className="text-xs text-destructive mt-1">{errors.bankCode.message}</p>}
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Account Name *</Label>
                  <Input {...register('accountName')} placeholder="Account holder name" className="mt-1.5 h-8 text-xs sm:h-10 sm:text-sm" />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Account Number *</Label>
                  <Input {...register('accountNumber')} placeholder="Account number" className="mt-1.5 h-8 text-xs sm:h-10 sm:text-sm" />
                </div>
              </>
            )}

            {errors.root && <p className="text-xs text-destructive">{errors.root.message}</p>}

            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-accent" />
                <div>
                  <h3 className="text-sm font-semibold">Security OTP</h3>
                  <p className="text-xs text-muted-foreground">
                    We will send a 6-digit code to your account email. The code expires in 5 minutes.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  disabled={sendOtpMutation.isPending}
                  onClick={handleSubmit(data => {
                    setOtpCode('');
                    sendOtpMutation.mutate(data);
                  })}
                >
                  {sendOtpMutation.isPending ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                </Button>
                <Input
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  placeholder="Enter 6-digit OTP"
                  className="h-10 text-sm tracking-[0.35em]"
                />
              </div>
              {otpSent && (
                <p className="text-xs text-muted-foreground">
                  OTP sent. {otpExpiresIn ? `Expires in ${Math.ceil(otpExpiresIn / 60)} minute(s).` : 'Expires in 5 minutes.'}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/withdrawals')}
                className="flex-1 h-8 text-xs sm:h-10 sm:text-sm"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={withdrawMutation.isPending || !otpSent || otpCode.length !== 6} 
                className="flex-1 h-8 text-xs sm:h-10 sm:text-sm bg-accent text-accent-foreground hover:bg-accent/90"
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
