import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Package2, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Rates { mwkRate: number; kesRate: number; malawiDiscount: number; kenyaDiscount: number; }

function fmtUSD(n: number) { return `$${n % 1 === 0 ? n : n.toFixed(2)}`; }
function fmtKES(usd: number, rates: Rates) { return `KES ${Math.round(usd * rates.kesRate * rates.kenyaDiscount).toLocaleString()}`; }
function fmtMWK(usd: number, rates: Rates) { return `MWK ${Math.round(usd * rates.mwkRate * rates.malawiDiscount).toLocaleString()}`; }

// Small inline conversion hint shown below a USD price input
function ConversionHint({ usd, rates }: { usd: string | number; rates: Rates | undefined }) {
  const val = Number(usd);
  if (!rates || !val || isNaN(val)) return null;
  return (
    <p className="text-xs text-muted-foreground mt-0.5">
      ≈ {fmtKES(val, rates)} · {fmtMWK(val, rates)}
    </p>
  );
}

const LIMIT_FIELDS = [
  { key: 'maxChurches', label: 'Max Churches' },
  { key: 'maxMembers',  label: 'Max Members' },
  { key: 'maxEvents',   label: 'Max Events' },
  { key: 'maxGivings',  label: 'Max Giving Campaigns' },
  { key: 'maxCells',    label: 'Max Cells' },
];

const CATEGORY_COLORS: Record<string, string> = {
  core: 'bg-blue-100 text-blue-700',
  communication: 'bg-green-100 text-green-700',
  reporting: 'bg-purple-100 text-purple-700',
  management: 'bg-orange-100 text-orange-700',
  events: 'bg-pink-100 text-pink-700',
  limit: 'bg-gray-100 text-gray-700',
};

// ─── Package Form ─────────────────────────────────────────────────────────────

function PackageForm({ pkg, features, rates, onSubmit, isPending, onClose }: {
  pkg?: any;
  features: any[];
  rates: Rates | undefined;
  onSubmit: (data: any) => void;
  isPending: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: pkg?.name ?? '',
    displayName: pkg?.displayName ?? '',
    description: pkg?.description ?? '',
    priceMonthly: pkg?.priceMonthly ?? 0,
    priceYearly: pkg?.priceYearly ?? 0,
    isActive: pkg?.isActive ?? true,
    isPrivate: pkg?.isPrivate ?? false,
    sortOrder: pkg?.sortOrder ?? 0,
    maxChurches: pkg?.maxChurches ?? '',
    maxMembers: pkg?.maxMembers ?? '',
    maxEvents: pkg?.maxEvents ?? '',
    maxGivings: pkg?.maxGivings ?? '',
    maxCells: pkg?.maxCells ?? '',
  });

  // Selected features with optional limit values
  const [selectedFeatures, setSelectedFeatures] = useState<Record<string, { selected: boolean; limit: string }>>(
    () => {
      const map: Record<string, { selected: boolean; limit: string }> = {};
      features.forEach(f => {
        const existing = pkg?.features?.find((pf: any) => pf.featureId === f.id || pf.feature?.id === f.id);
        map[f.id] = {
          selected: !!existing,
          limit: existing?.limitValue != null ? String(existing.limitValue) : '',
        };
      });
      return map;
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const featureList = Object.entries(selectedFeatures)
      .filter(([, v]) => v.selected)
      .map(([featureId]) => ({ featureId, limitValue: null }));

    onSubmit({
      ...form,
      priceMonthly: Number(form.priceMonthly),
      priceYearly: Number(form.priceYearly),
      sortOrder: Number(form.sortOrder),
      maxChurches: form.maxChurches ? Number(form.maxChurches) : null,
      maxMembers: form.maxMembers ? Number(form.maxMembers) : null,
      maxEvents: form.maxEvents ? Number(form.maxEvents) : null,
      maxGivings: form.maxGivings ? Number(form.maxGivings) : null,
      maxCells: form.maxCells ? Number(form.maxCells) : null,
      features: featureList,
      isPrivate: form.isPrivate,
    });
  };

  const grouped = features.reduce((acc: Record<string, any[]>, f) => {
    const cat = f.category || 'core';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Name (slug) *</Label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. premium" required disabled={!!pkg} />
        </div>
        <div>
          <Label>Display Name *</Label>
          <Input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} placeholder="e.g. Premium" required />
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <Textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Price Monthly (USD)</Label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
            <Input type="number" min="0" step="0.01" className="pl-5" value={form.priceMonthly} onChange={e => setForm(f => ({ ...f, priceMonthly: e.target.value }))} />
          </div>
          <ConversionHint usd={form.priceMonthly} rates={rates} />
        </div>
        <div>
          <Label>Price Yearly (USD)</Label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
            <Input type="number" min="0" step="0.01" className="pl-5" value={form.priceYearly} onChange={e => setForm(f => ({ ...f, priceYearly: e.target.value }))} />
          </div>
          <ConversionHint usd={form.priceYearly} rates={rates} />
        </div>
        <div>
          <Label>Sort Order</Label>
          <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} />
        </div>
      </div>

      {/* Limits */}
      <div>
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Limits (leave blank = unlimited)</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
          {LIMIT_FIELDS.map(lf => (
            <div key={lf.key}>
              <Label className="text-xs">{lf.label}</Label>
              <Input
                type="number" min="1" placeholder="∞"
                value={(form as any)[lf.key]}
                onChange={e => setForm(f => ({ ...f, [lf.key]: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div>
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Features</Label>
        <div className="mt-1.5 border rounded-lg divide-y max-h-64 overflow-y-auto">
          {Object.entries(grouped).map(([cat, feats]) => (
            <div key={cat}>
              <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 capitalize">{cat}</p>
              {feats.map((f: any) => (
                <div key={f.id} className="flex items-center gap-3 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedFeatures[f.id]?.selected ?? false}
                    onChange={e => setSelectedFeatures(prev => ({
                      ...prev,
                      [f.id]: { ...prev[f.id], selected: e.target.checked },
                    }))}
                    className="h-4 w-4"
                  />
                  <span className="flex-1 text-sm">{f.displayName}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
          <Label>Active</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={form.isPrivate} onCheckedChange={v => setForm(f => ({ ...f, isPrivate: v }))} />
          <Label>Private <span className="text-xs text-muted-foreground">(hidden from public listing)</span></Label>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
          {isPending ? 'Saving...' : pkg ? 'Update Package' : 'Create Package'}
        </Button>
      </div>
    </form>
  );
}

// ─── Feature Form removed — features are seeded, not created via UI ──────────

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPackagesPage() {
  const qc = useQueryClient();
  const [pkgOpen, setPkgOpen] = useState(false);
  const [editPkg, setEditPkg] = useState<any>(null);
  const [viewPkg, setViewPkg] = useState<any>(null);
  const [deletePkg, setDeletePkg] = useState<any>(null);
  const [tab, setTab] = useState<'packages' | 'features'>('packages');

  const { data: packages = [], isLoading: pkgLoading } = useQuery({
    queryKey: ['admin-packages'],
    queryFn: async () => { const { data } = await apiClient.get('/admin/packages'); return data.data; },
  });

  const { data: features = [] } = useQuery({
    queryKey: ['admin-features'],
    queryFn: async () => { const { data } = await apiClient.get('/admin/packages/features'); return data.data; },
  });

  const { data: rates } = useQuery<Rates>({
    queryKey: ['admin-package-rates'],
    queryFn: async () => { const { data } = await apiClient.get('/admin/packages/rates'); return data.data; },
    staleTime: 60_000,
  });

  const createPkgMutation = useMutation({
    mutationFn: (dto: any) => apiClient.post('/admin/packages', dto),
    onSuccess: () => { toast.success('Package created'); qc.invalidateQueries({ queryKey: ['admin-packages'] }); setPkgOpen(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updatePkgMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => apiClient.put(`/admin/packages/${id}`, dto),
    onSuccess: () => { toast.success('Package updated'); qc.invalidateQueries({ queryKey: ['admin-packages'] }); setEditPkg(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deletePkgMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/packages/${id}`),
    onSuccess: () => { toast.success('Package deleted'); qc.invalidateQueries({ queryKey: ['admin-packages'] }); setDeletePkg(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const createFeatMutation = { isPending: false };
  const updateFeatMutation = { isPending: false };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">Package Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Manage subscription packages and features</p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={() => setPkgOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" /> New Package
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b flex gap-1">
        {(['packages', 'features'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize border-b-2 transition-colors ${tab === t ? 'border-accent text-accent font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Packages Tab */}
      {tab === 'packages' && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {pkgLoading ? (
            <div className="col-span-3 flex justify-center py-10"><div className="h-5 w-5 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>
          ) : packages.map((pkg: any) => {
            const accentMap: Record<string, string> = {
              basic: 'from-slate-500 to-slate-600',
              standard: 'from-blue-500 to-blue-600',
              premium: 'from-purple-500 to-purple-700',
            };
            const gradient = accentMap[pkg.name] ?? 'from-gray-500 to-gray-600';

            return (
              <Card key={pkg.id} className={`overflow-hidden flex flex-col ${!pkg.isActive ? 'opacity-60' : ''}`}>

                {/* ── Gradient header ── */}
                <div className={`bg-gradient-to-r ${gradient} px-5 py-4 text-white`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Package2 className="h-4 w-4 opacity-80 shrink-0" />
                        <span className="font-bold text-base leading-tight">{pkg.displayName}</span>
                        {!pkg.isActive && <Badge className="text-xs bg-white/20 text-white border-0">Inactive</Badge>}
                        {pkg.isPrivate && <Badge className="text-xs bg-amber-400/30 text-amber-100 border-0">Private</Badge>}
                      </div>
                      <p className="text-xs opacity-60 mt-0.5 font-mono">{pkg.name}</p>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <button onClick={() => setViewPkg(pkg)} className="p-1.5 rounded hover:bg-white/20 transition-colors" title="View"><Eye className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setEditPkg(pkg)} className="p-1.5 rounded hover:bg-white/20 transition-colors" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeletePkg(pkg)} className="p-1.5 rounded hover:bg-white/20 transition-colors" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>

                  {/* USD price prominent */}
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{fmtUSD(pkg.priceMonthly)}</span>
                    <span className="text-sm opacity-70">/mo</span>
                    <span className="text-sm opacity-50 ml-1">{fmtUSD(pkg.priceYearly)}/yr</span>
                  </div>
                </div>

                <CardContent className="flex-1 flex flex-col gap-0 p-0">

                  {/* ── Description ── */}
                  {pkg.description && (
                    <div className="px-5 py-3 border-b">
                      <p className="text-xs text-muted-foreground leading-relaxed">{pkg.description}</p>
                    </div>
                  )}

                  {/* ── Currency conversions ── */}
                  {rates && pkg.priceMonthly > 0 && (
                    <div className="px-5 py-3 border-b bg-muted/30 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Kenya (KES)</p>
                        <p className="text-sm font-semibold">{fmtKES(pkg.priceMonthly, rates)}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                        <p className="text-xs text-muted-foreground">{fmtKES(pkg.priceYearly, rates)}/yr</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Malawi (MWK)</p>
                        <p className="text-sm font-semibold">{fmtMWK(pkg.priceMonthly, rates)}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                        <p className="text-xs text-muted-foreground">{fmtMWK(pkg.priceYearly, rates)}/yr</p>
                      </div>
                    </div>
                  )}

                  {/* ── Limits ── */}
                  <div className="px-5 py-3 border-b">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Limits</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                      {LIMIT_FIELDS.map(lf => (
                        <div key={lf.key} className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{lf.label.replace('Max ', '')}</span>
                          <span className="text-xs font-bold tabular-nums">
                            {pkg[lf.key] != null ? pkg[lf.key].toLocaleString() : '∞'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Features ── */}
                  <div className="px-5 py-3 flex-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Features <span className="font-normal normal-case">({pkg.features?.length ?? 0})</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {pkg.features?.slice(0, 8).map((pf: any) => (
                        <Badge key={pf.featureId} variant="secondary" className="text-xs px-2 py-0.5">
                          {pf.feature?.displayName}
                        </Badge>
                      ))}
                      {(pkg.features?.length ?? 0) > 8 && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5">+{pkg.features.length - 8} more</Badge>
                      )}
                    </div>
                  </div>

                  {/* ── Footer ── */}
                  <div className="px-5 py-2.5 border-t bg-muted/20 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {pkg._count?.subscriptions ?? 0} active subscription{pkg._count?.subscriptions !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-muted-foreground">Sort: {pkg.sortOrder}</span>
                  </div>

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Features Tab */}
      {tab === 'features' && (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Name</th>
                <th className="text-left px-3 py-2 font-medium">Display Name</th>
                <th className="text-left px-3 py-2 font-medium">Category</th>
                <th className="text-left px-3 py-2 font-medium">Packages</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {features.map((f: any) => (
                <tr key={f.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono text-xs">{f.name}</td>
                  <td className="px-3 py-2 font-medium">{f.displayName}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[f.category] ?? 'bg-gray-100 text-gray-700'}`}>
                      {f.category}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {packages.filter((p: any) => p.features?.some((pf: any) => pf.featureId === f.id || pf.feature?.id === f.id)).map((p: any) => p.displayName).join(', ') || '—'}
                  </td>
                  <td className="px-2 py-2 w-8" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Package Dialog */}
      <Dialog open={!!viewPkg} onOpenChange={open => !open && setViewPkg(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
          {viewPkg && (() => {
            const accentMap: Record<string, string> = {
              basic: 'from-slate-500 to-slate-600',
              standard: 'from-blue-500 to-blue-600',
              premium: 'from-purple-500 to-purple-700',
            };
            const gradient = accentMap[viewPkg.name] ?? 'from-gray-500 to-gray-600';
            return (
              <>
                {/* Header */}
                <div className={`bg-gradient-to-r ${gradient} px-6 py-5 text-white rounded-t-lg`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Package2 className="h-5 w-5 opacity-80" />
                    <span className="font-bold text-lg">{viewPkg.displayName}</span>
                    {!viewPkg.isActive && <Badge className="text-xs bg-white/20 text-white border-0">Inactive</Badge>}
                    {viewPkg.isPrivate && <Badge className="text-xs bg-amber-400/30 text-amber-100 border-0">Private</Badge>}
                  </div>
                  <p className="text-xs opacity-50 font-mono mb-3">{viewPkg.name}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">${viewPkg.priceMonthly}</span>
                    <span className="opacity-70">/mo</span>
                    <span className="opacity-50 ml-1 text-sm">${viewPkg.priceYearly}/yr</span>
                  </div>
                </div>

                <div className="divide-y">
                  {/* Description */}
                  {viewPkg.description && (
                    <div className="px-6 py-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{viewPkg.description}</p>
                    </div>
                  )}

                  {/* Currency conversions */}
                  {rates && viewPkg.priceMonthly > 0 && (
                    <div className="px-6 py-4 bg-muted/20">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pricing by Country</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-background rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground mb-1">🇰🇪 Kenya</p>
                          <p className="font-semibold text-sm">{fmtKES(viewPkg.priceMonthly, rates)}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                          <p className="text-xs text-muted-foreground mt-0.5">{fmtKES(viewPkg.priceYearly, rates)}/yr</p>
                        </div>
                        <div className="bg-background rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground mb-1">🇲🇼 Malawi</p>
                          <p className="font-semibold text-sm">{fmtMWK(viewPkg.priceMonthly, rates)}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                          <p className="text-xs text-muted-foreground mt-0.5">{fmtMWK(viewPkg.priceYearly, rates)}/yr</p>
                        </div>
                      </div>
                      {rates && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Rates: $1 = KES {rates.kesRate} · $1 = MWK {rates.mwkRate}
                          {rates.malawiDiscount < 1 && ` · Malawi discount: ${Math.round((1 - rates.malawiDiscount) * 100)}% off`}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Limits */}
                  <div className="px-6 py-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Limits</p>
                    <div className="grid grid-cols-2 gap-2">
                      {LIMIT_FIELDS.map(lf => (
                        <div key={lf.key} className="flex items-center justify-between bg-muted/30 rounded-md px-3 py-2">
                          <span className="text-xs text-muted-foreground">{lf.label.replace('Max ', '')}</span>
                          <span className="text-sm font-bold tabular-nums">
                            {viewPkg[lf.key] != null ? viewPkg[lf.key].toLocaleString() : '∞'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="px-6 py-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Features ({viewPkg.features?.length ?? 0})
                    </p>
                    {viewPkg.features?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {viewPkg.features.map((pf: any) => (
                          <Badge key={pf.featureId} variant="secondary" className="text-xs px-2.5 py-1">
                            {pf.feature?.displayName}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No features linked</p>
                    )}
                  </div>

                  {/* Footer actions */}
                  <div className="px-6 py-4 flex items-center justify-between bg-muted/10">
                    <span className="text-xs text-muted-foreground">
                      {viewPkg._count?.subscriptions ?? 0} active subscription{viewPkg._count?.subscriptions !== 1 ? 's' : ''}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setViewPkg(null)}>Close</Button>
                      <Button size="sm" className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
                        onClick={() => { setViewPkg(null); setEditPkg(viewPkg); }}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Create Package Dialog */}
      <Dialog open={pkgOpen} onOpenChange={setPkgOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Package</DialogTitle></DialogHeader>
          <PackageForm features={features} rates={rates} onSubmit={dto => createPkgMutation.mutate(dto)} isPending={createPkgMutation.isPending} onClose={() => setPkgOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Package Dialog */}
      <Dialog open={!!editPkg} onOpenChange={open => !open && setEditPkg(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Package — {editPkg?.displayName}</DialogTitle></DialogHeader>
          {editPkg && (
            <PackageForm pkg={editPkg} features={features} rates={rates} onSubmit={dto => updatePkgMutation.mutate({ id: editPkg.id, dto })} isPending={updatePkgMutation.isPending} onClose={() => setEditPkg(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Package Confirm */}
      <AlertDialog open={!!deletePkg} onOpenChange={open => !open && setDeletePkg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Package</AlertDialogTitle>
            <AlertDialogDescription>Delete <strong>{deletePkg?.displayName}</strong>? This cannot be undone. Packages with active subscriptions cannot be deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deletePkg && deletePkgMutation.mutate(deletePkg.id)}>
              {deletePkgMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
