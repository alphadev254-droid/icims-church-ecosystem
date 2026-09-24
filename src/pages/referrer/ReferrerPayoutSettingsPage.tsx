import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { phoneInputProps, phoneInputValue } from '@/lib/numeric-input';
import { LoadingState, ReferrerStatusNotice, isReferrerVerified, useReferrerDashboardData, PageShell, PageHeader, CardTitleRow, ActionGroup } from './shared';

export default function ReferrerPayoutSettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading: dashboardLoading } = useReferrerDashboardData();
  const [payoutPhone, setPayoutPhone] = useState('');
  const [payoutProvider, setPayoutProvider] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpResendSeconds, setOtpResendSeconds] = useState(0);
  const [isUnlockingEdit, setIsUnlockingEdit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editToken, setEditToken] = useState('');

  const { data: payoutOptions, isLoading: optionsLoading } = useQuery({
    queryKey: ['referrer-payout-options'],
    queryFn: async () => {
      const response = await apiClient.get('/referrals/payout-options');
      return response.data.data;
    },
  });

  useEffect(() => {
    if (data?.referrer && !isEditing) {
      setPayoutPhone(data.referrer.payoutPhone || '');
      setPayoutProvider(data.referrer.payoutProvider || '');
    }
  }, [data?.referrer, isEditing]);

  useEffect(() => {
    if (otpResendSeconds <= 0) return undefined;

    const timer = window.setTimeout(() => {
      setOtpResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [otpResendSeconds]);

  const requestOtp = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/referrals/payout-setup/otp');
      return response.data;
    },
    onSuccess: (response: any) => {
      setOtpRequested(true);
      setOtpCode('');
      setOtpResendSeconds(response.retryAfterSeconds || 40);
      toast.success(response.message || 'OTP sent to your email');
    },
    onError: (error: any) => {
      const retryAfterSeconds = error.response?.data?.retryAfterSeconds;
      if (retryAfterSeconds) setOtpResendSeconds(retryAfterSeconds);
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    },
  });

  const verifyOtp = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/referrals/payout-setup/otp/verify', { otp: otpCode });
      return response.data.data;
    },
    onSuccess: (session: any) => {
      setEditToken(session.editToken);
      setIsEditing(true);
      setIsUnlockingEdit(false);
      setOtpRequested(false);
      setOtpCode('');
      setOtpResendSeconds(0);
      toast.success('Payout settings unlocked');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to verify OTP'),
  });

  const savePayout = useMutation({
    mutationFn: async () => {
      const response = await apiClient.put('/referrals/payout-setup', { payoutPhone: payoutPhone.trim(), payoutProvider, editToken });
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Payout settings saved');
      setIsEditing(false);
      setOtpRequested(false);
      setOtpCode('');
      setOtpResendSeconds(0);
      setIsUnlockingEdit(false);
      setEditToken('');
      queryClient.invalidateQueries({ queryKey: ['referrer-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['referrer-payout-options'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to save payout settings'),
  });

  if (dashboardLoading || optionsLoading) return <LoadingState label="Loading payout settings..." />;

  const providers = payoutOptions?.providers || [];
  const isSupported = payoutOptions?.supported && providers.length > 0;
  const verified = isReferrerVerified(data?.referrer);
  const trimmedPayoutPhone = payoutPhone.trim();
  const isPayoutPhoneValid = /^\+?\d{7,16}$/.test(trimmedPayoutPhone);
  const canRequestOtp = isUnlockingEdit && verified && !requestOtp.isPending && otpResendSeconds === 0;
  const requestOtpLabel = requestOtp.isPending
    ? 'Sending OTP...'
    : otpResendSeconds > 0
      ? `You can request another OTP in ${otpResendSeconds}s`
      : otpRequested
        ? 'Resend OTP'
        : 'Request OTP';
  const resetEditState = () => {
    setPayoutPhone(data?.referrer?.payoutPhone || '');
    setPayoutProvider(data?.referrer?.payoutProvider || '');
    setOtpRequested(false);
    setOtpCode('');
    setOtpResendSeconds(0);
    setIsUnlockingEdit(false);
    setIsEditing(false);
    setEditToken('');
  };

  return (
    <PageShell>
      <PageHeader title="Payout Settings" description="Choose where your marketer payouts should be sent." />

      <ReferrerStatusNotice referrer={data?.referrer} />

      <Card>
        <CardTitleRow
          title="Mobile payout details"
          description="Providers are loaded from the active market for your registration country."
          action={verified && isSupported && !isEditing && !isUnlockingEdit ? (
            <Button type="button" onClick={() => setIsUnlockingEdit(true)} className="w-full sm:w-auto">Edit</Button>
          ) : null}
        />
        <CardContent className="space-y-4">
          {!verified ? (
            <div className="rounded-md border bg-muted p-4 text-sm text-muted-foreground">Payout setup is disabled until your marketer account is verified.</div>
          ) : !isSupported ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
              {payoutOptions?.message || 'Payout setup is not available for your selected country yet.'}
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="payoutProvider">Payout provider</Label>
                <Select
                  value={payoutProvider}
                  onValueChange={setPayoutProvider}
                  disabled={!verified || !isEditing}
                >
                  <SelectTrigger id="payoutProvider"><SelectValue placeholder="Select provider" /></SelectTrigger>
                  <SelectContent>
                    {providers.map((provider: any) => (
                      <SelectItem key={provider.code} value={provider.code}>{provider.name || provider.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="payoutPhone">Payout phone number</Label>
                <Input
                  id="payoutPhone"
                  value={payoutPhone}
                  onChange={(event) => setPayoutPhone(phoneInputValue(event.target.value))}
                  {...phoneInputProps}
                  placeholder="Enter payout phone number"
                  disabled={!verified || !isEditing}
                />
                {isEditing && payoutPhone && !isPayoutPhoneValid && (
                  <p className="text-xs text-destructive">Enter a valid phone number using digits and an optional leading +.</p>
                )}
              </div>
              {isUnlockingEdit && (
                <div className="grid gap-2 rounded-md border bg-muted/40 p-4">
                  <div>
                    <Label htmlFor="payoutOtp">Email OTP</Label>
                    <p className="text-xs text-muted-foreground">Request and enter the 6-digit OTP sent to your email to unlock editing.</p>
                  </div>
                  <ActionGroup>
                    <Button onClick={() => requestOtp.mutate()} disabled={!canRequestOtp} className="w-full sm:w-auto">
                      {requestOtpLabel}
                    </Button>
                    <Button type="button" variant="ghost" onClick={resetEditState} disabled={requestOtp.isPending || verifyOtp.isPending} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                  </ActionGroup>
                  {otpRequested && (
                    <>
                  <Input
                    id="payoutOtp"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                  />
                  <Button
                    type="button"
                    onClick={() => verifyOtp.mutate()}
                    disabled={verifyOtp.isPending || otpCode.length !== 6}
                    className="w-full sm:w-auto"
                  >
                    {verifyOtp.isPending ? 'Verifying...' : 'Verify and unlock'}
                  </Button>
                    </>
                  )}
                </div>
              )}
              {isEditing && (
                <ActionGroup>
                  <Button
                    onClick={() => savePayout.mutate()}
                    disabled={!verified || savePayout.isPending || !editToken || !isPayoutPhoneValid || !payoutProvider}
                    className="w-full sm:w-auto"
                  >
                    {savePayout.isPending ? 'Saving...' : 'Save payout settings'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={resetEditState} disabled={requestOtp.isPending || savePayout.isPending} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                </ActionGroup>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}



