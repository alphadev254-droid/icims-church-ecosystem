import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState, ReferrerStatusNotice, isReferrerVerified, money, useReferrerDashboardData } from './shared';

export default function ReferrerWithdrawalsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useReferrerDashboardData();
  const [amount, setAmount] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);

  const referrer = data?.referrer;
  const withdrawals = data?.withdrawals || [];
  const verified = isReferrerVerified(referrer);
  const payoutReady = referrer?.payoutSetupStatus === 'complete' && referrer?.payoutPhone && referrer?.payoutProvider;

  const payload = {
    amount: Number(amount),
    method: 'mobile_money',
    mobileNumber: referrer?.payoutPhone,
    bankName: referrer?.payoutProvider,
  };

  const requestOtp = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/referrals/withdrawals/otp', payload);
      return response.data;
    },
    onSuccess: (response) => {
      setOtpRequested(true);
      toast.success(response?.data?.devOtp ? `OTP generated: ${response.data.devOtp}` : 'Withdrawal OTP sent');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to request OTP'),
  });

  const confirmWithdrawal = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/referrals/withdrawals', { ...payload, otp });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Withdrawal request submitted');
      setAmount('');
      setOtp('');
      setOtpRequested(false);
      queryClient.invalidateQueries({ queryKey: ['referrer-dashboard'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to submit withdrawal'),
  });

  if (isLoading) return <LoadingState label="Loading withdrawals..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Withdrawals</h1>
        <p className="text-sm text-muted-foreground">Request withdrawals with OTP confirmation.</p>
      </div>

      <ReferrerStatusNotice referrer={referrer} />

      <Card>
        <CardHeader>
          <CardTitle>Request withdrawal</CardTitle>
          <CardDescription>Available balance: {money(data?.balance)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!verified ? (
            <div className="rounded-md border bg-muted p-4 text-sm text-muted-foreground">Your marketer account must be verified before withdrawals.</div>
          ) : !payoutReady ? (
            <div className="rounded-md border bg-muted p-4 text-sm text-muted-foreground">Complete payout settings before requesting a withdrawal.</div>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="1" placeholder="Enter amount" />
              </div>
              {otpRequested && (
                <div className="grid gap-2">
                  <Label htmlFor="otp">OTP code</Label>
                  <Input id="otp" value={otp} onChange={(event) => setOtp(event.target.value)} maxLength={6} placeholder="Enter 6-digit OTP" />
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => requestOtp.mutate()} disabled={requestOtp.isPending || !amount || Number(amount) <= 0} variant={otpRequested ? 'outline' : 'default'}>
                  {requestOtp.isPending ? 'Requesting...' : otpRequested ? 'Request new OTP' : 'Request OTP'}
                </Button>
                {otpRequested && (
                  <Button onClick={() => confirmWithdrawal.mutate()} disabled={confirmWithdrawal.isPending || otp.length !== 6}>
                    {confirmWithdrawal.isPending ? 'Submitting...' : 'Submit withdrawal'}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Withdrawal history</CardTitle>
          <CardDescription>Submitted withdrawal requests and their current status.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No withdrawals yet.</TableCell></TableRow>
              ) : withdrawals.map((withdrawal: any) => (
                <TableRow key={withdrawal.id}>
                  <TableCell>{new Date(withdrawal.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="capitalize">{withdrawal.status}</TableCell>
                  <TableCell className="capitalize">{withdrawal.method}</TableCell>
                  <TableCell>{withdrawal.mobileNumber || withdrawal.accountNumber || '-'}</TableCell>
                  <TableCell className="text-right">{money(withdrawal.amount, withdrawal.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
