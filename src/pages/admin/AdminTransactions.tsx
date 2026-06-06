import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, TrendingUp, DollarSign, Zap, CreditCard, Eye, X } from 'lucide-react';
import { adminApi, type AdminSystemTransaction } from '@/services/adminApi';
import apiClient from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDebounce } from '@/hooks/use-debounce';
import { ExportImportButtons } from '@/components/ExportImportButtons';

type Ministry = { id: string; label: string; country: string | null };
type Church   = { id: string; name: string; ministryAdminId?: string };

// ─── JSON viewer (reused from AdminPendingTransactions pattern) ───────────────
function JsonValue({ value, depth = 0 }: { value: any; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);
  if (value === null || value === undefined) return <span className="text-gray-400">null</span>;
  if (typeof value === 'boolean') return <span className="text-blue-500">{String(value)}</span>;
  if (typeof value === 'number')  return <span className="text-orange-500">{value}</span>;
  if (typeof value === 'string')  return <span className="text-green-600 break-all">"{value}"</span>;
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-gray-500">[]</span>;
    return (
      <span>
        <button onClick={() => setOpen(o => !o)} className="text-gray-500 hover:text-foreground font-mono text-xs">
          {open ? '▾' : '▸'} [{value.length}]
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
    const keys = Object.keys(value);
    if (keys.length === 0) return <span className="text-gray-500">{'{}'}</span>;
    return (
      <span>
        <button onClick={() => setOpen(o => !o)} className="text-gray-500 hover:text-foreground font-mono text-xs">
          {open ? '▾' : '▸'} {'{'}…{'}'}
        </button>
        {open && (
          <div className="pl-4 border-l border-border/50 mt-0.5 space-y-0.5">
            {keys.map(k => (
              <div key={k} className="text-xs font-mono flex gap-1 flex-wrap">
                <span className="text-accent shrink-0">"{k}":</span>
                <JsonValue value={(value as any)[k]} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </span>
    );
  }
  return <span>{String(value)}</span>;
}

// ─── Detail dialog ─────────────────────────────────────────────────────────────
function TransactionDetailDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-system-transaction', id],
    queryFn: () => apiClient.get(`/admin/system-transactions/${id}`).then(r => r.data.data),
    staleTime: 60_000,
  });

  const tx = data;

  // Extract PayChangu-specific fields from gatewayResponse
  const gwr = tx?.gatewayResponseParsed;
  const paychanguRefId = gwr?.reference ?? gwr?.data?.reference ?? gwr?.ref_id ?? gwr?.data?.ref_id ?? null;
  const paychanguTxId  = gwr?.id ?? gwr?.data?.id ?? null;

  const fields: [string, any][] = tx ? [
    ['ID',                tx.id],
    ['Reference (tx_ref)', tx.reference ?? '—'],
    ['PayChangu ref_id',  paychanguRefId ?? '— (see Gateway Response below)'],
    ['PayChangu tx id',   paychanguTxId  ?? '—'],
    ['Type',              tx.type],
    ['Status',            tx.status],
    ['Gateway',           tx.gateway ?? '—'],
    ['Country',           tx.gatewayCountry ?? '—'],
    ['Currency',          tx.currency],
    ['Base Amount',       tx.baseAmount != null ? `${tx.currency} ${tx.baseAmount.toLocaleString()}` : '—'],
    ['Convenience Fee',   tx.convenienceFee != null ? `${tx.currency} ${tx.convenienceFee.toLocaleString()}` : '—'],
    ['System Fee',        tx.systemFeeAmount != null ? `${tx.currency} ${tx.systemFeeAmount.toLocaleString()}` : '—'],
    ['Rounding',          tx.ceilRoundingAmount ? `${tx.currency} ${tx.ceilRoundingAmount.toLocaleString()}` : '—'],
    ['Total Amount',      tx.totalAmount != null ? `${tx.currency} ${tx.totalAmount.toLocaleString()}` : '—'],
    ['Payment Method',    tx.paymentMethod ?? '—'],
    ['Channel',           tx.channel ?? '—'],
    ['User',              tx.user ? `${tx.user.firstName} ${tx.user.lastName} (${tx.user.email})` : (tx.isGuest ? `Guest: ${tx.guestName ?? '—'} (${tx.guestEmail ?? '—'})` : '—')],
    ['Church',            tx.church?.name ?? '—'],
    ['Campaign',          tx.campaignName ?? '—'],
    ['Campaign Category', tx.campaignCategory ?? '—'],
    ['Cell',              tx.cellName ?? '—'],
    ['Event Tickets',     tx.tickets?.length > 0 ? tx.tickets.map((t: any) => t.ticketNumber).join(', ') : '—'],
    ['Subaccount',        tx.subaccountName ?? '—'],
    ['Gateway Charge',    tx.gatewayCharge != null ? `${tx.currency} ${tx.gatewayCharge.toLocaleString()}` : '—'],
    ['Paid At',           tx.paidAt ? new Date(tx.paidAt).toLocaleString() : '—'],
    ['Created At',        new Date(tx.createdAt).toLocaleString()],
    ['Manual Entry',      tx.isManual ? 'Yes' : 'No'],
    ['Notes',             tx.notes ?? '—'],
  ] : [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            Transaction Detail
            {tx && statusBadge(tx.status)}
            {tx && typeBadge(tx.type)}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : tx ? (
          <>
            {/* Core fields */}
            <div className="rounded-lg border divide-y text-xs">
              {fields.map(([label, val]) => (
                <div key={label} className="flex gap-3 px-3 py-2">
                  <span className="text-muted-foreground w-40 shrink-0">{label}</span>
                  <span className="font-mono break-all">{String(val)}</span>
                </div>
              ))}
            </div>

            {/* Gateway Response — interactive JSON tree */}
            <div className="space-y-2">
              <p className="text-xs font-medium">Gateway Response (raw PayChangu / Paystack data)</p>
              {tx.gatewayResponseParsed ? (
                <div className="rounded-lg border bg-muted/30 p-3 text-xs font-mono overflow-x-auto">
                  <JsonValue value={tx.gatewayResponseParsed} depth={0} />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No gateway response stored</p>
              )}
            </div>

            {/* Raw gateway response string */}
            {tx.gatewayResponse && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground select-none">
                  Raw gateway response string
                </summary>
                <pre className="mt-2 rounded-lg border bg-muted/30 p-3 overflow-x-auto text-xs whitespace-pre-wrap break-all">
                  {tx.gatewayResponse}
                </pre>
              </details>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Transaction not found</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

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
  if (type === 'donation')     return <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">Giving</Badge>;
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
  const [ministry, setMinistry] = useState('');
  const [churchId, setChurchId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [page, setPage]         = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  // Load ministries for dropdown
  const { data: ministriesData } = useQuery({
    queryKey: ['admin-ministries'],
    queryFn: () => adminApi.getMinistries().then(r => r.data.data),
    staleTime: 60_000,
  });
  const ministries: Ministry[] = ministriesData ?? [];

  // Load churches — filtered by selected ministry if set
  const { data: churchesData } = useQuery({
    queryKey: ['admin-all-churches', ministry],
    queryFn: () => adminApi.getAllChurches(ministry || undefined).then(r => r.data.data),
    staleTime: 60_000,
  });
  const churches: Church[] = churchesData ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['admin-system-transactions', debouncedSearch, type, status, gateway, country, ministry, churchId, dateFrom, dateTo, page],
    queryFn: () => adminApi.getSystemTransactions({
      search:   debouncedSearch || undefined,
      type:     type     || undefined,
      status:   status   || undefined,
      gateway:  gateway  || undefined,
      country:  country  || undefined,
      ministry: ministry || undefined,
      churchId: churchId || undefined,
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
            campaign:    t.campaignName ?? '',
            event:       t.eventTitle ?? '',
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
            { label: 'Giver',            key: 'donor' },
            { label: 'Email',            key: 'email' },
            { label: 'Type',             key: 'type' },
            { label: 'Church',           key: 'church' },
            { label: 'Campaign',         key: 'campaign' },
            { label: 'Event',            key: 'event' },
            { label: 'Base Amount',      key: 'baseAmount' },
            { label: 'Transaction Cost', key: 'transactionCost' },
            { label: 'Gateway Fee',      key: 'gatewayFee' },
            { label: 'System Fee',       key: 'systemFee' },
            { label: 'Rounding',         key: 'rounding' },
            { label: 'Total',            key: 'total' },
            { label: 'Currency',         key: 'currency' },
            { label: 'Gateway',          key: 'gateway' },
            { label: 'Country',          key: 'country' },
            { label: 'Method',           key: 'method' },
            { label: 'Status',           key: 'status' },
            { label: 'Reference',        key: 'reference' },
            { label: 'Date',             key: 'date' },
          ]}
          pdfColumns={['Giver','Email','Type','Church','Campaign','Event','Base Amount','Transaction Cost','Gateway Fee','System Fee','Rounding','Total','Currency','Gateway','Country','Method','Status','Reference','Date']}
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
        {/* Ministry filter */}
        <Select value={ministry} onValueChange={v => { setMinistry(v === 'all' ? '' : v); setChurchId(''); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-44"><SelectValue placeholder="All ministries" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All ministries</SelectItem>
            {ministries.map(m => (
              <SelectItem key={m.id} value={m.id} className="text-xs">{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Church filter — options narrow when ministry is selected */}
        <Select value={churchId} onValueChange={v => { setChurchId(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-44"><SelectValue placeholder="All churches" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All churches</SelectItem>
            {churches.map(c => (
              <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
            ))}
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
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Giver</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Church</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Campaign</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Event</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Transaction Cost</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden xl:table-cell">↳ Gateway Fee</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden xl:table-cell">↳ System Fee</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden xl:table-cell">↳ Rounding</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden xl:table-cell">Gateway</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Date</th>
                <th className="px-4 py-2.5 w-10" />
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
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedId(t.id)}>
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
                      <td className="px-4 py-3 hidden md:table-cell"><span className="text-xs text-muted-foreground">{t.campaignName || '—'}</span></td>
                      <td className="px-4 py-3 hidden md:table-cell"><span className="text-xs text-muted-foreground">{t.eventTitle || '—'}</span></td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium">{t.currency} {(t.baseAmount ?? t.amount).toLocaleString()}</p>
                        {t.totalAmount && t.totalAmount !== (t.baseAmount ?? t.amount) && (
                          <p className="text-xs text-muted-foreground">Total: {t.currency} {t.totalAmount.toLocaleString()}</p>
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
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-xs capitalize text-muted-foreground">{t.gateway ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">{statusBadge(t.status)}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={e => { e.stopPropagation(); setSelectedId(t.id); }}>
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

      {/* Detail dialog */}
      {selectedId && (
        <TransactionDetailDialog id={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
