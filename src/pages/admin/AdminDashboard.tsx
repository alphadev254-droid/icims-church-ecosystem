import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CreditCard,
  Globe2,
  Layers3,
  Package,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminApi, type AdminStats } from '@/services/adminApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  sub?: string;
  tone?: 'default' | 'accent' | 'warning';
  wrapValue?: boolean;
};

function StatCard({ label, value, icon: Icon, sub, tone = 'default', wrapValue = false }: StatCardProps) {
  const toneClass = {
    default: 'bg-accent/10 text-accent',
    accent: 'bg-accent text-accent-foreground',
    warning: 'bg-yellow-100 text-yellow-700',
  }[tone];

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className={`${wrapValue ? 'text-lg sm:text-xl whitespace-normal break-words' : 'text-xl truncate'} font-bold leading-tight`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function HealthItem({ label, value, icon: Icon, tone = 'default' }: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: 'default' | 'warning';
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${tone === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-muted text-muted-foreground'}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium truncate">{label}</span>
      </div>
      <span className="text-lg font-bold">{value.toLocaleString()}</span>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats().then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 h-20 animate-pulse bg-muted rounded" /></Card>
          ))}
        </div>
      </div>
    );
  }

  const s = data as AdminStats;
  const activeSubscriptions = s.activeSubscriptions ?? 0;
  const expiredSubscriptions = s.expiredSubscriptions ?? 0;
  const totalSubscriptions = activeSubscriptions + expiredSubscriptions;
  const activeSubscriptionRate = totalSubscriptions > 0
    ? Math.round((activeSubscriptions / totalSubscriptions) * 100)
    : 0;
  const activeUserRate = s.totalUsers > 0
    ? Math.round(((s.activeUsers ?? 0) / s.totalUsers) * 100)
    : 0;

  const countryRows = [
    {
      country: 'Malawi',
      users: s.malawiUsers,
      packagePayments: `MWK ${(s.malawiRevenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      mainRevenue: `MWK ${(s.malawiMainRevenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      payments: s.malawiPayments,
    },
    {
      country: 'Kenya',
      users: s.kenyaUsers,
      packagePayments: `KSH ${(s.kenyaRevenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      mainRevenue: `KSH ${(s.kenyaMainRevenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      payments: s.kenyaPayments,
    },
  ];

  const packagePaymentsText = [
    `MWK ${(s.malawiRevenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    `KSH ${(s.kenyaRevenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
  ].join(' / ');

  const mainRevenueText = [
    `MWK ${(s.malawiMainRevenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    `KSH ${(s.kenyaMainRevenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
  ].join(' / ');

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">System Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Platform health, adoption, subscriptions, and package performance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/users')}>
            Users <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/payments')}>
            Payments <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => navigate('/admin/packages')}>
            Packages <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Users" value={s.totalUsers} icon={Users} tone="accent" sub={`${activeUserRate}% active`} />
        <StatCard label="Ministry Admins" value={s.totalMinistryAdmins} icon={ShieldCheck} />
        <StatCard label="Churches" value={s.totalChurches} icon={Building2} />
        <StatCard label="Members" value={s.totalMembers} icon={UserCheck} />
        <StatCard label="Active Subscriptions" value={activeSubscriptions} icon={Package} tone="accent" sub={`${activeSubscriptionRate}% current`} />
        <StatCard label="Expiring Soon" value={s.expiringSoonSubscriptions ?? 0} icon={AlertTriangle} tone="warning" sub="Next 14 days" />
        <StatCard label="Package Payments" value={packagePaymentsText} icon={CreditCard} sub={`${s.totalPayments} completed`} wrapValue />
        <StatCard label="Main Revenue" value={mainRevenueText} icon={TrendingUp} tone="accent" sub={`${s.mainRevenueTransactions ?? 0} transactions + withdrawals`} wrapValue />
        <StatCard label="Active Packages" value={s.totalPackages ?? 0} icon={Layers3} />
      </div>

      <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent" />
              Platform Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <HealthItem label="Active users" value={s.activeUsers ?? 0} icon={UserCheck} />
              <HealthItem label="Suspended users" value={s.suspendedUsers ?? 0} icon={AlertTriangle} tone="warning" />
              <HealthItem label="Expired subscriptions" value={expiredSubscriptions} icon={AlertTriangle} tone="warning" />
              <HealthItem label="Pending payments" value={s.pendingPayments ?? 0} icon={CreditCard} tone="warning" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">Subscription health</span>
                <span className="text-muted-foreground">{activeSubscriptionRate}% active</span>
              </div>
              <Progress value={activeSubscriptionRate} className="h-2" />
            </div>

            {(s.failedPayments ?? 0) > 0 && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-destructive">Failed payments need review</p>
                  <p className="text-xs text-muted-foreground">{s.failedPayments} failed payment(s) recorded.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/admin/payments')}>Review</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-accent" />
              Country Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 text-left font-medium">Country</th>
                    <th className="py-2 text-right font-medium">Users</th>
                    <th className="py-2 text-right font-medium">Package Payments</th>
                    <th className="py-2 text-right font-medium">Main Revenue</th>
                    <th className="py-2 text-right font-medium">Payments</th>
                  </tr>
                </thead>
                <tbody>
                  {countryRows.map(row => (
                    <tr key={row.country} className="border-b last:border-0">
                      <td className="py-3 font-medium">{row.country}</td>
                      <td className="py-3 text-right">{row.users.toLocaleString()}</td>
                      <td className="py-3 text-right">{row.packagePayments}</td>
                      <td className="py-3 text-right">{row.mainRevenue}</td>
                      <td className="py-3 text-right">{row.payments.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            Package Adoption
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(s.packageBreakdown ?? []).length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {s.packageBreakdown.map(pkg => {
                const activeRate = pkg.total > 0 ? Math.round((pkg.active / pkg.total) * 100) : 0;
                return (
                  <div key={pkg.packageId} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{pkg.displayName}</p>
                        <p className="text-xs text-muted-foreground">{pkg.total.toLocaleString()} subscription(s)</p>
                      </div>
                      <Badge variant="outline">{pkg.active.toLocaleString()} active</Badge>
                    </div>
                    <Progress value={activeRate} className="h-2" />
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-md bg-muted p-2">
                        <p className="font-bold">{pkg.active.toLocaleString()}</p>
                        <p className="text-muted-foreground">Active</p>
                      </div>
                      <div className="rounded-md bg-muted p-2">
                        <p className="font-bold">{pkg.expired.toLocaleString()}</p>
                        <p className="text-muted-foreground">Expired</p>
                      </div>
                      <div className="rounded-md bg-muted p-2">
                        <p className="font-bold">{pkg.cancelled.toLocaleString()}</p>
                        <p className="text-muted-foreground">Cancelled</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground rounded-lg border border-dashed p-6 text-center">
              No package subscription data yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
