import { useQuery } from '@tanstack/react-query';
import { Users, Building2, Globe, UserCheck, UserX, Flag, Package, TrendingUp, CreditCard, AlertCircle } from 'lucide-react';
import { adminApi, type AdminStats } from '@/services/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

function StatCard({ label, value, icon: Icon, sub, accent = false }: {
  label: string; value: string | number; icon: any; sub?: string; accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${accent ? 'bg-accent' : 'bg-accent/10'}`}>
          <Icon className={`h-4 w-4 ${accent ? 'text-accent-foreground' : 'text-accent'}`} />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold leading-tight truncate">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function payStatusBadge(status: string) {
  if (status === 'completed') return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Completed</Badge>;
  if (status === 'pending') return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">Pending</Badge>;
  return <Badge variant="outline" className="text-xs capitalize">{status}</Badge>;
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 h-16 animate-pulse bg-muted rounded" /></Card>
          ))}
        </div>
      </div>
    );
  }

  const s = data as AdminStats;

  const fmt = (amount: number, currency: string) =>
    `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-xl sm:text-2xl font-bold">System Dashboard</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Platform-wide overview</p>
      </div>

      {/* Users & Churches */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Users & Churches</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Users" value={s.totalUsers} icon={Users} />
          <StatCard label="Total Churches" value={s.totalChurches} icon={Building2} />
          <StatCard label="Ministry Admins" value={s.totalMinistryAdmins} icon={UserCheck} />
          <StatCard label="Members" value={s.totalMembers} icon={Users} />
          <StatCard label="Active Users" value={s.activeUsers} icon={UserCheck} />
          <StatCard label="Suspended" value={s.suspendedUsers} icon={UserX} />
          <StatCard label="Malawi Users" value={s.malawiUsers} icon={Flag} />
          <StatCard label="Kenya Users" value={s.kenyaUsers} icon={Globe} />
        </div>
      </div>

      {/* Subscriptions */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Subscriptions</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Active Subscriptions" value={s.activeSubscriptions} icon={Package} accent />
          <StatCard label="Expired Subscriptions" value={s.expiredSubscriptions} icon={AlertCircle} />
        </div>
      </div>

      {/* Revenue */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Package Revenue</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard
            label="Total Revenue"
            value={`MWK ${s.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            icon={TrendingUp}
            sub={`${s.totalPayments} completed payments`}
            accent
          />
          <StatCard
            label="Malawi Revenue"
            value={fmt(s.malawiRevenue, 'MWK')}
            icon={CreditCard}
            sub={`${s.malawiPayments} payments`}
          />
          <StatCard
            label="Kenya Revenue"
            value={fmt(s.kenyaRevenue, 'KSH')}
            icon={CreditCard}
            sub={`${s.kenyaPayments} payments`}
          />
        </div>
      </div>

      {/* Bottom tables side by side on large screens */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent Registrations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent Ministry Registrations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {s.recentRegistrations.map(u => (
                <div key={u.id}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/admin/users/${u.id}`)}>
                  <div>
                    <p className="text-xs font-medium">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">{u.accountCountry || '—'}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {s.recentRegistrations.length === 0 && (
                <p className="text-xs text-muted-foreground px-4 py-6 text-center">No registrations yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent Package Payments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {s.recentPayments.map(p => (
                <div key={p.id}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => p.ministryAdmin && navigate(`/admin/users/${p.ministryAdminId}`)}>
                  <div>
                    <p className="text-xs font-medium">
                      {p.ministryAdmin ? `${p.ministryAdmin.firstName} ${p.ministryAdmin.lastName}` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {p.package?.displayName ?? p.packageName} · {p.billingCycle ?? '—'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold">{p.currency} {p.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {s.recentPayments.length === 0 && (
                <p className="text-xs text-muted-foreground px-4 py-6 text-center">No payments yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
