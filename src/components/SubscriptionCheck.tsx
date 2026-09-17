import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export function SubscriptionCheck() {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    // Only check for non-members.
    if (!user || user.roleName === 'member') {
      setShowDialog(false);
      return;
    }

    setShowDialog(!user.package);
  }, [user]);

  if (!showDialog) return null;

  const subscription = user?.subscription;
  const expired = subscription?.status === 'expired'
    || Boolean(subscription?.expiresAt && new Date(subscription.expiresAt).getTime() <= Date.now());
  const hasPreviousSubscription = Boolean(subscription?.startsAt || subscription?.expiresAt);
  const formatDate = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  const startedOn = formatDate(subscription?.startsAt);
  const expiredOn = formatDate(subscription?.expiresAt);
  const title = expired ? 'Subscription Expired' : hasPreviousSubscription ? 'Subscription Inactive' : 'Subscription Required';

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-full dark:bg-amber-900/30">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
          <div className="space-y-3 text-sm text-muted-foreground">
            {expired ? (
              <>
                <p>
                  Your {subscription?.packageName ? <strong>{subscription.packageName}</strong> : 'last'} subscription
                  {expiredOn ? <> expired on <strong>{expiredOn}</strong></> : ' has expired'}.
                  {' '}Subscribe again to restore your package features.
                </p>
                {startedOn && expiredOn && (
                  <div className="rounded-md bg-muted p-3 text-xs">
                    <p className="font-medium text-foreground">Previous subscription period</p>
                    <p className="mt-1 text-muted-foreground">{startedOn} – {expiredOn}</p>
                  </div>
                )}
              </>
            ) : hasPreviousSubscription ? (
              <p>
                Your previous subscription is no longer active{expiredOn ? <>. Its recorded service end date is <strong>{expiredOn}</strong></> : ''}.
                {' '}Choose a package to restore access.
              </p>
            ) : (
              <p>
                You have not subscribed to a package yet. Choose a package to start using ICIMS services.
              </p>
            )}
            <div className="bg-muted rounded-md p-3 text-xs space-y-1">
              <p className="font-medium text-foreground">Why subscribe?</p>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                <li>Access all church management features</li>
                <li>Manage multiple churches and members</li>
                <li>Track events, giving, and attendance</li>
                <li>Generate reports and analytics</li>
              </ul>
            </div>
          </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setShowDialog(false)}
            className="w-full sm:w-auto"
          >
            Remind Me Later
          </Button>
          <Button
            onClick={() => {
              setShowDialog(false);
              navigate('/dashboard/packages');
            }}
            className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90"
          >
            View Packages
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
