import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Banknote, CreditCard, Eye, ShieldCheck, Wallet, Zap } from 'lucide-react';
import { adminApi, type AdminPlatformWithdrawal } from '@/services/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

type Method = 'mobile_money' | 'bank_transfer';
type Operator = 'airtel' | 'tnm';
type SupportedBank = { uuid?: string; bank_uuid?: string; id?: string | number; name?: string };

function money(currency = 'MWK', value?: number | null) {
  return `${currency} ${(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusBadge(status: string) {
  if (status === 'completed') return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Completed</Badge>;
  if (status === 'processing') return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Processing</Badge>;
  if (status === 'pending') return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">Pending</Badge>;
  if (status === 'failed') return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Failed</Badge>;
  return <Badge variant="outline" className="text-xs capitalize">{status}</Badge>;
}

function methodLabel(method: string) {
  return method === 'mobile_money' ? 'Mobile Money' : 'Bank Transfer';
}

function SummaryCard({ label, value, sub, icon: Icon, tone }: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <div className="border rounded-lg p-4 bg-card flex items-start gap-3">
      <div className={`p-2 rounded-md ${tone}`}><Icon className="h-4 w-4" /></div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold mt-0.5 break-words">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function getMobileOperatorFromNumber(value?: string): Operator | null {
  const digits = String(value || '').replace(/\D/g, '');
  const local = digits.startsWith('265') ? `0${digits.slice(3)}` : digits;
  if (local.startsWith('099') || local.startsWith('098')) return 'airtel';
  if (local.startsWith('088') || local.startsWith('089')) return 'tnm';
  return null;
}

function DetailDialog({ row, onClose }: { row: AdminPlatformWithdrawal; onClose: () => void }) {
  const fields: [string, string][] = [
    ['ID', row.id],
    ['Status', row.status],
    ['Method', methodLabel(row.method)],
    ['Payout', money('MWK', row.payoutAmount)],
    ['Payout Cost', money('MWK', row.fee)],
    ['Total Required', money('MWK', row.netAmount)],
    ['Charge ID', row.chargeId ?? '-'],
    ['Mobile Operator', row.mobileOperator ?? '-'],
    ['Mobile Number', row.mobileNumber ?? '-'],
    ['Bank Code', row.bankCode ?? '-'],
    ['Account Name', row.accountName ?? '-'],
    ['Account Number', row.accountNumber ?? '-'],
    ['Failure Reason', row.failureReason ?? '-'],
    ['Created At', new Date(row.createdAt).toLocaleString()],
    ['Processed At', row.processedAt ? new Date(row.processedAt).toLocaleString() : '-'],
  ];
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-sm">Platform Withdrawal Trace</DialogTitle></DialogHeader>
        <div className="rounded-lg border divide-y text-xs">
          {fields.map(([k, v]) => (
            <div key={k} className="flex gap-3 px-3 py-2">
              <span className="text-muted-foreground w-36 shrink-0">{k}</span>
              <span className="font-mono break-all">{v}</span>
            </div>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <pre className="rounded-lg border bg-muted/30 p-3 text-xs overflow-auto max-h-72 whitespace-pre-wrap">{row.gatewayPayload || 'No gateway payload'}</pre>
          <pre className="rounded-lg border bg-muted/30 p-3 text-xs overflow-auto max-h-72 whitespace-pre-wrap">{row.gatewayResponse || 'No gateway response'}</pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminTreasury() {
  const qc = useQueryClient();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<Method>('mobile_money');
  const [mobileOperator, setMobileOperator] = useState<Operator>('airtel');
  const [mobileNumber, setMobileNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [selected, setSelected] = useState<AdminPlatformWithdrawal | null>(null);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['admin-treasury-summary'],
    queryFn: () => adminApi.getTreasurySummary().then(r => r.data.data),
    staleTime: 30_000,
  });
  const { data: banksData } = useQuery({
    queryKey: ['admin-treasury-banks'],
    queryFn: () => adminApi.getTreasuryBanks().then(r => r.data.data),
    staleTime: 5 * 60_000,
  });
  const { data: withdrawalsData } = useQuery({
    queryKey: ['admin-treasury-withdrawals'],
    queryFn: () => adminApi.getTreasuryWithdrawals({ limit: 50 }).then(r => r.data),
    staleTime: 30_000,
  });

  const banks: SupportedBank[] = banksData ?? [];
  const rows = withdrawalsData?.data ?? [];

  const payload = () => ({
    amount: Number(amount),
    method,
    mobileOperator: method === 'mobile_money' ? mobileOperator : undefined,
    mobileNumber: method === 'mobile_money' ? mobileNumber : undefined,
    bankCode: method === 'bank_transfer' ? bankCode : undefined,
    accountName: method === 'bank_transfer' ? accountName : undefined,
    accountNumber: method === 'bank_transfer' ? accountNumber : undefined,
  });

  const validate = () => {
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) return 'Enter a valid amount.';
    if (method === 'mobile_money') {
      const detected = getMobileOperatorFromNumber(mobileNumber);
      if (!detected) return 'Enter a valid Airtel Money or TNM Mpamba number.';
      if (detected !== mobileOperator) return `The selected operator is ${mobileOperator === 'airtel' ? 'Airtel Money' : 'TNM Mpamba'}, but the number looks like ${detected === 'airtel' ? 'Airtel Money' : 'TNM Mpamba'}.`;
    } else if (!bankCode || !accountName || !accountNumber) {
      return 'Enter bank, account name, and account number.';
    }
    return null;
  };

  const sendOtpMutation = useMutation({
    mutationFn: () => adminApi.sendTreasuryOtp(payload()),
    onSuccess: (res) => {
      setOtpSent(true);
      setOtpCode('');
      toast.success(res.data.message || 'OTP sent');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Failed to send OTP'),
  });

  const withdrawMutation = useMutation({
    mutationFn: () => adminApi.requestTreasuryWithdrawal({ ...payload(), otpCode }),
    onSuccess: () => {
      toast.success('Platform withdrawal submitted');
      setOtpSent(false);
      setOtpCode('');
      setAmount('');
      qc.invalidateQueries({ queryKey: ['admin-treasury-summary'] });
      qc.invalidateQueries({ queryKey: ['admin-treasury-withdrawals'] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Platform withdrawal failed'),
  });

  const onSendOtp = () => {
    const error = validate();
    if (error) { toast.error(error); return; }
    sendOtpMutation.mutate();
  };
  const onWithdraw = () => {
    const error = validate();
    if (error) { toast.error(error); return; }
    if (!/^\d{6}$/.test(otpCode)) { toast.error('Enter the 6-digit OTP code'); return; }
    withdrawMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Platform Treasury</h1>
        <p className="text-sm text-muted-foreground">System-admin PayChangu balance, safe balance, and platform payouts.</p>
      </div>

      {summaryLoading ? <div className="h-24 rounded-lg bg-muted animate-pulse" /> : summary && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryCard label="PayChangu Wallet" value={money(summary.currency, summary.paychanguBalance)} sub="Raw gateway wallet balance" icon={Wallet} tone="bg-blue-100 text-blue-700" />
            <SummaryCard label="Ministry Liability" value={money(summary.currency, summary.ministryWalletBalance)} sub={`${summary.ministryWalletCount} ministry wallet(s)`} icon={Banknote} tone="bg-yellow-100 text-yellow-700" />
            <SummaryCard label="Reserved Payouts" value={money(summary.currency, summary.pendingMinistryPayouts + summary.pendingPlatformPayouts)} sub="Pending/processing payouts" icon={CreditCard} tone="bg-purple-100 text-purple-700" />
            <SummaryCard label="Safe Platform Balance" value={money(summary.currency, summary.safeAvailableBalance)} sub="Maximum platform-safe pool" icon={Zap} tone="bg-emerald-100 text-emerald-700" />
          </div>
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Security rule: platform withdrawals are blocked when payout plus gateway cost exceeds safe platform balance. Ministry wallet balances are reserved first.</span>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Initiate Platform Withdrawal</h2>
            <p className="text-xs text-muted-foreground">OTP required. This does not debit ministry wallets.</p>
          </div>
          <div>
            <Label className="text-xs">Payout Amount</Label>
            <Input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as Method)}>
              <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {method === 'mobile_money' ? (
            <>
              <div>
                <Label className="text-xs">Operator</Label>
                <Select value={mobileOperator} onValueChange={(v) => setMobileOperator(v as Operator)}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="airtel">Airtel Money</SelectItem>
                    <SelectItem value="tnm">TNM Mpamba</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Mobile Number</Label>
                <Input value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} placeholder="0991234567" className="mt-1 h-9 text-sm" />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label className="text-xs">Bank</Label>
                <Select value={bankCode} onValueChange={setBankCode}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select bank" /></SelectTrigger>
                  <SelectContent>
                    {banks.map((b) => {
                      const value = String(b.uuid || b.bank_uuid || b.id);
                      return <SelectItem key={value} value={value}>{b.name || value}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Account Name</Label>
                <Input value={accountName} onChange={e => setAccountName(e.target.value)} className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Account Number</Label>
                <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="mt-1 h-9 text-sm" />
              </div>
            </>
          )}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
            <div className="flex gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <p className="text-xs text-muted-foreground">OTP is sent to your system-admin email and expires in 5 minutes.</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="h-9" onClick={onSendOtp} disabled={sendOtpMutation.isPending}>
                {sendOtpMutation.isPending ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
              </Button>
              <Input value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="OTP" className="h-9 tracking-[0.35em]" />
            </div>
          </div>
          <Button className="w-full h-9 bg-accent text-accent-foreground hover:bg-accent/90" disabled={!otpSent || otpCode.length !== 6 || withdrawMutation.isPending} onClick={onWithdraw}>
            {withdrawMutation.isPending ? 'Processing...' : 'Submit Platform Withdrawal'}
          </Button>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h2 className="text-sm font-semibold">Platform Withdrawal History</h2>
            <p className="text-xs text-muted-foreground">{withdrawalsData?.pagination.total ?? 0} record(s)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs">
                <tr>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Method</th>
                  <th className="text-right p-3">Payout</th>
                  <th className="text-right p-3">Cost</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">No platform withdrawals yet</td></tr>
                ) : rows.map(row => (
                  <tr key={row.id}>
                    <td className="p-3 text-xs whitespace-nowrap">{new Date(row.createdAt).toLocaleString()}</td>
                    <td className="p-3 text-xs">{methodLabel(row.method)}</td>
                    <td className="p-3 text-xs text-right font-mono">{money('MWK', row.payoutAmount)}</td>
                    <td className="p-3 text-xs text-right font-mono">{money('MWK', row.fee)}</td>
                    <td className="p-3">{statusBadge(row.status)}</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelected(row)}><Eye className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {selected && <DetailDialog row={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
