import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { eventsService } from '@/services/events';

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

  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [txData, setTxData] = useState<any>(null);

  useEffect(() => {
    if (!reference) { setStatus('failed'); return; }

    if (urlStatus === 'failed' || urlStatus === 'error') {
      setStatus('failed');
      return;
    }

    // Guest ticket success — no transaction exists, everything is in URL params
    if (urlStatus === 'success' && isFree && isGuest) {
      setStatus('success');
      return;
    }

    // Guest donation success — transaction exists but no redirect needed
    if (urlStatus === 'success' && isGuest && urlType === 'donation') {
      eventsService.getTransactionByReference(reference)
        .then(data => { setTxData(data); setStatus('success'); })
        .catch(() => setStatus('success'));
      return;
    }

    if (urlStatus === 'success' && urlType) {
      // Backend already verified — fetch full transaction info to display
      eventsService.getTransactionByReference(reference)
        .then(data => { setTxData(data); setStatus('success'); })
        .catch(() => {
          // Still show success even if fetch fails — backend confirmed it
          setStatus('success');
        });

      // Auto-redirect only for logged-in users
      if (!isGuest) {
        setTimeout(() => {
          if (urlType === 'donation') navigate('/dashboard/giving');
          else if (urlType === 'package_subscription') navigate('/dashboard/packages');
          else navigate('/dashboard/my-tickets');
        }, 3000);
      }
      return;
    }

    // No status in URL — shouldn't happen with Paychangu (backend always redirects with status)
    // Fallback for Paystack verify flow
    import('@/lib/api-client').then(({ default: apiClient }) => {
      apiClient.get(`/payments/verify/${reference}`)
        .then(res => {
          if (res.data.success && res.data.data.status === 'success') {
            const type = res.data.data.metadata?.type || 'event_ticket';
            setTxData({ type, reference });
            setStatus('success');
            if (!isGuest) {
              setTimeout(() => {
                if (type === 'donation') navigate('/dashboard/giving');
                else if (type === 'package_subscription') navigate('/dashboard/packages');
                else navigate('/dashboard/my-tickets');
              }, 3000);
            }
          } else {
            setStatus('failed');
          }
        })
        .catch(() => setStatus('failed'));
    });
  }, [reference, urlStatus, urlType, isGuest, isFree, navigate]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin text-accent mx-auto" />
          <h1 className="text-2xl font-bold">Verifying Payment...</h1>
          <p className="text-muted-foreground">Please wait</p>
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
