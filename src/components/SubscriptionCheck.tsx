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
    // Only check for non-members (national_admin, regional_leader, district_overseer, local_admin)
    if (!user || user.roleName === 'member') return;

    // Check if user has no package or subscription is expired
    const hasNoPackage = !user.package;
    
    if (hasNoPackage) {
      setShowDialog(true);
    }
  }, [user]);

  if (!showDialog) return null;

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-full dark:bg-amber-900/30">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <AlertDialogTitle className="text-lg">Subscription Required</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 text-sm">
            <p>
              You don't have an active subscription. To continue accessing ICIMS services, 
              please subscribe to a package.
            </p>
            <div className="bg-muted rounded-md p-3 text-xs space-y-1">
              <p className="font-medium text-foreground">Why subscribe?</p>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                <li>Access all church management features</li>
                <li>Manage multiple churches and members</li>
                <li>Track events, giving, and attendance</li>
                <li>Generate reports and analytics</li>
              </ul>
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
