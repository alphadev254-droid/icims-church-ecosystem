import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingState, ReferrerStatusNotice, useReferrerDashboardData } from './shared';

export default function ReferrerPayoutSettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading: dashboardLoading } = useReferrerDashboardData();
  const [payoutPhone, setPayoutPhone] = useState('');
  const [payoutProvider, setPayoutProvider] = useState('');

  const { data: payoutOptions, isLoading: optionsLoading } = useQuery({
    queryKey: ['referrer-payout-options'],
    queryFn: async () => {
      const response = await apiClient.get('/referrals/payout-options');
      return response.data.data;
    },
  });

  useEffect(() => {
    if (data?.referrer) {
      setPayoutPhone(data.referrer.payoutPhone || '');
      setPayoutProvider(data.referrer.payoutProvider || '');
    }
  }, [data?.referrer]);

  const savePayout = useMutation({
    mutationFn: async () => {
      const response = await apiClient.put('/referrals/payout-setup', { payoutPhone, payoutProvider });
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Payout settings saved');
      queryClient.invalidateQueries({ queryKey: ['referrer-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['referrer-payout-options'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to save payout settings'),
  });

  if (dashboardLoading || optionsLoading) return <LoadingState label="Loading payout settings..." />;

  const providers = payoutOptions?.providers || [];
  const isSupported = payoutOptions?.supported && providers.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payout Settings</h1>
        <p className="text-sm text-muted-foreground">Choose where your marketer withdrawals should be sent.</p>
      </div>

      <ReferrerStatusNotice referrer={data?.referrer} />

      <Card>
        <CardHeader>
          <CardTitle>Mobile payout details</CardTitle>
          <CardDescription>
            Providers are loaded from the active market for your registration country.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSupported ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
              {payoutOptions?.message || 'Payout setup is not available for your selected country yet.'}
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="payoutProvider">Payout provider</Label>
                <Select value={payoutProvider} onValueChange={setPayoutProvider}>
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
                <Input id="payoutPhone" value={payoutPhone} onChange={(event) => setPayoutPhone(event.target.value)} placeholder="Enter payout phone number" />
              </div>
              <Button onClick={() => savePayout.mutate()} disabled={savePayout.isPending || !payoutPhone || !payoutProvider}>
                {savePayout.isPending ? 'Saving...' : 'Save payout settings'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
