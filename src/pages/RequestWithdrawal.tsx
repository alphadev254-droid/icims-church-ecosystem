import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ShieldCheck, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { walletService, type WithdrawalFeePreview, type WithdrawalPayload } from '@/services/wallet';

type WithdrawalRequestState = {
  payload?: WithdrawalPayload;
  preview?: WithdrawalFeePreview;
  expiresInSeconds?: number;
};

function getApiErrorMessage(err: unknown, fallback: string) {
  const error = err as { response?: { data?: unknown }; message?: string };
  const data = error.response?.data;

  if (data && typeof data === 'object') {
    const body = data as Record<string, unknown>;
    if (body.message) {
      if (typeof body.message === 'string') return body.message;
      if (Array.isArray(body.message)) return body.message.map(String).join('. ');
      if (typeof body.message === 'object') {
        return Object.values(body.message as Record<string, unknown>)
          .flatMap(value => Array.isArray(value) ? value.map(String) : [String(value)])
          .filter(Boolean)
          .join('. ') || fallback;
      }
    }
  }

  return error.message || fallback;
}

function maskRecipient(payload: WithdrawalPayload) {
  if (payload.method === 'bank_transfer') {
    const account = payload.accountNumber || '';
    return `${payload.accountName || 'Bank account'}${account ? ` (${account.slice(0, 2)}***${account.slice(-3)})` : ''}`;
  }
  const number = payload.mobileNumber || '';
  const digits = number.replace(/\D/g, '');
  return digits.length > 6 ? `${digits.slice(0, 4)}***${digits.slice(-3)}` : number || '-';
}

function methodLabel(payload: WithdrawalPayload) {
  if (payload.method === 'bank_transfer') return 'Bank Transfer';
  return payload.mobileOperator === 'tnm' ? 'TNM Mpamba' : 'Airtel Money';
}

export default function RequestWithdrawalPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const state = (location.state || {}) as WithdrawalRequestState;
  const payload = state.payload;
  const preview = state.preview;
  const [otpCode, setOtpCode] = useState('');
  const [otpExpiresIn, setOtpExpiresIn] = useState<number | null>(state.expiresInSeconds ?? 300);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const formatCurrency = (amount?: number, currency = 'MWK') =>
    `${currency} ${(amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const resendOtpMutation = useMutation({
    mutationFn: () => {
      if (!payload) throw new Error('Missing withdrawal details');
      return walletService.sendWithdrawalOtp(payload);
    },
    onSuccess: (result) => {
      setSubmissionError(null);
      setOtpCode('');
      setOtpExpiresIn(result.expiresInSeconds ?? 300);
      toast.success(result.message || 'OTP sent to your email');
    },
    onError: (err: unknown) => {
      const errorMessage = getApiErrorMessage(err, 'Failed to resend OTP');
      setSubmissionError(errorMessage);
      toast.error(errorMessage, { duration: 8000 });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: () => {
      if (!payload) throw new Error('Missing withdrawal details');
      return walletService.requestWithdrawal({ ...payload, otpCode });
    },
    onSuccess: () => {
      setSubmissionError(null);
      toast.success('Withdrawal request submitted successfully');
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
      qc.invalidateQueries({ queryKey: ['withdrawals'] });
      navigate('/dashboard/withdrawals');
    },
    onError: (err: unknown) => {
      const errorMessage = getApiErrorMessage(err, 'Failed to request withdrawal');
      setSubmissionError(errorMessage);
      toast.error(errorMessage, { id: 'withdrawal-request-error', duration: 8000 });
    },
  });

  if (!payload || !preview) {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center">
            <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Start from withdrawals</h2>
            <p className="text-sm text-muted-foreground">Enter withdrawal details first so we can confirm the allowed amount and send an OTP.</p>
            <Button onClick={() => navigate('/dashboard/withdrawals')} className="mt-4">Go to Withdrawals</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/withdrawals')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">Confirm Withdrawal</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Enter the OTP sent to your email to submit this withdrawal.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Withdrawal Confirmation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border bg-muted/30 divide-y">
            <div className="flex items-center justify-between gap-3 px-3 py-3">
              <span className="text-sm text-muted-foreground">Amount to receive</span>
              <span className="font-semibold">{formatCurrency(preview.payoutAmount, preview.currency)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 px-3 py-3">
              <span className="text-sm text-muted-foreground">Total wallet debit</span>
              <span className="font-semibold">{formatCurrency(preview.netAmount, preview.currency)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 px-3 py-3">
              <span className="text-sm text-muted-foreground">Method</span>
              <span className="font-medium">{methodLabel(payload)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 px-3 py-3">
              <span className="text-sm text-muted-foreground">Recipient</span>
              <span className="font-medium text-right break-all">{maskRecipient(payload)}</span>
            </div>
          </div>

          {submissionError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {submissionError}
            </div>
          )}

          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-accent" />
              <div>
                <h3 className="text-sm font-semibold">Security OTP</h3>
                <p className="text-xs text-muted-foreground">
                  The OTP expires in {otpExpiresIn ? Math.ceil(otpExpiresIn / 60) : 5} minute(s).
                </p>
              </div>
            </div>
            <div>
              <Label className="text-xs sm:text-sm">OTP Code</Label>
              <Input
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                placeholder="Enter 6-digit OTP"
                className="mt-1.5 h-10 text-sm tracking-[0.35em]"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => resendOtpMutation.mutate()}
                disabled={resendOtpMutation.isPending}
                className="flex-1"
              >
                {resendOtpMutation.isPending ? 'Sending...' : 'Resend OTP'}
              </Button>
              <Button
                type="button"
                disabled={withdrawMutation.isPending || otpCode.length !== 6}
                onClick={() => withdrawMutation.mutate()}
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {withdrawMutation.isPending ? 'Submitting...' : 'Submit Withdrawal'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
