import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsService, type Transaction } from '@/services/transactions';
import { churchesService } from '@/services/churches';
import { useRole } from '@/hooks/useRole';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Receipt, Eye, Search, Lock, Calendar } from 'lucide-react';
import { ExportImportButtons } from '@/components/ExportImportButtons';
import { toast } from 'sonner';
import { STALE_TIME } from '@/lib/query-config';
import { Link } from 'react-router-dom';

export default function TransactionsPage() {
  const [viewTransaction, setViewTransaction] = useState<Transaction | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [churchFilter, setChurchFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { hasPermission, role } = useRole();
  const hasTransactions = useHasFeature('transactions_view');
  const qc = useQueryClient();
  const isMember = role === 'member';

  // Block members from accessing this page (after all hooks)
  if (isMember) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Access Denied</h1>
          <p className="text-sm text-muted-foreground">You don't have permission to view transactions.</p>
        </div>
      </div>
    );
  }

  const { data: churches = [] } = useQuery({
    queryKey: ['churches'],
    queryFn: churchesService.getAll,
    staleTime: STALE_TIME.LONG,
    enabled: !isMember,
  });

  const { data, isLoading } = useQuery({ 
    queryKey: ['transactions', page, limit, search, typeFilter, statusFilter, paymentFilter, churchFilter, startDate, endDate], 
    queryFn: () => transactionsService.getAll({ 
      page, 
      limit, 
      search: search || undefined, 
      type: typeFilter !== 'all' ? typeFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      paymentMethod: paymentFilter !== 'all' ? paymentFilter : undefined,
      churchId: churchFilter !== 'all' ? churchFilter : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    staleTime: STALE_TIME.DEFAULT,
    enabled: hasTransactions,
  });

  const transactions = data?.data || [];
  const pagination = data?.pagination;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Transaction['status'] }) => 
      transactionsService.updateStatus(id, status),
    onSuccess: () => { 
      toast.success('Transaction status updated'); 
      qc.invalidateQueries({ queryKey: ['transactions'] }); 
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update status'),
  });

  const canUpdate = hasPermission('transactions:update');

  if (!hasTransactions) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">View all payment transactions</p>
        </div>
        <Alert className="border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Transactions View is not available in your current package.{' '}
            <Link to="/dashboard/packages" className="font-medium underline">Upgrade now</Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' | 'outline' =>
    s === 'completed' ? 'default' : s === 'pending' ? 'outline' : s === 'failed' ? 'destructive' : 'secondary';

  const formatCurrency = (amount: number, currency: string) => 
    `${currency} ${amount.toLocaleString()}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">Transactions</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{pagination?.total || 0} total transactions</p>
        </div>
        <ExportImportButtons
          data={transactions.map(t => ({
            amount: t.baseAmount || t.amount,
            currency: t.currency,
            status: t.status,
            type: t.type,
            paymentMethod: t.paymentMethod,
            gateway: t.gateway || '',
            name: t.user ? `${t.user.firstName} ${t.user.lastName}` : (t.isGuest ? t.guestName : ''),
            email: t.user ? t.user.email : (t.isGuest ? t.guestEmail : ''),
            church: t.church?.name || '',
            subaccount: t.subaccountName || 'Finance Account',
            date: new Date(t.createdAt).toLocaleDateString(),
          }))}
          filename="transactions"
          headers={[
            { label: 'Amount', key: 'amount' },
            { label: 'Currency', key: 'currency' },
            { label: 'Status', key: 'status' },
            { label: 'Type', key: 'type' },
            { label: 'Payment Method', key: 'paymentMethod' },
            { label: 'Gateway', key: 'gateway' },
            { label: 'Name', key: 'name' },
            { label: 'Email', key: 'email' },
            { label: 'Church', key: 'church' },
            { label: 'Church Account', key: 'subaccount' },
            { label: 'Date', key: 'date' },
          ]}
          pdfTitle="Transactions Report"
        />
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 h-8 text-xs sm:h-9 sm:text-sm"
            />
          </div>
          <Select value={churchFilter} onValueChange={(v) => { setChurchFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36 h-8 text-xs sm:h-9 sm:text-sm"><SelectValue placeholder="All Churches" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Churches</SelectItem>
              {churches.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-32 h-8 text-xs sm:h-9 sm:text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="event_ticket">Event Ticket</SelectItem>
              <SelectItem value="donation">Donation</SelectItem>
              <SelectItem value="subscription">Subscription</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-28 h-8 text-xs sm:h-9 sm:text-sm"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setPage(1); }}>
            <SelectTrigger className="w-32 h-8 text-xs sm:h-9 sm:text-sm"><SelectValue placeholder="All Payment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payment</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="mobile_money">Mobile Money</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(limit)} onValueChange={(v) => { setLimit(Math.max(100, parseInt(v))); setPage(1); }}>
            <SelectTrigger className="w-20 h-8 text-xs sm:h-9 sm:text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
              <SelectItem value="500">500</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="pl-8 h-8 text-xs sm:h-9 sm:text-sm w-36"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="pl-8 h-8 text-xs sm:h-9 sm:text-sm w-36"
            />
          </div>
          {(startDate || endDate || churchFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all' || paymentFilter !== 'all') && (
            <Button variant="outline" size="sm" className="h-8 text-xs sm:h-9 sm:text-sm" onClick={() => { setStartDate(''); setEndDate(''); setChurchFilter('all'); setTypeFilter('all'); setStatusFilter('all'); setPaymentFilter('all'); setPage(1); }}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full min-w-[900px] text-xs sm:text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Amount</th>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Status</th>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Type</th>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Name</th>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Email</th>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Church</th>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Payment</th>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Gateway</th>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Church Account</th>
                  <th className="text-left px-3 py-2 font-medium whitespace-nowrap">Date</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => (
                  <tr key={transaction.id} className="border-t hover:bg-muted/50">
                    <td className="px-3 py-2 font-medium whitespace-nowrap">
                      {formatCurrency(transaction.baseAmount ?? transaction.amount, transaction.currency)}
                      {transaction.isManual && <Badge variant="outline" className="ml-1 text-xs px-1 py-0">Manual</Badge>}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={statusVariant(transaction.status)} className="text-xs px-1.5 py-0">{transaction.status}</Badge>
                    </td>
                    <td className="px-3 py-2 capitalize whitespace-nowrap">{transaction.type.replace('_', ' ')}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {transaction.user ? `${transaction.user.firstName} ${transaction.user.lastName}` : transaction.isGuest ? transaction.guestName : '-'}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                      {transaction.user?.email || (transaction.isGuest ? transaction.guestEmail : '-')}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{transaction.church?.name || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="capitalize">{transaction.paymentMethod.replace('_', ' ')}</div>
                      {transaction.cardBank && transaction.cardLast4 && (
                        <div className="text-muted-foreground">{transaction.cardBank} ****{transaction.cardLast4}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 capitalize whitespace-nowrap">{transaction.gateway || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{transaction.subaccountName || 'Finance Account'}</td>
                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {canUpdate && transaction.status === 'pending' && (
                          <Select
                            defaultValue={transaction.status}
                            onValueChange={(v) => updateStatusMutation.mutate({ id: transaction.id, status: v as any })}
                          >
                            <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                              <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <button onClick={() => setViewTransaction(transaction)} className="p-1 text-muted-foreground hover:text-foreground">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={14} className="text-center py-12 text-muted-foreground">
                      <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No transactions found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs sm:h-9 sm:text-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" className="h-8 text-xs sm:h-9 sm:text-sm" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={!!viewTransaction} onOpenChange={open => !open && setViewTransaction(null)}>
        <DialogContent className="w-full max-w-sm sm:max-w-md">
          <DialogHeader><DialogTitle className="font-heading text-base sm:text-lg">Transaction Details</DialogTitle></DialogHeader>
          {viewTransaction && (
            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
              <div><p className="text-muted-foreground">Amount</p><p className="font-medium">{formatCurrency(viewTransaction.baseAmount ?? viewTransaction.amount, viewTransaction.currency)}</p></div>
              <div><p className="text-muted-foreground">Status</p><Badge variant={statusVariant(viewTransaction.status)} className="text-xs px-1.5 py-0">{viewTransaction.status}</Badge></div>
              <div><p className="text-muted-foreground">Type</p><p className="capitalize">{viewTransaction.type.replace('_', ' ')}</p></div>
              <div><p className="text-muted-foreground">Payment Method</p><p className="capitalize">{viewTransaction.paymentMethod.replace('_', ' ')}</p></div>
              {viewTransaction.reference && (
                <div className="col-span-2"><p className="text-muted-foreground">Reference</p><p className="font-mono break-all">{viewTransaction.reference}</p></div>
              )}
              {(viewTransaction.user || viewTransaction.isGuest) && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Name</p>
                  <p>{viewTransaction.user ? `${viewTransaction.user.firstName} ${viewTransaction.user.lastName}` : viewTransaction.guestName}</p>
                  <p className="text-muted-foreground">{viewTransaction.user?.email || viewTransaction.guestEmail}</p>
                </div>
              )}
              {viewTransaction.church && (
                <div className="col-span-2"><p className="text-muted-foreground">Church</p><p>{viewTransaction.church.name}</p></div>
              )}
              {viewTransaction.notes && (
                <div className="col-span-2"><p className="text-muted-foreground">Notes</p><p>{viewTransaction.notes}</p></div>
              )}
              <div className="col-span-2"><p className="text-muted-foreground">Created</p><p>{new Date(viewTransaction.createdAt).toLocaleString()}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
