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
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Recent wallet activity</CardTitle>
          <CardDescription>Latest commission and payout movements.</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild className="w-full justify-center sm:w-auto">
          <Link to="/dashboard/referrals/wallet">View all <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="hidden sm:block">
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
        </div>
        <div className="space-y-3 sm:hidden">
          {recentLedger.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground"><Clock className="mx-auto mb-2 h-5 w-5" />No wallet activity yet.</div>
          ) : recentLedger.map((entry: any) => (
            <div key={entry.id} className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium capitalize">{entry.direction} / {entry.category}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString()}</p>
                </div>
                <p className={entry.direction === 'credit' ? 'shrink-0 text-sm font-semibold text-emerald-600' : 'shrink-0 text-sm font-semibold text-destructive'}>
                  {entry.direction === 'credit' ? '+' : '-'}{money(entry.amount, entry.currency)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
