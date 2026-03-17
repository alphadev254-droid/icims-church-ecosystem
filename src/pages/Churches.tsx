import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { churchesService, type Church } from '@/services/churches';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useHasFeature, useCheckLimit } from '@/hooks/usePackageFeatures';
import { STALE_TIME } from '@/lib/query-config';
import { LocationSelect, type LocationValue } from '@/components/LocationSelect';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Building2, Users, MapPin, Globe, Landmark, Plus, Pencil, Trash2, Lock, Link2, Copy, Check, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
const LEVEL_ICON: Record<string, typeof Globe> = {
  national: Globe, regional: MapPin, district: Landmark, local: Building2,
};

const STATIC_BASE = (import.meta.env.VITE_STATIC_URL || 'http://localhost:5000').replace(/\/+$/, '');
const getLogoUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('http')) return path;
  return `${STATIC_BASE}${path}`;
};

// ─── Form schema ──────────────────────────────────────────────────────────────
const schema = z.object({
  name: z.string().min(2, 'Name required (min 2 characters)'),
  phone: z.string().optional().default(''),
  email: z.string().email().optional().or(z.literal('')).default(''),
  website: z.string().optional().default(''),
  address: z.string().optional().default(''),
  pastorName: z.string().optional().default(''),
  region: z.string().min(1, 'Region is required'),
  district: z.string().min(1, 'District is required'),
  traditionalAuthority: z.string().min(1, 'Traditional Authority is required'),
  village: z.string().optional().default(''),
});
type FormValues = z.infer<typeof schema>;

// ─── Church Form ──────────────────────────────────────────────────────────────
function ChurchForm({ defaultValues, defaultLocation, existingLogoUrl, onSubmit, isPending, submitLabel }: {
  defaultValues?: Partial<FormValues>;
  defaultLocation?: LocationValue;
  existingLogoUrl?: string | null;
  onSubmit: (v: FormValues, logoFile: File | null, removeLogo: boolean) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const logoFileRef = useRef<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(existingLogoUrl ? getLogoUrl(existingLogoUrl) : '');
  const [removeLogoFlag, setRemoveLogoFlag] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: '', email: '', website: '', address: '', village: '', pastorName: '',
      region: defaultLocation?.region || '',
      district: defaultLocation?.district || '',
      traditionalAuthority: defaultLocation?.traditionalAuthority || '',
      ...defaultValues
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    logoFileRef.current = file;
    setRemoveLogoFlag(false);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    logoFileRef.current = null;
    setLogoPreview('');
    setRemoveLogoFlag(true);
  };

  return (
    <form onSubmit={handleSubmit(v => onSubmit(v, logoFileRef.current, removeLogoFlag))} className="space-y-4">
      {/* Logo upload */}
      <div>
        <Label>Branch Logo <span className="text-muted-foreground text-xs">(optional)</span></Label>
        {logoPreview ? (
          <div className="relative mt-1 w-24 h-24">
            <img src={logoPreview} alt="Logo preview" className="w-24 h-24 object-cover rounded-lg border" />
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="absolute -top-1.5 -right-1.5 p-0.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <label className="mt-1 flex items-center gap-2 w-fit cursor-pointer px-3 py-2 border rounded-md hover:bg-accent/50 transition-colors text-sm text-muted-foreground">
            <Upload className="h-4 w-4" />
            Upload logo
            <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
          </label>
        )}
      </div>

      <div>
        <Label>Branch Name</Label>
        <Input {...register('name')} />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
      </div>

      {/* Cascading location — level auto-derived from depth selected */}
      <div className="rounded-lg border p-3 space-y-3 bg-muted/30">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location</p>
        <LocationSelect
          defaultValues={defaultLocation}
          onChange={(loc) => {
            setValue('region', loc.region || '');
            setValue('district', loc.district || '');
            setValue('traditionalAuthority', loc.traditionalAuthority || '');
            setValue('village', loc.village || '');
          }}
          required={{ region: true, district: true, traditionalAuthority: true }}
          errors={{
            region: errors.region?.message,
            district: errors.district?.message,
            traditionalAuthority: errors.traditionalAuthority?.message,
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Phone <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input {...register('phone')} />
        </div>
        <div>
          <Label>Email <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input {...register('email')} type="email" />
        </div>
      </div>
      <div>
        <Label>Pastor/Minister Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input {...register('pastorName')} placeholder="e.g. Rev. John Banda" />
      </div>
      <div>
        <Label>Address <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input {...register('address')} />
      </div>
      <Button type="submit" disabled={isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
        {isPending ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ChurchesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editChurch, setEditChurch] = useState<Church | null>(null);
  const [deleteChurch, setDeleteChurch] = useState<Church | null>(null);
  const [inviteLinkChurch, setInviteLinkChurch] = useState<Church | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { user } = useAuth();
  const { hasPermission } = useRole();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const hasChurches = useHasFeature('churches_management');

  const canCreate = hasPermission('churches:create');
  const canUpdate = hasPermission('churches:update');
  const canDelete = hasPermission('churches:delete');
  const canInvite = hasPermission('churches:invite');
  const isKenyaAccount = user?.accountCountry === 'Kenya';

  const { data: churches = [], isLoading } = useQuery({
    queryKey: ['churches'],
    queryFn: churchesService.getAll,
    staleTime: STALE_TIME.DEFAULT,
    enabled: hasChurches,
  });

  const churchLimit = useCheckLimit('max_churches', churches.length);

  if (!hasChurches) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Branches</h1>
          <p className="text-sm text-muted-foreground">Manage your church branches</p>
        </div>
        <Alert className="border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Church Management is not available in your current package.{' '}
            <Link to="/dashboard/packages" className="font-medium underline">Upgrade now</Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const createMutation = useMutation({
    mutationFn: (payload: FormData) => {
      if (!churchLimit.allowed) throw new Error(churchLimit.message);
      return churchesService.create(payload);
    },
    onSuccess: () => {
      toast.success('Branch created');
      qc.invalidateQueries({ queryKey: ['churches'] });
      setCreateOpen(false);
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) =>
      toast.error(err.response?.data?.message || err.message || 'Failed to create branch'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FormData }) => churchesService.update(id, payload),
    onSuccess: () => {
      toast.success('Branch updated');
      qc.invalidateQueries({ queryKey: ['churches'] });
      setEditChurch(null);
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message || 'Failed to update branch'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => churchesService.delete(id),
    onSuccess: () => {
      toast.success('Branch deleted');
      qc.invalidateQueries({ queryKey: ['churches'] });
      setDeleteChurch(null);
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message || 'Failed to delete branch'),
  });

  const generateInviteMutation = useMutation({
    mutationFn: (id: string) => churchesService.generateInviteLink(id),
    onSuccess: (data) => {
      qc.setQueryData(['churches'], (old: Church[] | undefined) => 
        old?.map(c => c.id === data.id ? { ...c, inviteToken: data.inviteToken } : c)
      );
      setInviteLinkChurch(prev => prev ? { ...prev, inviteToken: data.inviteToken } : null);
      toast.success('Invite link generated');
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message || 'Failed to generate invite link'),
  });

  const copyInviteLink = (token: string, churchId: string) => {
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/register/member?invite=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedId(churchId);
    toast.success('Invite link copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  function buildFormData(v: FormValues, logoFile: File | null, removeLogo: boolean): FormData {
    const locParts = [v.traditionalAuthority, v.district, v.region].filter(Boolean);
    const locationStr = locParts.join(', ') || 'Malawi';
    const fd = new FormData();
    fd.append('name', v.name);
    fd.append('location', locationStr);
    fd.append('country', 'Malawi');
    fd.append('region', v.region);
    fd.append('district', v.district);
    fd.append('traditionalAuthority', v.traditionalAuthority);
    if (v.village) fd.append('village', v.village);
    if (v.phone) fd.append('phone', v.phone);
    if (v.email) fd.append('email', v.email);
    if (v.website) fd.append('website', v.website);
    if (v.address) fd.append('address', v.address);
    if (v.pastorName) fd.append('pastorName', v.pastorName);
    if (logoFile) fd.append('logo', logoFile);
    if (removeLogo) fd.append('removeLogo', 'true');
    return fd;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Branches</h1>
          <p className="text-sm text-muted-foreground">
            {churches.length} branch{churches.length !== 1 ? 'es' : ''} in your network
          </p>
        </div>
        {canCreate && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                <Plus className="h-4 w-4" /> Add Branch
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-heading">Add Branch</DialogTitle></DialogHeader>
              <ChurchForm
                onSubmit={(v, logoFile, removeLogo) => createMutation.mutate(buildFormData(v, logoFile, removeLogo))}
                isPending={createMutation.isPending}
                submitLabel="Create Branch"
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : churches.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No branch data available</p>
          {canCreate && <p className="text-sm mt-1">Add your first branch.</p>}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {churches.map(church => {
            const ChurchIcon = LEVEL_ICON[church.level] ?? Building2;
            return (
              <Card key={church.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {church.logoUrl ? (
                        <img
                          src={getLogoUrl(church.logoUrl)}
                          alt={church.name}
                          className="h-9 w-9 rounded-md object-cover flex-shrink-0 border"
                        />
                      ) : (
                        <div className="p-2 bg-accent/10 rounded-md flex-shrink-0">
                          <ChurchIcon className="h-4 w-4 text-accent" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-semibold leading-tight truncate">{church.name}</CardTitle>
                        {church.branchCode && <p className="text-xs text-muted-foreground">{church.branchCode}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      {canInvite && (
                        <button onClick={() => setInviteLinkChurch(church)} className="p-1 text-muted-foreground hover:text-accent" title="Generate invite link">
                          <Link2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {canUpdate && (
                        <button onClick={() => setEditChurch(church)} className="p-1 text-muted-foreground hover:text-foreground">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => setDeleteChurch(church)} className="p-1 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {/* Location breadcrumb */}
                  <div className="flex flex-wrap gap-1">
                    {church.region && (
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{church.region}</span>
                    )}
                    {church.district && (
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{church.district}</span>
                    )}
                    {church.traditionalAuthority && (
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{church.traditionalAuthority}</span>
                    )}
                    {church.village && (
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{church.village}</span>
                    )}
                  </div>
                  {church.location && !church.region && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{church.location}
                    </div>
                  )}
                  {church._count?.members !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />{church._count.members} members
                    </div>
                  )}
                  {church.email && <p className="text-xs text-muted-foreground truncate">{church.email}</p>}
                  {church.phone && <p className="text-xs text-muted-foreground">{church.phone}</p>}
                  {hasPermission('subaccounts:view') && isKenyaAccount && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full mt-2"
                      onClick={() => navigate(`/dashboard/subaccount/${church.id}`)}
                    >
                      Manage finance account
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editChurch} onOpenChange={open => !open && setEditChurch(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Edit Branch</DialogTitle></DialogHeader>
          {editChurch && (
            <ChurchForm
              defaultValues={{
                name: editChurch.name,
                phone: editChurch.phone ?? '',
                email: editChurch.email ?? '',
                website: editChurch.website ?? '',
                address: editChurch.address ?? '',
                pastorName: editChurch.pastorName ?? '',
                region: editChurch.region ?? '',
                district: editChurch.district ?? '',
                traditionalAuthority: editChurch.traditionalAuthority ?? '',
                village: editChurch.village ?? '',
              }}
              defaultLocation={{
                region: editChurch.region ?? undefined,
                district: editChurch.district ?? undefined,
                traditionalAuthority: editChurch.traditionalAuthority ?? undefined,
                village: editChurch.village ?? undefined,
              }}
              existingLogoUrl={editChurch.logoUrl}
              onSubmit={(v, logoFile, removeLogo) =>
                updateMutation.mutate({ id: editChurch.id, payload: buildFormData(v, logoFile, removeLogo) })
              }
              isPending={updateMutation.isPending}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Invite Link Dialog */}
      <Dialog open={!!inviteLinkChurch} onOpenChange={open => !open && setInviteLinkChurch(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Church Invite Link</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share this link with members to join <strong>{inviteLinkChurch?.name}</strong>. 
              Anyone who registers using this link will automatically become a member of this church.
            </p>
            {inviteLinkChurch?.inviteToken ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <code className="flex-1 text-xs break-all">
                    {window.location.origin}/register/member?invite={inviteLinkChurch.inviteToken}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyInviteLink(inviteLinkChurch.inviteToken!, inviteLinkChurch.id)}
                  >
                    {copiedId === inviteLinkChurch.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => inviteLinkChurch && generateInviteMutation.mutate(inviteLinkChurch.id)}
                  disabled={generateInviteMutation.isPending}
                >
                  {generateInviteMutation.isPending ? 'Generating...' : 'Regenerate Link'}
                </Button>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={() => inviteLinkChurch && generateInviteMutation.mutate(inviteLinkChurch.id)}
                disabled={generateInviteMutation.isPending}
              >
                {generateInviteMutation.isPending ? 'Generating...' : 'Generate Invite Link'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteChurch} onOpenChange={open => !open && setDeleteChurch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch - Data Loss Warning</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>You are about to permanently delete <strong>{deleteChurch?.name}</strong>.</p>
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <p className="font-medium text-destructive mb-2">⚠️ This will permanently delete ALL data associated with this branch:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• All branch members and their records</li>
                  <li>• All events and attendance records</li>
                  <li>• All giving and donation records</li>
                  <li>• All announcements and communications</li>
                  <li>• All resources and documents</li>
                  <li>• All user accounts linked to this branch</li>
                  <li>• All roles and permissions for this branch</li>
                </ul>
              </div>
              <p className="font-medium">This action cannot be undone. Are you absolutely sure?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteChurch && deleteMutation.mutate(deleteChurch.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
