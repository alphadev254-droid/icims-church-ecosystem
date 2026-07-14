import { useState, type ElementType } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, CreditCard, Eye, RefreshCw, Search, TrendingUp, Wallet, Zap } from 'lucide-react';
import { adminApi, type AdminWithdrawal } from '@/services/adminApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDebounce } from '@/hooks/use-debounce';
import { ExportImportButtons } from '@/components/ExportImportButtons';
import { toast } from 'sonner';

type Ministry = { id: string; label: string; country: string | null };
type DatePreset = 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth';
type JsonObject = Record<string, unknown>;

const STATUSES = ['pending', 'processing', 'review_required', 'completed', 'failed'];
const METHODS = ['mobile_money', 'bank_transfer'];
const CURRENCIES = ['MWK', 'KES'];

function statusBadge(status: string) {
  if (status === 'completed') return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Completed</Badge>;
  if (status === 'processing') return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Processing</Badge>;
  if (status === 'review_required') return <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">Review Required</Badge>;
  if (status === 'pending') return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">Pending</Badge>;
  if (status === 'failed') return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Failed</Badge>;
  return <Badge variant="outline" className="text-xs capitalize">{status}</Badge>;
}

function methodLabel(method: string) {
  return method === 'mobile_money' ? 'Mobile Money' : method === 'bank_transfer' ? 'Bank Transfer' : method.replace('_', ' ');
}

function fmt(n: number | null | undefined) {
  return (n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function money(currency: string, value?: number | null) {
  return `${currency} ${fmt(value)}`;
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : '-';
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDatePresetRange(preset: DatePreset) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (preset === 'today') return { from: toDateInputValue(start), to: toDateInputValue(end) };
  if (preset === 'thisWeek') {
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset);
    return { from: toDateInputValue(start), to: toDateInputValue(end) };
  }
  if (preset === 'thisMonth') {
    start.setDate(1);
    return { from: toDateInputValue(start), to: toDateInputValue(end) };
  }
  start.setMonth(start.getMonth() - 1, 1);
  end.setDate(0);
  return { from: toDateInputValue(start), to: toDateInputValue(end) };
}

function parseJson(value?: string | null): unknown {
  if (!value) return null;
  try { return JSON.parse(value); } catch { return value; }
}

function JsonValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);
  if (value === null || value === undefined) return <span className="text-gray-400">null</span>;
  if (typeof value === 'boolean') return <span className="text-blue-500">{String(value)}</span>;
  if (typeof value === 'number') return <span className="text-orange-500">{value}</span>;
  if (typeof value === 'string') return <span className="text-green-600 break-all">"{value}"</span>;
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-gray-500">[]</span>;
    return (
      <span>
        <button onClick={() => setOpen(o => !o)} className="text-gray-500 hover:text-foreground font-mono text-xs">
          {open ? 'v' : '>'} [{value.length}]
        </button>
        {open && (
          <div className="pl-4 border-l border-border/50 mt-0.5 space-y-0.5">
            {value.map((item, i) => (
              <div key={i} className="text-xs font-mono">
                <span className="text-gray-400">{i}: </span>
                <JsonValue value={item} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </span>
    );
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value as JsonObject);
    if (keys.length === 0) return <span className="text-gray-500">{'{}'}</span>;
    return (
      <span>
        <button onClick={() => setOpen(o => !o)} className="text-gray-500 hover:text-foreground font-mono text-xs">
          {open ? 'v' : '>'} {'{'}...{'}'}
        </button>
        {open && (
          <div className="pl-4 border-l border-border/50 mt-0.5 space-y-0.5">
            {keys.map(k => (
              <div key={k} className="text-xs font-mono flex gap-1 flex-wrap">
                <span className="text-accent shrink-0">"{k}":</span>
                <JsonValue value={(value as JsonObject)[k]} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </span>
    );
  }
  return <span>{String(value)}</span>;
}

function SummaryCard({ label, value, sub, icon: Icon, color }: {
  label: string;
  value: string;
  sub?: string;
  icon: ElementType;
  color: string;
}) {
  return (
    <div className="border rounded-lg p-4 bg-card flex items-start gap-3">
      <div className={`p-2 rounded-md ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold mt-0.5 whitespace-normal break-words">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function CountPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold leading-tight">{value.toLocaleString()}</p>
    </div>
  );
}

function WithdrawalDetailDialog({ withdrawal, onClose }: { withdrawal: AdminWithdrawal; onClose: () => void }) {
  const fields: [string, string][] = [
    ['Withdrawal ID', withdrawal.id],
    ['Charge ID', withdrawal.chargeId ?? '-'],
    ['Status', withdrawal.status],
    ['Method', methodLabel(withdrawal.method)],
    ['Church', withdrawal.church?.name ?? '-'],
    ['Ministry', withdrawal.ministryAdmin?.ministryName ?? (withdrawal.ministryAdmin ? `${withdrawal.ministryAdmin.firstName} ${withdrawal.ministryAdmin.lastName}` : '-')],
    ['Initiated By', withdrawal.initiatedByUser ? `${withdrawal.initiatedByUser.firstName} ${withdrawal.initiatedByUser.lastName} (${withdrawal.initiatedByUser.email})` : '-'],
    ['Requested Amount', money(withdrawal.currency, withdrawal.amount)],
    ['Total Fee', money(withdrawal.currency, withdrawal.fee)],
    ['Gateway Fee', money(withdrawal.currency, withdrawal.gatewayFeeAmount)],
    ['Bank Fixed Fee', money(withdrawal.currency, withdrawal.bankFixedFeeAmount)],
    ['ICIMS Fee', money(withdrawal.currency, withdrawal.systemFeeAmount)],
    ['Net Amount', money(withdrawal.currency, withdrawal.netAmount)],
    ['Payout Sent', money(withdrawal.currency, withdrawal.payoutAmount)],
    ['Gateway Fee Rate', withdrawal.gatewayFeeRate != null ? String(withdrawal.gatewayFeeRate) : '-'],
    ['ICIMS Fee Rate', withdrawal.systemFeeRate != null ? String(withdrawal.systemFeeRate) : '-'],
    ['Mobile Operator', withdrawal.mobileOperator ?? '-'],
    ['Mobile Number', withdrawal.mobileNumber ?? '-'],
    ['Bank Code', withdrawal.bankCode ?? '-'],
    ['Account Name', withdrawal.accountName ?? '-'],
    ['Account Number', withdrawal.accountNumber ?? '-'],
    ['Failure Reason', withdrawal.failureReason ?? '-'],
    ['Processed At', formatDateTime(withdrawal.processedAt)],
    ['Created At', formatDateTime(withdrawal.createdAt)],
    ['Updated At', formatDateTime(withdrawal.updatedAt)],
  ];
  const payload = parseJson(withdrawal.gatewayPayload);
  const response = parseJson(withdrawal.gatewayResponse);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 text-sm">
            Withdrawal Trace
            {statusBadge(withdrawal.status)}
          </DialogTitle>
        </DialogHeader>
        <div className="rounded-lg border divide-y text-xs">
          {fields.map(([label, value]) => (
            <div key={label} className="flex gap-3 px-3 py-2">
              <span className="text-muted-foreground w-36 shrink-0">{label}</span>
              <span className="font-mono break-all">{value}</span>
            </div>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-medium">Gateway Payload</p>
            <div className="rounded-lg border bg-muted/30 p-3 text-xs font-mono overflow-x-auto max-h-80 overflow-y-auto">
              <JsonValue value={payload} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium">Gateway Response / Webhook</p>
            <div className="rounded-lg border bg-muted/30 p-3 text-xs font-mono overflow-x-auto max-h-80 overflow-y-auto">
              <JsonValue value={response} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminWithdrawals() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [currency, setCurrency] = useState('');
  const [ministry, setMinistry] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminWithdrawal | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const { data: ministriesData } = useQuery({
    queryKey: ['admin-ministries'],
    queryFn: () => adminApi.getMinistries().then(r => r.data.data),
    staleTime: 60_000,
  });
  const ministries: Ministry[] = ministriesData ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['admin-withdrawals', debouncedSearch, status, method, currency, ministry, dateFrom, dateTo, page],
    queryFn: () => adminApi.getWithdrawals({
      search: debouncedSearch || undefined,
      status: status || undefined,
      method: method || undefined,
      currency: currency || undefined,
      ministry: ministry || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page,
      limit: 70,
    }).then(r => r.data),
    staleTime: 30_000,
  });

  const withdrawals = data?.data ?? [];
  const pagination = data?.pagination;
  const summary = data?.summary;

  const reconcileMutation = useMutation({
    mutationFn: (id: string) => adminApi.reconcileWithdrawal('ministry', id),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Withdrawal reconciliation checked');
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Failed to reconcile withdrawal');
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
    },
  });

  const applyDatePreset = (preset: DatePreset) => {
    const range = getDatePresetRange(preset);
    setDateFrom(range.from);
    setDateTo(range.to);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Withdrawals</h1>
          <p className="text-sm text-muted-foreground">
            {pagination ? `${pagination.total.toLocaleString()} withdrawal(s)` : 'System-admin withdrawal tracing'}
          </p>
        </div>
        <ExportImportButtons
          filename="system-withdrawals"
          pdfTitle="System Withdrawals Export"
          data={withdrawals.map(w => ({
            church: w.church?.name ?? '',
            ministry: w.ministryAdmin?.ministryName ?? '',
            method: methodLabel(w.method),
            status: w.status,
            amount: w.amount,
            totalFee: w.fee,
            gatewayFee: w.gatewayFeeAmount ?? 0,
            bankFixedFee: w.bankFixedFeeAmount ?? 0,
            systemFee: w.systemFeeAmount ?? 0,
            netAmount: w.netAmount,
            payoutAmount: w.payoutAmount ?? 0,
            currency: w.currency,
            chargeId: w.chargeId ?? '',
            initiatedBy: w.initiatedByUser ? `${w.initiatedByUser.firstName} ${w.initiatedByUser.lastName}` : '',
            createdAt: formatDateTime(w.createdAt),
            processedAt: formatDateTime(w.processedAt),
          }))}
          headers={[
            { label: 'Church', key: 'church' },
            { label: 'Ministry', key: 'ministry' },
            { label: 'Method', key: 'method' },
            { label: 'Status', key: 'status' },
            { label: 'Amount', key: 'amount' },
            { label: 'Total Fee', key: 'totalFee' },
            { label: 'Gateway Fee', key: 'gatewayFee' },
            { label: 'Bank Fixed Fee', key: 'bankFixedFee' },
            { label: 'System Fee', key: 'systemFee' },
            { label: 'Net Amount', key: 'netAmount' },
            { label: 'Payout Amount', key: 'payoutAmount' },
            { label: 'Currency', key: 'currency' },
            { label: 'Charge ID', key: 'chargeId' },
            { label: 'Initiated By', key: 'initiatedBy' },
            { label: 'Created At', key: 'createdAt' },
            { label: 'Processed At', key: 'processedAt' },
          ]}
          pdfColumns={['Church', 'Ministry', 'Method', 'Status', 'Amount', 'Total Fee', 'Gateway Fee', 'Bank Fixed Fee', 'System Fee', 'Net Amount', 'Payout Amount', 'Currency', 'Charge ID', 'Initiated By', 'Created At', 'Processed At']}
        />
      </div>

      {summary && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <CountPill label="Pending" value={summary.byStatus?.pending ?? 0} />
            <CountPill label="Processing" value={summary.byStatus?.processing ?? 0} />
            <CountPill label="Review" value={summary.byStatus?.review_required ?? 0} />
            <CountPill label="Completed" value={summary.byStatus?.completed ?? 0} />
            <CountPill label="Failed" value={summary.byStatus?.failed ?? 0} />
          </div>
          {summary.walletBalances.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {summary.walletBalances.map(w => (
                <SummaryCard
                  key={w.currency}
                  label={`${w.currency} Wallet Balance`}
                  value={money(w.currency, w.balance)}
                  sub={`${w.walletCount.toLocaleString()} ministry wallet(s)${ministry ? ' in selected ministry' : ' across system'}`}
                  icon={Wallet}
                  color="bg-emerald-100 text-emerald-700"
                />
              ))}
            </div>
          )}
          {summary.byCurrency.map(c => (
            <div key={c.currency} className="rounded-xl border bg-muted/20 p-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{c.currency} Withdrawals</p>
                  <p className="text-xs text-muted-foreground">{c.count.toLocaleString()} matching withdrawal(s)</p>
                </div>
                <Badge variant="outline" className="text-xs">{c.currency}</Badge>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <SummaryCard label="Requested" value={money(c.currency, c.totalRequested)} sub="Amount requested by churches" icon={Wallet} color="bg-accent/10 text-accent" />
                <SummaryCard label="Payout Sent" value={money(c.currency, c.payoutAmount)} sub="Amount sent to bank/mobile" icon={Banknote} color="bg-green-100 text-green-700" />
                <SummaryCard label="Total Fees" value={money(c.currency, c.totalFee)} sub="Gateway + bank + ICIMS" icon={CreditCard} color="bg-blue-100 text-blue-700" />
                <SummaryCard label="ICIMS Fee" value={money(c.currency, c.systemFee)} sub={`Completed revenue ${money(c.currency, c.completedSystemRevenue)}`} icon={Zap} color="bg-purple-100 text-purple-700" />
                <SummaryCard label="Gateway/Bank Cost" value={money(c.currency, (c.gatewayFee ?? 0) + (c.bankFixedFee ?? 0))} sub={`Gateway ${money(c.currency, c.gatewayFee)}`} icon={TrendingUp} color="bg-yellow-100 text-yellow-700" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-8 h-8 text-xs" placeholder="Search initiator, ministry, phone, account, charge..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={status} onValueChange={v => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={method} onValueChange={v => { setMethod(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Method" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All methods</SelectItem>
            {METHODS.map(m => <SelectItem key={m} value={m} className="text-xs">{methodLabel(m)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={currency} onValueChange={v => { setCurrency(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="Currency" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All currencies</SelectItem>
            {CURRENCIES.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={ministry} onValueChange={v => { setMinistry(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-44"><SelectValue placeholder="All ministries" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All ministries</SelectItem>
            {ministries.map(m => <SelectItem key={m.id} value={m.id} className="text-xs">{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" className="h-8 text-xs w-36" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
        <Input type="date" className="h-8 text-xs w-36" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
        <div className="flex flex-wrap gap-1">
          {(['today', 'thisWeek', 'thisMonth', 'lastMonth'] as DatePreset[]).map(p => (
            <Button key={p} type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => applyDatePreset(p)}>
              {p === 'today' ? 'Today' : p === 'thisWeek' ? 'This Week' : p === 'thisMonth' ? 'This Month' : 'Last Month'}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr>
                <th className="text-left p-3 font-medium">Church</th>
                <th className="text-left p-3 font-medium">Method</th>
                <th className="text-right p-3 font-medium">Amount</th>
                <th className="text-right p-3 font-medium">Payout</th>
                <th className="text-right p-3 font-medium">ICIMS Fee</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Initiator</th>
                <th className="text-left p-3 font-medium">Charge</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-right p-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={10} className="p-3"><div className="h-8 bg-muted animate-pulse rounded" /></td></tr>
                ))
              ) : withdrawals.length === 0 ? (
                <tr><td colSpan={10} className="p-8 text-center text-sm text-muted-foreground">No withdrawals found</td></tr>
              ) : withdrawals.map(w => (
                <tr key={w.id} className="hover:bg-muted/30">
                  <td className="p-3 min-w-44">
                    <p className="font-medium">{w.church?.name ?? 'Unknown church'}</p>
                    <p className="text-xs text-muted-foreground">{w.ministryAdmin?.ministryName ?? w.ministryAdmin?.email ?? '-'}</p>
                  </td>
                  <td className="p-3 text-xs">{methodLabel(w.method)}</td>
                  <td className="p-3 text-right font-mono text-xs">{money(w.currency, w.amount)}</td>
                  <td className="p-3 text-right font-mono text-xs">{money(w.currency, w.payoutAmount ?? w.netAmount)}</td>
                  <td className="p-3 text-right font-mono text-xs">{money(w.currency, w.systemFeeAmount)}</td>
                  <td className="p-3">{statusBadge(w.status)}</td>
                  <td className="p-3 min-w-40">
                    <p className="text-xs font-medium">{w.initiatedByUser ? `${w.initiatedByUser.firstName} ${w.initiatedByUser.lastName}` : '-'}</p>
                    <p className="text-xs text-muted-foreground">{w.initiatedByUser?.email ?? ''}</p>
                  </td>
                  <td className="p-3 text-xs font-mono max-w-36 truncate">{w.chargeId ?? '-'}</td>
                  <td className="p-3 text-xs whitespace-nowrap">{formatDateTime(w.createdAt)}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      {['pending', 'processing', 'review_required'].includes(w.status) && w.chargeId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => reconcileMutation.mutate(w.id)}
                          disabled={reconcileMutation.isPending}
                          title="Reconcile with PayChangu"
                        >
                          <RefreshCw className={`h-4 w-4 ${reconcileMutation.isPending ? 'animate-spin' : ''}`} />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelected(w)} title="View withdrawal trace">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {selected && <WithdrawalDetailDialog withdrawal={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
