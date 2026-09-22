import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function RecentReferralsCard({ referrals }: { referrals: any[] }) {
  const recentReferrals = referrals.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div><CardTitle>Recent ministries</CardTitle><CardDescription>Latest ministries linked to your marketer account.</CardDescription></div>
        <Button variant="ghost" size="sm" asChild><Link to="/dashboard/referrals/my-referrals">View all <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}

