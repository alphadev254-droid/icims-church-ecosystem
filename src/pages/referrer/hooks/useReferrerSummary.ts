import { useMemo } from 'react';

export function useReferrerSummary(data: any) {
  return useMemo(() => {
    if (data?.summary) {
      return {
        totalCredits: Number(data.summary.totalCredits || 0),
        totalWithdrawn: Number(data.summary.totalWithdrawn || 0),
        pendingWithdrawals: Number(data.summary.pendingWithdrawals || 0),
        referralsCount: Number(data.summary.referralsCount || 0),
      };
    }

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
