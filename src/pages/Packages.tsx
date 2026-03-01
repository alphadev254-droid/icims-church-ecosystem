import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { packagesService, type PackageTier, type PackageFeature } from '@/services/packages';
import { useRole } from '@/hooks/useRole';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, CreditCard, Package2, Settings2, Plus, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PKG_COLOR: Record<string, string> = {
  basic:    'bg-slate-100 border-slate-200 dark:bg-slate-800/40',
  standard: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20',
  premium:  'bg-purple-50 border-purple-200 dark:bg-purple-900/20',
};
const PKG_BADGE: Record<string, string> = {
  basic:    'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  standard: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  premium:  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};
const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  failed:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK', maximumFractionDigits: 0 }).format(n);
}

// ─── Package Comparison Card ──────────────────────────────────────────────────
function PackageCard({ pkg, isCurrent, allFeatures, canManage, onManageFeatures, onUpgrade }: {
  pkg: PackageTier;
  isCurrent: boolean;
  allFeatures: (PackageFeature & { packages: { packageId: string }[] })[];
  canManage: boolean;
  onManageFeatures: (pkg: PackageTier) => void;
  onUpgrade: (pkgName: string) => void;
}) {
  const includedFeatureIds = new Set(pkg.features.map(f => f.feature.id));

  return (
    <Card className={`relative border-2 ${PKG_COLOR[pkg.name] ?? ''} ${isCurrent ? 'ring-2 ring-accent' : ''}`}>
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">Current Plan</span>
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PKG_BADGE[pkg.name] ?? ''}`}>
            {pkg.displayName}
          </span>
          {canManage && (
            <button onClick={() => onManageFeatures(pkg)} className="p-1 text-muted-foreground hover:text-foreground" title="Manage features">
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <CardTitle className="text-2xl font-bold mt-2">
          {fmt(pkg.priceMonthly)}
          <span className="text-sm font-normal text-muted-foreground">/mo</span>
        </CardTitle>
        <CardDescription className="text-xs">{fmt(pkg.priceYearly)}/yr · Save {Math.round((1 - pkg.priceYearly / (pkg.priceMonthly * 12)) * 100)}%</CardDescription>
        {pkg.description && <p className="text-xs text-muted-foreground mt-1">{pkg.description}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Feature list */}
        <div className="space-y-1.5">
          {allFeatures.map(feat => {
            const included = includedFeatureIds.has(feat.id);
            return (
              <div key={feat.id} className={`flex items-center gap-2 text-sm ${included ? '' : 'opacity-35'}`}>
                <Check className={`h-3.5 w-3.5 flex-shrink-0 ${included ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                <span>{feat.displayName}</span>
              </div>
            );
          })}
        </div>
        {!isCurrent && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5"
            onClick={() => onUpgrade(pkg.name)}
          >
            <Zap className="h-3.5 w-3.5" />
            Switch to {pkg.displayName}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Manage Features Dialog ───────────────────────────────────────────────────
function ManageFeaturesDialog({ pkg, allFeatures, onClose }: {
  pkg: PackageTier;
  allFeatures: (PackageFeature & { packages: { packageId: string }[] })[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const includedIds = new Set(pkg.features.map(f => f.feature.id));
  const [selected, setSelected] = useState<Set<string>>(new Set(includedIds));

  const saveMutation = useMutation({
    mutationFn: () => packagesService.setPackageFeatures(pkg.id, [...selected]),
    onSuccess: () => {
      toast.success(`${pkg.displayName} features updated`);
      qc.invalidateQueries({ queryKey: ['packages'] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update'),
  });

  const byCategory = allFeatures.reduce((acc: Record<string, typeof allFeatures>, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select which features are included in the <strong>{pkg.displayName}</strong> package.
      </p>
      <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
        {Object.entries(byCategory).map(([cat, feats]) => (
          <div key={cat}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 capitalize">{cat}</p>
            <div className="space-y-1.5">
              {feats.map(feat => (
                <div key={feat.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`feat-${feat.id}`}
                    checked={selected.has(feat.id)}
                    onCheckedChange={c => {
                      const next = new Set(selected);
                      if (c) next.add(feat.id); else next.delete(feat.id);
                      setSelected(next);
                    }}
                  />
                  <label htmlFor={`feat-${feat.id}`} className="text-sm cursor-pointer">
                    {feat.displayName}
                    {feat.description && <span className="text-xs text-muted-foreground ml-1">— {feat.description}</span>}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
          {saveMutation.isPending ? 'Saving...' : 'Save Features'}
        </Button>
      </div>
    </div>
  );
}

// ─── Add Feature Dialog ───────────────────────────────────────────────────────
function AddFeatureDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('core');

  const createMutation = useMutation({
    mutationFn: () => packagesService.createFeature({ name, displayName, description: description || undefined, category }),
    onSuccess: () => {
      toast.success('Feature created');
      qc.invalidateQueries({ queryKey: ['package-features'] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create'),
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Feature Key <span className="text-xs text-muted-foreground">(no spaces, e.g. sms_alerts)</span></Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="feature_key" />
      </div>
      <div>
        <Label>Display Name</Label>
        <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="SMS Alerts" />
      </div>
      <div>
        <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div>
        <Label>Category</Label>
        <Select defaultValue="core" onValueChange={setCategory}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="core">Core</SelectItem>
            <SelectItem value="communication">Communication</SelectItem>
            <SelectItem value="reporting">Reporting</SelectItem>
            <SelectItem value="management">Management</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" disabled={!name || !displayName || createMutation.isPending} onClick={() => createMutation.mutate()} className="bg-accent text-accent-foreground hover:bg-accent/90">
          {createMutation.isPending ? 'Creating...' : 'Create Feature'}
        </Button>
      </div>
    </div>
  );
}

// ─── Record Payment Dialog ─────────────────────────────────────────────────────
function RecordPaymentDialog({ packages, onClose }: { packages: PackageTier[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('subscription');
  const [pkgName, setPkgName] = useState('');
  const [reference, setReference] = useState('');
  const [status, setStatus] = useState('completed');

  const createMutation = useMutation({
    mutationFn: () => packagesService.createPayment({
      amount: parseFloat(amount),
      type,
      packageName: pkgName,
      reference: reference || undefined,
      status,
    }),
    onSuccess: () => {
      toast.success('Payment recorded');
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['package-current'] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to record payment'),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Amount (MWK)</Label>
          <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="15000" />
        </div>
        <div>
          <Label>Type</Label>
          <Select defaultValue="subscription" onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="subscription">Subscription</SelectItem>
              <SelectItem value="upgrade">Upgrade</SelectItem>
              <SelectItem value="downgrade">Downgrade</SelectItem>
              <SelectItem value="renewal">Renewal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Package</Label>
        <Select onValueChange={setPkgName}>
          <SelectTrigger><SelectValue placeholder="Select package..." /></SelectTrigger>
          <SelectContent>
            {packages.map(p => <SelectItem key={p.name} value={p.name}>{p.displayName}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Status</Label>
        <Select defaultValue="completed" onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Reference <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="TXN-12345" />
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" disabled={!amount || !pkgName || createMutation.isPending} onClick={() => createMutation.mutate()} className="bg-accent text-accent-foreground hover:bg-accent/90">
          {createMutation.isPending ? 'Recording...' : 'Record Payment'}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PackagesPage() {
  const { hasPermission } = useRole();
  const canManage = hasPermission('packages:manage');
  const canPayments = hasPermission('payments:create');
  const qc = useQueryClient();

  const [managePkg, setManagePkg] = useState<PackageTier | null>(null);
  const [addFeatureOpen, setAddFeatureOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);

  const { data: packages = [], isLoading: loadingPkgs } = useQuery({
    queryKey: ['packages'],
    queryFn: packagesService.getAll,
  });

  const { data: currentData } = useQuery({
    queryKey: ['package-current'],
    queryFn: packagesService.getCurrent,
  });

  const { data: allFeatures = [] } = useQuery({
    queryKey: ['package-features'],
    queryFn: packagesService.getFeatures,
  });

  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['payments'],
    queryFn: packagesService.getPayments,
  });

  const deleteFeatureMutation = useMutation({
    mutationFn: (id: string) => packagesService.deleteFeature(id),
    onSuccess: () => {
      toast.success('Feature deleted');
      qc.invalidateQueries({ queryKey: ['package-features'] });
      qc.invalidateQueries({ queryKey: ['packages'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to delete feature'),
  });

  function handleUpgrade(pkgName: string) {
    // Open record payment dialog pre-filled
    setRecordPaymentOpen(true);
    toast.info(`Select payment details to switch to ${pkgName}`);
  }

  const currentPkg = currentData?.church?.package;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Packages & Billing</h1>
          <p className="text-sm text-muted-foreground">
            Current plan:&nbsp;
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${PKG_BADGE[currentPkg ?? 'basic'] ?? ''}`}>
              {currentPkg ?? '—'}
            </span>
          </p>
        </div>
        {canPayments && (
          <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                <CreditCard className="h-4 w-4" /> Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">Record Payment</DialogTitle></DialogHeader>
              <RecordPaymentDialog packages={packages} onClose={() => setRecordPaymentOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans" className="gap-1.5"><Package2 className="h-3.5 w-3.5" /> Plans</TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Payments</TabsTrigger>
          {canManage && (
            <TabsTrigger value="features" className="gap-1.5"><Settings2 className="h-3.5 w-3.5" /> Features</TabsTrigger>
          )}
        </TabsList>

        {/* ─── Plans Tab ──────────────────────────────────────────────── */}
        <TabsContent value="plans" className="mt-6">
          {loadingPkgs ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {packages.map(pkg => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isCurrent={pkg.name === currentPkg}
                  allFeatures={allFeatures}
                  canManage={canManage}
                  onManageFeatures={setManagePkg}
                  onUpgrade={handleUpgrade}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Payments Tab ───────────────────────────────────────────── */}
        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {loadingPayments ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-sm capitalize">{p.type.replace('_', ' ')}</TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${PKG_BADGE[p.packageName] ?? ''}`}>
                            {p.package?.displayName ?? p.packageName}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{fmt(p.amount)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.reference ?? '—'}</TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[p.status] ?? ''}`}>
                            {p.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {payments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          No payment records yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Features Tab (manage only) ─────────────────────────────── */}
        {canManage && (
          <TabsContent value="features" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">{allFeatures.length} features defined</p>
              <Dialog open={addFeatureOpen} onOpenChange={setAddFeatureOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Add Feature
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-heading">Add Package Feature</DialogTitle></DialogHeader>
                  <AddFeatureDialog onClose={() => setAddFeatureOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Packages</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allFeatures.map(f => (
                      <TableRow key={f.id}>
                        <TableCell>
                          <p className="font-medium text-sm">{f.displayName}</p>
                          <p className="text-xs text-muted-foreground">{f.name}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">{f.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {packages
                              .filter(p => f.packages.some(fp => fp.packageId === p.id))
                              .map(p => (
                                <span key={p.id} className={`text-xs px-1.5 py-0.5 rounded-full ${PKG_BADGE[p.name] ?? ''}`}>
                                  {p.displayName}
                                </span>
                              ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => deleteFeatureMutation.mutate(f.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Manage features dialog */}
      <Dialog open={!!managePkg} onOpenChange={open => !open && setManagePkg(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Manage {managePkg?.displayName} Features</DialogTitle></DialogHeader>
          {managePkg && (
            <ManageFeaturesDialog
              pkg={managePkg}
              allFeatures={allFeatures}
              onClose={() => setManagePkg(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
