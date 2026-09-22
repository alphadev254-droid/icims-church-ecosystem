import { ReferrerStatusNotice, LoadingState, useReferrerDashboardData } from './shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ReferrerReferralsPage() {
  const { data, isLoading } = useReferrerDashboardData();

  if (isLoading) return <LoadingState label="Loading referrals..." />;

  const referrals = data?.referrals || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Referrals</h1>
        <p className="text-sm text-muted-foreground">Ministries that registered through your marketer code or link.</p>
      </div>

      <ReferrerStatusNotice referrer={data?.referrer} />

      <Card>
        <CardHeader>
          <CardTitle>Referred ministries</CardTitle>
          <CardDescription>Track who joined through your marketer link.</CardDescription>
        </CardHeader>
        <CardContent>
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
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No referrals yet.</TableCell></TableRow>
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
        </CardContent>
      </Card>
    </div>
  );
}
