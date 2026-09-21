import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Handshake, Wallet, Users, Clock, Phone } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function money(value: number | string | null | undefined, currency = 'MWK') {
  const amount = Number(value || 0);
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ReferrerDashboard() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [payoutPhone, setPayoutPhone] = useState('');
  const [payoutProvider, setPayoutProvider] = useState('');
  const [savingPayout, setSavingPayout] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['referrer-dashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/referrals/me');
      return response.data.data;
    },
  });

  const { data: payoutOptions } = useQuery({
    queryKey: ['referrer-payout-options'],
    queryFn: async () => {
      const response = await apiClient.get('/referrals/payout-options');
      return response.data.data;
    },
  });

  const totalCredits = useMemo(() => (data?.ledger || [])
    .filter((entry: any) => entry.direction === 'credit')
    .reduce((sum: number, entry: any) => sum + Number(entry.amount), 0), [data]);

  const referrer = data?.referrer;
  const referrals = data?.referrals || [];
  const ledger = data?.ledger || [];

  useEffect(() => {
    if (referrer) {
      setPayoutPhone(referrer.payoutPhone || '');
      setPayoutProvider(referrer.payoutProvider || payoutOptions?.providers?.[0]?.code || '');
    }
  }, [referrer, payoutOptions]);

  if (isLoading) {
    return <div className="flex min-h-[300px] items-center justify-center text-muted-foreground">Loading referral dashboard...</div>;
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(referrer.referralLink);
    setCopied(true);
    toast.success('Referral link copied');
    setTimeout(() => setCopied(false), 1500);
  };

  const savePayoutSetup = async () => {
    setSavingPayout(true);
    try {
      await apiClient.put('/referrals/payout-setup', { payoutPhone, payoutProvider });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['referrer-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['referrer-payout-options'] }),
      ]);
      toast.success('Payout setup saved');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not save payout setup');
    } finally {
      setSavingPayout(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Referral Dashboard</h1>
          <p className="text-sm text-muted-foreground">Share your link and track referred ministries plus wallet movements.</p>
        </div>
        <Badge variant={referrer?.status === 'approved' ? 'default' : 'secondary'} className="w-fit capitalize">
          {referrer?.status || 'pending'}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Wallet Balance</CardTitle><Wallet className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{money(data?.balance)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Earned</CardTitle><Handshake className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{money(totalCredits)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ministries Referred</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{referrals.length}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My referral link</CardTitle>
          <CardDescription>Ministries must register through this link for commission tracking.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm break-all">{referrer?.referralLink}</div>
          <Button onClick={copyLink} variant="outline"><Copy className="mr-2 h-4 w-4" />{copied ? 'Copied' : 'Copy'}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payout setup</CardTitle>
          <CardDescription>
            {payoutOptions?.market ? `Market: ${payoutOptions.market.name}` : 'Payout availability depends on your registered country.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {payoutOptions && !payoutOptions.supported ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {payoutOptions.message || 'Payout setup is not available for your selected country yet.'}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="payoutProvider">Provider</Label>
                <select id="payoutProvider" value={payoutProvider} onChange={event => setPayoutProvider(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {(payoutOptions?.providers || []).map((provider: any) => <option key={provider.code} value={provider.code}>{provider.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payoutPhone">Payout phone number</Label>
                <Input id="payoutPhone" value={payoutPhone} onChange={event => setPayoutPhone(event.target.value)} placeholder="Phone number for payouts" />
              </div>
              <Button onClick={savePayoutSetup} disabled={savingPayout || !payoutPhone || !payoutProvider}>
                <Phone className="mr-2 h-4 w-4" />{savingPayout ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
          {referrer?.payoutSetupStatus === 'complete' && <p className="text-sm text-emerald-600">Payout setup is complete.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent ledger</CardTitle><CardDescription>Credits are commissions; debits are withdrawals.</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
            <TableBody>
              {ledger.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground"><Clock className="mx-auto mb-2 h-5 w-5" />No wallet activity yet.</TableCell></TableRow>
              ) : ledger.map((entry: any) => (
                <TableRow key={entry.id}>
                  <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="capitalize">{entry.direction} / {entry.category}</TableCell>
                  <TableCell>{entry.description || entry.sourceType}</TableCell>
                  <TableCell className={entry.direction === 'credit' ? 'text-right text-emerald-600' : 'text-right text-destructive'}>
                    {entry.direction === 'credit' ? '+' : '-'}{money(entry.amount, entry.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
