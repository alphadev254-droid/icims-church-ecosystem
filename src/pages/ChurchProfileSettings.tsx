import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Globe, Lock, Plus, Trash2, ExternalLink,
  Palette, User, Clock, Phone, Save, CheckCircle2,
  Upload, X, ImageIcon, Eye, BookOpen, HeartHandshake, Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { STALE_TIME } from '@/lib/query-config';

// ─── Image upload picker component ───────────────────────────────────────────

const BACKEND_URL = (import.meta.env.VITE_STATIC_URL as string) || import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';
const MAX_SIZE_MB = 5;
const MAX_SIZE = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function ImageUploadPicker({
  label,
  hint,
  value,
  uploadEndpoint,
  onUploaded,
  onRemoved,
  aspectClass = 'aspect-video',
  disabled = false,
}: {
  label: string;
  hint?: string;
  value?: string;
  uploadEndpoint: string;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
  aspectClass?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const fullUrl = value
    ? (value.startsWith('http') ? value : `${BACKEND_URL}${value}`)
    : null;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(`Invalid file type. Allowed: JPG, PNG, WebP, GIF`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    if (file.size > MAX_SIZE) {
      toast.error(`File too large. Maximum size is ${MAX_SIZE_MB}MB`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await apiClient.post(uploadEndpoint, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploaded(data.url);
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      // Derive type from endpoint: .../logo → logo, .../banner → banner
      const type = uploadEndpoint.split('/').pop();
      await apiClient.delete(`/church-profile/upload/${type}`);
      onRemoved();
      toast.success('Image removed');
    } catch {
      toast.error('Failed to remove image');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className={`space-y-1.5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <Label className="text-xs sm:text-sm">{label}</Label>
      <div className={`relative rounded-lg border-2 border-dashed border-border bg-muted/30 overflow-hidden ${aspectClass}`}>
        {fullUrl ? (
          <>
            <img src={fullUrl} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 text-xs gap-1.5"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-3.5 w-3.5" />
                {uploading ? 'Uploading...' : 'Change'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="h-8 text-xs gap-1.5"
                onClick={handleRemove}
                disabled={removing}
              >
                <X className="h-3.5 w-3.5" />
                {removing ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors w-full"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            ) : (
              <ImageIcon className="h-8 w-8 opacity-40" />
            )}
            <span className="text-xs">{uploading ? 'Uploading...' : `Click to upload ${label.toLowerCase()}`}</span>
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceTime { name: string; day: string; time: string; location: string; }

interface WebsiteSermon {
  id: string;
  title: string;
  youtubeUrl: string;
  speaker?: string | null;
  series?: string | null;
  duration?: string | null;
  sermonDate?: string | null;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface WebsiteMinistry {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  icon?: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface ProfileData {
  logoUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor?: string | null;
  tagline?: string | null;
  aboutText?: string | null;
  pastorName?: string | null;
  pastorPhoto?: string | null;
  pastorBio?: string | null;
  visionText?: string | null;
  missionText?: string | null;
  serviceTimes?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  whatsappNumber?: string | null;
  isPublished?: boolean;
}

const PROFILE_EDIT_FIELDS: Array<keyof ProfileData> = [
  'logoUrl',
  'bannerUrl',
  'primaryColor',
  'tagline',
  'aboutText',
  'pastorName',
  'pastorPhoto',
  'pastorBio',
  'visionText',
  'missionText',
  'serviceTimes',
  'phone',
  'email',
  'address',
  'facebookUrl',
  'youtubeUrl',
  'whatsappNumber',
  'isPublished',
];

function cleanProfilePayload(form: ProfileData, serviceTimes: ServiceTime[]): ProfileData {
  const payload: ProfileData = {};
  for (const key of PROFILE_EDIT_FIELDS) {
    if (key in form) payload[key] = form[key] as never;
  }
  payload.serviceTimes = JSON.stringify(serviceTimes);
  return payload;
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function SettingsSection({ title, icon, locked, children }: {
  title: string;
  icon: React.ReactNode;
  locked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          {icon}
          {title}
          {locked && (
            <Badge variant="outline" className="ml-auto text-xs gap-1 text-muted-foreground">
              <Lock className="h-3 w-3" /> Standard / Premium
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className={`space-y-4 ${locked ? 'opacity-50 pointer-events-none select-none' : ''}`}>
        {children}
      </CardContent>
    </Card>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs sm:text-sm">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const emptySermon = {
  title: '',
  youtubeUrl: '',
  speaker: '',
  series: '',
  duration: '',
  sermonDate: '',
  description: '',
  isActive: true,
  sortOrder: 0,
};

const emptyMinistry = {
  name: '',
  description: '',
  imageUrl: '',
  icon: '',
  isActive: true,
  sortOrder: 0,
};

function toDateInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function WebsiteContentManager({ locked }: { locked: boolean }) {
  const qc = useQueryClient();
  const [sermonForm, setSermonForm] = useState({ ...emptySermon });
  const [editingSermonId, setEditingSermonId] = useState<string | null>(null);
  const [ministryForm, setMinistryForm] = useState({ ...emptyMinistry });
  const [editingMinistryId, setEditingMinistryId] = useState<string | null>(null);

  const sermonsQuery = useQuery({
    queryKey: ['church-profile-sermons'],
    queryFn: async () => {
      const { data } = await apiClient.get('/church-profile/sermons');
      return data.data as WebsiteSermon[];
    },
    staleTime: STALE_TIME.DEFAULT,
  });

  const ministriesQuery = useQuery({
    queryKey: ['church-profile-ministries'],
    queryFn: async () => {
      const { data } = await apiClient.get('/church-profile/ministries');
      return data.data as WebsiteMinistry[];
    },
    staleTime: STALE_TIME.DEFAULT,
  });

  const sermonMutation = useMutation({
    mutationFn: (payload: typeof emptySermon) => editingSermonId
      ? apiClient.put(`/church-profile/sermons/${editingSermonId}`, payload)
      : apiClient.post('/church-profile/sermons', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['church-profile-sermons'] });
      toast.success(editingSermonId ? 'Sermon updated' : 'Sermon added');
      setSermonForm({ ...emptySermon });
      setEditingSermonId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save sermon'),
  });

  const ministryMutation = useMutation({
    mutationFn: (payload: typeof emptyMinistry) => editingMinistryId
      ? apiClient.put(`/church-profile/ministries/${editingMinistryId}`, payload)
      : apiClient.post('/church-profile/ministries', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['church-profile-ministries'] });
      toast.success(editingMinistryId ? 'Ministry updated' : 'Ministry added');
      setMinistryForm({ ...emptyMinistry });
      setEditingMinistryId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save ministry'),
  });

  const deleteSermon = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/church-profile/sermons/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['church-profile-sermons'] });
      toast.success('Sermon deleted');
    },
    onError: () => toast.error('Failed to delete sermon'),
  });

  const deleteMinistry = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/church-profile/ministries/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['church-profile-ministries'] });
      toast.success('Ministry deleted');
    },
    onError: () => toast.error('Failed to delete ministry'),
  });

  const saveSermon = () => sermonMutation.mutate({
    ...sermonForm,
    sortOrder: Number(sermonForm.sortOrder) || 0,
  });

  const saveMinistry = () => ministryMutation.mutate({
    ...ministryForm,
    sortOrder: Number(ministryForm.sortOrder) || 0,
  });

  return (
    <div className={`space-y-4 ${locked ? 'opacity-50 pointer-events-none select-none' : ''}`}>
      <SettingsSection title="Sermons" icon={<BookOpen className="h-4 w-4 text-accent" />} locked={locked}>
        <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Title">
              <Input value={sermonForm.title} onChange={e => setSermonForm(f => ({ ...f, title: e.target.value }))} placeholder="The Weight of Glory" />
            </Field>
            <Field label="YouTube link">
              <Input value={sermonForm.youtubeUrl} onChange={e => setSermonForm(f => ({ ...f, youtubeUrl: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
            </Field>
            <Field label="Speaker">
              <Input value={sermonForm.speaker} onChange={e => setSermonForm(f => ({ ...f, speaker: e.target.value }))} placeholder="Pastor Sammy Anistar" />
            </Field>
            <Field label="Series">
              <Input value={sermonForm.series} onChange={e => setSermonForm(f => ({ ...f, series: e.target.value }))} placeholder="Kingdom Foundations" />
            </Field>
            <Field label="Duration">
              <Input value={sermonForm.duration} onChange={e => setSermonForm(f => ({ ...f, duration: e.target.value }))} placeholder="42 min" />
            </Field>
            <Field label="Date">
              <Input type="date" value={sermonForm.sermonDate} onChange={e => setSermonForm(f => ({ ...f, sermonDate: e.target.value }))} />
            </Field>
          </div>
          <Field label="Description">
            <Textarea rows={2} value={sermonForm.description} onChange={e => setSermonForm(f => ({ ...f, description: e.target.value }))} placeholder="Short sermon summary..." />
          </Field>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Sort order">
              <Input type="number" className="w-28" value={sermonForm.sortOrder} onChange={e => setSermonForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} />
            </Field>
            <label className="flex items-center gap-2 text-sm pb-2">
              <input type="checkbox" checked={sermonForm.isActive} onChange={e => setSermonForm(f => ({ ...f, isActive: e.target.checked }))} />
              Show publicly
            </label>
            <Button type="button" size="sm" className="h-9 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90" onClick={saveSermon} disabled={sermonMutation.isPending}>
              <Save className="h-3.5 w-3.5" /> {editingSermonId ? 'Update sermon' : 'Add sermon'}
            </Button>
            {editingSermonId && (
              <Button type="button" size="sm" variant="outline" className="h-9" onClick={() => { setEditingSermonId(null); setSermonForm({ ...emptySermon }); }}>
                Cancel
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {(sermonsQuery.data ?? []).map(sermon => (
            <div key={sermon.id} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{sermon.title}</p>
                <p className="text-xs text-muted-foreground truncate">{sermon.speaker || 'No speaker'} - {sermon.isActive ? 'Public' : 'Hidden'}</p>
              </div>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                setEditingSermonId(sermon.id);
                setSermonForm({
                  title: sermon.title,
                  youtubeUrl: sermon.youtubeUrl,
                  speaker: sermon.speaker ?? '',
                  series: sermon.series ?? '',
                  duration: sermon.duration ?? '',
                  sermonDate: toDateInput(sermon.sermonDate),
                  description: sermon.description ?? '',
                  isActive: sermon.isActive,
                  sortOrder: sermon.sortOrder ?? 0,
                });
              }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => deleteSermon.mutate(sermon.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {!sermonsQuery.isLoading && !(sermonsQuery.data ?? []).length && (
            <p className="text-xs text-muted-foreground">No sermons added yet.</p>
          )}
        </div>
      </SettingsSection>

      <SettingsSection title="Ministries" icon={<HeartHandshake className="h-4 w-4 text-accent" />} locked={locked}>
        <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Name">
              <Input value={ministryForm.name} onChange={e => setMinistryForm(f => ({ ...f, name: e.target.value }))} placeholder="Outreach" />
            </Field>
            <Field label="Icon text">
              <Input value={ministryForm.icon} onChange={e => setMinistryForm(f => ({ ...f, icon: e.target.value }))} placeholder="O" maxLength={8} />
            </Field>
          </div>
          <Field label="Description">
            <Textarea rows={3} value={ministryForm.description} onChange={e => setMinistryForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe this ministry..." />
          </Field>
          <Field label="Image URL">
            <Input value={ministryForm.imageUrl} onChange={e => setMinistryForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
          </Field>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Sort order">
              <Input type="number" className="w-28" value={ministryForm.sortOrder} onChange={e => setMinistryForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} />
            </Field>
            <label className="flex items-center gap-2 text-sm pb-2">
              <input type="checkbox" checked={ministryForm.isActive} onChange={e => setMinistryForm(f => ({ ...f, isActive: e.target.checked }))} />
              Show publicly
            </label>
            <Button type="button" size="sm" className="h-9 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90" onClick={saveMinistry} disabled={ministryMutation.isPending}>
              <Save className="h-3.5 w-3.5" /> {editingMinistryId ? 'Update ministry' : 'Add ministry'}
            </Button>
            {editingMinistryId && (
              <Button type="button" size="sm" variant="outline" className="h-9" onClick={() => { setEditingMinistryId(null); setMinistryForm({ ...emptyMinistry }); }}>
                Cancel
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {(ministriesQuery.data ?? []).map(ministry => (
            <div key={ministry.id} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{ministry.name}</p>
                <p className="text-xs text-muted-foreground truncate">{ministry.isActive ? 'Public' : 'Hidden'} - {ministry.description}</p>
              </div>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                setEditingMinistryId(ministry.id);
                setMinistryForm({
                  name: ministry.name,
                  description: ministry.description,
                  imageUrl: ministry.imageUrl ?? '',
                  icon: ministry.icon ?? '',
                  isActive: ministry.isActive,
                  sortOrder: ministry.sortOrder ?? 0,
                });
              }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => deleteMinistry.mutate(ministry.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {!ministriesQuery.isLoading && !(ministriesQuery.data ?? []).length && (
            <p className="text-xs text-muted-foreground">No ministries added yet.</p>
          )}
        </div>
      </SettingsSection>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChurchProfileSettingsPage() {
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);

  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ['church-profile'],
    queryFn: async () => {
      const { data } = await apiClient.get('/church-profile');
      return data;
    },
    staleTime: STALE_TIME.DEFAULT,
  });

  const hasFeature: boolean = profileResponse?.hasWebsiteFeature ?? false;
  const subdomain: string | null = profileResponse?.subdomain ?? null;
  const profile: ProfileData = profileResponse?.data ?? {};

  // Local form state
  const [form, setForm] = useState<ProfileData>({});
  const [serviceTimes, setServiceTimes] = useState<ServiceTime[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm(profile);
      try {
        setServiceTimes(profile.serviceTimes ? JSON.parse(profile.serviceTimes) : []);
      } catch {
        setServiceTimes([]);
      }
    }
  }, [profileResponse]);

  const set = (key: keyof ProfileData, value: any) => {
    setForm(f => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: (payload: ProfileData) => apiClient.put('/church-profile', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['church-profile'] });
      toast.success('Profile saved');
      setDirty(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save');
    },
  });

  const handleSave = () => {
    saveMutation.mutate(cleanProfilePayload(form, serviceTimes));
  };

  const addServiceTime = () => {
    setServiceTimes(s => [...s, { name: '', day: '', time: '', location: '' }]);
    setDirty(true);
  };

  const updateServiceTime = (i: number, key: keyof ServiceTime, value: string) => {
    setServiceTimes(s => s.map((item, idx) => idx === i ? { ...item, [key]: value } : item));
    setDirty(true);
  };

  const removeServiceTime = (i: number) => {
    setServiceTimes(s => s.filter((_, idx) => idx !== i));
    setDirty(true);
  };

  const previewUrl = subdomain
    ? (subdomain.includes('.') ? `https://${subdomain}` : `https://${subdomain}.churchcentral.church`)
    : null;

  if (isLoading) {
    return <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">Loading...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Globe className="h-5 w-5 text-accent" />
            Church Website
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Customise your public church page
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {previewUrl && (
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs sm:h-9 sm:text-sm" asChild>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" /> Preview
              </a>
            </Button>
          )}
          <Button
            size="sm"
            className="h-8 text-xs sm:h-9 sm:text-sm bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5"
            disabled={!dirty || saveMutation.isPending}
            onClick={handleSave}
          >
            <Save className="h-3.5 w-3.5" />
            {saveMutation.isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </div>

      {/* Subdomain info */}
      {subdomain && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Globe className="h-4 w-4 text-accent shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Your church URL</p>
              <a
                href={previewUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-accent hover:underline break-all"
              >
                {previewUrl}
              </a>
            </div>
            <Badge variant={form.isPublished ? 'default' : 'secondary'} className="ml-auto shrink-0 text-xs">
              {form.isPublished ? <><CheckCircle2 className="h-3 w-3 mr-1" />Live</> : 'Draft'}
            </Badge>
          </CardContent>
        </Card>
      )}

      {!hasFeature && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4 flex items-start gap-3">
            <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Standard or Premium required</p>
              <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">
                Upgrade to customise branding, about section, service times, and contact info. Public events and giving campaigns are always shown automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Publish toggle ── */}
      <SettingsSection title="Publish" icon={<Eye className="h-4 w-4 text-accent" />} locked={!hasFeature}>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Page status</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {form.isPublished ? 'Your page is live and visible to the public.' : 'Your page is in draft mode — only you can see it.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => set('isPublished', !form.isPublished)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isPublished ? 'bg-accent' : 'bg-muted'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isPublished ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </SettingsSection>

      {/* ── Branding ── */}
      <SettingsSection title="Branding" icon={<Palette className="h-4 w-4 text-accent" />} locked={!hasFeature}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ImageUploadPicker
            label="Logo"
            hint={`Square image recommended. JPG, PNG, WebP, GIF. Max ${MAX_SIZE_MB}MB.`}
            value={form.logoUrl}
            uploadEndpoint="/church-profile/upload/logo"
            aspectClass="aspect-square max-h-40"
            onUploaded={url => set('logoUrl', url)}
            onRemoved={() => set('logoUrl', '')}
            disabled={!hasFeature}
          />
          <ImageUploadPicker
            label="Banner / Hero image"
            hint={`Wide image (16:9 recommended). JPG, PNG, WebP, GIF. Max ${MAX_SIZE_MB}MB.`}
            value={form.bannerUrl}
            uploadEndpoint="/church-profile/upload/banner"
            aspectClass="aspect-video"
            onUploaded={url => set('bannerUrl', url)}
            onRemoved={() => set('bannerUrl', '')}
            disabled={!hasFeature}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tagline" hint="Short description shown under your church name">
            <Input placeholder="e.g. A place of hope and community" value={form.tagline ?? ''} onChange={e => set('tagline', e.target.value)} />
          </Field>
          <Field label="Primary colour" hint="Used for buttons and accents on your page">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.primaryColor ?? '#d4a574'}
                onChange={e => set('primaryColor', e.target.value)}
                className="h-9 w-14 rounded-md border border-input cursor-pointer p-1"
              />
              <Input
                value={form.primaryColor ?? '#d4a574'}
                onChange={e => set('primaryColor', e.target.value)}
                placeholder="#d4a574"
                className="font-mono"
              />
            </div>
          </Field>
        </div>
      </SettingsSection>

      {/* ── About ── */}
      <SettingsSection title="About" icon={<User className="h-4 w-4 text-accent" />} locked={!hasFeature}>
        <Field label="About text">
          <Textarea rows={4} placeholder="Tell visitors about your church..." value={form.aboutText ?? ''} onChange={e => set('aboutText', e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Vision">
            <Textarea rows={2} placeholder="Our vision is..." value={form.visionText ?? ''} onChange={e => set('visionText', e.target.value)} />
          </Field>
          <Field label="Mission">
            <Textarea rows={2} placeholder="Our mission is..." value={form.missionText ?? ''} onChange={e => set('missionText', e.target.value)} />
          </Field>
        </div>
        <div className="border-t pt-4 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pastor / Leader</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name">
              <Input placeholder="Pastor James Banda" value={form.pastorName ?? ''} onChange={e => set('pastorName', e.target.value)} />
            </Field>
            <ImageUploadPicker
              label="Pastor photo"
              hint={`Square image recommended. JPG, PNG, WebP, GIF. Max ${MAX_SIZE_MB}MB.`}
              value={form.pastorPhoto}
              uploadEndpoint="/church-profile/upload/pastor"
              aspectClass="aspect-square max-h-36"
              onUploaded={url => set('pastorPhoto', url)}
              onRemoved={() => set('pastorPhoto', '')}
              disabled={!hasFeature}
            />
          </div>
          <Field label="Bio">
            <Textarea rows={3} placeholder="Short bio..." value={form.pastorBio ?? ''} onChange={e => set('pastorBio', e.target.value)} />
          </Field>
        </div>
      </SettingsSection>

      {/* ── Service Times ── */}
      <SettingsSection title="Service Times" icon={<Clock className="h-4 w-4 text-accent" />} locked={!hasFeature}>
        <div className="space-y-3">
          {serviceTimes.map((s, i) => (
            <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end p-3 rounded-lg border bg-muted/20">
              <div className="space-y-1">
                <Label className="text-xs">Service name</Label>
                <Input className="h-8 text-xs" placeholder="Sunday Service" value={s.name} onChange={e => updateServiceTime(i, 'name', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Day</Label>
                <Input className="h-8 text-xs" placeholder="Sunday" value={s.day} onChange={e => updateServiceTime(i, 'day', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Time</Label>
                <Input className="h-8 text-xs" placeholder="9:00 AM" value={s.time} onChange={e => updateServiceTime(i, 'time', e.target.value)} />
              </div>
              <div className="flex items-end gap-1">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Location</Label>
                  <Input className="h-8 text-xs" placeholder="Main Hall" value={s.location} onChange={e => updateServiceTime(i, 'location', e.target.value)} />
                </div>
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => removeServiceTime(i)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={addServiceTime}>
            <Plus className="h-3.5 w-3.5" /> Add service time
          </Button>
        </div>
      </SettingsSection>

      {/* ── Contact ── */}
      <SettingsSection title="Contact Information" icon={<Phone className="h-4 w-4 text-accent" />} locked={!hasFeature}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone">
            <Input placeholder="+254 700 000 000" value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" placeholder="info@church.org" value={form.email ?? ''} onChange={e => set('email', e.target.value)} />
          </Field>
        </div>
        <Field label="Address" hint="Used to embed a Google Maps location on your page">
          <Input placeholder="123 Church Street, Nairobi, Kenya" value={form.address ?? ''} onChange={e => set('address', e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Facebook URL">
            <Input placeholder="https://facebook.com/..." value={form.facebookUrl ?? ''} onChange={e => set('facebookUrl', e.target.value)} />
          </Field>
          <Field label="YouTube URL">
            <Input placeholder="https://youtube.com/..." value={form.youtubeUrl ?? ''} onChange={e => set('youtubeUrl', e.target.value)} />
          </Field>
          <Field label="WhatsApp number" hint="Include country code, no spaces">
            <Input placeholder="254700000000" value={form.whatsappNumber ?? ''} onChange={e => set('whatsappNumber', e.target.value)} />
          </Field>
        </div>
      </SettingsSection>

      {/* ── Events & Giving (info only) ── */}
      <WebsiteContentManager locked={!hasFeature} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4 text-accent" />
            Events & Giving
            <Badge variant="outline" className="ml-auto text-xs text-accent border-accent/30">Auto</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Upcoming events that do not require tickets are shown automatically. Ticketed events must be marked <strong>Allow Public Ticketing</strong>, and giving campaigns must be marked <strong>Allow Public Donations</strong> to appear on your public page.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
              <a href="/dashboard/events">Manage Events</a>
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
              <a href="/dashboard/giving">Manage Campaigns</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sticky save bar */}
      {dirty && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-foreground text-background rounded-xl px-5 py-3 shadow-xl text-sm">
          <span>You have unsaved changes</span>
          <Button size="sm" className="h-7 text-xs bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : 'Save now'}
          </Button>
        </div>
      )}
    </div>
  );
}
