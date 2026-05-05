import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { givingService, type Pledge, type PledgeStatus } from '@/services/giving';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ArrowLeft, Handshake, Wallet, Clock, CheckCircle2,
  TrendingUp, AlertCircle, Calendar, User, Building2,
  CreditCard, Hash, ExternalLink,
} from 'lucide-react';
import { STALE_TIME } from '@/lib/query-config';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PledgeStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  pending:   { label: 'Pending',   variant: 'secondary',   icon: <Clock className="h-3.5 w-3.5" /> },
  partial:   { label: 'Partial',   variant: 'default',     icon: <TrendingUp className="h-3.5 w-3.5" /> },
  fulfilled: { label: 'Fulfilled', variant: 'outline',     icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  overdue:   { label: 'Overdue',   variant: 'destructive', icon: <AlertCircle className="h-3.5 w-3.5" /> },
};

function StatusBadge({ status }: { status: PledgeStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <Badge variant={cfg.variant} className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1">
      {cfg.icon} {cfg.label}
    </Badge>
  );
}

function fmt(n: number, currency: string) {
  return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b last:border-0">
      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground shrink-0">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xs sm:text-sm font-medium text-right">{value}</div>
    </div>
  );
}

// ─── Pay toward pledge dialog ─────────────────────────────────────────────────

function PayPledgeDialog({ pledge, open, onClose }: { pledge: Pledge; open: boolean; onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const balance = pledge.pledgedAmount - pledge.amountPaid;

  const handlePay = async () => {
    if (!amount || Number(amount) <= 0) return;
    setIsProcessing(true);
    try {
      const result = await givingService.donate({
        campaignId: pledge.campaignId,
        amount: Number(amount),
        pledgeId: pledge.id,
      });
      if (result?.authorization_url) {
        window.location.href = result.authorization_url;
      } else {
        toast.error('Could not initiate payment');
        setIsProcessing(false);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Payment failed');
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Pay Toward Pledge</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md bg-muted/50 border px-3 py-2 text-sm">
            <p className="text-muted-foreground text-xs">Campaign</p>
            <p className="font-medium">{pledge.campaign?.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Outstanding balance: <strong>{fmt(balance, pledge.currency)}</strong>
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Amount <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-10 shrink-0">{pledge.currency}</span>
              <input
                type="number" min="1" max={balance} step="any" placeholder="0.00"
                value={amount} onChange={e => setAmount(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <p className="text-xs text-muted-foreground">You can pay part or all of your remaining balance.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={!amount || Number(amount) <= 0 || isProcessing}
              onClick={handlePay}
            >
              {isProcessing ? 'Redirecting...' : 'Proceed to Payment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PledgeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const isMember = user?.roleName === 'member';
  const [payOpen, setPayOpen] = useState(false);

  const { data: pledge, isLoading, error } = useQuery({
    queryKey: ['pledge', id],
    queryFn: () => givingService.getPledge(id!),
    enabled: !!id,
    staleTime: STALE_TIME.DEFAULT,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
        Loading pledge...
      </div>
    );
  }

  if (error || !pledge) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-muted-foreground text-sm">Pledge not found or access denied.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/pledges')}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Pledges
        </Button>
      </div>
    );
  }

  const balance = pledge.pledgedAmount - pledge.amountPaid;
  const pct = pledge.pledgedAmount > 0 ? Math.min(100, (pledge.amountPaid / pledge.pledgedAmount) * 100) : 0;
  const pledgerName = pledge.user
    ? `${pledge.user.firstName} ${pledge.user.lastName}`
    : (pledge.pledgerName ?? 'Walk-in Pledger');
  const canPay = isMember && pledge.status !== 'fulfilled' && pledge.campaign?.status === 'active';

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* ── Back + header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/pledges')} className="gap-1.5 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Handshake className="h-5 w-5 text-accent shrink-0" />
              Pledge Details
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{pledge.campaign?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={pledge.status as PledgeStatus} />
          {canPay && (
            <Button
              size="sm"
              className="h-8 text-xs sm:h-9 sm:text-sm bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5"
              onClick={() => setPayOpen(true)}
            >
              <Wallet className="h-3.5 w-3.5" /> Pay Now
            </Button>
          )}
        </div>
      </div>

      {/* ── Progress card ── */}
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Fulfillment Progress</span>
            <span className="text-sm font-bold text-accent">{pct.toFixed(1)}%</span>
          </div>
          <Progress value={pct} className="h-2 sm:h-3" />
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <div className="rounded-lg bg-muted/50 border p-2 sm:p-3">
              <p className="text-xs text-muted-foreground mb-1">Pledged</p>
              <p className="font-bold text-xs sm:text-sm">{fmt(pledge.pledgedAmount, pledge.currency)}</p>
            </div>
            <div className="rounded-lg bg-accent/10 border border-accent/20 p-2 sm:p-3">
              <p className="text-xs text-muted-foreground mb-1">Paid</p>
              <p className="font-bold text-xs sm:text-sm text-accent">{fmt(pledge.amountPaid, pledge.currency)}</p>
            </div>
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-2 sm:p-3">
              <p className="text-xs text-muted-foreground mb-1">Balance</p>
              <p className="font-bold text-xs sm:text-sm text-destructive">{fmt(balance, pledge.currency)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Info cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Pledge info */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Pledge Information</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <InfoRow
              label="Pledger"
              icon={<User className="h-3.5 w-3.5" />}
              value={pledgerName}
            />
            {pledge.user?.email && (
              <InfoRow label="Email" icon={<User className="h-3.5 w-3.5" />} value={pledge.user.email} />
            )}
            {(pledge.pledgerPhone || pledge.user?.phone) && (
              <InfoRow label="Phone" icon={<User className="h-3.5 w-3.5" />} value={pledge.pledgerPhone ?? pledge.user?.phone ?? '—'} />
            )}
            <InfoRow
              label="Church"
              icon={<Building2 className="h-3.5 w-3.5" />}
              value={pledge.church?.name ?? '—'}
            />
            <InfoRow
              label="Campaign"
              icon={<Handshake className="h-3.5 w-3.5" />}
              value={
                <Link to="/dashboard/giving" className="text-accent hover:underline flex items-center gap-1">
                  {pledge.campaign?.name}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              }
            />
            <InfoRow
              label="Pledged On"
              icon={<Calendar className="h-3.5 w-3.5" />}
              value={new Date(pledge.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            />
            {pledge.fulfillmentDeadline && (
              <InfoRow
                label="Deadline"
                icon={<Clock className="h-3.5 w-3.5" />}
                value={
                  <span className={pledge.status === 'overdue' ? 'text-destructive' : ''}>
                    {new Date(pledge.fulfillmentDeadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                }
              />
            )}
            {pledge.notes && (
              <InfoRow label="Notes" icon={<Hash className="h-3.5 w-3.5" />} value={<span className="text-xs">{pledge.notes}</span>} />
            )}
          </CardContent>
        </Card>

        {/* Payment summary */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <InfoRow
              label="Total Payments"
              icon={<CreditCard className="h-3.5 w-3.5" />}
              value={pledge.payments?.length ?? 0}
            />
            <InfoRow
              label="Total Paid"
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
              value={<span className="text-accent font-semibold">{fmt(pledge.amountPaid, pledge.currency)}</span>}
            />
            <InfoRow
              label="Outstanding"
              icon={<AlertCircle className="h-3.5 w-3.5" />}
              value={<span className="text-destructive font-semibold">{fmt(balance, pledge.currency)}</span>}
            />
            {pledge.payments && pledge.payments.length > 0 && (
              <InfoRow
                label="Last Payment"
                icon={<Calendar className="h-3.5 w-3.5" />}
                value={new Date(pledge.payments[0].createdAt).toLocaleDateString()}
              />
            )}
            {canPay && (
              <div className="pt-3">
                <Button
                  size="sm"
                  className="w-full h-8 text-xs sm:h-9 sm:text-sm bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5"
                  onClick={() => setPayOpen(true)}
                >
                  <Wallet className="h-3.5 w-3.5" /> Pay Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Transactions table ── */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-accent" />
            Payment Transactions
            {pledge.payments && pledge.payments.length > 0 && (
              <Badge variant="secondary" className="text-xs">{pledge.payments.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {!pledge.payments || pledge.payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-4">
              <CreditCard className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No payments yet.</p>
              {canPay && (
                <Button size="sm" variant="outline" onClick={() => setPayOpen(true)} className="mt-1">
                  Make First Payment
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="px-3 sm:px-4 py-2.5 text-left">#</th>
                    <th className="px-3 sm:px-4 py-2.5 text-left">Date</th>
                    <th className="px-3 sm:px-4 py-2.5 text-left">Method</th>
                    <th className="px-3 sm:px-4 py-2.5 text-left hidden sm:table-cell">Reference</th>
                    <th className="px-3 sm:px-4 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {pledge.payments.map((p, i) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-3 sm:px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 sm:px-4 py-3">
                        {new Date(p.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </td>
                      <td className="px-3 sm:px-4 py-3 capitalize">
                        <Badge variant="outline" className="text-xs font-normal">
                          {p.paymentMethod?.replace('_', ' ') ?? 'online'}
                        </Badge>
                      </td>
                      <td className="px-3 sm:px-4 py-3 font-mono text-xs text-muted-foreground hidden sm:table-cell">
                        {p.reference ?? '—'}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right font-semibold text-accent">
                        {fmt(p.amount, p.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30 border-t">
                    <td colSpan={3} className="px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium text-right text-muted-foreground sm:hidden">
                      Total Paid
                    </td>
                    <td colSpan={4} className="px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium text-right text-muted-foreground hidden sm:table-cell">
                      Total Paid
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-right font-bold text-accent">
                      {fmt(pledge.amountPaid, pledge.currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pay dialog */}
      {payOpen && (
        <PayPledgeDialog pledge={pledge} open={payOpen} onClose={() => setPayOpen(false)} />
      )}
    </div>
  );
}
