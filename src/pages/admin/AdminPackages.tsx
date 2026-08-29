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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layers3, Plus, Pencil, Trash2, Package2, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Rates { mwkRate: number; kesRate: number; malawiDiscount: number; kenyaDiscount: number; }
interface PricingMarket {
  id: string;
  code: string;
  name: string;
  currencyCode: string;
  packageGateway: string;
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  packagePrices?: Array<{ id?: string; packageId: string; priceMonthly: number; priceYearly: number; currencyCode: string; package?: { displayName?: string } }>;
  _count?: { countries?: number; packagePrices?: number };
}
interface CountryMarket { id: string; name: string; iso2: string; phoneCode?: string; currencyCode?: string; pricingMarketId?: string | null; pricingMarket?: PricingMarket | null; isActive: boolean; }

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

function fmtLocal(amount: number | string, currency: string) {
  const value = Number(amount || 0);
  return `${currency} ${value.toLocaleString()}`;
}

const LIMIT_FIELDS = [
  { key: 'maxChurches', label: 'Max Churches' },
  { key: 'maxMembers',  label: 'Max Members' },
  { key: 'maxEvents',   label: 'Max Events' },
  { key: 'maxGivings',  label: 'Max Giving Campaigns' },
  { key: 'maxCells',    label: 'Max Cells' },
];

const CURRENCY_OPTIONS = ['USD', 'KES', 'MWK'];

const CATEGORY_COLORS: Record<string, string> = {
  core: 'bg-blue-100 text-blue-700',
  communication: 'bg-green-100 text-green-700',
  reporting: 'bg-purple-100 text-purple-700',
  management: 'bg-orange-100 text-orange-700',
  attendance: 'bg-cyan-100 text-cyan-700',
  events: 'bg-pink-100 text-pink-700',
  giving: 'bg-emerald-100 text-emerald-700',
  limit: 'bg-gray-100 text-gray-700',
};

// ─── Package Form ─────────────────────────────────────────────────────────────

function PackageForm({ pkg, bundles, markets, rates, onSubmit, isPending, onClose }: {
  pkg?: any;
  bundles: any[];
  markets: PricingMarket[];
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
    currencyCode: pkg?.currencyCode ?? 'USD',
    isActive: pkg?.isActive ?? true,
    isPrivate: pkg?.isPrivate ?? false,
    sortOrder: pkg?.sortOrder ?? 0,
    maxChurches: pkg?.maxChurches ?? '',
    maxMembers: pkg?.maxMembers ?? '',
    maxEvents: pkg?.maxEvents ?? '',
    maxGivings: pkg?.maxGivings ?? '',
    maxCells: pkg?.maxCells ?? '',
  });

  const [selectedBundles, setSelectedBundles] = useState<Record<string, { selected: boolean; limit: string }>>(
    () => {
      const map: Record<string, { selected: boolean; limit: string }> = {};
      bundles.forEach(bundle => {
        const existing = pkg?.moduleBundles?.find((pb: any) => pb.bundleId === bundle.id || pb.bundle?.id === bundle.id);
        map[bundle.id] = {
          selected: !!existing,
          limit: existing?.limitValue != null ? String(existing.limitValue) : '',
        };
      });
      return map;
    }
  );

  const [bundleFeatureEnabled, setBundleFeatureEnabled] = useState<Record<string, boolean>>(
    () => {
      const map: Record<string, boolean> = {};
      bundles.forEach(bundle => {
        bundle.features?.forEach((bf: any) => {
          const featureId = bf.featureId || bf.feature?.id;
          if (!featureId) return;
          const existingOverride = pkg?.bundleFeatureOverrides?.find((override: any) => {
            const overrideBundleId = override.bundleId || override.bundle?.id;
            const overrideFeatureId = override.featureId || override.feature?.id;
            return overrideBundleId === bundle.id && overrideFeatureId === featureId;
          });
          map[`${bundle.id}:${featureId}`] = existingOverride ? existingOverride.enabled !== false : true;
        });
      });
      return map;
    }
  );

  const [marketPrices, setMarketPrices] = useState<Record<string, { selected: boolean; monthly: string; yearly: string; currencyCode: string }>>(
    () => {
      const map: Record<string, { selected: boolean; monthly: string; yearly: string; currencyCode: string }> = {};
      markets.forEach(market => {
        const existing = pkg?.marketPrices?.find((price: any) => price.pricingMarketId === market.id || price.pricingMarket?.id === market.id);
        map[market.id] = {
          selected: !!existing,
          monthly: existing ? String(existing.priceMonthly) : '',
          yearly: existing ? String(existing.priceYearly) : '',
          currencyCode: existing?.currencyCode || market.currencyCode,
        };
      });
      return map;
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const moduleBundleList = Object.entries(selectedBundles)
      .filter(([, v]) => v.selected)
      .map(([bundleId, v]) => ({ bundleId, limitValue: v.limit ? Number(v.limit) : null }));
    const bundleFeatureOverrideList = Object.entries(selectedBundles)
      .filter(([, v]) => v.selected)
      .flatMap(([bundleId]) => {
        const bundle = bundles.find(item => item.id === bundleId);
        return (bundle?.features ?? [])
          .map((bf: any) => ({ bundleId, featureId: bf.featureId || bf.feature?.id }))
          .filter((item: any) => item.featureId && bundleFeatureEnabled[`${item.bundleId}:${item.featureId}`] === false)
          .map((item: any) => ({
            bundleId: item.bundleId,
            featureId: item.featureId,
            enabled: false,
            limitValue: null,
            reason: 'Disabled for this package.',
          }));
      });

    const marketPriceList = form.isPrivate
      ? []
      : Object.entries(marketPrices)
          .filter(([, value]) => value.selected)
          .map(([pricingMarketId, value]) => ({
            pricingMarketId,
            priceMonthly: Number(value.monthly || 0),
            priceYearly: Number(value.yearly || 0),
            currencyCode: markets.find(market => market.id === pricingMarketId)?.currencyCode || value.currencyCode,
          }));

    onSubmit({
      ...form,
      priceMonthly: Number(form.priceMonthly),
      priceYearly: Number(form.priceYearly),
      currencyCode: form.isPrivate ? form.currencyCode : 'USD',
      sortOrder: Number(form.sortOrder),
      maxChurches: form.maxChurches ? Number(form.maxChurches) : null,
      maxMembers: form.maxMembers ? Number(form.maxMembers) : null,
      maxEvents: form.maxEvents ? Number(form.maxEvents) : null,
      maxGivings: form.maxGivings ? Number(form.maxGivings) : null,
      maxCells: form.maxCells ? Number(form.maxCells) : null,
      features: [],
      moduleBundles: moduleBundleList,
      bundleFeatureOverrides: bundleFeatureOverrideList,
      marketPrices: marketPriceList,
      isPrivate: form.isPrivate,
    });
  };

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

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <Label>{form.isPrivate ? 'Private Monthly Price' : 'Base Monthly Price'}</Label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{form.isPrivate ? form.currencyCode : 'USD'}</span>
            <Input type="number" min="0" step="0.01" className="pl-14" value={form.priceMonthly} onChange={e => setForm(f => ({ ...f, priceMonthly: e.target.value }))} />
          </div>
          {!form.isPrivate && <ConversionHint usd={form.priceMonthly} rates={rates} />}
        </div>
        <div>
          <Label>{form.isPrivate ? 'Private Yearly Price' : 'Base Yearly Price'}</Label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{form.isPrivate ? form.currencyCode : 'USD'}</span>
            <Input type="number" min="0" step="0.01" className="pl-14" value={form.priceYearly} onChange={e => setForm(f => ({ ...f, priceYearly: e.target.value }))} />
          </div>
          {!form.isPrivate && <ConversionHint usd={form.priceYearly} rates={rates} />}
        </div>
        <div>
          <Label>Package Currency</Label>
          <Select value={form.isPrivate ? form.currencyCode : 'USD'} onValueChange={value => setForm(f => ({ ...f, currencyCode: value }))} disabled={!form.isPrivate}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map(currency => <SelectItem key={currency} value={currency}>{currency}</SelectItem>)}
            </SelectContent>
          </Select>
          {!form.isPrivate && <p className="mt-1 text-xs text-muted-foreground">Public packages use market prices.</p>}
        </div>
        <div>
          <Label>Sort Order</Label>
          <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} />
        </div>
      </div>

      {!form.isPrivate && (
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Market Prices</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">Select the markets where this public package should be available.</p>
          <div className="mt-2 grid gap-2">
            {markets.map(market => {
              const value = marketPrices[market.id] ?? { selected: false, monthly: '', yearly: '', currencyCode: market.currencyCode };
              return (
                <div key={market.id} className="rounded-lg border p-3">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={value.selected}
                      onChange={e => setMarketPrices(prev => ({
                        ...prev,
                        [market.id]: { ...value, selected: e.target.checked },
                      }))}
                      className="mt-1 h-4 w-4"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{market.name}</span>
                      <span className="block text-xs text-muted-foreground">{market.currencyCode} package payments via {market.packageGateway}</span>
                    </span>
                  </label>
                  {value.selected && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <Input type="number" min="0" step="0.01" placeholder="Monthly" value={value.monthly}
                        onChange={e => setMarketPrices(prev => ({ ...prev, [market.id]: { ...value, monthly: e.target.value } }))} />
                      <Input type="number" min="0" step="0.01" placeholder="Yearly" value={value.yearly}
                        onChange={e => setMarketPrices(prev => ({ ...prev, [market.id]: { ...value, yearly: e.target.value } }))} />
                      <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3 text-sm font-medium text-muted-foreground">
                        {market.currencyCode}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {markets.length === 0 && (
              <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">No pricing markets found. Seed or create markets first.</p>
            )}
          </div>
        </div>
      )}

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
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Module Bundles</Label>
        <div className="mt-1.5 border rounded-lg divide-y max-h-96 overflow-y-auto">
          {bundles.map(bundle => (
            <div key={bundle.id} className="px-3 py-2.5">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedBundles[bundle.id]?.selected ?? false}
                  onChange={e => setSelectedBundles(prev => ({
                    ...prev,
                    [bundle.id]: { ...prev[bundle.id], selected: e.target.checked },
                  }))}
                  className="h-4 w-4 mt-0.5 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{bundle.name}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${CATEGORY_COLORS[bundle.category] ?? 'bg-gray-100 text-gray-700'}`}>
                      {bundle.category}
                    </span>
                  </div>
                  {bundle.description && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{bundle.description}</p>
                  )}
                  <div className="grid gap-1.5 mt-2 sm:grid-cols-2">
                    {bundle.features?.map((bf: any) => (
                      <label
                        key={bf.featureId}
                        className={`flex items-start gap-2 rounded-md border px-2 py-1.5 ${selectedBundles[bundle.id]?.selected ? 'bg-background' : 'bg-muted/30 opacity-70'}`}
                      >
                        <input
                          type="checkbox"
                          checked={bundleFeatureEnabled[`${bundle.id}:${bf.featureId}`] ?? true}
                          disabled={!selectedBundles[bundle.id]?.selected}
                          onChange={e => setBundleFeatureEnabled(prev => ({
                            ...prev,
                            [`${bundle.id}:${bf.featureId}`]: e.target.checked,
                          }))}
                          className="mt-0.5 h-3.5 w-3.5 shrink-0"
                        />
                        <span className="min-w-0">
                          <span className="block text-xs font-medium leading-snug">{bf.feature?.displayName}</span>
                          {bf.feature?.description && (
                            <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                              {bf.feature.description}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {bundles.length === 0 && (
            <p className="px-3 py-3 text-sm text-muted-foreground">No module bundles seeded yet.</p>
          )}
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
  const [tab, setTab] = useState<'packages' | 'features' | 'markets'>('packages');
  const [marketOpen, setMarketOpen] = useState(false);
  const [editMarket, setEditMarket] = useState<PricingMarket | null>(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [marketForm, setMarketForm] = useState({
    code: '',
    name: '',
    currencyCode: 'KES',
    packageGateway: 'paystack',
    isDefault: false,
    isActive: true,
    sortOrder: 0,
  });
  const [marketPackagePrices, setMarketPackagePrices] = useState<Record<string, { selected: boolean; monthly: string; yearly: string }>>({});

  const { data: packages = [], isLoading: pkgLoading } = useQuery({
    queryKey: ['admin-packages'],
    queryFn: async () => { const { data } = await apiClient.get('/admin/packages'); return data.data; },
  });

  const { data: features = [] } = useQuery({
    queryKey: ['admin-features'],
    queryFn: async () => { const { data } = await apiClient.get('/admin/packages/features'); return data.data; },
  });

  const { data: bundles = [] } = useQuery({
    queryKey: ['admin-module-bundles'],
    queryFn: async () => { const { data } = await apiClient.get('/admin/packages/module-bundles'); return data.data; },
  });

  const { data: markets = [] } = useQuery<PricingMarket[]>({
    queryKey: ['admin-pricing-markets'],
    queryFn: async () => { const { data } = await apiClient.get('/admin/packages/pricing-markets'); return data.data; },
  });

  const { data: countries = [] } = useQuery<CountryMarket[]>({
    queryKey: ['admin-pricing-countries'],
    queryFn: async () => { const { data } = await apiClient.get('/admin/packages/countries'); return data.data; },
  });

  const { data: rates } = useQuery<Rates>({
    queryKey: ['admin-package-rates'],
    queryFn: async () => { const { data } = await apiClient.get('/admin/packages/rates'); return data.data; },
    staleTime: 60_000,
  });

  const publicPackages = packages.filter((pkg: any) => !pkg.isPrivate);

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

  const openMarketForm = (market?: PricingMarket) => {
    const priceMap: Record<string, { selected: boolean; monthly: string; yearly: string }> = {};
    publicPackages.forEach((pkg: any) => {
      const existing = market?.packagePrices?.find(price => price.packageId === pkg.id);
      priceMap[pkg.id] = {
        selected: !!existing,
        monthly: existing ? String(existing.priceMonthly) : '',
        yearly: existing ? String(existing.priceYearly) : '',
      };
    });
    setEditMarket(market ?? null);
    setMarketForm({
      code: market?.code ?? '',
      name: market?.name ?? '',
      currencyCode: market?.currencyCode ?? 'KES',
      packageGateway: market?.packageGateway ?? 'paystack',
      isDefault: !!market?.isDefault,
      isActive: market?.isActive ?? true,
      sortOrder: market?.sortOrder ?? 0,
    });
    setMarketPackagePrices(priceMap);
    setMarketOpen(true);
  };

  const saveMarketMutation = useMutation({
    mutationFn: (dto: any) => editMarket
      ? apiClient.put(`/admin/packages/pricing-markets/${editMarket.id}`, dto)
      : apiClient.post('/admin/packages/pricing-markets', dto),
    onSuccess: () => {
      toast.success(editMarket ? 'Market updated' : 'Market created');
      qc.invalidateQueries({ queryKey: ['admin-pricing-markets'] });
      qc.invalidateQueries({ queryKey: ['admin-packages'] });
      setMarketOpen(false);
      setEditMarket(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to save market'),
  });

  const deleteMarketMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/packages/pricing-markets/${id}`),
    onSuccess: () => {
      toast.success('Market disabled');
      qc.invalidateQueries({ queryKey: ['admin-pricing-markets'] });
      qc.invalidateQueries({ queryKey: ['admin-pricing-countries'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to disable market'),
  });

  const assignCountryMutation = useMutation({
    mutationFn: ({ countryId, pricingMarketId }: { countryId: string; pricingMarketId: string | null }) =>
      apiClient.put(`/admin/packages/countries/${countryId}/market`, { pricingMarketId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pricing-countries'] });
      qc.invalidateQueries({ queryKey: ['admin-pricing-markets'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update country market'),
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
        {(['packages', 'features', 'markets'] as const).map(t => (
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

                  {/* Package price */}
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{pkg.currencyCode === 'USD' ? fmtUSD(pkg.priceMonthly) : fmtLocal(pkg.priceMonthly, pkg.currencyCode || 'USD')}</span>
                    <span className="text-sm opacity-70">/mo</span>
                    <span className="text-sm opacity-50 ml-1">{pkg.currencyCode === 'USD' ? fmtUSD(pkg.priceYearly) : fmtLocal(pkg.priceYearly, pkg.currencyCode || 'USD')}/yr</span>
                  </div>
                </div>

                <CardContent className="flex-1 flex flex-col gap-0 p-0">

                  {/* ── Description ── */}
                  {pkg.description && (
                    <div className="px-5 py-3 border-b">
                      <p className="text-xs text-muted-foreground leading-relaxed">{pkg.description}</p>
                    </div>
                  )}

                  {/* ── Market pricing ── */}
                  {!pkg.isPrivate && pkg.marketPrices?.length > 0 && (
                    <div className="px-5 py-3 border-b bg-muted/30 grid gap-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Market Prices</p>
                      {pkg.marketPrices.slice(0, 3).map((price: any) => (
                        <div key={price.id || price.pricingMarketId} className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-muted-foreground">{price.pricingMarket?.name || 'Market'}</span>
                          <span className="font-semibold">{fmtLocal(price.priceMonthly, price.currencyCode)}/mo</span>
                        </div>
                      ))}
                      {pkg.marketPrices.length > 3 && <p className="text-xs text-muted-foreground">+{pkg.marketPrices.length - 3} more market(s)</p>}
                    </div>
                  )}

                  {/* ── Legacy conversion fallback ── */}
                  {!pkg.isPrivate && rates && pkg.priceMonthly > 0 && (!pkg.marketPrices || pkg.marketPrices.length === 0) && (
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
                      Bundles <span className="font-normal normal-case">({pkg.moduleBundles?.length ?? 0})</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {pkg.moduleBundles?.slice(0, 5).map((pb: any) => (
                        <Badge key={pb.bundleId} variant="outline" className="text-xs px-2 py-0.5 gap-1">
                          <Layers3 className="h-3 w-3" /> {pb.bundle?.name}
                        </Badge>
                      ))}
                      {(pkg.moduleBundles?.length ?? 0) > 5 && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5">+{pkg.moduleBundles.length - 5} more</Badge>
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

      {tab === 'markets' && (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Pricing Markets</h2>
                <p className="text-xs text-muted-foreground">Control currency and package checkout gateway by market.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => openMarketForm()}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Market
              </Button>
            </div>
            <div className="space-y-2">
              {markets.map(market => (
                <Card key={market.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{market.name}</p>
                          {market.isDefault && <Badge variant="outline">Default</Badge>}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{market.currencyCode} package payments via {market.packageGateway}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{market._count?.countries ?? 0} countries · {market._count?.packagePrices ?? 0} package prices</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button className="rounded p-1.5 hover:bg-muted" title="Edit market" onClick={() => openMarketForm(market)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {!market.isDefault && (
                          <button className="rounded p-1.5 text-destructive hover:bg-destructive/10" title="Disable market" onClick={() => deleteMarketMutation.mutate(market.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold">Country Assignment</h2>
              <p className="text-xs text-muted-foreground">Unassigned countries use the default General market.</p>
            </div>
            <Input value={countrySearch} onChange={e => setCountrySearch(e.target.value)} placeholder="Search countries..." className="max-w-md" />
            <div className="max-h-[560px] overflow-y-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Country</th>
                    <th className="px-3 py-2 text-left font-medium">Currency</th>
                    <th className="px-3 py-2 text-left font-medium">Pricing Market</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {countries
                    .filter(country => {
                      const search = countrySearch.trim().toLowerCase();
                      return !search || country.name.toLowerCase().includes(search) || country.iso2.toLowerCase().includes(search);
                    })
                    .slice(0, 250)
                    .map(country => (
                      <tr key={country.id}>
                        <td className="px-3 py-2">
                          <p className="font-medium">{country.name}</p>
                          <p className="text-xs text-muted-foreground">{country.iso2}{country.phoneCode ? ` · ${country.phoneCode}` : ''}</p>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{country.currencyCode || '-'}</td>
                        <td className="px-3 py-2">
                          <Select
                            value={country.pricingMarketId || '__default__'}
                            onValueChange={value => assignCountryMutation.mutate({
                              countryId: country.id,
                              pricingMarketId: value === '__default__' ? null : value,
                            })}
                          >
                            <SelectTrigger className="h-9 min-w-52"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__default__">Default General</SelectItem>
                              {markets.map(market => <SelectItem key={market.id} value={market.id}>{market.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View Package Dialog */}
      <Dialog open={!!viewPkg} onOpenChange={open => !open && setViewPkg(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
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
                    <span className="text-3xl font-bold">{viewPkg.currencyCode === 'USD' ? fmtUSD(viewPkg.priceMonthly) : fmtLocal(viewPkg.priceMonthly, viewPkg.currencyCode || 'USD')}</span>
                    <span className="opacity-70">/mo</span>
                    <span className="opacity-50 ml-1 text-sm">{viewPkg.currencyCode === 'USD' ? fmtUSD(viewPkg.priceYearly) : fmtLocal(viewPkg.priceYearly, viewPkg.currencyCode || 'USD')}/yr</span>
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

                  {/* Market pricing */}
                  {!viewPkg.isPrivate && viewPkg.marketPrices?.length > 0 && (
                    <div className="px-6 py-4 bg-muted/20">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Market Pricing</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {viewPkg.marketPrices.map((price: any) => (
                          <div key={price.id || price.pricingMarketId} className="bg-background rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground mb-1">{price.pricingMarket?.name || 'Market'}</p>
                            <p className="font-semibold text-sm">{fmtLocal(price.priceMonthly, price.currencyCode)}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                            <p className="text-xs text-muted-foreground mt-0.5">{fmtLocal(price.priceYearly, price.currencyCode)}/yr</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Legacy conversion fallback */}
                  {!viewPkg.isPrivate && rates && viewPkg.priceMonthly > 0 && (!viewPkg.marketPrices || viewPkg.marketPrices.length === 0) && (
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
                      Module Bundles ({viewPkg.moduleBundles?.length ?? 0})
                    </p>
                    {viewPkg.moduleBundles?.length > 0 ? (
                      <div className="space-y-2">
                        {viewPkg.moduleBundles.map((pb: any) => (
                          <div key={pb.bundleId} className="rounded-md border p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Layers3 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm font-medium">{pb.bundle?.name}</span>
                              <span className={`text-[11px] px-2 py-0.5 rounded-full ${CATEGORY_COLORS[pb.bundle?.category] ?? 'bg-gray-100 text-gray-700'}`}>
                                {pb.bundle?.category}
                              </span>
                            </div>
                            {pb.bundle?.description && (
                              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{pb.bundle.description}</p>
                            )}
                            {pb.bundle?.features?.length > 0 && (
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {pb.bundle.features.map((bf: any) => {
                                  const disabledOverride = viewPkg.bundleFeatureOverrides?.some((override: any) => {
                                    const overrideBundleId = override.bundleId || override.bundle?.id;
                                    const overrideFeatureId = override.featureId || override.feature?.id;
                                    return overrideBundleId === pb.bundleId && overrideFeatureId === bf.featureId && override.enabled === false;
                                  });
                                  return (
                                    <div key={bf.featureId} className={`rounded-md border px-2 py-1.5 ${disabledOverride ? 'bg-muted/40 opacity-70' : 'bg-background'}`}>
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-medium leading-snug">{bf.feature?.displayName}</span>
                                        {disabledOverride && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Disabled</Badge>}
                                      </div>
                                      {bf.feature?.description && (
                                        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{bf.feature.description}</p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No bundles linked</p>
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Package</DialogTitle></DialogHeader>
          <PackageForm bundles={bundles} markets={markets} rates={rates} onSubmit={dto => createPkgMutation.mutate(dto)} isPending={createPkgMutation.isPending} onClose={() => setPkgOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Package Dialog */}
      <Dialog open={!!editPkg} onOpenChange={open => !open && setEditPkg(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Package — {editPkg?.displayName}</DialogTitle></DialogHeader>
          {editPkg && (
            <PackageForm pkg={editPkg} bundles={bundles} markets={markets} rates={rates} onSubmit={dto => updatePkgMutation.mutate({ id: editPkg.id, dto })} isPending={updatePkgMutation.isPending} onClose={() => setEditPkg(null)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={marketOpen} onOpenChange={setMarketOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editMarket ? 'Edit Market' : 'Create Market'}</DialogTitle></DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              saveMarketMutation.mutate({
                ...marketForm,
                sortOrder: Number(marketForm.sortOrder || 0),
                packagePrices: Object.entries(marketPackagePrices)
                  .filter(([, value]) => value.selected)
                  .map(([packageId, value]) => ({
                    packageId,
                    priceMonthly: Number(value.monthly || 0),
                    priceYearly: Number(value.yearly || 0),
                  })),
              });
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Code</Label>
                <Input value={marketForm.code} onChange={e => setMarketForm(f => ({ ...f, code: e.target.value }))} placeholder="general" disabled={!!editMarket} required />
              </div>
              <div>
                <Label>Name</Label>
                <Input value={marketForm.name} onChange={e => setMarketForm(f => ({ ...f, name: e.target.value }))} placeholder="General" required />
              </div>
              <div>
                <Label>Currency</Label>
                <Select value={marketForm.currencyCode} onValueChange={value => setMarketForm(f => ({ ...f, currencyCode: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map(currency => <SelectItem key={currency} value={currency}>{currency}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Package Gateway</Label>
                <Select value={marketForm.packageGateway} onValueChange={value => setMarketForm(f => ({ ...f, packageGateway: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paystack">Paystack</SelectItem>
                    <SelectItem value="paychangu">PayChangu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input type="number" value={marketForm.sortOrder} onChange={e => setMarketForm(f => ({ ...f, sortOrder: Number(e.target.value || 0) }))} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={marketForm.isDefault} onCheckedChange={value => setMarketForm(f => ({ ...f, isDefault: value }))} />
                Default market
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={marketForm.isActive} onCheckedChange={value => setMarketForm(f => ({ ...f, isActive: value }))} />
                Active
              </label>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Packages In This Market</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Check a package to make it available in this market, then set its monthly and yearly price in {marketForm.currencyCode}.
              </p>
              <div className="mt-2 divide-y rounded-lg border">
                {publicPackages.map((pkg: any) => {
                  const value = marketPackagePrices[pkg.id] ?? { selected: false, monthly: '', yearly: '' };
                  return (
                    <div key={pkg.id} className="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_140px_140px] md:items-center">
                      <label className="flex min-w-0 items-start gap-2">
                        <input
                          type="checkbox"
                          checked={value.selected}
                          onChange={e => setMarketPackagePrices(prev => ({
                            ...prev,
                            [pkg.id]: { ...value, selected: e.target.checked },
                          }))}
                          className="mt-1 h-4 w-4 shrink-0"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{pkg.displayName}</span>
                          <span className="block text-xs text-muted-foreground">{pkg.name}</span>
                        </span>
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={`Monthly ${marketForm.currencyCode}`}
                        value={value.monthly}
                        disabled={!value.selected}
                        onChange={e => setMarketPackagePrices(prev => ({
                          ...prev,
                          [pkg.id]: { ...value, monthly: e.target.value },
                        }))}
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={`Yearly ${marketForm.currencyCode}`}
                        value={value.yearly}
                        disabled={!value.selected}
                        onChange={e => setMarketPackagePrices(prev => ({
                          ...prev,
                          [pkg.id]: { ...value, yearly: e.target.value },
                        }))}
                      />
                    </div>
                  );
                })}
                {publicPackages.length === 0 && (
                  <p className="p-3 text-sm text-muted-foreground">No public packages found yet.</p>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Private/custom packages keep their own price on the package because they belong to a negotiated ministry package.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setMarketOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMarketMutation.isPending}>{saveMarketMutation.isPending ? 'Saving...' : 'Save Market'}</Button>
            </div>
          </form>
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
