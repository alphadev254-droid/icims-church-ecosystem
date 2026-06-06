import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Eye, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { adminApi } from '@/services/adminApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDebounce } from '@/hooks/use-debounce';

type Ministry = { id: string; label: string; country: string | null };
type Church   = { id: string; name: string; ministryAdminId?: string };

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingTx {
  id: string;
  reference: string | null;
  amount: number;
  currency: string;
  status: string;
  type: string;
  userId: string | null;
  churchId: string | null;
  eventId: string | null;
  expiresAt: string;
  createdAt: string;
  metadata: string | null;
  metadataParsed: Record<string, any> | null;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
  churchName: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  if (status === 'pending')   return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
  if (status === 'completed') return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs gap-1"><CheckCircle2 className="h-3 w-3" />Completed</Badge>;
  if (status === 'failed')    return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs gap-1"><XCircle className="h-3 w-3" />Failed</Badge>;
  return <Badge variant="outline" className="text-xs capitalize">{status}</Badge>;
}

function typeBadge(type: string) {
  const map: Record<string, string> = {
    donation: 'text-emerald-600 border-emerald-300',
    event_ticket: 'text-purple-600 border-purple-300',
    package_subscription: 'text-blue-600 border-blue-300',
  };
  return (
    <Badge variant="outline" className={`text-xs ${map[type] ?? 'text-muted-foreground'}`}>
      {type.replace(/_/g, ' ')}
    </Badge>
  );
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt) < new Date();
}

// ─── JSON renderer — collapsible, pretty ─────────────────────────────────────

function JsonValue({ value, depth = 0 }: { value: any; depth?: number }) {
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

// ─── Detail dialog ────────────────────────────────────────────────────────────

function DetailDialog({ tx, onClose }: { tx: PendingTx; onClose: () => void }) {
  const expired = isExpired(tx.expiresAt);

  const fields: [string, any][] = [
    ['ID', tx.id],
    ['Reference (tx_ref)', tx.reference ?? '— not yet assigned'],
    ['Type', tx.type],
    ['Status', tx.status],
    ['Amount', `${tx.currency} ${tx.amount.toLocaleString()}`],
    ['Gateway', tx.metadataParsed?.gateway ?? '—'],
    ['User', tx.user ? `${tx.user.firstName} ${tx.user.lastName} (${tx.user.email})` : tx.metadataParsed?.isGuest ? `Guest: ${tx.metadataParsed?.guestName ?? '—'} (${tx.metadataParsed?.guestEmail ?? '—'})` : '—'],
    ['Church', tx.churchName ?? '—'],
    ['Church ID', tx.churchId ?? '—'],
    ['Event ID', tx.eventId ?? '—'],
    ['Campaign', tx.metadataParsed?.campaignName ?? '—'],
    ['Expires At', `${new Date(tx.expiresAt).toLocaleString()}${expired ? ' · EXPIRED' : ''}`],
    ['Created At', new Date(tx.createdAt).toLocaleString()],
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            Pending Transaction
            {statusBadge(tx.status)}
            {expired && tx.status === 'pending' && (
              <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs gap-1">
                <AlertTriangle className="h-3 w-3" />Expired
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Core fields */}
        <div className="rounded-lg border divide-y text-xs">
          {fields.map(([label, val]) => (
            <div key={label} className="flex gap-3 px-3 py-2">
              <span className="text-muted-foreground w-28 shrink-0">{label}</span>
              <span className="font-mono break-all">{val}</span>
            </div>
          ))}
        </div>

        {/* Metadata — interactive JSON tree */}
        <div className="space-y-2">
          <p className="text-xs font-medium">Metadata</p>
          <p className="text-xs text-muted-foreground">
            Note: <span className="font-mono">Reference (tx_ref)</span> above is the PayChangu transaction reference.
            PayChangu's internal <span className="font-mono">ref_id</span> only appears after payment completes — find it in the
            processed <span className="font-mono">Transaction.gatewayResponse</span> record.
          </p>
          {tx.metadataParsed ? (
            <div className="rounded-lg border bg-muted/30 p-3 text-xs font-mono overflow-x-auto">
              <JsonValue value={tx.metadataParsed} depth={0} />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No metadata</p>
          )}
        </div>

        {/* Raw metadata string */}
        {tx.metadata && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground select-none">
              Raw metadata string
            </summary>
            <pre className="mt-2 rounded-lg border bg-muted/30 p-3 overflow-x-auto text-xs whitespace-pre-wrap break-all">
              {tx.metadata}
            </pre>
          </details>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const STATUSES = ['pending', 'completed', 'failed'];
const TYPES    = ['donation', 'event_ticket', 'package_subscription'];

export default function AdminPendingTransactions() {
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('');
  const [type, setType]         = useState('');
  const [ministry, setMinistry] = useState('');
  const [churchId, setChurchId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [page, setPage]         = useState(1);
  const [selected, setSelected] = useState<PendingTx | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  // Ministry dropdown
  const { data: ministriesData } = useQuery({
    queryKey: ['admin-ministries'],
    queryFn: () => adminApi.getMinistries().then(r => r.data.data),
    staleTime: 60_000,
  });
  const ministries: Ministry[] = ministriesData ?? [];

  // Church dropdown — filtered by selected ministry
  const { data: churchesData } = useQuery({
    queryKey: ['admin-all-churches', ministry],
    queryFn: () => adminApi.getAllChurches(ministry || undefined).then(r => r.data.data),
    staleTime: 60_000,
  });
  const churches: Church[] = churchesData ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pending-transactions', debouncedSearch, status, type, ministry, churchId, dateFrom, dateTo, page],
    queryFn: async () => {
      const params: any = { page, limit: 50 };
      if (debouncedSearch) params.search   = debouncedSearch;
      if (status)          params.status   = status;
      if (type)            params.type     = type;
      if (ministry)        params.ministry = ministry;
      if (churchId)        params.churchId = churchId;
      if (dateFrom)        params.dateFrom = dateFrom;
      if (dateTo)          params.dateTo   = dateTo;
      const { data } = await apiClient.get('/admin/pending-transactions', { params });
      return data;
    },
    staleTime: 15_000,
  });

  const rows: PendingTx[]  = data?.data ?? [];
  const pagination         = data?.pagination;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Payment Metadata</h1>
        <p className="text-sm text-muted-foreground">
          {pagination
            ? `${pagination.total.toLocaleString()} pending transactions — full metadata view`
            : 'Inspect PendingTransaction records with full metadata'}
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
        <span><span className="font-medium text-yellow-600">pending</span> — user initiated, not yet paid</span>
        <span><span className="font-medium text-green-600">completed</span> — webhook/callback deleted it (rare to see)</span>
        <span><span className="font-medium text-red-600">failed</span> — payment succeeded at gateway but our system crashed</span>
        <span className="text-orange-500 font-medium">orange expired badge</span> = status pending + past expiresAt = abandoned checkout
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-8 h-8 text-xs" placeholder="Search ID or reference..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={status} onValueChange={v => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={v => { setType(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All types</SelectItem>
            {TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t.replace(/_/g, ' ')}</SelectItem>)}
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
        {/* Church filter — narrows to selected ministry */}
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
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">ID / Ref</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Church</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Expires</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Created</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-muted animate-pulse rounded w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map(tx => {
                    const expired = isExpired(tx.expiresAt) && tx.status === 'pending';
                    return (
                      <tr key={tx.id}
                        className={`hover:bg-muted/30 transition-colors cursor-pointer ${expired ? 'opacity-60' : ''}`}
                        onClick={() => setSelected(tx)}>
                        <td className="px-4 py-3">
                          <p className="text-xs font-mono text-muted-foreground truncate max-w-[120px]" title={tx.id}>{tx.id}</p>
                          {tx.reference && (
                            <p className="text-xs font-mono truncate max-w-[120px]" title={tx.reference}>{tx.reference}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">{typeBadge(tx.type)}</td>
                        <td className="px-4 py-3">
                          {tx.user ? (
                            <>
                              <p className="text-xs font-medium">{tx.user.firstName} {tx.user.lastName}</p>
                              <p className="text-xs text-muted-foreground">{tx.user.email}</p>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">Guest / anon</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">{tx.churchName ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium">{tx.currency} {tx.amount.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {statusBadge(tx.status)}
                            {expired && (
                              <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs gap-1 w-fit">
                                <AlertTriangle className="h-3 w-3" />Expired
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={`text-xs ${expired ? 'text-orange-500' : 'text-muted-foreground'}`}>
                            {new Date(tx.expiresAt).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={e => { e.stopPropagation(); setSelected(tx); }}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
        {!isLoading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">No records found</p>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Page {pagination.page} of {pagination.totalPages} · {pagination.total.toLocaleString()} total</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Detail dialog */}
      {selected && <DetailDialog tx={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
