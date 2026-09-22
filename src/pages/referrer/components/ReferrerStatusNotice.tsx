import { AlertTriangle } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isReferrerVerified } from '../utils/referrerStatus';

export function ReferrerStatusNotice({ referrer, dashboard = false }: { referrer: any; dashboard?: boolean }) {
  if (isReferrerVerified(referrer)) return null;

  return (
    <Card className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
        <div>
          <CardTitle>{dashboard ? 'Waiting verification' : 'Not verified'}</CardTitle>
          <CardDescription className="text-amber-900/80 dark:text-amber-100/80">
            Your marketer account is still pending approval. You can view this page, but earnings and withdrawals become active after verification.
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}
