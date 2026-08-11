import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { packagesService, type PackageTier, type PackageFeature, type PackageInvoice } from '@/services/packages';
import { paymentService } from '@/services/payments';
import { useRole } from '@/hooks/useRole';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, CreditCard, Package2, Zap, Building2, Users, Calendar, HandCoins, Users2, FileText, Wallet, Download, Link as LinkIcon } from 'lucide-react';
import { downloadPackageInvoicePdf } from '@/lib/invoice-pdf';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PKG_COLOR: Record<string, string> = {
  basic:    'bg-slate-100 border-slate-200 dark:bg-slate-800/40',
  standard: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20',
  premium:  'bg-purple-50 border-purple-200 dark:bg-purple-900/20',
};
const PKG_BADGE: Record<string, string> = {
  basic:    'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  standard: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  premium:  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};
const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  failed:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};
const INVOICE_STATUS_BADGE: Record<string, string> = {
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
  partially_paid: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  cancelled: 'bg-muted text-muted-foreground',
};

function fmt(n: number, currency: string = 'KES') {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency, 
    maximumFractionDigits: currency === 'KES' || currency === 'MWK' ? 0 : 2
  }).format(n);
}

function fmtDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

// ─── Package Comparison Card ──────────────────────────────────────────────────
function invoicePayUrl(token?: string | null) {
  return token ? `${window.location.origin}/invoice/pay/${token}` : '';
}

function PackageCard({ pkg, isCurrent, allFeatures, onUpgrade }: {
  pkg: PackageTier;
  isCurrent: boolean;
  allFeatures: (PackageFeature & { packages: { packageId: string }[] })[];
  onUpgrade: (pkgId: string, pkgName: string) => void;
}) {
  const includedFeatureIds = new Set(pkg.features.map((f: any) => f.name ?? f.feature?.name));
  const p = pkg as any;

  const limits = [
    { label: 'Churches', value: p.maxChurches, icon: Building2 },
    { label: 'Members', value: p.maxMembers, icon: Users },
    { label: 'Events/mo', value: p.maxEvents, icon: Calendar },
    { label: 'Campaigns', value: p.maxGivings, icon: HandCoins },
    { label: 'Cells', value: p.maxCells, icon: Users2 },
  ].filter(l => l.value != null);

  const displayLimit = (v: number) => v >= 999999 ? '∞' : v.toLocaleString();

  const accentMap: Record<string, string> = {
    basic: 'from-slate-500 to-slate-600',
    standard: 'from-blue-500 to-blue-600',
    premium: 'from-purple-500 to-purple-700',
  };
  const gradient = accentMap[pkg.name] ?? 'from-gray-500 to-gray-600';

  return (
    <Card className={`relative flex flex-col overflow-hidden border-2 transition-shadow hover:shadow-lg ${isCurrent ? 'ring-2 ring-accent shadow-md' : ''} ${PKG_COLOR[pkg.name] ?? ''}`}>
      {isCurrent && (
        <div className="absolute top-0 right-0">
          <div className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg">
            Current Plan
          </div>
        </div>
      )}

      {/* Header gradient band */}
      <div className={`bg-gradient-to-r ${gradient} px-5 py-4 text-white`}>
        <div className="flex items-center gap-2 mb-2">
          <Package2 className="h-4 w-4 opacity-80" />
          <span className="text-xs font-semibold uppercase tracking-widest opacity-90">{pkg.displayName}</span>
        </div>
        <div className="flex items-end gap-1">
          <span className="text-3xl font-bold">{fmt(pkg.priceMonthly, p.currency)}</span>
          <span className="text-sm opacity-75 mb-1">/mo</span>
        </div>
        <p className="text-xs opacity-70 mt-0.5">
          {fmt(pkg.priceYearly, p.currency)}/yr · Save {Math.round((1 - pkg.priceYearly / (pkg.priceMonthly * 12)) * 100)}%
        </p>
      </div>

      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        {pkg.description && (
          <p className="text-xs text-muted-foreground">{pkg.description}</p>
        )}

        {/* Features */}
        <div className="space-y-1.5 flex-1">
          {allFeatures.filter(feat => feat.category !== 'limit').map(feat => {
            const included = includedFeatureIds.has(feat.name);
            return (
              <div key={feat.id ?? feat.name} className={`flex items-center gap-2 text-sm ${included ? '' : 'opacity-30'}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${included ? 'bg-green-100 dark:bg-green-900/40' : 'bg-muted'}`}>
                  <Check className={`h-2.5 w-2.5 ${included ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                </div>
                <span className={included ? 'text-foreground' : 'text-muted-foreground line-through'}>{feat.displayName}</span>
              </div>
            );
          })}
        </div>

        {/* Limits grid */}
        {limits.length > 0 && (
          <div className="border rounded-lg p-3 bg-muted/30 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Limits</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {limits.map(l => (
                <div key={l.label} className="flex items-center justify-between gap-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <l.icon className="h-3 w-3 shrink-0" />{l.label}
                  </span>
                  <span className="text-xs font-bold">{displayLimit(l.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {isCurrent ? (
          <div className="flex items-center justify-center gap-1.5 py-2 rounded-md bg-accent/10 text-accent text-sm font-medium">
            <Check className="h-4 w-4" /> Active Plan
          </div>
        ) : (
          <Button
            size="sm"
            className={`w-full gap-1.5 bg-gradient-to-r ${gradient} text-white border-0 hover:opacity-90`}
            onClick={() => onUpgrade(pkg.id, pkg.name)}
          >
            <Zap className="h-3.5 w-3.5" />
            Upgrade to {pkg.displayName}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}



// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PackagesPage() {
  const { hasPermission } = useRole();
  const canViewPayments = hasPermission('system_payments:view');
  const qc = useQueryClient();

  const [upgradeDialog, setUpgradeDialog] = useState<{ open: boolean; packageId: string; packageName: string } | null>(null);
  const [viewInvoice, setViewInvoice] = useState<PackageInvoice | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const { data: fees, isFetching: loadingFees } = useQuery({
    queryKey: ['package-fees', upgradeDialog?.packageId, billingCycle],
    queryFn: () => packagesService.calculateFees(upgradeDialog!.packageId, billingCycle),
    enabled: !!upgradeDialog?.packageId,
  });

  const { data: packages = [], isLoading: loadingPkgs } = useQuery({
    queryKey: ['packages'],
    queryFn: packagesService.getAll,
  });

  const { data: currentData } = useQuery({
    queryKey: ['package-current'],
    queryFn: packagesService.getCurrent,
  });

  const { data: allFeatures = [] } = useQuery({
    queryKey: ['package-features'],
    queryFn: packagesService.getFeatures,
  });

  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['payments'],
    queryFn: packagesService.getPayments,
    enabled: canViewPayments,
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['package-invoices'],
    queryFn: packagesService.getInvoices,
  });

  const subscribePaymentMutation = useMutation({
    mutationFn: ({ packageId, billingCycle }: { packageId: string; billingCycle: 'monthly' | 'yearly' }) =>
      paymentService.initiateSubscription({ packageId, billingCycle }),
    onSuccess: (data) => {
      window.location.href = data.authorization_url;
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to initiate payment'),
  });

  const payInvoiceMutation = useMutation({
    mutationFn: (invoiceId: string) => paymentService.initiateSubscription({ invoiceId }),
    onSuccess: (data) => {
      window.location.href = data.authorization_url;
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to initiate invoice payment'),
  });

  function handleUpgrade(pkgId: string, pkgName: string) {
    setUpgradeDialog({ open: true, packageId: pkgId, packageName: pkgName });
  }

  function handleConfirmUpgrade() {
    if (!upgradeDialog) return;
    subscribePaymentMutation.mutate({ packageId: upgradeDialog.packageId, billingCycle });
  }

  function copyInvoicePaymentLink(invoice: PackageInvoice) {
    const url = invoicePayUrl(invoice.publicToken);
    if (!url) {
      toast.error('Payment link is not available for this invoice yet');
      return;
    }
    navigator.clipboard.writeText(url);
    toast.success('Invoice payment link copied');
  }

  const currentPkg = currentData?.package?.name;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">Packages & Billing</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Current plan:&nbsp;
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${PKG_BADGE[currentPkg ?? 'basic'] ?? ''}`}>
              {currentPkg ?? '—'}
            </span>
          </p>
        </div>
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans" className="gap-1.5"><Package2 className="h-3.5 w-3.5" /> Plans</TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Invoices</TabsTrigger>
          {canViewPayments && <TabsTrigger value="payments" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Payments</TabsTrigger>}
        </TabsList>

        {/* ─── Plans Tab ──────────────────────────────────────────────── */}
        <TabsContent value="plans" className="mt-6">
          {loadingPkgs ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {packages.map(pkg => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isCurrent={pkg.name === currentPkg}
                  allFeatures={allFeatures}
                  onUpgrade={handleUpgrade}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Payments Tab ───────────────────────────────────────────── */}
        <TabsContent value="invoices" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {loadingInvoices ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[850px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Invoice</TableHead>
                        <TableHead className="text-xs sm:text-sm">Package</TableHead>
                        <TableHead className="text-xs sm:text-sm">Period</TableHead>
                        <TableHead className="text-xs sm:text-sm">Due</TableHead>
                        <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                        <TableHead className="text-xs sm:text-sm">Balance</TableHead>
                        <TableHead className="text-xs sm:text-sm">Status</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map(invoice => (
                        <TableRow key={invoice.id}>
                          <TableCell className="text-xs sm:text-sm font-medium">{invoice.invoiceNumber}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{invoice.package?.displayName || invoice.packageName}</TableCell>
                          <TableCell className="text-xs sm:text-sm whitespace-nowrap">{fmtDate(invoice.servicePeriodStart)} - {fmtDate(invoice.servicePeriodEnd)}</TableCell>
                          <TableCell className="text-xs sm:text-sm whitespace-nowrap">{fmtDate(invoice.dueDate)}</TableCell>
                          <TableCell className="text-xs sm:text-sm font-medium whitespace-nowrap">{fmt(invoice.amount, invoice.currency)}</TableCell>
                          <TableCell className="text-xs sm:text-sm font-semibold whitespace-nowrap">{fmt(invoice.balanceDue, invoice.currency)}</TableCell>
                          <TableCell>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${INVOICE_STATUS_BADGE[invoice.status] ?? ''}`}>
                              {invoice.status.replace('_', ' ')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setViewInvoice(invoice)}>
                                View
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => downloadPackageInvoicePdf(invoice, 'Your ministry')}>
                                <Download className="h-3.5 w-3.5" /> PDF
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => copyInvoicePaymentLink(invoice)}>
                                <LinkIcon className="h-3.5 w-3.5" /> Link
                              </Button>
                              {!['paid', 'cancelled'].includes(invoice.status) && (
                                <Button size="sm" className="h-8 text-xs gap-1" onClick={() => payInvoiceMutation.mutate(invoice.id)} disabled={payInvoiceMutation.isPending}>
                                  <Wallet className="h-3.5 w-3.5" /> Pay Now
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {invoices.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                            No invoices yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {canViewPayments && (
        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {loadingPayments ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
                </div>
              ) : (
        <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Date</TableHead>
                      <TableHead className="text-xs sm:text-sm">Package</TableHead>
                      <TableHead className="text-xs sm:text-sm">Base Amount</TableHead>
                      <TableHead className="text-xs sm:text-sm">Transaction Cost</TableHead>
                      <TableHead className="text-xs sm:text-sm">Tax</TableHead>
                      <TableHead className="text-xs sm:text-sm">Total</TableHead>
                      <TableHead className="text-xs sm:text-sm">Gateway</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(p.paidAt || p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${PKG_BADGE[p.packageName] ?? ''}`}>
                            {p.package?.displayName ?? p.packageName}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm font-medium whitespace-nowrap">{fmt(p.baseAmount || p.amount, p.currency)}</TableCell>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">{p.convenienceFee ? fmt(p.convenienceFee, p.currency) : '—'}</TableCell>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">{p.systemFeeAmount ? fmt(p.systemFeeAmount, p.currency) : '—'}</TableCell>
                        <TableCell className="text-xs sm:text-sm font-semibold whitespace-nowrap">{fmt(p.totalAmount || p.amount, p.currency)}</TableCell>
                        <TableCell>
                          <span className="text-xs capitalize">{p.gateway || 'paystack'}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[p.status] ?? ''}`}>
                            {p.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {payments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                          <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          No payment records yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        )}
      </Tabs>

      <Dialog open={!!viewInvoice} onOpenChange={open => !open && setViewInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{viewInvoice?.invoiceNumber}</DialogTitle></DialogHeader>
          {viewInvoice && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div><p className="text-muted-foreground">Package</p><p className="font-medium">{viewInvoice.package?.displayName || viewInvoice.packageName}</p></div>
                <div><p className="text-muted-foreground">Status</p><p className="capitalize">{viewInvoice.status.replace('_', ' ')}</p></div>
                <div><p className="text-muted-foreground">Invoice date</p><p>{fmtDate(viewInvoice.invoiceDate)}</p></div>
                <div><p className="text-muted-foreground">Due date</p><p>{fmtDate(viewInvoice.dueDate)}</p></div>
                <div><p className="text-muted-foreground">Service period</p><p>{fmtDate(viewInvoice.servicePeriodStart)} - {fmtDate(viewInvoice.servicePeriodEnd)}</p></div>
                <div><p className="text-muted-foreground">Billing</p><p className="capitalize">{viewInvoice.billingCycle}</p></div>
                <div><p className="text-muted-foreground">Amount</p><p>{fmt(viewInvoice.amount, viewInvoice.currency)}</p></div>
                <div><p className="text-muted-foreground">Balance</p><p className="font-semibold">{fmt(viewInvoice.balanceDue, viewInvoice.currency)}</p></div>
              </div>
              {(viewInvoice.notes || viewInvoice.terms) && (
                <div className="rounded-md border p-3 text-xs">
                  {viewInvoice.notes && <p><span className="font-medium">Notes:</span> {viewInvoice.notes}</p>}
                  {viewInvoice.terms && <p><span className="font-medium">Terms:</span> {viewInvoice.terms}</p>}
                </div>
              )}
              <div className="rounded-md border">
                <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">Payments</div>
                {(viewInvoice.payments ?? []).length === 0 ? (
                  <p className="px-3 py-4 text-xs text-muted-foreground">No payments recorded.</p>
                ) : viewInvoice.payments!.map(payment => (
                  <div key={payment.id} className="flex items-center justify-between border-b px-3 py-2 text-xs last:border-0">
                    <span>{fmtDate(payment.paidAt || payment.createdAt)} · {payment.paymentMethod || payment.gateway || 'payment'}</span>
                    <span className="font-medium">{fmt(payment.baseAmount ?? payment.amount, payment.currency)}</span>
                  </div>
                ))}
              </div>
              {!['paid', 'cancelled'].includes(viewInvoice.status) && (
                <div className="grid gap-2 sm:grid-cols-3">
                  <Button variant="outline" className="gap-2" onClick={() => downloadPackageInvoicePdf(viewInvoice, 'Your ministry')}>
                    <Download className="h-4 w-4" /> Download PDF
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => copyInvoicePaymentLink(viewInvoice)}>
                    <LinkIcon className="h-4 w-4" /> Copy Link
                  </Button>
                  <Button className="gap-2" onClick={() => payInvoiceMutation.mutate(viewInvoice.id)} disabled={payInvoiceMutation.isPending}>
                    <Wallet className="h-4 w-4" /> Pay Invoice
                  </Button>
                </div>
              )}
              {['paid', 'cancelled'].includes(viewInvoice.status) && (
                <Button variant="outline" className="w-full gap-2" onClick={() => downloadPackageInvoicePdf(viewInvoice, 'Your ministry')}>
                  <Download className="h-4 w-4" /> Download PDF
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upgrade/Subscribe dialog */}
      <Dialog open={upgradeDialog?.open ?? false} onOpenChange={open => !open && setUpgradeDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Subscribe to {upgradeDialog?.packageName}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select your billing cycle to proceed with payment.</p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200">
              <p className="font-semibold mb-1">⚠️ Important: No Refund Policy</p>
              <p className="text-xs">
                All subscription payments are non-refundable. If you upgrade or downgrade, 
                you will be charged immediately and no refunds will be issued for the remaining time 
                on your current subscription period.
              </p>
            </div>

            <div>
              <Label>Billing Cycle</Label>
              <Select value={billingCycle} onValueChange={(v: 'monthly' | 'yearly') => setBillingCycle(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly (Save more)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loadingFees ? (
              <div className="flex justify-center py-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </div>
            ) : fees && (
              <div className="rounded-md border bg-muted/40 p-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Package price</span>
                  <span className="font-medium">{fmt(fees.baseAmount, fees.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction cost</span>
                  <span>{fmt(fees.transactionCost, fees.currency)}</span>
                </div>
                <div className="flex justify-between border-t pt-1.5 font-semibold">
                  <span>Total</span>
                  <span>{fmt(fees.totalAmount, fees.currency)}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setUpgradeDialog(null)}>Cancel</Button>
              <Button
                size="sm"
                onClick={handleConfirmUpgrade}
                disabled={subscribePaymentMutation.isPending}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {subscribePaymentMutation.isPending ? 'Processing...' : 'Proceed to Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
