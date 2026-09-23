import { ReferrerStatusNotice, LoadingState, useReferrerDashboardData, PageShell, PageHeader, CardTitleRow } from './shared';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ReferrerReferralsPage() {
  const { data, isLoading } = useReferrerDashboardData();

  if (isLoading) return <LoadingState label="Loading ministries..." />;

  const referrals = data?.referrals || [];

  return (
    <PageShell>
      <PageHeader
        title="Partnered Ministries"
        description="Ministries that registered through your marketer link."
      />

      <ReferrerStatusNotice referrer={data?.referrer} />

      <Card>
        <CardTitleRow title="Partnered ministries" description="Track ministries that joined through your marketer link." />
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
        </CardContent>
      </Card>
    </PageShell>
  );
}


