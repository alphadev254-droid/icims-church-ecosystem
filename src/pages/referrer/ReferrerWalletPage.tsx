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
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Wallet Ledger</h1>
        <p className="text-sm text-muted-foreground">Every credit and withdrawal is recorded as a ledger transaction.</p>
      </div>

      <ReferrerStatusNotice referrer={data?.referrer} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard title="Current Balance" value={money(data?.balance, currency)} icon={Wallet} />
        <SummaryCard title="Total Credits" value={money(summary.totalCredits, currency)} icon={Handshake} />
        <SummaryCard title="Total Withdrawn" value={money(summary.totalWithdrawn, currency)} icon={Banknote} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger transactions</CardTitle>
          <CardDescription>Credits increase the wallet; debits reduce it when payouts are processed.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="hidden overflow-x-auto md:block">
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
          </div>
          <div className="space-y-3 md:hidden">
            {ledger.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No wallet transactions yet.</div>
            ) : ledger.map((entry: any) => (
              <div key={entry.id} className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium capitalize">{entry.direction} / {entry.category}</p>
                    <p className="mt-1 break-words text-xs text-muted-foreground">{entry.description || entry.sourceType || '-'}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={entry.direction === 'credit' ? 'text-sm font-semibold text-emerald-600' : 'text-sm font-semibold text-destructive'}>
                      {entry.direction === 'credit' ? '+' : '-'}{money(entry.amount, entry.currency)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Bal. {money(entry.balanceAfter, entry.currency)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
