import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { walletService, type WithdrawalPayload } from '@/services/wallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle2, Wallet, Plus, ArrowDownToLine } from 'lucide-react';
import { ExportImportButtons } from '@/components/ExportImportButtons';
import { toast } from 'sonner';

type SupportedBank = { uuid?: string; bank_uuid?: string; id?: string | number; name?: string };

function getApiErrorMessage(err: unknown, fallback: string) {
  const error = err as { response?: { data?: { message?: unknown } }; message?: string };
  const message = error.response?.data?.message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.map(String).join('. ');
  if (message && typeof message === 'object') {
    return Object.values(message as Record<string, unknown>)
      .flatMap(value => Array.isArray(value) ? value.map(String) : [String(value)])
      .filter(Boolean)
      .join('. ') || fallback;
  }
  return error.message || fallback;
}

function getMobileOperatorFromNumber(value?: string): 'airtel' | 'tnm' | null {
  const digits = String(value || '').replace(/\D/g, '');
  const local = digits.startsWith('265') ? `0${digits.slice(3)}` : digits;
  if (local.startsWith('099') || local.startsWith('098')) return 'airtel';
  if (local.startsWith('088') || local.startsWith('089')) return 'tnm';
  return null;
}

function buildPayload(form: {
  amount: string;
  method: 'mobile_money' | 'bank_transfer';
  mobileOperator: 'airtel' | 'tnm';
  mobileNumber: string;
  bankCode: string;
  accountName: string;
  accountNumber: string;
}): WithdrawalPayload {
  return {
    amount: Number(form.amount),
    method: form.method,
    mobileOperator: form.method === 'mobile_money' ? form.mobileOperator : undefined,
    mobileNumber: form.method === 'mobile_money' ? form.mobileNumber : undefined,
    bankCode: form.method === 'bank_transfer' ? form.bankCode : undefined,
    accountName: form.method === 'bank_transfer' ? form.accountName : undefined,
    accountNumber: form.method === 'bank_transfer' ? form.accountNumber : undefined,
  };
}

function RequestWithdrawalDialog({
  open,
  onOpenChange,
  banks,
  isLoadingBanks,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banks: SupportedBank[];
  isLoadingBanks: boolean;
}) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    amount: '',
    method: 'mobile_money' as 'mobile_money' | 'bank_transfer',
    mobileOperator: 'airtel' as 'airtel' | 'tnm',
    mobileNumber: '',
    bankCode: '',
    accountName: '',
    accountNumber: '',
  });
  const payload = buildPayload(form);

  const localError = (() => {
    if (!Number.isFinite(payload.amount) || payload.amount <= 0) return null;
    if (payload.method === 'mobile_money') {
      if (!payload.mobileNumber) return null;
      const detected = getMobileOperatorFromNumber(payload.mobileNumber);
      if (!detected) return 'Enter a valid Airtel Money or TNM Mpamba number.';
      if (detected !== payload.mobileOperator) return `The number looks like ${detected === 'airtel' ? 'Airtel Money' : 'TNM Mpamba'}, not ${payload.mobileOperator === 'airtel' ? 'Airtel Money' : 'TNM Mpamba'}.`;
    }
    return null;
  })();

  const hasRequiredDetails =
    Number.isFinite(payload.amount) &&
    payload.amount > 0 &&
    !localError &&
    (payload.method === 'mobile_money'
      ? Boolean(payload.mobileOperator && payload.mobileNumber)
      : Boolean(payload.bankCode && payload.accountName && payload.accountNumber));

  const { data: preview, isFetching: isPreviewing, error: previewError } = useQuery({
    queryKey: ['wallet-withdrawal-fee-preview', payload],
    queryFn: () => walletService.getWithdrawalFeePreview(payload),
    enabled: open && hasRequiredDetails,
    staleTime: 10_000,
    retry: false,
  });

  const sendOtpMutation = useMutation({
    mutationFn: walletService.sendWithdrawalOtp,
    onSuccess: (result) => {
      const trustedPreview = result.data || preview;
      if (!trustedPreview) {
        toast.error('Unable to confirm withdrawal cost. Please try again.');
        return;
      }
      toast.success(result.message || 'OTP sent to your email');
      onOpenChange(false);
      navigate('/dashboard/withdrawals/request', {
        state: {
          payload,
          preview: trustedPreview,
          expiresInSeconds: result.expiresInSeconds ?? 300,
        },
      });
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Failed to send OTP'), { duration: 8000 }),
  });

  const formatCurrency = (amount?: number, currency = 'MWK') =>
    `${currency} ${(amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const previewMessage = (() => {
    if (localError) return { tone: 'error', text: localError };
    if (!hasRequiredDetails) return { tone: 'neutral', text: 'Enter withdrawal details to check if this amount is allowed.' };
    if (isPreviewing) return { tone: 'neutral', text: 'Checking withdrawal amount...' };
    if (previewError) return { tone: 'error', text: getApiErrorMessage(previewError, 'Unable to check withdrawal amount.') };
    if (!preview) return { tone: 'neutral', text: 'Enter withdrawal details to check if this amount is allowed.' };
    if (!preview.hasEnoughBalance) {
      return {
        tone: 'error',
        text: `Not enough balance. You need ${formatCurrency(preview.netAmount, preview.currency)} including transaction cost, available is ${formatCurrency(preview.availableBalance, preview.currency)}.`,
      };
    }
    return {
      tone: 'success',
      text: `Allowed. Total amount including transaction cost is ${formatCurrency(preview.netAmount, preview.currency)}.`,
    };
  })();

  const canProceed = Boolean(preview?.hasEnoughBalance && !localError);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Withdrawal Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs sm:text-sm">Amount *</Label>
            <Input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm(current => ({ ...current, amount: e.target.value }))}
              placeholder="Enter amount"
              className="mt-1.5 h-9 text-sm"
            />
            <div className={`mt-2 rounded-md border px-3 py-2 text-xs ${
              previewMessage.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : previewMessage.tone === 'error'
                  ? 'border-destructive/30 bg-destructive/10 text-destructive'
                  : 'border-muted bg-muted/30 text-muted-foreground'
            }`}>
              <div className="flex gap-2">
                {previewMessage.tone === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                <span>{previewMessage.text}</span>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs sm:text-sm">Withdrawal Method *</Label>
            <Select value={form.method} onValueChange={(value) => setForm(current => ({ ...current, method: value as 'mobile_money' | 'bank_transfer' }))}>
              <SelectTrigger className="mt-1.5 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.method === 'mobile_money' ? (
            <>
              <div>
                <Label className="text-xs sm:text-sm">Mobile Operator *</Label>
                <Select value={form.mobileOperator} onValueChange={(value) => setForm(current => ({ ...current, mobileOperator: value as 'airtel' | 'tnm' }))}>
                  <SelectTrigger className="mt-1.5 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="airtel">Airtel Money</SelectItem>
                    <SelectItem value="tnm">TNM Mpamba</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Mobile Number *</Label>
                <Input
                  value={form.mobileNumber}
                  onChange={(e) => setForm(current => ({ ...current, mobileNumber: e.target.value }))}
                  placeholder="e.g. 0991234567"
                  className="mt-1.5 h-9 text-sm"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label className="text-xs sm:text-sm">Bank *</Label>
                <Select value={form.bankCode} onValueChange={(value) => setForm(current => ({ ...current, bankCode: value }))}>
                  <SelectTrigger className="mt-1.5 h-9 text-sm">
                    <SelectValue placeholder={isLoadingBanks ? 'Loading banks...' : 'Select bank'} />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => {
                      const value = String(bank.uuid || bank.bank_uuid || bank.id);
                      return <SelectItem key={value} value={value}>{bank.name || value}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Account Name *</Label>
                <Input value={form.accountName} onChange={(e) => setForm(current => ({ ...current, accountName: e.target.value }))} className="mt-1.5 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Account Number *</Label>
                <Input value={form.accountNumber} onChange={(e) => setForm(current => ({ ...current, accountNumber: e.target.value }))} className="mt-1.5 h-9 text-sm" />
              </div>
            </>
          )}

          <Button
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={!canProceed || sendOtpMutation.isPending}
            onClick={() => sendOtpMutation.mutate(payload)}
          >
            {sendOtpMutation.isPending ? 'Requesting OTP...' : 'Proceed & Request OTP'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function WithdrawalsPage() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  const { data: balance } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: walletService.getBalance,
    enabled: user?.accountCountry === 'Malawi',
  });

  const { data: banks = [], isLoading: isLoadingBanks } = useQuery({
    queryKey: ['wallet-supported-banks'],
    queryFn: walletService.getSupportedBanks,
    enabled: user?.accountCountry === 'Malawi',
    staleTime: 5 * 60_000,
  });

  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ['withdrawals', appliedStartDate, appliedEndDate],
    queryFn: () => walletService.getWithdrawals({
      startDate: appliedStartDate || undefined,
      endDate: appliedEndDate || undefined,
    }),
    enabled: user?.accountCountry === 'Malawi',
  });

  const handleApplyFilters = () => {
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setAppliedStartDate('');
    setAppliedEndDate('');
  };

  const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' | 'outline' =>
    s === 'completed' ? 'default' : s === 'processing' ? 'outline' : s === 'failed' ? 'destructive' : 'secondary';

  const formatCurrency = (amount: number) => `MWK ${amount.toLocaleString()}`;

  // Block access for non-Malawi accounts (after all hooks)
  if (user?.accountCountry !== 'Malawi') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Withdrawals Not Available</h2>
            <p className="text-muted-foreground">Withdrawals are only available for Malawi accounts.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">Withdrawals</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Manage wallet withdrawals</p>
        </div>
        <div className="flex gap-2 self-end sm:self-auto">
          <ExportImportButtons
            data={withdrawals.map((w: any) => ({
              amount: w.amount,
              gatewayFee: w.gatewayFeeAmount ?? w.fee,
              systemFee: w.systemFeeAmount ?? 0,
              fee: w.fee,
              netAmount: w.netAmount,
              payoutAmount: w.payoutAmount ?? w.netAmount,
              method: w.method.replace('_', ' '),
              status: w.status,
              date: new Date(w.createdAt).toLocaleDateString(),
            }))}
            filename="withdrawals"
            headers={[
              { label: 'Amount', key: 'amount' },
              { label: 'Gateway Fee', key: 'gatewayFee' },
              { label: 'System Fee', key: 'systemFee' },
              { label: 'Total Fee', key: 'fee' },
              { label: 'Net Amount', key: 'netAmount' },
              { label: 'Amount Sent', key: 'payoutAmount' },
              { label: 'Method', key: 'method' },
              { label: 'Status', key: 'status' },
              { label: 'Date', key: 'date' },
            ]}
            pdfTitle="Withdrawals Report"
          />
          <Button 
            onClick={() => setRequestDialogOpen(true)} 
            className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 h-8 text-xs sm:h-9 sm:text-sm"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Request Withdrawal
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold font-heading">
            {balance ? formatCurrency(balance.balance) : 'MWK 0'}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[140px]">
                  <Label className="text-xs sm:text-sm">Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-xs sm:h-10 sm:text-sm" />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <Label className="text-xs sm:text-sm">End Date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8 text-xs sm:h-10 sm:text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleApplyFilters} variant="default" className="h-8 text-xs sm:h-10 sm:text-sm">
                    Apply
                  </Button>
                  <Button onClick={handleClearFilters} variant="outline" className="h-8 text-xs sm:h-10 sm:text-sm">
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
          <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                  <TableHead className="text-xs sm:text-sm">Gateway Fee</TableHead>
                  <TableHead className="text-xs sm:text-sm">System Fee</TableHead>
                  <TableHead className="text-xs sm:text-sm">Total Fee</TableHead>
                  <TableHead className="text-xs sm:text-sm">Net Amount</TableHead>
                  <TableHead className="text-xs sm:text-sm">Amount Sent</TableHead>
                  <TableHead className="text-xs sm:text-sm">Method</TableHead>
                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="text-xs sm:text-sm">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((w: any) => (
                  <TableRow key={w.id}>
                    <TableCell className="text-xs sm:text-sm font-medium whitespace-nowrap">{formatCurrency(w.amount)}</TableCell>
                    <TableCell className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{formatCurrency(w.gatewayFeeAmount ?? w.fee)}</TableCell>
                    <TableCell className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{formatCurrency(w.systemFeeAmount ?? 0)}</TableCell>
                    <TableCell className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{formatCurrency(w.fee)}</TableCell>
                    <TableCell className="text-xs sm:text-sm font-semibold whitespace-nowrap">{formatCurrency(w.netAmount)}</TableCell>
                    <TableCell className="text-xs sm:text-sm font-semibold whitespace-nowrap">{formatCurrency(w.payoutAmount ?? w.netAmount)}</TableCell>
                    <TableCell className="text-xs sm:text-sm capitalize whitespace-nowrap">{w.method.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(w.status)} className="text-xs">{w.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(w.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {withdrawals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      <ArrowDownToLine className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No withdrawals yet.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          </CardContent>
        </Card>
        </>
      )}
      <RequestWithdrawalDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        banks={banks as SupportedBank[]}
        isLoadingBanks={isLoadingBanks}
      />
    </div>
  );
}
