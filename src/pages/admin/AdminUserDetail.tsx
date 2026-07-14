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

type EditUserData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  roleId: string;
  accountCountry: string;
  title: string;
  titleOther: string;
  ministryName: string;
  currentMembership: string;
  gender: string;
  dateOfBirth: string;
  maritalStatus: string;
  weddingDate: string;
  residentialNeighbourhood: string;
  membershipType: string;
  serviceInterest: string;
  baptizedByImmersion: boolean;
  memberType: string;
  loginEnabled: boolean;
  churchId: string;
  regions: string;
  districts: string;
  traditionalAuthorities: string;
};

const emptyEditData: EditUserData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  status: 'active',
  roleId: '',
  accountCountry: '',
  title: '',
  titleOther: '',
  ministryName: '',
  currentMembership: '',
  gender: '',
  dateOfBirth: '',
  maritalStatus: '',
  weddingDate: '',
  residentialNeighbourhood: '',
  membershipType: '',
  serviceInterest: '',
  baptizedByImmersion: false,
  memberType: 'adult',
  loginEnabled: true,
  churchId: '',
  regions: '',
  districts: '',
  traditionalAuthorities: '',
};

function listToInput(value: unknown) {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.join(', ');
    } catch {
      return value;
    }
    return value;
  }
  return '';
}

function inputToList(value: string) {
  return value.split(',').map(v => v.trim()).filter(Boolean);
}

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<EditUserData>(emptyEditData);
  const [churchSearch, setChurchSearch] = useState('');
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

  const { data: churchesData } = useQuery({
    queryKey: ['admin-all-churches', churchSearch],
    queryFn: () => adminApi.getAllChurches({ q: churchSearch || undefined, limit: 30 }).then(r => r.data),
    enabled: editOpen && !!data && ((data.roleName ?? data.role?.name) === 'member' || !!data.church),
  });
  const churches = churchesData?.data ?? [];
  const selectedChurch = data?.church && !churches.some((church: any) => church.id === data.church?.id)
    ? [data.church]
    : [];
  const churchOptions = [...selectedChurch, ...churches];

  const { data: roleOptionsData } = useQuery({
    queryKey: ['admin-user-role-options', id],
    queryFn: () => adminApi.getUserRoleOptions(id!).then(r => r.data.data),
    enabled: editOpen && !!id,
  });
  const roleOptions = roleOptionsData?.roles ?? [];

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
    onSuccess: () => { toast.success('Password reset successfully'); setNewPassword(''); setResetOpen(false); },
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

  const openEditUser = () => {
    if (!data) return;
    setEditData({
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      email: data.email ?? '',
      phone: data.phone ?? '',
      status: data.status ?? 'active',
      roleId: data.role?.id ?? data.roleId ?? '',
      accountCountry: data.accountCountry ?? '',
      title: data.title ?? '',
      titleOther: data.titleOther ?? '',
      ministryName: data.ministryName ?? '',
      currentMembership: data.currentMembership != null ? String(data.currentMembership) : '',
      gender: data.gender ?? '',
      dateOfBirth: data.dateOfBirth ? toDateInput(data.dateOfBirth) : '',
      maritalStatus: data.maritalStatus ?? '',
      weddingDate: data.weddingDate ? toDateInput(data.weddingDate) : '',
      residentialNeighbourhood: data.residentialNeighbourhood ?? '',
      membershipType: data.membershipType ?? '',
      serviceInterest: data.serviceInterest ?? '',
      baptizedByImmersion: !!data.baptizedByImmersion,
      memberType: data.memberType ?? 'adult',
      loginEnabled: data.loginEnabled ?? true,
      churchId: data.church?.id ?? '',
      regions: listToInput(data.regions),
      districts: listToInput(data.districts),
      traditionalAuthorities: listToInput(data.traditionalAuthorities),
    });
    setChurchSearch(data.church?.name ?? '');
    setEditOpen(true);
  };

  const nullable = (value: string) => value.trim() ? value.trim() : null;
  const nullableNumber = (value: string) => value.trim() ? Number(value) : null;

  const saveEditUser = () => {
    const roleName = data?.roleName ?? data?.role?.name;
    const isMemberEdit = roleName === 'member';
    const isMinistryAdminEdit = roleName === 'ministry_admin';
    const hasChurchProfile = !!editData.churchId || !!data?.church?.id;
    const payload: Record<string, any> = {
      firstName: editData.firstName.trim(),
      lastName: editData.lastName.trim(),
      email: editData.email.trim(),
      phone: nullable(editData.phone),
      status: editData.status,
      roleId: editData.roleId || undefined,
      loginEnabled: editData.loginEnabled,
    };

    if (isMinistryAdminEdit || (!isMemberEdit && !hasChurchProfile)) {
      payload.accountCountry = editData.accountCountry || null;
    }

    if (isMinistryAdminEdit) {
      payload.title = nullable(editData.title);
      payload.titleOther = nullable(editData.titleOther);
      payload.ministryName = nullable(editData.ministryName);
      payload.currentMembership = nullableNumber(editData.currentMembership);
    }

    if (isMemberEdit || hasChurchProfile) {
      payload.churchId = editData.churchId || null;
      payload.memberType = editData.memberType || 'adult';
      payload.gender = editData.gender || null;
      payload.dateOfBirth = editData.dateOfBirth || null;
      payload.maritalStatus = editData.maritalStatus || null;
      payload.weddingDate = editData.weddingDate || null;
      payload.residentialNeighbourhood = nullable(editData.residentialNeighbourhood);
      payload.membershipType = editData.membershipType || null;
      payload.serviceInterest = nullable(editData.serviceInterest);
      payload.baptizedByImmersion = editData.baptizedByImmersion;
    }

    if (!isMemberEdit && !isMinistryAdminEdit) {
      payload.regions = inputToList(editData.regions);
      payload.districts = inputToList(editData.districts);
      payload.traditionalAuthorities = inputToList(editData.traditionalAuthorities);
    }

    updateMutation.mutate(payload);
  };

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

  const roleName = data.roleName ?? data.role?.name;
  const isMinistryAdmin = roleName === 'ministry_admin';
  const isMemberUser = roleName === 'member';
  const hasChurchProfile = !!data.church;
  const showCountryField = isMinistryAdmin || (!isMemberUser && !hasChurchProfile);
  const showMinistryProfile = isMinistryAdmin;
  const showMemberProfile = isMemberUser || hasChurchProfile;
  const showScopeProfile = !isMemberUser && !isMinistryAdmin;

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
            onClick={openEditUser}>
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
            {showCountryField && <InfoRow label="Country" value={data.accountCountry} />}
            <InfoRow label="Login Enabled" value={data.loginEnabled ? 'Yes' : 'No'} />
            {showMemberProfile && (
              <>
                <InfoRow label="Church" value={data.church?.name} />
                <InfoRow label="Gender" value={data.gender} />
                <InfoRow label="Date of Birth" value={data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : null} />
                <InfoRow label="Marital Status" value={data.maritalStatus} />
                <InfoRow label="Wedding Date" value={data.weddingDate ? new Date(data.weddingDate).toLocaleDateString() : null} />
                <InfoRow label="Neighbourhood" value={data.residentialNeighbourhood} />
                <InfoRow label="Membership Type" value={data.membershipType} />
                <InfoRow label="Member Type" value={data.memberType} />
                <InfoRow label="Service Interest" value={data.serviceInterest} />
                <InfoRow label="Baptized" value={data.baptizedByImmersion == null ? null : data.baptizedByImmersion ? 'Yes' : 'No'} />
              </>
            )}
            {showMinistryProfile && (
              <>
                <InfoRow label="Ministry Name" value={(data as any).ministryName} />
                <InfoRow label="Membership" value={(data as any).currentMembership?.toLocaleString()} />
                <InfoRow label="Branches" value={data.ownedChurches?.length ?? data.churchCount ?? 0} />
              </>
            )}
            {showScopeProfile && (
              <>
                <InfoRow label="Regions" value={listToInput(data.regions)} />
                <InfoRow label="Districts" value={listToInput(data.districts)} />
                <InfoRow label="T/Authorities" value={listToInput(data.traditionalAuthorities)} />
              </>
            )}
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

      {data.childProfile && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Child Profile</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-x-4">
              <InfoRow label="Child Name" value={`${data.childProfile.firstName} ${data.childProfile.lastName}`} />
              <InfoRow label="Status" value={data.childProfile.status} />
              <InfoRow label="Church" value={data.childProfile.church?.name} />
              <InfoRow label="Gender" value={data.childProfile.gender} />
              <InfoRow label="Date of Birth" value={data.childProfile.dateOfBirth ? new Date(data.childProfile.dateOfBirth).toLocaleDateString() : null} />
              <InfoRow label="Age" value={data.childProfile.age} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Guardians</p>
              {data.childProfile.guardians?.length ? (
                <div className="grid sm:grid-cols-2 gap-2">
                  {data.childProfile.guardians.map(link => (
                    <div key={link.guardian.id} className="rounded-md border p-2">
                      <p className="text-xs font-medium">{link.guardian.firstName} {link.guardian.lastName}</p>
                      <p className="text-xs text-muted-foreground">{link.guardian.email || link.guardian.phone || 'No contact'}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">
                        {link.relationship}{link.isPrimary ? ' · Primary' : ''}{link.emergencyContact ? ' · Emergency' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No guardians linked.</p>
              )}
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => navigate('/dashboard/children')}>
              Open Children Page
            </Button>
          </CardContent>
        </Card>
      )}

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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-base">Edit User</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Account</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">First Name</Label>
                  <Input className="h-8 text-xs" value={editData.firstName} onChange={e => setEditData(d => ({ ...d, firstName: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Last Name</Label>
                  <Input className="h-8 text-xs" value={editData.lastName} onChange={e => setEditData(d => ({ ...d, lastName: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input className="h-8 text-xs" type="email" value={editData.email} onChange={e => setEditData(d => ({ ...d, email: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Phone</Label>
                  <Input className="h-8 text-xs" value={editData.phone} onChange={e => setEditData(d => ({ ...d, phone: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select value={editData.status} onValueChange={v => setEditData(d => ({ ...d, status: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active" className="text-xs">Active</SelectItem>
                      <SelectItem value="suspended" className="text-xs">Suspended</SelectItem>
                      <SelectItem value="inactive" className="text-xs">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Role</Label>
                  <Select value={editData.roleId || 'none'} onValueChange={v => setEditData(d => ({ ...d, roleId: v === 'none' ? '' : v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">No role</SelectItem>
                      {roleOptions.map(role => (
                        <SelectItem key={role.id} value={role.id} className="text-xs">
                          {role.displayName}{role.isSystemRole ? ' (system)' : ' (ministry)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">Roles are loaded from this user&apos;s ministry plus global system roles.</p>
                </div>
                {showCountryField && (
                  <div className="space-y-1">
                    <Label className="text-xs">Account Country</Label>
                    <Select value={editData.accountCountry || 'none'} onValueChange={v => setEditData(d => ({ ...d, accountCountry: v === 'none' ? '' : v }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select country" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">Not set</SelectItem>
                        <SelectItem value="Malawi" className="text-xs">Malawi</SelectItem>
                        <SelectItem value="Kenya" className="text-xs">Kenya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <label className="flex items-center gap-2 text-xs rounded-md border p-2">
                  <input type="checkbox" checked={editData.loginEnabled} onChange={e => setEditData(d => ({ ...d, loginEnabled: e.target.checked }))} />
                  Login enabled
                </label>
              </div>
            </div>

            {showMinistryProfile && <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Ministry Admin Profile</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Title</Label>
                  <Input className="h-8 text-xs" value={editData.title} onChange={e => setEditData(d => ({ ...d, title: e.target.value }))} placeholder="Pastor, Rev, Dr..." />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Other Title</Label>
                  <Input className="h-8 text-xs" value={editData.titleOther} onChange={e => setEditData(d => ({ ...d, titleOther: e.target.value }))} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Ministry Name</Label>
                  <Input className="h-8 text-xs" value={editData.ministryName} onChange={e => setEditData(d => ({ ...d, ministryName: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Current Membership</Label>
                  <Input className="h-8 text-xs" type="number" min={0} value={editData.currentMembership} onChange={e => setEditData(d => ({ ...d, currentMembership: e.target.value }))} />
                </div>
              </div>
            </div>}

            {showMemberProfile && <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Member Profile</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Church</Label>
                  <Input
                    className="h-8 text-xs mb-1"
                    value={churchSearch}
                    onChange={e => setChurchSearch(e.target.value)}
                    placeholder="Search church by name, location, region, district"
                  />
                  <Select value={editData.churchId || 'none'} onValueChange={v => setEditData(d => ({ ...d, churchId: v === 'none' ? '' : v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select church" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">No church</SelectItem>
                      {churchOptions.map((church: any) => (
                        <SelectItem key={church.id} value={church.id} className="text-xs">
                          {church.name}{church.location ? ` - ${church.location}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">Showing up to 30 matches. Type to narrow results.</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Member Type</Label>
                  <Select value={editData.memberType} onValueChange={v => setEditData(d => ({ ...d, memberType: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adult" className="text-xs">Adult</SelectItem>
                      <SelectItem value="child" className="text-xs">Child</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Gender</Label>
                  <Select value={editData.gender || 'none'} onValueChange={v => setEditData(d => ({ ...d, gender: v === 'none' ? '' : v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">Not set</SelectItem>
                      <SelectItem value="male" className="text-xs">Male</SelectItem>
                      <SelectItem value="female" className="text-xs">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date of Birth</Label>
                  <Input className="h-8 text-xs" type="date" value={editData.dateOfBirth} onChange={e => setEditData(d => ({ ...d, dateOfBirth: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Marital Status</Label>
                  <Select value={editData.maritalStatus || 'none'} onValueChange={v => setEditData(d => ({ ...d, maritalStatus: v === 'none' ? '' : v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">Not set</SelectItem>
                      <SelectItem value="single" className="text-xs">Single</SelectItem>
                      <SelectItem value="married" className="text-xs">Married</SelectItem>
                      <SelectItem value="widowed" className="text-xs">Widowed</SelectItem>
                      <SelectItem value="divorced" className="text-xs">Divorced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Wedding Date</Label>
                  <Input className="h-8 text-xs" type="date" value={editData.weddingDate} onChange={e => setEditData(d => ({ ...d, weddingDate: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Residential Neighbourhood</Label>
                  <Input className="h-8 text-xs" value={editData.residentialNeighbourhood} onChange={e => setEditData(d => ({ ...d, residentialNeighbourhood: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Membership Type</Label>
                  <Select value={editData.membershipType || 'none'} onValueChange={v => setEditData(d => ({ ...d, membershipType: v === 'none' ? '' : v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select membership" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">Not set</SelectItem>
                      <SelectItem value="member" className="text-xs">Member</SelectItem>
                      <SelectItem value="pastor" className="text-xs">Pastor</SelectItem>
                      <SelectItem value="deacon" className="text-xs">Deacon</SelectItem>
                      <SelectItem value="other" className="text-xs">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-xs rounded-md border p-2">
                  <input type="checkbox" checked={editData.baptizedByImmersion} onChange={e => setEditData(d => ({ ...d, baptizedByImmersion: e.target.checked }))} />
                  Baptized by immersion
                </label>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Service Interest</Label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs min-h-16 resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                    value={editData.serviceInterest}
                    onChange={e => setEditData(d => ({ ...d, serviceInterest: e.target.value }))}
                    placeholder="Choir, ushering, outreach..."
                  />
                </div>
              </div>
            </div>}

            {showScopeProfile && <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Scope / Location</p>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Regions</Label>
                  <Input className="h-8 text-xs" value={editData.regions} onChange={e => setEditData(d => ({ ...d, regions: e.target.value }))} placeholder="Comma separated" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Districts</Label>
                  <Input className="h-8 text-xs" value={editData.districts} onChange={e => setEditData(d => ({ ...d, districts: e.target.value }))} placeholder="Comma separated" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Traditional Authorities</Label>
                  <Input className="h-8 text-xs" value={editData.traditionalAuthorities} onChange={e => setEditData(d => ({ ...d, traditionalAuthorities: e.target.value }))} placeholder="Comma separated" />
                </div>
              </div>
            </div>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={updateMutation.isPending || !editData.firstName.trim() || !editData.lastName.trim() || !editData.email.trim()} onClick={saveEditUser}>
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog
        open={resetOpen}
        onOpenChange={open => { if (!open && !resetMutation.isPending) { setResetOpen(false); setNewPassword(''); } }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Reset Password</DialogTitle></DialogHeader>
          <div className="space-y-1">
            <Label className="text-xs">New Password</Label>
            <Input
              className="h-8 text-xs"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
              autoComplete="new-password"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { setResetOpen(false); setNewPassword(''); }}>Cancel</Button>
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
