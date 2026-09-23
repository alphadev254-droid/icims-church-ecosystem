import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { phoneInputProps, phoneInputValue } from '@/lib/numeric-input';
import { LoadingState, ReferrerStatusNotice, isReferrerVerified, useReferrerDashboardData } from './shared';

export default function ReferrerPayoutSettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading: dashboardLoading } = useReferrerDashboardData();
  const [payoutPhone, setPayoutPhone] = useState('');
  const [payoutProvider, setPayoutProvider] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpResendSeconds, setOtpResendSeconds] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

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
      const response = await apiClient.post('/referrals/payout-setup/otp', { payoutPhone: payoutPhone.trim(), payoutProvider });
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

  const savePayout = useMutation({
    mutationFn: async () => {
      const response = await apiClient.put('/referrals/payout-setup', { payoutPhone: payoutPhone.trim(), payoutProvider, otp: otpCode });
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Payout settings saved');
      setIsEditing(false);
      setOtpRequested(false);
      setOtpCode('');
      setOtpResendSeconds(0);
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
  const canRequestOtp = isEditing && verified && isPayoutPhoneValid && Boolean(payoutProvider) && !requestOtp.isPending && otpResendSeconds === 0;
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
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payout Settings</h1>
        <p className="text-sm text-muted-foreground">Choose where your marketer withdrawals should be sent.</p>
      </div>

      <ReferrerStatusNotice referrer={data?.referrer} />

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Mobile payout details</CardTitle>
            <CardDescription>
              Providers are loaded from the active market for your registration country.
            </CardDescription>
          </div>
          {verified && isSupported && !isEditing && (
            <Button type="button" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </CardHeader>
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
                  onValueChange={(value) => {
                    setPayoutProvider(value);
                    setOtpRequested(false);
                    setOtpCode('');
                    setOtpResendSeconds(0);
                  }}
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
                  onChange={(event) => {
                    setPayoutPhone(phoneInputValue(event.target.value));
                    setOtpRequested(false);
                    setOtpCode('');
                    setOtpResendSeconds(0);
                  }}
                  {...phoneInputProps}
                  placeholder="Enter payout phone number"
                  disabled={!verified || !isEditing}
                />
                {isEditing && payoutPhone && !isPayoutPhoneValid && (
                  <p className="text-xs text-destructive">Enter a valid phone number using digits and an optional leading +.</p>
                )}
              </div>
              {isEditing && otpRequested && (
                <div className="grid gap-2 rounded-md border bg-muted/40 p-4">
                  <div>
                    <Label htmlFor="payoutOtp">Email OTP</Label>
                    <p className="text-xs text-muted-foreground">Enter the 6-digit OTP sent to your email to save these payout settings.</p>
                  </div>
                  <Input
                    id="payoutOtp"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                  />
                </div>
              )}
              {isEditing && (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => requestOtp.mutate()} disabled={!canRequestOtp}>
                    {requestOtpLabel}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => savePayout.mutate()}
                    disabled={!verified || savePayout.isPending || !otpRequested || otpCode.length !== 6 || !isPayoutPhoneValid || !payoutProvider}
                  >
                    {savePayout.isPending ? 'Saving...' : 'Save payout settings'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={resetEditState} disabled={requestOtp.isPending || savePayout.isPending}>
                    Cancel
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



