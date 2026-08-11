import { useParams } from 'react-router-dom';
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
  const invoiceQuery = useQuery({
    queryKey: ['public-package-invoice', token],
    queryFn: () => packagesService.getPublicInvoice(token),
    enabled: !!token,
  });

  const payMutation = useMutation({
    mutationFn: () => packagesService.payPublicInvoice(token),
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
                    <Button className="gap-2" onClick={() => payMutation.mutate()} disabled={payMutation.isPending}>
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
