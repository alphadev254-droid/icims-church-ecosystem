import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Eye } from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { ExportImportButtons } from '@/components/ExportImportButtons';

const STATUSES = ['completed', 'pending', 'failed'];
const COUNTRIES = ['Malawi', 'Kenya'];
const PACKAGES = ['basic', 'standard', 'premium'];

function statusBadge(status: string) {
  if (status === 'completed') return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Completed</Badge>;
  if (status === 'pending') return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">Pending</Badge>;
  if (status === 'failed') return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Failed</Badge>;
  return <Badge variant="outline" className="text-xs capitalize">{status}</Badge>;
}

export default function AdminTransactions() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [pkg, setPkg] = useState('');
  const [status, setStatus] = useState('');
  const [country, setCountry] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-transactions', debouncedSearch, pkg, status, country, dateFrom, dateTo, page],
    queryFn: () => adminApi.getTransactions({
      search: debouncedSearch || undefined,
      package: pkg || undefined,
      status: status || undefined,
      country: country || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page,
      limit: 70,
    }).then(r => r.data),
  });

  const transactions = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Package Transactions</h1>
          <p className="text-sm text-muted-foreground">
            {pagination ? `${pagination.total.toLocaleString()} total transactions` : 'All package payment transactions'}
          </p>
        </div>
        <ExportImportButtons
          filename="transactions"
          pdfTitle="Package Transactions Export"
          data={transactions.map((t: any) => ({
            adminName: t.ministryAdmin ? `${t.ministryAdmin.firstName} ${t.ministryAdmin.lastName}` : '',
            email: t.ministryAdmin?.email ?? '', package: t.package?.displayName ?? t.packageName ?? '',
            amount: t.amount, currency: t.currency, status: t.status,
            gateway: t.gateway ?? '', cycle: t.billingCycle ?? '',
            country: t.ministryAdmin?.accountCountry ?? '', date: new Date(t.createdAt).toLocaleDateString(),
          }))}
          headers={[
            { label: 'Admin Name', key: 'adminName' }, { label: 'Email', key: 'email' },
            { label: 'Package', key: 'package' }, { label: 'Amount', key: 'amount' },
            { label: 'Currency', key: 'currency' }, { label: 'Status', key: 'status' },
            { label: 'Gateway', key: 'gateway' }, { label: 'Cycle', key: 'cycle' },
            { label: 'Country', key: 'country' }, { label: 'Date', key: 'date' },
          ]}
          pdfColumns={['Admin Name', 'Email', 'Package', 'Amount', 'Currency', 'Status', 'Gateway', 'Cycle', 'Country', 'Date']}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-8 h-8 text-xs" placeholder="Search admin name or email..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={pkg} onValueChange={v => { setPkg(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="Package" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All packages</SelectItem>
            {PACKAGES.map(p => <SelectItem key={p} value={p} className="text-xs capitalize">{p}</SelectItem>)}
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
        <Input className="h-8 text-xs w-36" type="date" value={dateFrom}
          onChange={e => { setDateFrom(e.target.value); setPage(1); }}
          title="From date" />
        <Input className="h-8 text-xs w-36" type="date" value={dateTo}
          onChange={e => { setDateTo(e.target.value); setPage(1); }}
          title="To date" />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Ministry Admin</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Package</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Amount</th>
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
                : transactions.map((t: any) => (
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
                        <span className="text-xs font-medium">{t.currency} {t.amount?.toLocaleString()}</span>
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
                        {t.ministryAdmin && (
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => navigate(`/admin/users/${t.ministryAdminId}`)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        )}
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
