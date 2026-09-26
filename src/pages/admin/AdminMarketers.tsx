import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Handshake, Mail, MoreHorizontal, Search, ShieldCheck, Users, Wallet } from 'lucide-react';
import { adminApi, type AdminMarketer } from '@/services/adminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { agreementStatusBadge, marketerName, marketerStatusBadge, payoutStatusBadge, StatusDialog } from './marketers/components';

function SummaryCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: typeof Users }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
  );
}

export default function AdminMarketers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editTarget, setEditTarget] = useState<AdminMarketer | null>(null);
  const [editStatus, setEditStatus] = useState('pending');
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-marketers'],
    queryFn: () => adminApi.getMarketers().then(response => response.data.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status: string; reason?: string } }) => adminApi.updateMarketerStatus(id, payload),
    onSuccess: () => {
      toast.success('Marketer status updated');
      setEditTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-marketers'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update marketer'),
  });

  const marketers = data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return marketers.filter(marketer => {
      const matchesStatus = !status || marketer.status === status;
      const matchesSearch = !term || [
        marketerName(marketer),
        marketer.user?.email,
        marketer.user?.phone,
        marketer.phone,
        marketer.code,
        marketer.country,
        marketer.pricingMarket?.name,
      ].some(value => String(value || '').toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [marketers, search, status]);

  const summary = useMemo(() => ({
    total: marketers.length,
    pending: marketers.filter(item => item.status === 'pending').length,
    verified: marketers.filter(item => item.status === 'approved').length,
    referrals: marketers.reduce((sum, item) => sum + (item._count?.referrals ?? 0), 0),
  }), [marketers]);

  const openStatusDialog = (marketer: AdminMarketer, nextStatus = marketer.status || 'pending') => {
    setEditTarget(marketer);
    setEditStatus(nextStatus);
    setReason('');
  };

  const saveStatus = () => {
    if (!editTarget) return;
    statusMutation.mutate({ id: editTarget.id, payload: { status: editStatus, reason: reason.trim() || undefined } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Marketers</h1>
          <p className="text-sm text-muted-foreground">Manage marketer verification, markets, payout setup, and referred ministries.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Total Marketers" value={summary.total} icon={Users} />
        <SummaryCard title="Waiting Verification" value={summary.pending} icon={Mail} />
        <SummaryCard title="Verified" value={summary.verified} icon={ShieldCheck} />
        <SummaryCard title="Partnered Ministries" value={summary.referrals} icon={Handshake} />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-8 h-8 text-xs" placeholder="Search marketer, email, phone, code..." value={search} onChange={event => setSearch(event.target.value)} />
        </div>
        <Select value={status || 'all'} onValueChange={value => setStatus(value === 'all' ? '' : value)}>
          <SelectTrigger className="h-8 text-xs w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All statuses</SelectItem>
            <SelectItem value="pending" className="text-xs">Waiting Verification</SelectItem>
            <SelectItem value="approved" className="text-xs">Verified</SelectItem>
            <SelectItem value="suspended" className="text-xs">Suspended</SelectItem>
            <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marketer</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Country / Market</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Payout</TableHead>
                  <TableHead className="text-right">Ministries</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 9 }).map((__, cell) => <TableCell key={cell}><div className="h-4 w-24 rounded bg-muted animate-pulse" /></TableCell>)}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">No marketers found.</TableCell></TableRow>
                ) : filtered.map(marketer => (
                  <TableRow key={marketer.id}>
                    <TableCell>
                      <div className="font-medium text-xs">{marketerName(marketer)}</div>
                      <div className="text-xs text-muted-foreground">{marketer.user?.email}</div>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{marketer.code}</TableCell>
                    <TableCell>
                      <div className="text-xs">{marketer.country || '—'}</div>
                      <div className="text-xs text-muted-foreground">{marketer.pricingMarket?.name || 'No market'} {marketer.pricingMarket?.currencyCode ? `· ${marketer.pricingMarket.currencyCode}` : ''}</div>
                    </TableCell>
                    <TableCell>{marketerStatusBadge(marketer.status)}</TableCell>
                    <TableCell>{agreementStatusBadge(marketer.agreementStatus)}</TableCell>
                    <TableCell>{payoutStatusBadge(marketer.payoutSetupStatus)}</TableCell>
                    <TableCell className="text-right text-xs">{marketer._count?.referrals ?? 0}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(marketer.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-xs gap-2" onClick={() => navigate(`/admin/marketers/${marketer.id}`)}>
                            <Eye className="h-3.5 w-3.5" /> View details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs gap-2" onClick={() => openStatusDialog(marketer)}>
                            <Wallet className="h-3.5 w-3.5" /> Change status
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <StatusDialog
        open={!!editTarget}
        status={editStatus}
        reason={reason}
        isSaving={statusMutation.isPending}
        onOpenChange={open => !open && setEditTarget(null)}
        onStatusChange={setEditStatus}
        onReasonChange={setReason}
        onSave={saveStatus}
      />
    </div>
  );
}
