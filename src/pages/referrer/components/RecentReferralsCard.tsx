import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function RecentReferralsCard({ referrals }: { referrals: any[] }) {
  const recentReferrals = referrals.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Recent ministries</CardTitle>
          <CardDescription>Latest ministries linked to your marketer account.</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild className="w-full justify-center sm:w-auto">
          <Link to="/dashboard/referrals/my-referrals">View all <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="hidden sm:block">
          <Table>
          <TableHeader><TableRow><TableHead>Ministry</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {recentReferrals.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">No ministries yet.</TableCell></TableRow>
            ) : recentReferrals.map((referral: any) => (
              <TableRow key={referral.id}>
                <TableCell>{referral.ministryAdmin?.ministryName || referral.church?.name || referral.ministryAdmin?.email || 'Ministry'}</TableCell>
                <TableCell className="capitalize">{referral.status || 'registered'}</TableCell>
                <TableCell>{new Date(referral.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </div>
        <div className="space-y-3 sm:hidden">
          {recentReferrals.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No ministries yet.</div>
          ) : recentReferrals.map((referral: any) => (
            <div key={referral.id} className="rounded-lg border bg-muted/30 p-3">
              <p className="break-words text-sm font-medium">{referral.ministryAdmin?.ministryName || referral.church?.name || referral.ministryAdmin?.email || 'Ministry'}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="capitalize">{referral.status || 'registered'}</span>
                <span>{new Date(referral.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

