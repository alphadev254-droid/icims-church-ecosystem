import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, TrendingUp, DollarSign, Zap, CreditCard } from 'lucide-react';
import { adminApi, type AdminSystemTransaction } from '@/services/adminApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { ExportImportButtons } from '@/components/ExportImportButtons';

const TYPES    = ['event_ticket', 'donation'];
const STATUSES = ['completed', 'pending', 'failed', 'refunded'];
const GATEWAYS = ['paychangu', 'paystack'];
const COUNTRIES = ['Malawi', 'Kenya'];

function statusBadge(status: string) {
  if (status === 'completed') return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Completed</Badge>;
  if (status === 'pending')   return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">Pending</Badge>;
  if (status === 'failed')    return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Failed</Badge>;
  if (status === 'refunded')  return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Refunded</Badge>;
  return <Badge variant="outline" className="text-xs capitalize">{status}</Badge>;
}

function typeBadge(type: string) {
  if (type === 'event_ticket') return <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">Event Ticket</Badge>;
  if (type === 'donation')     return <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">Donation</Badge>;
  return <Badge variant="outline" className="text-xs capitalize">{type.replace('_', ' ')}</Badge>;
}

function SummaryCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="border rounded-lg p-4 bg-card flex items-start gap-3">
      <div className={`p-2 rounded-md ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminTransactions() {
  const [search, setSearch]     = useState('');
  const [type, setType]         = useState('');
  const [status, setStatus]     = useState('');
  const [gateway, setGateway]   = useState('');
  const [country, setCountry]   = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [page, setPage]         = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-system-transactions', debouncedSearch, type, status, gateway, country, dateFrom, dateTo, page],
    queryFn: () => adminApi.getSystemTransactions({
      search:   debouncedSearch || undefined,
      type:     type    || undefined,
      status:   status  || undefined,
      gateway:  gateway || undefined,
      country:  country || undefined,
      dateFrom: dateFrom || undefined,
      dateTo:   dateTo   || undefined,
      page,
      limit: 70,
    }).then(r => r.data),
    staleTime: 30_000,
  });

  const transactions: AdminSystemTransaction[] = data?.data ?? [];
  const pagination = data?.pagination;
  const summary    = data?.summary;

  const donorName = (t: AdminSystemTransaction) =>
    t.isGuest ? (t.guestName ?? 'Guest') : t.user ? `${t.user.firstName} ${t.user.lastName}` : 'Anonymous';
  const donorEmail = (t: AdminSystemTransaction) =>
    t.isGuest ? (t.guestEmail ?? '') : (t.user?.email ?? '');

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            {pagination ? `${pagination.total.toLocaleString()} total transactions` : 'All platform transactions'}
          </p>
        </div>
        <ExportImportButtons
          filename="system-transactions"
          pdfTitle="System Transactions Export"
          data={transactions.map(t => ({
            donor:       donorName(t),
            email:       donorEmail(t),
            type:        t.type.replace('_', ' '),
            church:      t.church?.name ?? '',
            baseAmount:  t.baseAmount ?? t.amount,
            transactionCost: (t.convenienceFee ?? 0) + (t.systemFeeAmount ?? 0) + (t.ceilRoundingAmount ?? 0),
            gatewayFee:  t.convenienceFee ?? 0,
            systemFee:   t.systemFeeAmount ?? 0,
            rounding:    t.ceilRoundingAmount ?? 0,
            total:       t.totalAmount ?? t.amount,
            currency:    t.currency,
            gateway:     t.gateway ?? '',
            country:     t.gatewayCountry ?? '',
            method:      t.paymentMethod ?? '',
            status:      t.status,
            reference:   t.reference ?? '',
            date:        new Date(t.createdAt).toLocaleDateString(),
          }))}
          headers={[
            { label: 'Donor',        key: 'donor' },
            { label: 'Email',        key: 'email' },
            { label: 'Type',         key: 'type' },
            { label: 'Church',       key: 'church' },
            { label: 'Base Amount',      key: 'baseAmount' },
            { label: 'Transaction Cost', key: 'transactionCost' },
            { label: 'Gateway Fee',      key: 'gatewayFee' },
            { label: 'System Fee',       key: 'systemFee' },
            { label: 'Rounding',         key: 'rounding' },
            { label: 'Total',        key: 'total' },
            { label: 'Currency',     key: 'currency' },
            { label: 'Gateway',      key: 'gateway' },
            { label: 'Country',      key: 'country' },
            { label: 'Method',       key: 'method' },
            { label: 'Status',       key: 'status' },
            { label: 'Reference',    key: 'reference' },
            { label: 'Date',         key: 'date' },
          ]}
          pdfColumns={['Donor','Email','Type','Church','Base Amount','Gateway Fee','System Fee','Rounding','Total','Currency','Gateway','Status','Date']}
        />
      </div>

      {/* Summary cards — one set per currency */}
      {summary && summary.byCurrency.length > 0 && (
        <div className="space-y-2">
          {summary.byCurrency.map(c => (
            <div key={c.currency} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <SummaryCard
                label={`Total Charged (${c.currency})`}
                value={`${c.currency} ${fmt(c.totalCharged)}`}
                sub={`${c.count} transactions`}
                icon={TrendingUp}
                color="bg-accent/10 text-accent"
              />
              <SummaryCard
                label={`Base Amount (${c.currency})`}
                value={`${c.currency} ${fmt(c.totalBaseAmount)}`}
                icon={DollarSign}
                color="bg-green-100 text-green-700"
              />
              <SummaryCard
                label={`Platform Fee (${c.currency})`}
                value={`${c.currency} ${fmt(c.totalSystemFee)}`}
                icon={Zap}
                color="bg-purple-100 text-purple-700"
              />
              <SummaryCard
                label={`Gateway Fee (${c.currency})`}
                value={`${c.currency} ${fmt(c.totalGatewayFee)}`}
                icon={CreditCard}
                color="bg-blue-100 text-blue-700"
              />
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-8 h-8 text-xs" placeholder="Search name, email, reference..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={type} onValueChange={v => { setType(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All types</SelectItem>
            {TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={v => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={gateway} onValueChange={v => { setGateway(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-32"><SelectValue placeholder="Gateway" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All gateways</SelectItem>
            {GATEWAYS.map(g => <SelectItem key={g} value={g} className="text-xs capitalize">{g}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={country} onValueChange={v => { setCountry(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All countries</SelectItem>
            {COUNTRIES.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input className="h-8 text-xs w-36" type="date" value={dateFrom}
          onChange={e => { setDateFrom(e.target.value); setPage(1); }} title="From date" />
        <Input className="h-8 text-xs w-36" type="date" value={dateTo}
          onChange={e => { setDateTo(e.target.value); setPage(1); }} title="To date" />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Donor</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Church</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Transaction Cost</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden xl:table-cell">↳ Gateway Fee</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden xl:table-cell">↳ System Fee</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden xl:table-cell">↳ Rounding</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden xl:table-cell">Gateway</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-muted animate-pulse rounded w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                : transactions.map(t => (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium">{donorName(t)}</p>
                        <p className="text-xs text-muted-foreground">{donorEmail(t)}</p>
                        {t.isGuest && <span className="text-xs text-blue-500">Guest</span>}
                        {t.isManual && <span className="text-xs text-orange-500 ml-1">Manual</span>}
                      </td>
                      <td className="px-4 py-3">{typeBadge(t.type)}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">{t.church?.name ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium">{t.currency} {(t.baseAmount ?? t.amount).toLocaleString()}</p>
                        {t.totalAmount && t.totalAmount !== (t.baseAmount ?? t.amount) && (
                          <p className="text-xs text-muted-foreground">Total: {t.currency} {t.totalAmount.toLocaleString()}</p>
                        )}
                      </td>
                      {/* Transaction Cost = combined */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs font-medium">
                          {(t.convenienceFee != null || t.systemFeeAmount != null)
                            ? `${t.currency} ${((t.convenienceFee ?? 0) + (t.systemFeeAmount ?? 0) + (t.ceilRoundingAmount ?? 0)).toLocaleString()}`
                            : '—'}
                        </span>
                      </td>
                      {/* Breakdown */}
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
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-xs capitalize text-muted-foreground">{t.gateway ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">{statusBadge(t.status)}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </span>
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
    </div>
  );
}
