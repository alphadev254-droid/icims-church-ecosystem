import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api-client';

export default function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference = searchParams.get('reference');
  const urlStatus = searchParams.get('status');
  const urlType = searchParams.get('type');
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [data, setData] = useState<any>(null);
  const [transactionType, setTransactionType] = useState<'event_ticket' | 'donation' | 'package_subscription' | null>(null);

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      return;
    }

    // If status is already in URL (from backend redirect), handle it
    if (urlStatus === 'failed' || urlStatus === 'error') {
      setStatus('failed');
      setTransactionType(urlType as any);
      return;
    }

    // If status is success and type is provided, skip verification (already processed by backend)
    if (urlStatus === 'success' && urlType) {
      setStatus('success');
      setTransactionType(urlType as any);
      setTimeout(() => {
        if (urlType === 'donation') {
          navigate('/dashboard/giving');
        } else if (urlType === 'package_subscription') {
          navigate('/dashboard/packages');
        } else {
          navigate('/dashboard/my-tickets');
        }
      }, 3000);
      return;
    }

    apiClient.get(`/payments/verify/${reference}`)
      .then(res => {
        if (res.data.success && res.data.data.status === 'success') {
          setStatus('success');
          setData(res.data.data);
          const type = res.data.data.metadata?.type || urlType || 'event_ticket';
          setTransactionType(type);
          setTimeout(() => {
            if (type === 'donation') {
              navigate('/dashboard/giving');
            } else if (type === 'package_subscription') {
              navigate('/dashboard/packages');
            } else {
              navigate('/dashboard/my-tickets');
            }
          }, 3000);
        } else {
          setStatus('failed');
          setData(res.data.data);
        }
      })
      .catch(() => setStatus('failed'));
  }, [reference, navigate, urlStatus, urlType]);

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

  if (status === 'success') {
    const isDonation = transactionType === 'donation';
    const isPackage = transactionType === 'package_subscription';
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">
            {isPackage ? 'Subscription Successful!' : isDonation ? 'Donation Successful!' : 'Payment Successful!'}
          </h1>
          <p className="text-muted-foreground">
            {isPackage ? 'Your package subscription has been activated.' : isDonation ? 'Thank you for your generous donation.' : 'Your ticket has been confirmed.'}
          </p>
          {data?.amount && <p className="text-lg font-medium">{data.currency} {data.amount / 100}</p>}
          {reference && <p className="text-sm text-muted-foreground">Ref: {reference}</p>}
          <p className="text-sm">Redirecting...</p>
          <Button onClick={() => navigate(isPackage ? '/dashboard/packages' : isDonation ? '/dashboard/giving' : '/dashboard/my-tickets')}>
            {isPackage ? 'View Packages' : isDonation ? 'View Campaigns' : 'View My Tickets'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <XCircle className="h-16 w-16 text-destructive mx-auto" />
        <h1 className="text-2xl font-bold">Payment Failed</h1>
        <p className="text-muted-foreground">Your payment could not be processed.</p>
        {reference && <p className="text-sm text-muted-foreground">Ref: {reference}</p>}
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={() => navigate(transactionType === 'package_subscription' ? '/dashboard/packages' : '/dashboard/events')}>
            {transactionType === 'package_subscription' ? 'Back to Packages' : 'Back to Events'}
          </Button>
          <Button onClick={() => navigate(transactionType === 'package_subscription' ? '/dashboard/packages' : '/dashboard/events')}>Try Again</Button>
        </div>
      </div>
    </div>
  );
}
