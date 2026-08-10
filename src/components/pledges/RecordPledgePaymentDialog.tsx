import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { givingService, type Pledge, type RecordPledgePaymentDto } from '@/services/giving';

type PaymentMethod = NonNullable<RecordPledgePaymentDto['paymentMethod']>;

interface RecordPledgePaymentDialogProps {
  pledge: Pledge | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'other', label: 'Other' },
];

function todayInputValue(): string {
  return new Date().toISOString().split('T')[0];
}

function fmt(amount: number, currency = 'MWK') {
  return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function RecordPledgePaymentDialog({ pledge, open, onOpenChange }: RecordPledgePaymentDialogProps) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [paidAt, setPaidAt] = useState(todayInputValue());

  const outstanding = useMemo(() => {
    if (!pledge) return 0;
    return Math.max(0, pledge.pledgedAmount - pledge.amountPaid);
  }, [pledge]);

  useEffect(() => {
    if (!open || !pledge) return;
    setAmount(outstanding > 0 ? String(outstanding) : '');
    setPaymentMethod('cash');
    setReference('');
    setNotes('');
    setPaidAt(todayInputValue());
  }, [open, pledge, outstanding]);

  const paymentAmount = Number(amount);
  const isValidAmount = Number.isFinite(paymentAmount) && paymentAmount > 0 && paymentAmount <= outstanding;

  const mutation = useMutation({
    mutationFn: () => {
      if (!pledge) throw new Error('Pledge is required');
      return givingService.recordPledgePayment(pledge.id, {
        amount: paymentAmount,
        paymentMethod,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        paidAt: paidAt || undefined,
      });
    },
    onSuccess: updated => {
      toast.success('Pledge payment recorded');
      queryClient.invalidateQueries({ queryKey: ['ministry-pledges'] });
      queryClient.invalidateQueries({ queryKey: ['my-pledges'] });
      if (pledge?.id) {
        queryClient.invalidateQueries({ queryKey: ['pledge', pledge.id] });
        queryClient.setQueryData(['pledge', pledge.id], updated);
      }
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Could not record pledge payment');
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!mutation.isPending) onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-accent" />
            Record Pledge Payment
          </DialogTitle>
        </DialogHeader>

        {pledge && (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="font-medium">{pledge.campaign?.name ?? 'Pledge campaign'}</p>
              <p className="text-xs text-muted-foreground">
                Outstanding: <span className="font-semibold text-foreground">{fmt(outstanding, pledge.currency)}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pledge-payment-amount">Amount</Label>
                <Input
                  id="pledge-payment-amount"
                  type="number"
                  min="0.01"
                  max={outstanding || undefined}
                  step="0.01"
                  value={amount}
                  onChange={event => setAmount(event.target.value)}
                />
                {amount && paymentAmount > outstanding && (
                  <p className="text-xs text-destructive">Amount cannot exceed the outstanding balance.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Payment method</Label>
                <Select value={paymentMethod} onValueChange={value => setPaymentMethod(value as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(method => (
                      <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pledge-payment-date">Date paid</Label>
                <Input
                  id="pledge-payment-date"
                  type="date"
                  value={paidAt}
                  onChange={event => setPaidAt(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pledge-payment-reference">Reference</Label>
                <Input
                  id="pledge-payment-reference"
                  value={reference}
                  onChange={event => setReference(event.target.value)}
                  placeholder="Receipt, bank ref, or note"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pledge-payment-notes">Notes</Label>
              <Textarea
                id="pledge-payment-notes"
                value={notes}
                onChange={event => setNotes(event.target.value)}
                placeholder="Optional payment notes"
                rows={3}
              />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={!isValidAmount || mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {mutation.isPending ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
