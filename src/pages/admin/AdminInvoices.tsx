import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Search, Send, Ban, Wallet, Eye, Link as LinkIcon } from 'lucide-react';
import { adminApi, type AdminPackageInvoice } from '@/services/adminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { downloadPackageInvoicePdf } from '@/lib/invoice-pdf';
import { toast } from 'sonner';

function money(currency: string, value?: number | null) {
  return `${currency} ${(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function date(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

function statusBadge(status: string) {
  const cls = status === 'paid'
    ? 'bg-green-100 text-green-700'
    : status === 'overdue'
      ? 'bg-red-100 text-red-700'
      : status === 'partially_paid'
        ? 'bg-amber-100 text-amber-700'
        : status === 'cancelled'
          ? 'bg-muted text-muted-foreground'
          : 'bg-blue-100 text-blue-700';
  return <Badge className={cls}>{status.replace('_', ' ')}</Badge>;
}

function invoicePayUrl(token?: string | null) {
  return token ? `${window.location.origin}/invoice/pay/${token}` : '';
}

function copyInvoicePaymentLink(invoice: AdminPackageInvoice) {
  const url = invoicePayUrl(invoice.publicToken);
  if (!url) {
    toast.error('Payment link is not available for this invoice yet');
    return;
  }
  navigator.clipboard.writeText(url);
  toast.success('Invoice payment link copied');
}

function InvoiceDetailDialog({ invoice, onClose, onRecord }: { invoice: AdminPackageInvoice; onClose: () => void; onRecord: () => void }) {
  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{invoice.invoiceNumber}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div><p className="text-muted-foreground">Ministry</p><p className="font-medium">{invoice.ministryAdmin?.ministryName || `${invoice.ministryAdmin?.firstName ?? ''} ${invoice.ministryAdmin?.lastName ?? ''}`}</p></div>
          <div><p className="text-muted-foreground">Status</p>{statusBadge(invoice.status)}</div>
          <div><p className="text-muted-foreground">Package</p><p>{invoice.package?.displayName || invoice.packageName}</p></div>
          <div><p className="text-muted-foreground">Billing</p><p className="capitalize">{invoice.billingCycle}</p></div>
          <div><p className="text-muted-foreground">Invoice Date</p><p>{date(invoice.invoiceDate)}</p></div>
          <div><p className="text-muted-foreground">Due Date</p><p>{date(invoice.dueDate)}</p></div>
          <div><p className="text-muted-foreground">Service Period</p><p>{date(invoice.servicePeriodStart)} - {date(invoice.servicePeriodEnd)}</p></div>
          <div><p className="text-muted-foreground">Amount</p><p>{money(invoice.currency, invoice.amount)}</p></div>
          <div><p className="text-muted-foreground">Paid</p><p>{money(invoice.currency, invoice.amountPaid)}</p></div>
          <div><p className="text-muted-foreground">Balance</p><p className="font-semibold">{money(invoice.currency, invoice.balanceDue)}</p></div>
        </div>
        {(invoice.notes || invoice.terms) && (
          <div className="space-y-2 rounded-md border p-3 text-sm">
            {invoice.notes && <p><span className="font-medium">Notes:</span> {invoice.notes}</p>}
            {invoice.terms && <p><span className="font-medium">Terms:</span> {invoice.terms}</p>}
          </div>
        )}
        <div className="rounded-md border">
          <div className="border-b px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">Payments</div>
          <div className="divide-y">
            {(invoice.payments ?? []).length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">No payments recorded.</p>
            ) : invoice.payments!.map(payment => (
              <div key={payment.id} className="grid gap-1 px-3 py-2 text-xs sm:grid-cols-4">
                <span>{date(payment.paidAt || payment.createdAt)}</span>
                <span className="capitalize">{payment.paymentMethod || payment.gateway || 'payment'}</span>
                <span>{payment.reference || '—'}</span>
                <span className="font-semibold">{money(payment.currency, payment.baseAmount ?? payment.amount)}</span>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => downloadPackageInvoicePdf(invoice)} className="gap-2">
            <Download className="h-4 w-4" /> Download PDF
          </Button>
          <Button variant="outline" onClick={() => copyInvoicePaymentLink(invoice)} className="gap-2">
            <LinkIcon className="h-4 w-4" /> Copy Link
          </Button>
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <Button onClick={onRecord} className="gap-2"><Wallet className="h-4 w-4" /> Record Payment</Button>
          )}
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminInvoices() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [pkg, setPkg] = useState('all');
  const [selected, setSelected] = useState<AdminPackageInvoice | null>(null);
  const [paying, setPaying] = useState<AdminPackageInvoice | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMethod: 'cash', reference: '', notes: '', paidAt: new Date().toISOString().slice(0, 10) });

  const params = useMemo(() => ({ page, limit: 50, search: search || undefined, status, package: pkg }), [page, search, status, pkg]);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-invoices', params],
    queryFn: () => adminApi.getInvoices(params).then(r => r.data),
  });

  const packagesQuery = useQuery({
    queryKey: ['admin-packages'],
    queryFn: () => adminApi.getPackages().then(r => r.data.data),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-invoices'] });
    qc.invalidateQueries({ queryKey: ['admin-user'] });
  };

  const sendMutation = useMutation({
    mutationFn: (id: string) => adminApi.sendInvoice(id),
    onSuccess: () => { toast.success('Invoice marked as sent'); refresh(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to send invoice'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminApi.cancelInvoice(id),
    onSuccess: () => { toast.success('Invoice cancelled'); refresh(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to cancel invoice'),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: () => adminApi.recordInvoicePayment(paying!.id, {
      amount: Number(paymentForm.amount),
      paymentMethod: paymentForm.paymentMethod,
      reference: paymentForm.reference || undefined,
      notes: paymentForm.notes || undefined,
      paidAt: paymentForm.paidAt || undefined,
    }),
    onSuccess: response => {
      toast.success('Payment recorded');
      setPaying(null);
      setSelected(response.data.data);
      refresh();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to record payment'),
  });

  const invoices = data?.data ?? [];
  const summary = data?.summary;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Package Invoices</h1>
          <p className="text-sm text-muted-foreground">Manage package renewal invoices and offline payments.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Invoiced</p><p className="text-xl font-bold">{money('MWK', summary?.totalAmount)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Paid</p><p className="text-xl font-bold">{money('MWK', summary?.amountPaid)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Outstanding</p><p className="text-xl font-bold">{money('MWK', summary?.balanceDue)}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 p-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search invoice, ministry, email" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['all', 'draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'].map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={pkg} onValueChange={v => { setPkg(v); setPage(1); }}>
            <SelectTrigger className="sm:w-56"><SelectValue placeholder="Package" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All packages</SelectItem>
              {(packagesQuery.data ?? []).map(p => <SelectItem key={p.id} value={p.id}>{p.displayName}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Invoices</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="border-y bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Invoice</th>
                <th className="px-4 py-2 text-left">Ministry</th>
                <th className="px-4 py-2 text-left">Package</th>
                <th className="px-4 py-2 text-left">Due</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Balance</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading invoices...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No invoices found.</td></tr>
              ) : invoices.map(invoice => (
                <tr key={invoice.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{invoice.invoiceNumber}</td>
                  <td className="px-4 py-3">{invoice.ministryAdmin?.ministryName || invoice.ministryAdmin?.email}</td>
                  <td className="px-4 py-3">{invoice.package?.displayName || invoice.packageName}</td>
                  <td className="px-4 py-3">{date(invoice.dueDate)}</td>
                  <td className="px-4 py-3">{money(invoice.currency, invoice.amount)}</td>
                  <td className="px-4 py-3">{money(invoice.currency, invoice.balanceDue)}</td>
                  <td className="px-4 py-3">{statusBadge(invoice.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSelected(invoice)}><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => downloadPackageInvoicePdf(invoice)}><Download className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyInvoicePaymentLink(invoice)}><LinkIcon className="h-4 w-4" /></Button>
                      {invoice.status === 'draft' && <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => sendMutation.mutate(invoice.id)}><Send className="h-4 w-4" /></Button>}
                      {invoice.status !== 'paid' && invoice.status !== 'cancelled' && <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setPaying(invoice); setPaymentForm(f => ({ ...f, amount: String(invoice.balanceDue || invoice.amount) })); }}><Wallet className="h-4 w-4" /></Button>}
                      {invoice.status !== 'paid' && invoice.status !== 'cancelled' && <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => cancelMutation.mutate(invoice.id)}><Ban className="h-4 w-4" /></Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {selected && <InvoiceDetailDialog invoice={selected} onClose={() => setSelected(null)} onRecord={() => { setPaying(selected); setPaymentForm(f => ({ ...f, amount: String(selected.balanceDue || selected.amount) })); }} />}

      <Dialog open={!!paying} onOpenChange={open => { if (!open) setPaying(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{paying?.invoiceNumber} balance: {paying ? money(paying.currency, paying.balanceDue) : ''}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1"><Label>Amount</Label><Input type="number" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Date paid</Label><Input type="date" value={paymentForm.paidAt} onChange={e => setPaymentForm(f => ({ ...f, paidAt: e.target.value }))} /></div>
            </div>
            <div className="space-y-1">
              <Label>Method</Label>
              <Select value={paymentForm.paymentMethod} onValueChange={value => setPaymentForm(f => ({ ...f, paymentMethod: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile money</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Reference</Label><Input value={paymentForm.reference} onChange={e => setPaymentForm(f => ({ ...f, reference: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Notes</Label><Textarea value={paymentForm.notes} onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaying(null)}>Cancel</Button>
            <Button disabled={!Number(paymentForm.amount) || recordPaymentMutation.isPending} onClick={() => recordPaymentMutation.mutate()}>
              {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
