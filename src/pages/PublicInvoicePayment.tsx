import { useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, CreditCard, FileText, Loader2 } from 'lucide-react';
import { packagesService } from '@/services/packages';
import { downloadPackageInvoicePdf } from '@/lib/invoice-pdf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function money(currency: string, value?: number | null) {
  return `${currency} ${(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function date(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : '-';
}

export default function PublicInvoicePayment() {
  const { token = '' } = useParams();
  const [selectedMonths, setSelectedMonths] = useState(1);
  const invoiceQuery = useQuery({
    queryKey: ['public-package-invoice', token],
    queryFn: () => packagesService.getPublicInvoice(token),
    enabled: !!token,
  });

  const payMutation = useMutation({
    mutationFn: () => packagesService.payPublicInvoice(token, selectedMonths),
    onSuccess: data => {
      if (!data.authorization_url) {
        toast.error('Payment gateway did not return a checkout link');
        return;
      }
      window.location.href = data.authorization_url;
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to start invoice payment'),
  });

  const invoice = invoiceQuery.data;
  const isPaid = invoice?.status === 'paid' || (invoice?.balanceDue ?? 0) <= 0;
  const paymentOptions = invoice?.paymentOptions;
  const allowedMonths = paymentOptions?.allowedMonths?.length ? paymentOptions.allowedMonths : [1, 3, 6, 12];
  const invoiceMonths = paymentOptions?.invoiceMonths ?? 1;
  const monthlyAmount = paymentOptions?.monthlyAmount ?? ((invoice?.amount ?? 0) / invoiceMonths);
  const extraMonths = Math.max(0, selectedMonths - invoiceMonths);
  const extraAmount = Math.round(monthlyAmount * extraMonths * 100) / 100;
  const payableBaseAmount = Math.round(((invoice?.balanceDue ?? 0) + extraAmount) * 100) / 100;
  const selectedMonthsLabel = `${selectedMonths} month${selectedMonths === 1 ? '' : 's'}`;

  useEffect(() => {
    if (paymentOptions?.defaultMonths) setSelectedMonths(paymentOptions.defaultMonths);
  }, [paymentOptions?.defaultMonths]);

  const extensionCopy = useMemo(() => {
    if (!extraMonths) return 'Pay this invoice only.';
    return `Pay this invoice and add ${extraMonths} extra month${extraMonths === 1 ? '' : 's'} of package access.`;
  }, [extraMonths]);

  return (
    <main className="min-h-[70vh] bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="font-heading text-2xl">Package Invoice</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Secure ICIMS package payment</p>
              </div>
              <FileText className="h-8 w-8 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {invoiceQuery.isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading invoice...
              </div>
            ) : invoiceQuery.isError || !invoice ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="mb-2 h-5 w-5" />
                This invoice link is invalid, expired, or no longer available.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Invoice</p>
                    <p className="font-semibold">{invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="capitalize">{invoice.status.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ministry</p>
                    <p className="font-medium">{invoice.ministryAdmin?.ministryName || invoice.ministryAdmin?.email || 'Ministry account'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Package</p>
                    <p>{invoice.package?.displayName || invoice.packageName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Service period</p>
                    <p>{date(invoice.servicePeriodStart)} - {date(invoice.servicePeriodEnd)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due date</p>
                    <p>{date(invoice.dueDate)}</p>
                  </div>
                </div>

                <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Invoice amount</p>
                    <p className="font-semibold">{money(invoice.currency, invoice.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="font-semibold">{money(invoice.currency, invoice.amountPaid)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Balance due</p>
                    <p className="text-lg font-bold">{money(invoice.currency, invoice.balanceDue)}</p>
                  </div>
                </div>

                {!isPaid && (
                  <div className="rounded-lg border p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold">Pay subscription for</p>
                        <p className="text-xs text-muted-foreground">
                          Choose months only. ICIMS calculates the secure payable amount.
                        </p>
                      </div>
                      <p className="text-sm font-semibold">{selectedMonthsLabel}</p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {allowedMonths.map(months => (
                        <Button
                          key={months}
                          type="button"
                          variant={selectedMonths === months ? 'default' : 'outline'}
                          className="h-9 text-xs"
                          onClick={() => setSelectedMonths(months)}
                        >
                          {months} month{months === 1 ? '' : 's'}
                        </Button>
                      ))}
                    </div>
                    <div className="mt-3 grid gap-2 rounded-md bg-muted/30 p-3 text-sm sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Invoice balance</p>
                        <p className="font-medium">{money(invoice.currency, invoice.balanceDue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Extra months</p>
                        <p className="font-medium">{money(invoice.currency, extraAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Payable before fees</p>
                        <p className="font-bold">{money(invoice.currency, payableBaseAmount)}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{extensionCopy}</p>
                  </div>
                )}

                {isPaid ? (
                  <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    <CheckCircle2 className="mb-2 h-5 w-5" />
                    This invoice has already been paid.
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button variant="outline" onClick={() => downloadPackageInvoicePdf(invoice, 'Ministry account')}>
                      Download PDF
                    </Button>
                    <Button className="gap-2" onClick={() => payMutation.mutate()} disabled={payMutation.isPending || payableBaseAmount <= 0}>
                      {payMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                      Pay Securely
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
