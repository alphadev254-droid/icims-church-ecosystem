import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { money } from '../utils/money';

export function RecentWalletActivityCard({ ledger }: { ledger: any[] }) {
  const recentLedger = ledger.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div><CardTitle>Recent wallet activity</CardTitle><CardDescription>Latest commission and withdrawal movements.</CardDescription></div>
        <Button variant="ghost" size="sm" asChild><Link to="/dashboard/referrals/wallet">View all <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
          <TableBody>
            {recentLedger.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground"><Clock className="mx-auto mb-2 h-5 w-5" />No wallet activity yet.</TableCell></TableRow>
            ) : recentLedger.map((entry: any) => (
              <TableRow key={entry.id}>
                <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="capitalize">{entry.direction} / {entry.category}</TableCell>
                <TableCell className={entry.direction === 'credit' ? 'text-right text-emerald-600' : 'text-right text-destructive'}>{entry.direction === 'credit' ? '+' : '-'}{money(entry.amount, entry.currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
