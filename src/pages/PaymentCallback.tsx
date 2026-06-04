import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { eventsService } from '@/services/events';
import apiClient from '@/lib/api-client';

export default function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reference = searchParams.get('reference');
  const urlStatus = searchParams.get('status');
  const urlType = searchParams.get('type');
  const isGuest = searchParams.get('isGuest') === 'true';
  const isFree = searchParams.get('isFree') === 'true';
  const urlGuestName = searchParams.get('guestName');
  const urlGuestEmail = searchParams.get('guestEmail');
  const urlAmount = searchParams.get('amount');
  const urlCurrency = searchParams.get('currency');

  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'timeout'>('loading');
  const [txData, setTxData] = useState<any>(null);
  const [attempts, setAttempts] = useState(0);

  // Poll for payment status
  const pollPaymentStatus = useCallback(async (currentAttempt: number) => {
    if (!reference) return;
    
    const MAX_ATTEMPTS = 15; // 30 seconds (2s * 15)
    
    try {
      // Use new polling endpoint
      const res = await apiClient.get(`/payment/status/${reference}`);
      const result = res.data;
      
      if (result.found && result.status === 'completed') {
        // Payment found and completed
        setTxData(result);
        setStatus('success');
        
        // Auto-redirect for logged-in users
        if (!isGuest) {
          const type = result.type || urlType;
          setTimeout(() => {
            if (type === 'donation') navigate('/dashboard/giving');
            else if (type === 'package_subscription') navigate('/dashboard/packages');
            else navigate('/dashboard/my-tickets');
          }, 3000);
        }
        return;
      }
      
      // Not found yet, continue polling if not maxed out
      if (currentAttempt < MAX_ATTEMPTS) {
        setAttempts(currentAttempt + 1);
        setTimeout(() => pollPaymentStatus(currentAttempt + 1), 2000);
      } else {
        // Max attempts reached
        setStatus('timeout');
      }
    } catch (error) {
      console.error('Polling error:', error);
      if (currentAttempt < MAX_ATTEMPTS) {
        setAttempts(currentAttempt + 1);
        setTimeout(() => pollPaymentStatus(currentAttempt + 1), 2000);
      } else {
        setStatus('timeout');
      }
    }
  }, [reference, isGuest, urlType, navigate]);

  useEffect(() => {
    if (!reference) { 
      setStatus('failed'); 
      return; 
    }

    // Immediate failure from URL
    if (urlStatus === 'failed' || urlStatus === 'error') {
      setStatus('failed');
      return;
    }

    // Guest free ticket - no payment needed
    if (urlStatus === 'success' && isFree && isGuest) {
      setStatus('success');
      return;
    }

    // If URL has success status, we can show success immediately 
    // but still poll for full transaction data
    if (urlStatus === 'success') {
      // Start polling to get full transaction details
      pollPaymentStatus(0);
      return;
    }

    // No status in URL - poll for payment
    pollPaymentStatus(0);
  }, [reference, urlStatus, isFree, isGuest, pollPaymentStatus]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin text-accent mx-auto" />
          <h1 className="text-2xl font-bold">Verifying Payment...</h1>
          <p className="text-muted-foreground">Checking payment status (attempt {attempts}/15)</p>
          <p className="text-xs text-muted-foreground">Reference: {reference}</p>
        </div>
      </div>
    );
  }

  if (status === 'timeout') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin text-accent mx-auto" />
          <h1 className="text-2xl font-bold">Payment Processing...</h1>
          <p className="text-muted-foreground">Your payment is still being processed. This may take a few moments.</p>
          <p className="text-sm text-muted-foreground font-mono">Ref: {reference}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => window.location.reload()}>Check Again</Button>
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </div>
          <p className="text-xs text-muted-foreground">You will receive an email confirmation once complete.</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <XCircle className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Payment Failed</h1>
          <p className="text-muted-foreground">Your payment could not be processed.</p>
          {reference && <p className="text-sm text-muted-foreground font-mono">Ref: {reference}</p>}
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
            <Button onClick={() => navigate(-1)}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  const type = txData?.type || urlType;
  const isDonation = type === 'donation';
  const isPackage = type === 'package_subscription';
  const isTicket = type === 'event_ticket';

  // Guest donation success — no redirect, show receipt info
  if (isGuest && isDonation) {
    const displayName = txData?.guestName || urlGuestName;
    const displayEmail = txData?.guestEmail || urlGuestEmail;
    const displayAmount = txData?.baseAmount || (urlAmount ? parseFloat(urlAmount) : null);
    const displayCurrency = txData?.currency || urlCurrency;

    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center space-y-6 max-w-md w-full">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <div>
            <h1 className="text-2xl font-bold">Giving Successful!</h1>
            {txData?.campaignName && (
              <p className="text-muted-foreground mt-1">{txData.campaignName}</p>
            )}
          </div>

          <div className="bg-muted rounded-lg p-4 space-y-3 text-left text-sm">
            {displayName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{displayName}</span>
              </div>
            )}
            {displayAmount && displayCurrency && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount given</span>
                <span className="font-medium">{displayCurrency} {Number(displayAmount).toLocaleString()}</span>
              </div>
            )}
            {reference && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono text-xs">{reference}</span>
              </div>
            )}
          </div>

          <div className="flex items-start gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 text-left">
            <Mail className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-green-800 dark:text-green-300">Receipt sent to your email</p>
              {displayEmail && (
                <p className="text-green-700 dark:text-green-400 mt-0.5">
                  Your giving receipt has been sent to <strong>{displayEmail}</strong>. Check your inbox.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Guest ticket success — no redirect, show full info
  if (isGuest && isTicket) {
    const displayName = txData?.guestName || urlGuestName;
    const displayEmail = txData?.guestEmail || urlGuestEmail;
    const displayTickets: string[] = txData?.tickets?.length > 0 ? txData.tickets : (reference ? [reference] : []);

    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center space-y-6 max-w-md w-full">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <div>
            <h1 className="text-2xl font-bold">{isFree ? 'Ticket Confirmed!' : 'Payment Successful!'}</h1>
            {txData?.eventTitle && (
              <p className="text-muted-foreground mt-1">{txData.eventTitle}</p>
            )}
          </div>

          <div className="bg-muted rounded-lg p-4 space-y-3 text-left text-sm">
            {displayName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{displayName}</span>
              </div>
            )}
            {!isFree && txData?.baseAmount && txData?.currency && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount paid</span>
                <span className="font-medium">{txData.currency} {Number(txData.baseAmount).toLocaleString()}</span>
              </div>
            )}
            {isFree && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount paid</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
            )}
            {displayTickets.length > 0 && (
              <div className="flex justify-between items-start gap-2">
                <span className="text-muted-foreground">Ticket{displayTickets.length > 1 ? 's' : ''}</span>
                <div className="text-right space-y-1">
                  {displayTickets.map((t: string) => (
                    <div key={t} className="flex items-center gap-1 font-mono text-xs">
                      <Ticket className="h-3 w-3" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!isFree && reference && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono text-xs">{reference}</span>
              </div>
            )}
          </div>

          <div className="flex items-start gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 text-left">
            <Mail className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-green-800 dark:text-green-300">Ticket sent to your email</p>
              {displayEmail && (
                <p className="text-green-700 dark:text-green-400 mt-0.5">
                  Your ticket {!isFree && 'and receipt '}ha{!isFree ? 've' : 's'} been sent to <strong>{displayEmail}</strong>. Check your inbox and spam folder.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Logged-in user success — auto-redirecting
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h1 className="text-2xl font-bold">
          {isPackage ? 'Subscription Successful!' : isDonation ? 'Giving Successful!' : 'Payment Successful!'}
        </h1>
        <p className="text-muted-foreground">
          {isPackage ? 'Your package subscription has been activated.' : isDonation ? 'Thank you for your generous giving.' : 'Your ticket has been confirmed.'}
        </p>
        {reference && <p className="text-sm text-muted-foreground">Ref: {reference}</p>}
        <p className="text-sm text-muted-foreground">Redirecting...</p>
        <Button onClick={() => navigate(isPackage ? '/dashboard/packages' : isDonation ? '/dashboard/giving' : '/dashboard/my-tickets')}>
          {isPackage ? 'View Packages' : isDonation ? 'View Campaigns' : 'View My Tickets'}
        </Button>
      </div>
    </div>
  );
}
