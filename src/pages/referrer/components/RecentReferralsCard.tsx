import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CardTitleRow } from './PageStates';

export function RecentReferralsCard({ referrals }: { referrals: any[] }) {
  const recentReferrals = referrals.slice(0, 5);

  return (
    <Card>
      <CardTitleRow
        title="Recent ministries"
        description="Latest ministries linked to your marketer account."
        action={(
          <Button variant="ghost" size="sm" asChild className="w-full justify-center sm:w-auto">
            <Link to="/dashboard/referrals/my-referrals">View all <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        )}
      />
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

