import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Banknote, Edit2, ExternalLink, Handshake, Mail, ShieldCheck, Users, Wallet } from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  InfoRow,
  marketerName,
  marketerStatusBadge,
  marketerStatusLabel,
  money,
  payoutStatusBadge,
  StatusDialog,
} from './marketers/components';

function SummaryCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: typeof Users }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
  );
}

export default function AdminMarketerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusOpen, setStatusOpen] = useState(false);
  const [status, setStatus] = useState('pending');
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-marketer', id],
    queryFn: () => adminApi.getMarketer(id!).then(response => response.data.data),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: () => adminApi.updateMarketerStatus(id!, { status, reason: reason.trim() || undefined }),
    onSuccess: () => {
      toast.success('Marketer status updated');
      setStatusOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-marketer', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-marketers'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update marketer'),
  });

  if (isLoading) {
    return <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">Loading marketer...</div>;
  }

  if (!data) return <p className="text-sm text-muted-foreground">Marketer not found.</p>;

  const currency = data.currency || data.pricingMarket?.currencyCode || '—';
  const openStatus = (nextStatus = data.status || 'pending') => {
    setStatus(nextStatus);
    setReason('');
    setStatusOpen(true);
  };

  const totalCredits = data.ledgerEntries.filter(entry => entry.direction === 'credit').reduce((sum, entry) => sum + Number(entry.amount), 0);
  const totalDebits = data.ledgerEntries.filter(entry => entry.direction === 'debit').reduce((sum, entry) => sum + Number(entry.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/admin/marketers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{marketerName(data)}</h1>
            <p className="text-xs text-muted-foreground">{data.user?.email}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => openStatus()}>
            <Edit2 className="h-3.5 w-3.5" /> Change Status
          </Button>
          {data.status !== 'approved' && (
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => openStatus('approved')}>
              <ShieldCheck className="h-3.5 w-3.5" /> Mark Verified
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => navigate(`/admin/users/${data.userId}`)}>
            <ExternalLink className="h-3.5 w-3.5" /> User Account
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Wallet Balance" value={money(currency, data.balance)} icon={Wallet} />
        <SummaryCard title="Total Earned" value={money(currency, totalCredits)} icon={Handshake} />
        <SummaryCard title="Debits" value={money(currency, totalDebits)} icon={Banknote} />
        <SummaryCard title="Partnered Ministries" value={data.referrals.length} icon={Users} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Marketer Profile</CardTitle></CardHeader>
          <CardContent>
            <InfoRow label="Name" value={marketerName(data)} />
            <InfoRow label="Email" value={data.user?.email} />
            <InfoRow label="Phone" value={data.phone || data.user?.phone} />
            <InfoRow label="Code" value={data.code} />
            <InfoRow label="Country" value={data.country} />
            <InfoRow label="City / Region" value={data.city} />
            <InfoRow label="District" value={data.district} />
            <div className="flex items-start gap-2 py-1.5 border-b">
              <span className="text-xs text-muted-foreground w-32 shrink-0">Status</span>
              {marketerStatusBadge(data.status)}
            </div>
            <InfoRow label="Status Text" value={marketerStatusLabel(data.status)} />
            <InfoRow label="Joined" value={new Date(data.createdAt).toLocaleDateString()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Market & Payout</CardTitle></CardHeader>
          <CardContent>
            <InfoRow label="Market" value={data.pricingMarket?.name} />
            <InfoRow label="Currency" value={currency} />
            <InfoRow label="Gateway" value={data.pricingMarket?.packageGateway} />
            <div className="flex items-start gap-2 py-1.5 border-b">
              <span className="text-xs text-muted-foreground w-32 shrink-0">Payout Setup</span>
              {payoutStatusBadge(data.payoutSetupStatus)}
            </div>
            <InfoRow label="Provider" value={data.payoutProvider} />
            <InfoRow label="Payout Phone" value={data.payoutPhone} />
            <InfoRow label="Approved At" value={data.approvedAt ? new Date(data.approvedAt).toLocaleString() : null} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Partnered Ministries</CardTitle>
          <CardDescription>Ministries registered through this marketer code.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Ministry</TableHead><TableHead>Status</TableHead><TableHead>First Payment</TableHead><TableHead>Joined</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.referrals.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No partnered ministries yet.</TableCell></TableRow>
              ) : data.referrals.map(referral => (
                <TableRow key={referral.id}>
                  <TableCell>
                    <div className="text-xs font-medium">{referral.ministryAdmin?.ministryName || referral.church?.name || 'Ministry'}</div>
                    <div className="text-xs text-muted-foreground">{referral.ministryAdmin?.email}</div>
                  </TableCell>
                  <TableCell className="text-xs capitalize">{referral.status}</TableCell>
                  <TableCell className="text-xs">{referral.firstPaymentAt ? new Date(referral.firstPaymentAt).toLocaleDateString() : '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(referral.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wallet Ledger</CardTitle>
          <CardDescription>Credits and debits recorded for this marketer.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Balance After</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.ledgerEntries.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No wallet entries yet.</TableCell></TableRow>
              ) : data.ledgerEntries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs">{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs capitalize">{entry.direction} / {entry.category}</TableCell>
                  <TableCell className="text-xs">{entry.description || '—'}</TableCell>
                  <TableCell className={entry.direction === 'credit' ? 'text-right text-xs text-emerald-600' : 'text-right text-xs text-destructive'}>
                    {entry.direction === 'credit' ? '+' : '-'}{money(entry.currency, entry.amount)}
                  </TableCell>
                  <TableCell className="text-right text-xs">{money(entry.currency, entry.balanceAfter)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <StatusDialog
        open={statusOpen}
        status={status}
        reason={reason}
        isSaving={statusMutation.isPending}
        onOpenChange={setStatusOpen}
        onStatusChange={setStatus}
        onReasonChange={setReason}
        onSave={() => statusMutation.mutate()}
      />
    </div>
  );
}
