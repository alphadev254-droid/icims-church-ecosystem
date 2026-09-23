import { ReferrerStatusNotice, LoadingState, useReferrerDashboardData } from './shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ReferrerReferralsPage() {
  const { data, isLoading } = useReferrerDashboardData();

  if (isLoading) return <LoadingState label="Loading ministries..." />;

  const referrals = data?.referrals || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Partnered Ministries</h1>
        <p className="text-sm text-muted-foreground">Ministries that registered through your marketer link.</p>
      </div>

      <ReferrerStatusNotice referrer={data?.referrer} />

      <Card>
        <CardHeader>
          <CardTitle>Partnered ministries</CardTitle>
          <CardDescription>Track ministries that joined through your marketer link.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ministry</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Church</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No ministries yet.</TableCell></TableRow>
                ) : referrals.map((referral: any) => (
                  <TableRow key={referral.id}>
                    <TableCell>{referral.ministryAdmin?.ministryName || referral.church?.name || 'Ministry'}</TableCell>
                    <TableCell>{referral.ministryAdmin?.email || `${referral.ministryAdmin?.firstName || ''} ${referral.ministryAdmin?.lastName || ''}`.trim() || '-'}</TableCell>
                    <TableCell>{referral.church?.name || '-'}</TableCell>
                    <TableCell className="capitalize">{referral.status || 'registered'}</TableCell>
                    <TableCell>{new Date(referral.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-3 md:hidden">
            {referrals.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No ministries yet.</div>
            ) : referrals.map((referral: any) => {
              const adminName = referral.ministryAdmin?.email || `${referral.ministryAdmin?.firstName || ''} ${referral.ministryAdmin?.lastName || ''}`.trim() || '-';
              return (
                <div key={referral.id} className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium">{referral.ministryAdmin?.ministryName || referral.church?.name || 'Ministry'}</p>
                      <p className="mt-1 break-words text-xs text-muted-foreground">{adminName}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-xs capitalize text-muted-foreground">{referral.status || 'registered'}</span>
                  </div>
                  <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                    <span className="break-words">Church: {referral.church?.name || '-'}</span>
                    <span>Joined: {new Date(referral.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


