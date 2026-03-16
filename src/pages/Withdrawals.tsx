import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { walletService } from '@/services/wallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, Plus, ArrowDownToLine } from 'lucide-react';
import { ExportImportButtons } from '@/components/ExportImportButtons';

export default function WithdrawalsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');

  const { data: balance } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: walletService.getBalance,
    enabled: user?.accountCountry === 'Malawi',
  });

  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ['withdrawals', appliedStartDate, appliedEndDate],
    queryFn: () => walletService.getWithdrawals({
      startDate: appliedStartDate || undefined,
      endDate: appliedEndDate || undefined,
    }),
    enabled: user?.accountCountry === 'Malawi',
  });

  const handleApplyFilters = () => {
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setAppliedStartDate('');
    setAppliedEndDate('');
  };

  const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' | 'outline' =>
    s === 'completed' ? 'default' : s === 'processing' ? 'outline' : s === 'failed' ? 'destructive' : 'secondary';

  const formatCurrency = (amount: number) => `MWK ${amount.toLocaleString()}`;

  // Block access for non-Malawi accounts (after all hooks)
  if (user?.accountCountry !== 'Malawi') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Withdrawals Not Available</h2>
            <p className="text-muted-foreground">Withdrawals are only available for Malawi accounts.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">Withdrawals</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Manage wallet withdrawals</p>
        </div>
        <div className="flex gap-2 self-end sm:self-auto">
          <ExportImportButtons
            data={withdrawals.map((w: any) => ({
              amount: w.amount,
              fee: w.fee,
              netAmount: w.netAmount,
              method: w.method.replace('_', ' '),
              status: w.status,
              date: new Date(w.createdAt).toLocaleDateString(),
            }))}
            filename="withdrawals"
            headers={[
              { label: 'Amount', key: 'amount' },
              { label: 'Fee', key: 'fee' },
              { label: 'Net Amount', key: 'netAmount' },
              { label: 'Method', key: 'method' },
              { label: 'Status', key: 'status' },
              { label: 'Date', key: 'date' },
            ]}
            pdfTitle="Withdrawals Report"
          />
          <Button 
            onClick={() => navigate('/dashboard/withdrawals/request')} 
            className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 h-8 text-xs sm:h-9 sm:text-sm"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Request Withdrawal
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold font-heading">
            {balance ? formatCurrency(balance.balance) : 'MWK 0'}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[140px]">
                  <Label className="text-xs sm:text-sm">Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-xs sm:h-10 sm:text-sm" />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <Label className="text-xs sm:text-sm">End Date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8 text-xs sm:h-10 sm:text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleApplyFilters} variant="default" className="h-8 text-xs sm:h-10 sm:text-sm">
                    Apply
                  </Button>
                  <Button onClick={handleClearFilters} variant="outline" className="h-8 text-xs sm:h-10 sm:text-sm">
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
          <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table className="min-w-[500px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                  <TableHead className="text-xs sm:text-sm">Fee</TableHead>
                  <TableHead className="text-xs sm:text-sm">Net Amount</TableHead>
                  <TableHead className="text-xs sm:text-sm">Method</TableHead>
                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="text-xs sm:text-sm">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((w: any) => (
                  <TableRow key={w.id}>
                    <TableCell className="text-xs sm:text-sm font-medium whitespace-nowrap">{formatCurrency(w.amount)}</TableCell>
                    <TableCell className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{formatCurrency(w.fee)}</TableCell>
                    <TableCell className="text-xs sm:text-sm font-semibold whitespace-nowrap">{formatCurrency(w.netAmount)}</TableCell>
                    <TableCell className="text-xs sm:text-sm capitalize whitespace-nowrap">{w.method.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(w.status)} className="text-xs">{w.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(w.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {withdrawals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <ArrowDownToLine className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No withdrawals yet.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          </CardContent>
        </Card>
        </>
      )}
    </div>
  );
}
