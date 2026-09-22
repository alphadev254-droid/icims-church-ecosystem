import { useMemo } from 'react';

export function useReferrerSummary(data: any) {
  return useMemo(() => {
    const ledger = data?.ledger || [];
    const totalCredits = ledger
      .filter((entry: any) => entry.direction === 'credit')
      .reduce((sum: number, entry: any) => sum + Number(entry.amount), 0);
    const totalWithdrawn = ledger
      .filter((entry: any) => entry.direction === 'debit')
      .reduce((sum: number, entry: any) => sum + Number(entry.amount), 0);
    const pendingWithdrawals = (data?.withdrawals || []).filter((withdrawal: any) => withdrawal.status === 'pending').length;

    return {
      totalCredits,
      totalWithdrawn,
      pendingWithdrawals,
      referralsCount: (data?.referrals || []).length,
    };
  }, [data]);
}
