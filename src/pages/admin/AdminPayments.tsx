import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CreditCard, DollarSign, Eye, Search, TrendingUp, Zap } from 'lucide-react';
import { adminApi, type AdminPayment } from '@/services/adminApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDebounce } from '@/hooks/use-debounce';
import { ExportImportButtons } from '@/components/ExportImportButtons';

const STATUSES = ['completed', 'pending', 'failed'];
const COUNTRIES = ['Malawi', 'Kenya'];
const GATEWAYS = ['paychangu', 'paystack'];
const CYCLES = ['monthly', 'yearly'];
type DatePreset = 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth';
type Ministry = { id: string; label: string; country: string | null };

function statusBadge(status: string) {
  if (status === 'completed') return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Completed</Badge>;
  if (status === 'pending') return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">Pending</Badge>;
  if (status === 'failed') return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Failed</Badge>;
  return <Badge variant="outline" className="text-xs capitalize">{status}</Badge>;
}

function SummaryCard({ label, value, sub, icon: Icon, color }: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
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

function money(payment: AdminPayment, value?: number | null) {
  return value != null ? `${payment.currency} ${value.toLocaleString()}` : '—';
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : '—';
}

function PaymentDetailDialog({
  payment,
  onClose,
  onOpenAdmin,
}: {
  payment: AdminPayment;
  onClose: () => void;
  onOpenAdmin: (id: string) => void;
}) {
  const transactionCost = (payment.convenienceFee ?? 0) + (payment.systemFeeAmount ?? 0) + (payment.ceilRoundingAmount ?? 0);
  const fields: [string, string][] = [
    ['Payment ID', payment.id],
    ['Reference', payment.reference ?? '—'],
    ['Status', payment.status],
    ['Type', payment.type],
    ['Package', payment.package?.displayName ?? payment.packageName ?? '—'],
    ['Billing Cycle', payment.billingCycle ?? '—'],
    ['Package Price', money(payment, payment.baseAmount ?? payment.amount)],
    ['Gateway Fee', money(payment, payment.convenienceFee)],
    ['ICIMS Fee', money(payment, payment.systemFeeAmount)],
    ['Rounding', money(payment, payment.ceilRoundingAmount)],
    ['Transaction Cost', money(payment, transactionCost)],
    ['Total Collected', money(payment, payment.totalAmount ?? payment.amount)],
    ['Gateway Charge', money(payment, payment.gatewayCharge)],
    ['Gateway', payment.gateway ?? '—'],
    ['Payment Method', payment.paymentMethod ?? '—'],
    ['Channel', payment.channel ?? '—'],
    ['Country', payment.ministryAdmin?.accountCountry ?? '—'],
    ['Ministry Admin', payment.ministryAdmin ? `${payment.ministryAdmin.firstName} ${payment.ministryAdmin.lastName}` : '—'],
    ['Admin Email', payment.ministryAdmin?.email ?? '—'],
    ['Customer Email', payment.customerEmail ?? '—'],
    ['Customer Phone', payment.customerPhone ?? '—'],
    ['Card', payment.cardLast4 ? `**** ${payment.cardLast4}${payment.cardBank ? ` (${payment.cardBank})` : ''}` : '—'],
    ['Subaccount', payment.subaccountName ?? payment.subaccountCode ?? '—'],
    ['Gateway Fee Rate', payment.systemGatewayFeeRate != null ? `${payment.systemGatewayFeeRate}` : '—'],
    ['ICIMS Fee Rate', payment.systemFeeRate != null ? `${payment.systemFeeRate}` : '—'],
    ['Paid At', formatDateTime(payment.paidAt)],
    ['Expires At', formatDateTime(payment.expiresAt)],
    ['Created At', formatDateTime(payment.createdAt)],
    ['Notes', payment.notes ?? '—'],
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 text-sm">
            Package Payment Detail
            {statusBadge(payment.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-lg border divide-y text-xs">
          {fields.map(([label, value]) => (
            <div key={label} className="flex gap-3 px-3 py-2">
              <span className="text-muted-foreground w-40 shrink-0">{label}</span>
              <span className="font-mono break-all">{value}</span>
            </div>
          ))}
        </div>

        {payment.gatewayPayload && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground select-none">
              Raw gateway request payload
            </summary>
            <pre className="mt-2 rounded-lg border bg-muted/30 p-3 overflow-x-auto text-xs whitespace-pre-wrap break-all">
              {payment.gatewayPayload}
            </pre>
          </details>
        )}

        {payment.gatewayResponse && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground select-none">
              Raw gateway response
            </summary>
            <pre className="mt-2 rounded-lg border bg-muted/30 p-3 overflow-x-auto text-xs whitespace-pre-wrap break-all">
              {payment.gatewayResponse}
            </pre>
          </details>
        )}

        {payment.ministryAdminId && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onOpenAdmin(payment.ministryAdminId)}>
              Open Ministry Admin
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
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

export default function AdminPayments() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [pkg, setPkg] = useState('');
  const [status, setStatus] = useState('');
  const [country, setCountry] = useState('');
  const [ministry, setMinistry] = useState('');
  const [gateway, setGateway] = useState('');
  const [cycle, setCycle] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const { data: packagesData } = useQuery({
    queryKey: ['admin-packages'],
    queryFn: () => adminApi.getPackages().then(r => r.data.data),
    staleTime: 60_000,
  });
  const packages = packagesData ?? [];

  const { data: ministriesData } = useQuery({
    queryKey: ['admin-ministries'],
    queryFn: () => adminApi.getMinistries().then(r => r.data.data),
    staleTime: 60_000,
  });
  const ministries: Ministry[] = ministriesData ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['admin-package-payments', debouncedSearch, pkg, status, country, ministry, gateway, cycle, dateFrom, dateTo, page],
    queryFn: () => adminApi.getPackagePayments({
      search: debouncedSearch || undefined,
      package: pkg || undefined,
      status: status || undefined,
      country: country || undefined,
      ministry: ministry || undefined,
      gateway: gateway || undefined,
      cycle: cycle || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page,
      limit: 70,
    }).then(r => r.data),
  });

  const transactions = data?.data ?? [];
  const pagination = data?.pagination;
  const summary = data?.summary;

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const applyDatePreset = (preset: DatePreset) => {
    const range = getDatePresetRange(preset);
    setDateFrom(range.from);
    setDateTo(range.to);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Package Payments</h1>
          <p className="text-sm text-muted-foreground">
            {pagination ? `${pagination.total.toLocaleString()} total transactions` : 'All package payment transactions'}
          </p>
        </div>
        <ExportImportButtons
          filename="package-payments"
          pdfTitle="Package Payments Export"
          data={transactions.map((t: AdminPayment) => ({
            adminName:       t.ministryAdmin ? `${t.ministryAdmin.firstName} ${t.ministryAdmin.lastName}` : '',
            email:           t.ministryAdmin?.email ?? '',
            package:         t.package?.displayName ?? t.packageName ?? '',
            baseAmount:      t.baseAmount ?? t.amount,
            transactionCost: (t.convenienceFee ?? 0) + (t.systemFeeAmount ?? 0) + (t.ceilRoundingAmount ?? 0),
            gatewayFee:      t.convenienceFee ?? 0,
            systemFee:       t.systemFeeAmount ?? 0,
            rounding:        t.ceilRoundingAmount ?? 0,
            total:           t.totalAmount ?? t.amount,
            currency:        t.currency,
            status:          t.status,
            gateway:         t.gateway ?? '',
            cycle:           t.billingCycle ?? '',
            country:         t.ministryAdmin?.accountCountry ?? '',
            date:            new Date(t.createdAt).toLocaleDateString(),
          }))}
          headers={[
            { label: 'Admin Name',       key: 'adminName' },
            { label: 'Email',            key: 'email' },
            { label: 'Package',          key: 'package' },
            { label: 'Package Price',    key: 'baseAmount' },
            { label: 'Transaction Cost', key: 'transactionCost' },
            { label: 'Gateway Fee',      key: 'gatewayFee' },
            { label: 'ICIMS Fee',        key: 'systemFee' },
            { label: 'Rounding',         key: 'rounding' },
            { label: 'Total',            key: 'total' },
            { label: 'Currency',         key: 'currency' },
            { label: 'Status',           key: 'status' },
            { label: 'Gateway',          key: 'gateway' },
            { label: 'Cycle',            key: 'cycle' },
            { label: 'Country',          key: 'country' },
            { label: 'Date',             key: 'date' },
          ]}
          pdfColumns={['Admin Name','Email','Package','Package Price','Transaction Cost','Gateway Fee','ICIMS Fee','Rounding','Total','Currency','Status','Gateway','Cycle','Country','Date']}
        />
      </div>

      {summary && summary.byCurrency.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <CountPill label="Completed" value={summary.byStatus?.completed ?? 0} />
            <CountPill label="Pending" value={summary.byStatus?.pending ?? 0} />
            <CountPill label="Failed" value={summary.byStatus?.failed ?? 0} />
            <CountPill label="Renewals" value={summary.byType?.renewal ?? 0} />
          </div>
          {summary.byCurrency.map(c => (
            <div key={c.currency} className="rounded-xl border bg-muted/20 p-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{c.currency} Package Payments</p>
                  <p className="text-xs text-muted-foreground">{c.count.toLocaleString()} matching payment(s)</p>
                </div>
                <Badge variant="outline" className="text-xs">{c.currency}</Badge>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <SummaryCard
                  label="Total Collected"
                  value={`${c.currency} ${fmt(c.totalCollected)}`}
                  sub="Amount paid by ministry admins"
                  icon={TrendingUp}
                  color="bg-accent/10 text-accent"
                />
                <SummaryCard
                  label="Package Revenue"
                  value={`${c.currency} ${fmt(c.packageRevenue)}`}
                  sub="Package price before payment fees"
                  icon={DollarSign}
                  color="bg-green-100 text-green-700"
                />
                <SummaryCard
                  label="ICIMS Fee"
                  value={`${c.currency} ${fmt(c.icimsFee)}`}
                  sub={`Fee ${fmt(c.feeOnly)} + rounding ${fmt(c.rounding)}`}
                  icon={Zap}
                  color="bg-purple-100 text-purple-700"
                />
                <SummaryCard
                  label="Gateway Cost"
                  value={`${c.currency} ${fmt(c.gatewayCost)}`}
                  sub="Processor/mobile money cost"
                  icon={CreditCard}
                  color="bg-blue-100 text-blue-700"
                />
                <SummaryCard
                  label="Total ICIMS Revenue"
                  value={`${c.currency} ${fmt(c.totalRevenue)}`}
                  sub="Package revenue + ICIMS fee"
                  icon={DollarSign}
                  color="bg-yellow-100 text-yellow-700"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-8 h-8 text-xs" placeholder="Search admin name or email..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={pkg} onValueChange={v => { setPkg(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Package" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All packages</SelectItem>
            {packages.map(p => <SelectItem key={p.id} value={p.name} className="text-xs">{p.displayName || p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={v => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={country} onValueChange={v => { setCountry(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All countries</SelectItem>
            {COUNTRIES.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={ministry} onValueChange={v => { setMinistry(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-44"><SelectValue placeholder="All ministries" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All ministries</SelectItem>
            {ministries.map(m => (
              <SelectItem key={m.id} value={m.id} className="text-xs">
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={gateway} onValueChange={v => { setGateway(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-32"><SelectValue placeholder="Gateway" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All gateways</SelectItem>
            {GATEWAYS.map(g => <SelectItem key={g} value={g} className="text-xs capitalize">{g}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={cycle} onValueChange={v => { setCycle(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="Cycle" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All cycles</SelectItem>
            {CYCLES.map(c => <SelectItem key={c} value={c} className="text-xs capitalize">{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input className="h-8 text-xs w-36" type="date" value={dateFrom}
          onChange={e => { setDateFrom(e.target.value); setPage(1); }}
          title="From date" />
        <Input className="h-8 text-xs w-36" type="date" value={dateTo}
          onChange={e => { setDateTo(e.target.value); setPage(1); }}
          title="To date" />
        <div className="flex flex-wrap gap-1">
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => applyDatePreset('today')}>
            Today
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => applyDatePreset('thisWeek')}>
            This Week
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => applyDatePreset('thisMonth')}>
            This Month
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => applyDatePreset('lastMonth')}>
            Last Month
          </Button>
          {(dateFrom || dateTo) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setPage(1);
              }}
            >
              Clear Dates
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Ministry Admin</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Package</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Package Price</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Transaction Cost</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden xl:table-cell">↳ Gateway Fee</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden xl:table-cell">↳ ICIMS Fee</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden xl:table-cell">↳ Rounding</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Gateway</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Cycle</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Country</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded w-20" /></td>
                      ))}
                    </tr>
                  ))
                : transactions.map((t: AdminPayment) => (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        {t.ministryAdmin ? (
                          <div>
                            <p className="text-xs font-medium">{t.ministryAdmin.firstName} {t.ministryAdmin.lastName}</p>
                            <p className="text-xs text-muted-foreground">{t.ministryAdmin.email}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs capitalize">{t.package?.displayName ?? t.packageName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium">{t.currency} {(t.baseAmount ?? t.amount)?.toLocaleString()}</p>
                        {t.totalAmount && t.totalAmount !== (t.baseAmount ?? t.amount) && (
                          <p className="text-xs text-muted-foreground">Total: {t.currency} {t.totalAmount?.toLocaleString()}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs font-medium">
                          {(t.convenienceFee != null || t.systemFeeAmount != null)
                            ? `${t.currency} ${((t.convenienceFee ?? 0) + (t.systemFeeAmount ?? 0) + (t.ceilRoundingAmount ?? 0)).toLocaleString()}`
                            : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {t.convenienceFee != null ? `${t.currency} ${t.convenienceFee.toLocaleString()}` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-xs text-purple-600">
                          {t.systemFeeAmount != null ? `${t.currency} ${t.systemFeeAmount.toLocaleString()}` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-xs text-orange-500">
                          {(t.ceilRoundingAmount ?? 0) > 0 ? `${t.currency} ${(t.ceilRoundingAmount ?? 0).toLocaleString()}` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{statusBadge(t.status)}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs capitalize text-muted-foreground">{t.gateway ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs capitalize text-muted-foreground">{t.billingCycle ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">{t.ministryAdmin?.accountCountry ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedPayment(t)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {!isLoading && transactions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">No transactions found</p>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {selectedPayment && (
        <PaymentDetailDialog
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onOpenAdmin={(id) => navigate(`/admin/users/${id}`)}
        />
      )}
    </div>
  );
}
