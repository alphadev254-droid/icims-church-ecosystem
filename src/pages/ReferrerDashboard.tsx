import { Banknote, Handshake, Users, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ReferrerStatusNotice, LoadingState, money, referrerCurrency, useReferrerDashboardData, useReferrerSummary, isReferrerVerified } from './referrer/shared';
import { SummaryCard } from './referrer/components/SummaryCard';
import { MarketingLinkCard } from './referrer/components/MarketingLinkCard';
import { RecentReferralsCard } from './referrer/components/RecentReferralsCard';
import { RecentWalletActivityCard } from './referrer/components/RecentWalletActivityCard';

export default function ReferrerDashboard() {
  const { data, isLoading } = useReferrerDashboardData();
  const summary = useReferrerSummary(data);

  if (isLoading) return <LoadingState label="Loading marketer dashboard..." />;

  const referrer = data?.referrer;
  const referrals = data?.referrals || [];
  const ledger = data?.ledger || [];
  const verified = isReferrerVerified(referrer);
  const currency = referrerCurrency(data);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Marketer Dashboard</h1>
          <p className="text-sm text-muted-foreground">Summary of your wallet, ministries, and account status.</p>
        </div>
        <Badge variant={verified ? 'default' : 'secondary'} className="w-fit capitalize">
          {verified ? 'verified' : 'waiting verification'}
        </Badge>
      </div>

      <ReferrerStatusNotice referrer={referrer} dashboard />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Wallet Balance" value={money(data?.balance, currency)} icon={Wallet} />
        <SummaryCard title="Total Earned" value={money(summary.totalCredits, currency)} icon={Handshake} />
        <SummaryCard title="Withdrawn" value={money(summary.totalWithdrawn, currency)} icon={Banknote} />
        <SummaryCard title="Partnered Ministries" value={summary.referralsCount} icon={Users} />
      </div>

      <MarketingLinkCard referralLink={referrer?.referralLink} verified={verified} />

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentReferralsCard referrals={referrals} />
        <RecentWalletActivityCard ledger={ledger} />
      </div>
    </div>
  );
}



