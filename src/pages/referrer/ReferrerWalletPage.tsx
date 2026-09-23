import { Banknote, Handshake, Wallet } from 'lucide-react';
import { ReferrerStatusNotice, LoadingState, money, referrerCurrency, useReferrerDashboardData, useReferrerSummary } from './shared';
import { SummaryCard } from './components/SummaryCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ReferrerWalletPage() {
  const { data, isLoading } = useReferrerDashboardData();
  const summary = useReferrerSummary(data);

  if (isLoading) return <LoadingState label="Loading wallet..." />;

  const ledger = data?.ledger || [];
  const currency = referrerCurrency(data);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Wallet Ledger</h1>
        <p className="text-sm text-muted-foreground">Every credit and withdrawal is recorded as a ledger transaction.</p>
      </div>

      <ReferrerStatusNotice referrer={data?.referrer} />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Current Balance" value={money(data?.balance, currency)} icon={Wallet} />
        <SummaryCard title="Total Credits" value={money(summary.totalCredits, currency)} icon={Handshake} />
        <SummaryCard title="Total Withdrawn" value={money(summary.totalWithdrawn, currency)} icon={Banknote} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger transactions</CardTitle>
          <CardDescription>Credits increase the wallet; debits reduce it when withdrawal is requested.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance After</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No wallet transactions yet.</TableCell></TableRow>
              ) : ledger.map((entry: any) => (
                <TableRow key={entry.id}>
                  <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="capitalize">{entry.direction} / {entry.category}</TableCell>
                  <TableCell>{entry.description || entry.sourceType || '-'}</TableCell>
                  <TableCell className={entry.direction === 'credit' ? 'text-right text-emerald-600' : 'text-right text-destructive'}>{entry.direction === 'credit' ? '+' : '-'}{money(entry.amount, entry.currency)}</TableCell>
                  <TableCell className="text-right">{money(entry.balanceAfter, entry.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
