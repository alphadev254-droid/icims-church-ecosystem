import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState, ReferrerStatusNotice, money, useReferrerDashboardData } from './shared';

export default function ReferrerPayoutsPage() {
  const { data, isLoading } = useReferrerDashboardData();

  if (isLoading) return <LoadingState label="Loading payouts..." />;

  const payouts = data?.withdrawals || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payouts</h1>
        <p className="text-sm text-muted-foreground">View payout activity processed by ICIMS admins.</p>
      </div>

      <ReferrerStatusNotice referrer={data?.referrer} />

      <Card>
        <CardHeader>
          <CardTitle>Admin-managed payouts</CardTitle>
          <CardDescription>
            Marketers cannot initiate payouts directly. ICIMS admins review wallet balances and process payouts from the admin side.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-muted p-4 text-sm text-muted-foreground">
            Available balance: <span className="font-medium text-foreground">{money(data?.balance)}</span>. Keep your payout settings updated so admins can process payouts correctly.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payout history</CardTitle>
          <CardDescription>Payout records and their current processing status.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No payouts yet.</TableCell></TableRow>
              ) : payouts.map((payout: any) => (
                <TableRow key={payout.id}>
                  <TableCell>{new Date(payout.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="capitalize">{payout.status}</TableCell>
                  <TableCell className="capitalize">{payout.method}</TableCell>
                  <TableCell>{payout.mobileNumber || payout.accountNumber || '-'}</TableCell>
                  <TableCell className="text-right">{money(payout.amount, payout.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


