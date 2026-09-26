import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { isReferrerVerified } from '../utils/referrerStatus';

export function ReferrerStatusNotice({ referrer, dashboard = false }: { referrer: any; dashboard?: boolean }) {
  if (isReferrerVerified(referrer)) return null;
  const agreementStatus = referrer?.agreementStatus || 'not_submitted';
  const needsAgreement = ['not_submitted', 'rejected'].includes(agreementStatus);
  const message = agreementStatus === 'pending_review'
    ? 'Your signed agreement is awaiting admin verification. You can view this page, but earnings and payouts become active after approval.'
    : agreementStatus === 'rejected'
      ? 'Your signed agreement was rejected. Open your profile to view the reason and upload a corrected copy.'
      : needsAgreement
        ? 'Complete your marketer profile and upload your signed agreement before admin verification.'
        : 'Your marketer account is still pending approval. You can view this page, but earnings and payouts become active after verification.';

  return (
    <Card className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
        <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
        <div>
          <CardTitle>{dashboard ? 'Waiting verification' : 'Not verified'}</CardTitle>
          <CardDescription className="text-amber-900/80 dark:text-amber-100/80">
            {message}
          </CardDescription>
        </div>
        </div>
        {needsAgreement && (
          <Button asChild size="sm" variant="outline" className="shrink-0 border-amber-300 bg-transparent">
            <Link to="/dashboard/referrals/profile">Open Profile</Link>
          </Button>
        )}
      </CardHeader>
    </Card>
  );
}
