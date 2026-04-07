import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2, ShieldOff, ShieldCheck, Trash2, KeyRound, Edit2, Package, Plus, RefreshCw, Mail } from 'lucide-react';
import { adminApi, type AdminSubscription } from '@/services/adminApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ExportImportButtons } from '@/components/ExportImportButtons';

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b last:border-0">
      <span className="text-xs text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="text-xs font-medium">{value ?? '—'}</span>
    </div>
  );
}

function subStatusBadge(status: string) {
  if (status === 'active') return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Active</Badge>;
  if (status === 'expired') return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Expired</Badge>;
  if (status === 'cancelled') return <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-xs">Cancelled</Badge>;
  return <Badge variant="outline" className="text-xs">{status}</Badge>;
}

function payStatusBadge(status: string) {
  if (status === 'completed') return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Completed</Badge>;
  if (status === 'pending') return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">Pending</Badge>;
  if (status === 'failed') return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Failed</Badge>;
  return <Badge variant="outline" className="text-xs capitalize">{status}</Badge>;
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function toDateInput(iso: string) {
  return iso ? new Date(iso).toISOString().split('T')[0] : '';
}

const today = () => new Date().toISOString().split('T')[0];

interface SubForm {
  packageId: string;
  startsAt: string;
  expiresAt: string;
  status: string;
}

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({ subject: '', message: '' });

  // Subscription dialog — used for both create and edit
  const [subOpen, setSubOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<AdminSubscription | null>(null);
  const [subForm, setSubForm] = useState<SubForm>({ packageId: '', startsAt: today(), expiresAt: addMonths(new Date(), 1), status: 'active' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => adminApi.getUser(id!).then(r => r.data.data),
    enabled: !!id,
  });

  const { data: packagesData } = useQuery({
    queryKey: ['admin-packages'],
    queryFn: () => adminApi.getPackages().then(r => r.data.data),
  });
  const packages = packagesData ?? [];

  const updateMutation = useMutation({
    mutationFn: (d: any) => adminApi.updateUser(id!, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-user', id] }); toast.success('User updated'); setEditOpen(false); },
    onError: () => toast.error('Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteUser(id!),
    onSuccess: () => { toast.success('User deleted'); navigate('/admin/users'); },
    onError: () => toast.error('Delete failed'),
  });

  const resetMutation = useMutation({
    mutationFn: () => adminApi.resetPassword(id!, newPassword),
    onSuccess: () => { toast.success('Password reset'); setResetOpen(false); setNewPassword(''); },
    onError: () => toast.error('Reset failed'),
  });

  const sendEmailMutation = useMutation({
    mutationFn: (d: { subject: string; message: string }) => adminApi.sendEmail(id!, d),
    onSuccess: () => { toast.success('Email queued successfully'); setEmailOpen(false); setEmailForm({ subject: '', message: '' }); },
    onError: () => toast.error('Failed to send email'),
  });

  const createSubMutation = useMutation({
    mutationFn: (d: SubForm) => adminApi.manageSubscription(id!, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-user', id] }); toast.success('Subscription created'); setSubOpen(false); },
    onError: () => toast.error('Failed to create subscription'),
  });

  const updateSubMutation = useMutation({
    mutationFn: (d: SubForm) => adminApi.updateSubscription(id!, editingSub!.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-user', id] }); toast.success('Subscription updated'); setSubOpen(false); },
    onError: () => toast.error('Failed to update subscription'),
  });

  const toggleStatus = () => updateMutation.mutate({ status: data?.status === 'active' ? 'suspended' : 'active' });

  const openCreateSub = () => {
    setEditingSub(null);
    setSubForm({ packageId: packages[0]?.id ?? '', startsAt: today(), expiresAt: addMonths(new Date(), 1), status: 'active' });
    setSubOpen(true);
  };

  const openEditSub = (sub: AdminSubscription) => {
    setEditingSub(sub);
    setSubForm({ packageId: sub.packageId, startsAt: toDateInput(sub.startsAt), expiresAt: toDateInput(sub.expiresAt), status: sub.status });
    setSubOpen(true);
  };

  const handleSubSave = () => {
    if (editingSub) updateSubMutation.mutate(subForm);
    else createSubMutation.mutate(subForm);
  };

  const setQuickExpiry = (months: number) => {
    setSubForm(f => ({ ...f, expiresAt: addMonths(new Date(f.startsAt || today()), months) }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2].map(i => <Card key={i}><CardContent className="p-4 h-40 animate-pulse bg-muted rounded" /></Card>)}
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-sm text-muted-foreground">User not found</p>;

  const isMinistryAdmin = data.roleName === 'ministry_admin';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{data.title ? `${data.title} ` : ''}{data.firstName} {data.lastName}</h1>
            <p className="text-xs text-muted-foreground">{data.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5"
            onClick={() => { setEditData({ firstName: data.firstName, lastName: data.lastName, email: data.email, phone: data.phone ?? '' }); setEditOpen(true); }}>
            <Edit2 className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={toggleStatus}>
            {data.status === 'active' ? <><ShieldOff className="h-3.5 w-3.5" /> Suspend</> : <><ShieldCheck className="h-3.5 w-3.5" /> Activate</>}
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => { setNewPassword(''); setResetOpen(true); }}>
            <KeyRound className="h-3.5 w-3.5" /> Reset Password
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => { setEmailForm({ subject: '', message: '' }); setEmailOpen(true); }}>
            <Mail className="h-3.5 w-3.5" /> Send Email
          </Button>
          <Button variant="destructive" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
          <ExportImportButtons
            filename={`user-${data.firstName}-${data.lastName}`}
            pdfTitle={`User: ${data.firstName} ${data.lastName}`}
            data={[{
              firstName: data.firstName, lastName: data.lastName, title: data.title ?? '',
              email: data.email, phone: data.phone ?? '', country: data.accountCountry ?? '',
              role: data.role?.displayName ?? '', status: data.status,
              joined: new Date(data.createdAt).toLocaleDateString(),
              ministryName: (data as any).ministryName ?? '',
              package: data.subscription?.package?.displayName ?? '',
              subStatus: data.subscription?.status ?? '',
              subStarts: data.subscription ? new Date(data.subscription.startsAt).toLocaleDateString() : '',
              subExpires: data.subscription ? new Date(data.subscription.expiresAt).toLocaleDateString() : '',
            }]}
            headers={[
              { label: 'First Name', key: 'firstName' }, { label: 'Last Name', key: 'lastName' },
              { label: 'Title', key: 'title' }, { label: 'Email', key: 'email' },
              { label: 'Phone', key: 'phone' }, { label: 'Country', key: 'country' },
              { label: 'Role', key: 'role' }, { label: 'Status', key: 'status' },
              { label: 'Joined', key: 'joined' }, { label: 'Ministry Name', key: 'ministryName' },
              { label: 'Package', key: 'package' }, { label: 'Sub Status', key: 'subStatus' },
              { label: 'Sub Starts', key: 'subStarts' }, { label: 'Sub Expires', key: 'subExpires' },
            ]}
            pdfColumns={['First Name', 'Last Name', 'Email', 'Phone', 'Country', 'Role', 'Status', 'Joined', 'Package', 'Sub Status', 'Sub Expires']}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Profile */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Profile</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4">
            <InfoRow label="Full Name" value={`${data.firstName} ${data.lastName}`} />
            <InfoRow label="Title" value={data.title} />
            <InfoRow label="Email" value={data.email} />
            <InfoRow label="Phone" value={data.phone} />
            <InfoRow label="Country" value={data.accountCountry} />
            <InfoRow label="Ministry Name" value={(data as any).ministryName} />
            <InfoRow label="Membership" value={(data as any).currentMembership?.toLocaleString()} />
            <InfoRow label="Branches" value={(data as any).numberOfBranches} />
            <InfoRow label="Role" value={data.role?.displayName} />
            <InfoRow label="Joined" value={new Date(data.createdAt).toLocaleDateString()} />
            <div className="flex items-start gap-2 py-1.5">
              <span className="text-xs text-muted-foreground w-32 shrink-0">Status</span>
              {data.status === 'active'
                ? <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Active</Badge>
                : <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs capitalize">{data.status}</Badge>}
            </div>
          </CardContent>
        </Card>

        {/* Active Subscription */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4" /> Active Subscription</CardTitle>
            {isMinistryAdmin && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={openCreateSub}>
                <Plus className="h-3 w-3" /> {data.subscription ? 'New' : 'Activate'}
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {data.subscription ? (
              <>
                <InfoRow label="Package" value={data.subscription.package.displayName} />
                <InfoRow label="Status" value={data.subscription.status} />
                <InfoRow label="Starts" value={new Date(data.subscription.startsAt).toLocaleDateString()} />
                <InfoRow label="Expires" value={new Date(data.subscription.expiresAt).toLocaleDateString()} />
                <div className="mt-3">
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                    onClick={() => openEditSub(data.subscription as AdminSubscription)}>
                    <RefreshCw className="h-3 w-3" /> Edit Subscription
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground py-2">
                {isMinistryAdmin ? 'No active subscription. Click "Activate" to assign one.' : 'Not applicable'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Churches */}
      {data.ownedChurches && data.ownedChurches.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Churches ({data.ownedChurches.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {data.ownedChurches.map(church => (
                <div key={church.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/admin/churches/${church.id}`)}>
                  <div>
                    <p className="text-sm font-medium">{church.name}</p>
                    <p className="text-xs text-muted-foreground">{church.location}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-medium">{church._count.users} users</p>
                      <p className="text-xs text-muted-foreground">{church.country}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">View →</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Subscriptions History */}
      {isMinistryAdmin && data.subscriptions && data.subscriptions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Subscription History ({data.subscriptions.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Package</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Starts</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Expires</th>
                    <th className="px-4 py-2 w-16" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.subscriptions.map((sub: AdminSubscription) => (
                    <tr key={sub.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-medium">{sub.package.displayName}</td>
                      <td className="px-4 py-2.5">{subStatusBadge(sub.status)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{new Date(sub.startsAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{new Date(sub.expiresAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5">
                        <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => openEditSub(sub)}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Transactions */}
      {isMinistryAdmin && data.payments && data.payments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Package Payment History ({data.payments.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Package</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden md:table-cell">Gateway</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden md:table-cell">Cycle</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-medium">{p.package?.displayName ?? p.packageName}</td>
                      <td className="px-4 py-2.5">{p.currency} {p.amount?.toLocaleString()}</td>
                      <td className="px-4 py-2.5">{payStatusBadge(p.status)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell capitalize">{p.gateway ?? '—'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell capitalize">{p.billingCycle ?? '—'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manage Subscription Dialog */}
      <Dialog open={subOpen} onOpenChange={setSubOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{editingSub ? 'Edit Subscription' : 'Activate Subscription'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Package</Label>
              <Select value={subForm.packageId} onValueChange={v => setSubForm(f => ({ ...f, packageId: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select package" /></SelectTrigger>
                <SelectContent>
                  {packages.map((p: any) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">{p.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={subForm.status} onValueChange={v => setSubForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="text-xs">Active</SelectItem>
                  <SelectItem value="expired" className="text-xs">Expired</SelectItem>
                  <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input className="h-8 text-xs" type="date" value={subForm.startsAt}
                onChange={e => setSubForm(f => ({ ...f, startsAt: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Expiry Date</Label>
              <Input className="h-8 text-xs" type="date" value={subForm.expiresAt}
                onChange={e => setSubForm(f => ({ ...f, expiresAt: e.target.value }))} />
              <div className="flex gap-1 mt-1">
                {[1, 3, 6, 12].map(m => (
                  <button key={m} type="button"
                    className="text-xs px-2 py-0.5 rounded border border-border hover:bg-muted transition-colors"
                    onClick={() => setQuickExpiry(m)}>
                    +{m}mo
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setSubOpen(false)}>Cancel</Button>
            <Button size="sm"
              disabled={!subForm.packageId || !subForm.startsAt || !subForm.expiresAt || createSubMutation.isPending || updateSubMutation.isPending}
              onClick={handleSubSave}>
              {(createSubMutation.isPending || updateSubMutation.isPending) ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-base">Send Email to {data?.firstName} {data?.lastName}</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground -mt-1">{data?.email}</p>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Subject</Label>
              <Input className="h-8 text-xs" value={emailForm.subject}
                onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Important Notice" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Message</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs min-h-32 resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                value={emailForm.message}
                onChange={e => setEmailForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Write your message here..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setEmailOpen(false)}>Cancel</Button>
            <Button size="sm"
              disabled={!emailForm.subject.trim() || !emailForm.message.trim() || sendEmailMutation.isPending}
              onClick={() => sendEmailMutation.mutate(emailForm)}>
              {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit user dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Edit User</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {(['firstName', 'lastName', 'email', 'phone'] as const).map(field => (
              <div key={field} className="space-y-1">
                <Label className="text-xs capitalize">{field.replace(/([A-Z])/g, ' $1')}</Label>
                <Input className="h-8 text-xs" value={editData[field]} onChange={e => setEditData(d => ({ ...d, [field]: e.target.value }))} />
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={updateMutation.isPending} onClick={() => updateMutation.mutate(editData)}>
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Reset Password</DialogTitle></DialogHeader>
          <div className="space-y-1">
            <Label className="text-xs">New Password</Label>
            <Input className="h-8 text-xs" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 8 characters" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={newPassword.length < 8 || resetMutation.isPending} onClick={() => resetMutation.mutate()}>
              {resetMutation.isPending ? 'Resetting...' : 'Reset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Delete User</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Delete <strong>{data.firstName} {data.lastName}</strong>? This cannot be undone.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
