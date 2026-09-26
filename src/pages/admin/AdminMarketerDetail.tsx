import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Banknote, CheckCircle2, Edit2, ExternalLink, FileText, Handshake, Users, Wallet, XCircle } from 'lucide-react';
import { adminApi, type AdminMarketerPayoutPreview } from '@/services/adminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  InfoRow,
  agreementStatusBadge,
  agreementStatusLabel,
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
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutPreview, setPayoutPreview] = useState<AdminMarketerPayoutPreview | null>(null);
  const [payoutPreviewError, setPayoutPreviewError] = useState('');
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [agreementStatus, setAgreementStatus] = useState<'approved' | 'rejected'>('approved');
  const [agreementReason, setAgreementReason] = useState('');
  const staticBase = (import.meta.env.VITE_STATIC_URL || 'http://localhost:5000').replace(/['"]|\/$|^\/api$/g, '');

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

  const agreementMutation = useMutation({
    mutationFn: () => adminApi.reviewMarketerAgreement(id!, {
      status: agreementStatus,
      reason: agreementReason.trim() || undefined,
    }),
    onSuccess: () => {
      toast.success(agreementStatus === 'approved' ? 'Agreement approved' : 'Agreement rejected');
      setAgreementOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-marketer', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-marketers'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to review agreement'),
  });

  const reconcileMutation = useMutation({
    mutationFn: (withdrawalId: string) => adminApi.reconcileMarketerWithdrawal(withdrawalId),
    onSuccess: (response) => {
      toast.success(response.data.message || 'Marketer payout reconciled');
      queryClient.invalidateQueries({ queryKey: ['admin-marketer', id] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to reconcile marketer payout'),
  });

  const previewPayoutMutation = useMutation({
    mutationFn: (amount: number) => adminApi.previewMarketerWithdrawal(id!, amount),
    onSuccess: (response) => {
      setPayoutPreview(response.data.data);
      setPayoutPreviewError('');
    },
    onError: (error: any) => {
      setPayoutPreview(null);
      setPayoutPreviewError(error.response?.data?.message || 'Unable to preview marketer payout');
    },
  });

  const initiatePayoutMutation = useMutation({
    mutationFn: () => adminApi.initiateMarketerWithdrawal(id!, Number(payoutAmount)),
    onSuccess: (response) => {
      toast.success(response.data.message || 'Marketer payout initiated');
      setPayoutOpen(false);
      setPayoutPreview(null);
      queryClient.invalidateQueries({ queryKey: ['admin-marketer', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-marketers'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Unable to initiate marketer payout'),
  });

  const payoutAmountNumber = Number(payoutAmount);
  const previewMatchesAmount = !!payoutPreview && Number(payoutPreview.amount) === Math.round(payoutAmountNumber * 100) / 100;

  useEffect(() => {
    if (!payoutOpen || !id) return;
    if (!Number.isFinite(payoutAmountNumber) || payoutAmountNumber <= 0) {
      setPayoutPreview(null);
      setPayoutPreviewError('');
      return;
    }

    const timeout = window.setTimeout(() => {
      previewPayoutMutation.mutate(payoutAmountNumber);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [payoutOpen, id, payoutAmountNumber]);

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
  const openAgreementReview = (nextStatus: 'approved' | 'rejected') => {
    setAgreementStatus(nextStatus);
    setAgreementReason('');
    setAgreementOpen(true);
  };
  const agreementUrl = data.signedAgreementUrl
    ? (data.signedAgreementUrl.startsWith('http') ? data.signedAgreementUrl : `${staticBase}${data.signedAgreementUrl}`)
    : '';
  const openPayout = () => {
    setPayoutAmount(Number(data.balance || 0).toFixed(2));
    setPayoutPreview(null);
    setPayoutPreviewError('');
    setPayoutOpen(true);
  };

  const totalCredits = data.ledgerEntries.filter(entry => entry.direction === 'credit').reduce((sum, entry) => sum + Number(entry.amount), 0);
  const totalDebits = data.ledgerEntries.filter(entry => entry.direction === 'debit').reduce((sum, entry) => sum + Number(entry.amount), 0);
  const payoutReady = data.status === 'approved' && data.payoutSetupStatus === 'complete' && Number(data.balance || 0) > 0;

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
          <Button variant="default" size="sm" className="h-8 text-xs gap-1.5" disabled={!payoutReady} onClick={openPayout}>
            <Banknote className="h-3.5 w-3.5" /> Initiate Payout
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => openStatus()}>
            <Edit2 className="h-3.5 w-3.5" /> Change Status
          </Button>
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
            <div className="flex items-start gap-2 py-1.5 border-b">
              <span className="text-xs text-muted-foreground w-32 shrink-0">Document Status</span>
              {agreementStatusBadge(data.agreementStatus)}
            </div>
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
          <CardTitle>Signed Agreement</CardTitle>
          <CardDescription>Review the marketer agreement before account activation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <InfoRow label="Agreement Status" value={agreementStatusLabel(data.agreementStatus)} />
            <InfoRow label="Submitted" value={data.agreementSubmittedAt ? new Date(data.agreementSubmittedAt).toLocaleString() : null} />
            <InfoRow label="Reviewed" value={data.agreementReviewedAt ? new Date(data.agreementReviewedAt).toLocaleString() : null} />
            <InfoRow label="File" value={data.signedAgreementFileName || null} />
          </div>
          {data.agreementRejectionReason && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {data.agreementRejectionReason}
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button asChild variant="outline" size="sm" disabled={!agreementUrl}>
              <a href={agreementUrl || undefined} target="_blank" rel="noreferrer">
                <FileText className="mr-2 h-4 w-4" /> View Signed Agreement
              </a>
            </Button>
            <Button size="sm" disabled={!data.signedAgreementUrl || data.agreementStatus === 'approved'} onClick={() => openAgreementReview('approved')}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Approve Agreement
            </Button>
            <Button size="sm" variant="destructive" disabled={!data.signedAgreementUrl} onClick={() => openAgreementReview('rejected')}>
              <XCircle className="mr-2 h-4 w-4" /> Reject Agreement
            </Button>
          </div>
        </CardContent>
      </Card>

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
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Ministry</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Balance After</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.ledgerEntries.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No wallet entries yet.</TableCell></TableRow>
              ) : data.ledgerEntries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs">{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs capitalize">{entry.direction} / {entry.category}</TableCell>
                  <TableCell className="text-xs">{entry.ministryName || '—'}</TableCell>
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

      <Card>
        <CardHeader>
          <CardTitle>Marketer Payouts</CardTitle>
          <CardDescription>Automatic commission payouts sent to this marketer.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Charge ID</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Fee</TableHead>
                <TableHead className="text-right">Payout</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.withdrawals.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No marketer payouts yet.</TableCell></TableRow>
              ) : data.withdrawals.map(withdrawal => {
                const canReconcile = ['processing', 'review_required'].includes(withdrawal.status);
                return (
                  <TableRow key={withdrawal.id}>
                    <TableCell className="text-xs">{new Date(withdrawal.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs capitalize">{String(withdrawal.status || 'pending').replace(/_/g, ' ')}</TableCell>
                    <TableCell className="text-xs capitalize">{withdrawal.mobileOperator || withdrawal.method || '—'}</TableCell>
                    <TableCell className="text-xs">{withdrawal.chargeId || '—'}</TableCell>
                    <TableCell className="text-right text-xs">{money(withdrawal.currency || currency, withdrawal.amount)}</TableCell>
                    <TableCell className="text-right text-xs">{money(withdrawal.currency || currency, withdrawal.feeAmount || 0)}</TableCell>
                    <TableCell className="text-right text-xs">{money(withdrawal.currency || currency, withdrawal.payoutAmount || withdrawal.amount)}</TableCell>
                    <TableCell className="text-right">
                      {canReconcile ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          disabled={reconcileMutation.isPending}
                          onClick={() => reconcileMutation.mutate(withdrawal.id)}
                        >
                          Reconcile
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
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

      <Dialog open={agreementOpen} onOpenChange={setAgreementOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{agreementStatus === 'approved' ? 'Approve Agreement' : 'Reject Agreement'}</DialogTitle>
            <DialogDescription>
              {agreementStatus === 'approved'
                ? 'Approving locks the marketer profile and signed agreement.'
                : 'Rejecting reopens upload on the marketer side. Add a clear reason.'}
            </DialogDescription>
          </DialogHeader>
          {agreementStatus === 'rejected' && (
            <div className="space-y-2">
              <Label htmlFor="agreementReason">Reason</Label>
              <Input
                id="agreementReason"
                value={agreementReason}
                onChange={event => setAgreementReason(event.target.value)}
                placeholder="Explain what needs to be fixed"
              />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAgreementOpen(false)}>Cancel</Button>
            <Button
              type="button"
              variant={agreementStatus === 'rejected' ? 'destructive' : 'default'}
              disabled={agreementMutation.isPending || (agreementStatus === 'rejected' && !agreementReason.trim())}
              onClick={() => agreementMutation.mutate()}
            >
              {agreementMutation.isPending ? 'Saving...' : agreementStatus === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Initiate Marketer Payout</DialogTitle>
            <DialogDescription>
              Review the wallet debit and PayChangu payout details before sending money.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Available balance</span>
                <span className="font-medium">{money(currency, data.balance)}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Provider</span>
                <span className="font-medium">{data.payoutProvider || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Payout phone</span>
                <span className="font-medium">{data.payoutPhone || '—'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="marketer-payout-amount">Amount to debit from wallet</Label>
              <Input
                id="marketer-payout-amount"
                type="number"
                min="1"
                step="0.01"
                value={payoutAmount}
                onChange={(event) => {
                  setPayoutAmount(event.target.value);
                  setPayoutPreview(null);
                  setPayoutPreviewError('');
                }}
              />
              <p className="text-xs text-muted-foreground">
                Fee breakdown updates from the backend as you type. The marketer receives the amount after fee.
              </p>
              {previewPayoutMutation.isPending && (
                <p className="text-xs text-muted-foreground">Calculating provider fee...</p>
              )}
              {payoutPreviewError && (
                <p className="text-xs text-destructive">{payoutPreviewError}</p>
              )}
            </div>

            {payoutPreview && (
              <div className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Minimum payout</span>
                  <span className="font-medium">{money(payoutPreview.currency, payoutPreview.minimumAmount)}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Wallet debit</span>
                  <span className="font-medium">{money(payoutPreview.currency, payoutPreview.amount)}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Provider rate</span>
                  <span className="font-medium">{(Number(payoutPreview.gatewayFeeRate || 0) * 100).toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Provider fee</span>
                  <span className="font-medium">{money(payoutPreview.currency, payoutPreview.feeAmount)}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Net sent</span>
                  <span className="font-medium">{money(payoutPreview.currency, payoutPreview.payoutAmount)}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Balance after success</span>
                  <span className="font-medium">{money(payoutPreview.currency, payoutPreview.balance - payoutPreview.amount)}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPayoutOpen(false)}>Cancel</Button>
            <Button
              variant="outline"
              disabled={!payoutAmount || previewPayoutMutation.isPending || initiatePayoutMutation.isPending}
              onClick={() => previewPayoutMutation.mutate(payoutAmountNumber)}
            >
              {previewPayoutMutation.isPending ? 'Calculating...' : 'Refresh Breakdown'}
            </Button>
            <Button
              disabled={!previewMatchesAmount || initiatePayoutMutation.isPending || previewPayoutMutation.isPending}
              onClick={() => initiatePayoutMutation.mutate()}
            >
              {initiatePayoutMutation.isPending ? 'Initiating...' : 'Confirm & Initiate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
