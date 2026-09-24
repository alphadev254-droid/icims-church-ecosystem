import { Banknote, Handshake, Users, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ReferrerStatusNotice, LoadingState, money, referrerCurrency, useReferrerDashboardData, useReferrerSummary, isReferrerVerified, PageHeader, PageShell, SummaryGrid } from './referrer/shared';
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
    <PageShell>
      <PageHeader
        title="Marketer Dashboard"
        description="Summary of your wallet, ministries, and account status."
        action={
        <Badge variant={verified ? 'default' : 'secondary'} className="w-fit capitalize">
          {verified ? 'verified' : 'waiting verification'}
        </Badge>
        }
      />

      <ReferrerStatusNotice referrer={referrer} dashboard />

      <SummaryGrid>
        <SummaryCard title="Wallet Balance" value={money(data?.balance, currency)} icon={Wallet} />
        <SummaryCard title="Total Earned" value={money(summary.totalCredits, currency)} icon={Handshake} />
        <SummaryCard title="Withdrawn" value={money(summary.totalWithdrawn, currency)} icon={Banknote} />
        <SummaryCard title="Partnered Ministries" value={summary.referralsCount} icon={Users} />
      </SummaryGrid>

      <MarketingLinkCard referralCode={referrer?.code} referralLink={referrer?.referralLink} verified={verified} />

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentReferralsCard referrals={referrals} />
        <RecentWalletActivityCard ledger={ledger} />
      </div>
    </PageShell>
  );
}



