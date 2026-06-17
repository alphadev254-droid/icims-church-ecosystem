import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { givingService, type Pledge, type PledgeStatus } from '@/services/giving';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Handshake, Wallet, Eye, TrendingUp, Clock,
  CheckCircle2, AlertCircle, ArrowUpDown,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { STALE_TIME } from '@/lib/query-config';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: 'newest',       label: 'Newest first' },
  { value: 'oldest',       label: 'Oldest first' },
  { value: 'amount_desc',  label: 'Largest pledge' },
  { value: 'amount_asc',   label: 'Smallest pledge' },
  { value: 'paid_desc',    label: 'Most paid (amount)' },
  { value: 'paid_asc',     label: 'Least paid (amount)' },
  { value: 'balance_desc', label: 'Largest balance owed' },
  { value: 'deadline_asc', label: 'Deadline soonest' },
  { value: 'deadline_desc','label': 'Deadline latest' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PledgeStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  pending:   { label: 'Pending',   variant: 'secondary',   icon: <Clock className="h-3 w-3" /> },
  partial:   { label: 'Partial',   variant: 'default',     icon: <TrendingUp className="h-3 w-3" /> },
  fulfilled: { label: 'Fulfilled', variant: 'outline',     icon: <CheckCircle2 className="h-3 w-3" /> },
  overdue:   { label: 'Overdue',   variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
};

function StatusBadge({ status }: { status: PledgeStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <Badge variant={cfg.variant} className="flex items-center gap-1 text-xs">
      {cfg.icon} {cfg.label}
    </Badge>
  );
}

function fmt(n: number, currency: string) {
  return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(pledge: Pledge) {
  return pledge.pledgedAmount > 0
    ? Math.min(100, (pledge.amountPaid / pledge.pledgedAmount) * 100)
    : 0;
}

// ─── Pagination bar ───────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline" size="sm"
          className="h-7 w-7 p-0"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        {/* Page number pills — show up to 5 */}
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const start = Math.max(1, Math.min(page - 2, totalPages - 4));
          const p = start + i;
          return (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="sm"
              className="h-7 w-7 p-0 text-xs"
              onClick={() => onPage(p)}
            >
              {p}
            </Button>
          );
        })}
        <Button
          variant="outline" size="sm"
          className="h-7 w-7 p-0"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Member pledge card ───────────────────────────────────────────────────────

function MemberPledgeCard({ pledge, onView, onPayNow }: {
  pledge: Pledge; onView: () => void; onPayNow: () => void;
}) {
  const balance = pledge.pledgedAmount - pledge.amountPaid;
  const p = pct(pledge);
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{pledge.campaign?.name}</p>
            <p className="text-xs text-muted-foreground">{pledge.church?.name}</p>
          </div>
          <StatusBadge status={pledge.status as PledgeStatus} />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{fmt(pledge.amountPaid, pledge.currency)} paid</span>
            <span className="font-medium">{p.toFixed(0)}%</span>
          </div>
          <Progress value={p} className="h-1.5" />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Pledged: <span className="text-foreground font-medium">{fmt(pledge.pledgedAmount, pledge.currency)}</span></span>
            <span className="text-muted-foreground">Balance: <span className="text-destructive font-medium">{fmt(balance, pledge.currency)}</span></span>
          </div>
        </div>
        {pledge.fulfillmentDeadline && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Due: {new Date(pledge.fulfillmentDeadline).toLocaleDateString()}
          </p>
        )}
        <div className="flex gap-1.5 pt-1">
          <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={onView}>
            <Eye className="h-3 w-3 mr-1" /> View
          </Button>
          {pledge.status !== 'fulfilled' && pledge.campaign?.status === 'active' && (
            <Button size="sm" className="flex-1 h-7 text-xs bg-accent text-accent-foreground hover:bg-accent/90" onClick={onPayNow}>
              <Wallet className="h-3 w-3 mr-1" /> Pay Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Admin pledge row ─────────────────────────────────────────────────────────

function AdminPledgeRow({ pledge, onView }: { pledge: Pledge; onView: () => void }) {
  const balance = pledge.pledgedAmount - pledge.amountPaid;
  const p = pct(pledge);
  const pledgerName = pledge.user
    ? `${pledge.user.firstName} ${pledge.user.lastName}`
    : (pledge.pledgerName ?? 'Walk-in');
  return (
    <tr className="border-b hover:bg-muted/30 transition-colors">
      <td className="px-3 py-2.5">
        <p className="font-medium text-xs sm:text-sm">{pledgerName}</p>
        <p className="text-xs text-muted-foreground">{pledge.user?.email ?? pledge.pledgerEmail ?? '—'}</p>
      </td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">{pledge.campaign?.name}</td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{pledge.church?.name}</td>
      <td className="px-3 py-2.5 font-medium text-xs sm:text-sm">{fmt(pledge.pledgedAmount, pledge.currency)}</td>
      <td className="px-3 py-2.5 text-accent font-medium text-xs sm:text-sm">{fmt(pledge.amountPaid, pledge.currency)}</td>
      <td className="px-3 py-2.5 text-destructive font-medium text-xs sm:text-sm hidden sm:table-cell">{fmt(balance, pledge.currency)}</td>
      <td className="px-3 py-2.5 hidden lg:table-cell">
        <div className="flex items-center gap-2 min-w-[90px]">
          <Progress value={p} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground w-9 shrink-0 text-right">{p.toFixed(0)}%</span>
        </div>
      </td>
      <td className="px-3 py-2.5"><StatusBadge status={pledge.status as PledgeStatus} /></td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell">
        {pledge.fulfillmentDeadline ? new Date(pledge.fulfillmentDeadline).toLocaleDateString() : '—'}
      </td>
      <td className="px-3 py-2.5">
        <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={onView}>
          <Eye className="h-3 w-3 mr-1" /> View
        </Button>
      </td>
    </tr>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PledgesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const isMember = user?.roleName === 'member';

  const campaignIdFilter = searchParams.get('campaignId') ?? undefined;

  // All filter/sort/page state — changes trigger a new backend request
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever filters change
  const handleStatusChange = (v: string) => { setStatusFilter(v); setPage(1); };
  const handleSortChange   = (v: string) => { setSortBy(v);       setPage(1); };

  // ── Member: my pledges ──
  const { data: myResponse, isLoading: loadingMy } = useQuery({
    queryKey: ['my-pledges', statusFilter, sortBy, page],
    queryFn: () => givingService.getMyPledges({
      status:  statusFilter !== 'all' ? statusFilter : undefined,
      sortBy,
      page,
      limit: PAGE_SIZE,
    }),
    enabled: isMember,
    staleTime: STALE_TIME.DEFAULT,
  });

  // ── Admin: ministry pledges ──
  const { data: ministryResponse, isLoading: loadingMinistry } = useQuery({
    queryKey: ['ministry-pledges', campaignIdFilter, statusFilter, sortBy, page],
    queryFn: () => givingService.getMinistryPledges({
      campaignId: campaignIdFilter,
      status:     statusFilter !== 'all' ? statusFilter : undefined,
      sortBy,
      page,
      limit: PAGE_SIZE,
    }),
    enabled: !isMember,
    staleTime: STALE_TIME.DEFAULT,
  });

  const myPledges: Pledge[]       = myResponse?.data ?? [];
  const myPagination              = myResponse?.pagination;
  const ministryPledges: Pledge[] = ministryResponse?.data ?? [];
  const ministryPagination        = ministryResponse?.pagination;
  const summary                   = ministryResponse?.summary;

  const isLoading      = isMember ? loadingMy : loadingMinistry;
  const pledges        = isMember ? myPledges : ministryPledges;
  const pagination     = isMember ? myPagination : ministryPagination;
  const defaultCurrency = pledges[0]?.currency ?? 'MWK';

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Handshake className="h-5 w-5 text-accent" />
            {isMember ? 'My Pledges' : 'Pledges'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isMember ? 'Track your giving commitments' : 'All pledges across your ministry'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {isMember && (
            <Button size="sm" className="h-8 text-xs sm:h-9 sm:text-sm gap-1.5" onClick={() => navigate('/dashboard/giving')}>
              <Handshake className="h-3.5 w-3.5" /> Make Pledge
            </Button>
          )}

          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-36 h-8 text-xs sm:h-9 sm:text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="fulfilled">Fulfilled</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-48 h-8 text-xs sm:h-9 sm:text-sm gap-1.5">
              <ArrowUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Admin summary cards ── */}
      {!isMember && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Pledged', value: fmt(summary.totalPledged, defaultCurrency), icon: <Handshake className="h-4 w-4 text-accent" /> },
            { label: 'Total Paid',    value: fmt(summary.totalPaid,    defaultCurrency), icon: <CheckCircle2 className="h-4 w-4 text-accent" /> },
            { label: 'Outstanding',   value: fmt(summary.outstanding,  defaultCurrency), icon: <AlertCircle className="h-4 w-4 text-destructive" /> },
            { label: 'Total Pledges', value: String(summary.count),                      icon: <TrendingUp className="h-4 w-4 text-accent" /> },
          ].map(card => (
            <Card key={card.label}>
              <CardContent className="p-3 flex items-center gap-3">
                {card.icon}
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="font-semibold text-sm">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Member summary cards ── */}
      {isMember && myPagination && myPagination.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Total Pledged', value: fmt(myPledges.reduce((s, p) => s + p.pledgedAmount, 0), defaultCurrency) },
            { label: 'Total Paid',    value: fmt(myPledges.reduce((s, p) => s + p.amountPaid, 0),    defaultCurrency) },
            { label: 'Outstanding',   value: fmt(myPledges.reduce((s, p) => s + (p.pledgedAmount - p.amountPaid), 0), defaultCurrency) },
          ].map(card => (
            <Card key={card.label}>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="font-semibold text-sm">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          Loading pledges...
        </div>
      ) : pledges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <Handshake className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No pledges found.</p>
          {isMember && (
            <>
              <p className="text-xs text-muted-foreground">Go to a campaign and click <strong>Pledge</strong> to make a commitment.</p>
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/giving')}>Browse Campaigns</Button>
            </>
          )}
        </div>
      ) : isMember ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myPledges.map(pledge => (
              <MemberPledgeCard
                key={pledge.id}
                pledge={pledge}
                onView={() => navigate(`/dashboard/pledges/${pledge.id}`)}
                onPayNow={() => navigate(`/dashboard/pledges/${pledge.id}`)}
              />
            ))}
          </div>
          {pagination && (
            <Pagination page={pagination.page} totalPages={pagination.totalPages} onPage={setPage} />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="px-3 py-2.5 text-left">Pledger</th>
                  <th className="px-3 py-2.5 text-left hidden sm:table-cell">Campaign</th>
                  <th className="px-3 py-2.5 text-left hidden md:table-cell">Church</th>
                  <th className="px-3 py-2.5 text-left">Pledged</th>
                  <th className="px-3 py-2.5 text-left">Paid</th>
                  <th className="px-3 py-2.5 text-left hidden sm:table-cell">Balance</th>
                  <th className="px-3 py-2.5 text-left hidden lg:table-cell">Progress</th>
                  <th className="px-3 py-2.5 text-left">Status</th>
                  <th className="px-3 py-2.5 text-left hidden md:table-cell">Deadline</th>
                  <th className="px-3 py-2.5 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {ministryPledges.map(pledge => (
                  <AdminPledgeRow
                    key={pledge.id}
                    pledge={pledge}
                    onView={() => navigate(`/dashboard/pledges/${pledge.id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {pagination && (
            <Pagination page={pagination.page} totalPages={pagination.totalPages} onPage={setPage} />
          )}
          {pagination && (
            <p className="text-xs text-muted-foreground text-right">
              Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} pledges
            </p>
          )}
        </div>
      )}
    </div>
  );
}
