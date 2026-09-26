import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, CheckCircle2, Download, FileText, Upload, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader, PageShell, LoadingState, CardTitleRow } from './shared';

const STATIC_BASE = (import.meta.env.VITE_STATIC_URL || 'http://localhost:5000').replace(/["']|\/$|^\/api$/g, '');
const AGREEMENT_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const AGREEMENT_MAX_SIZE = 10 * 1024 * 1024;
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const AVATAR_MAX_SIZE = 5 * 1024 * 1024;

type ReferrerProfileResponse = {
  referrer: {
    status: string;
    agreementTemplateUrl?: string | null;
    signedAgreementUrl?: string | null;
    signedAgreementFileName?: string | null;
    agreementStatus?: string | null;
    agreementSubmittedAt?: string | null;
    agreementReviewedAt?: string | null;
    agreementRejectionReason?: string | null;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    avatar?: string | null;
    emailVerified?: boolean;
  };
};

function fileUrl(url?: string | null) {
  if (!url) return '';
  return url.startsWith('http') ? url : `${STATIC_BASE}${url}`;
}

function agreementStatusLabel(status?: string | null) {
  if (status === 'pending_review') return 'Pending admin verification';
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return 'Not submitted';
}

function AgreementNotice({ data }: { data: ReferrerProfileResponse }) {
  const status = data.referrer.agreementStatus || 'not_submitted';
  if (status === 'approved') {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
        <div className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4" /> Agreement approved</div>
        <p className="mt-1">Your marketer profile and signed agreement are locked. Contact support if anything needs correction.</p>
      </div>
    );
  }
  if (status === 'pending_review') {
    return <div className="rounded-lg border bg-muted p-4 text-sm text-muted-foreground">Your signed agreement has been submitted. Please wait for admin verification before using marketer features.</div>;
  }
  if (status === 'rejected') {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        <div className="flex items-center gap-2 font-medium"><XCircle className="h-4 w-4" /> Agreement rejected</div>
        <p className="mt-1">{data.referrer.agreementRejectionReason || 'Please download, sign, and upload the agreement again.'}</p>
      </div>
    );
  }
  return <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">Download the marketer agreement, sign it, then upload the signed PDF/PNG/JPG for verification.</div>;
}

export default function ReferrerProfilePage() {
  const queryClient = useQueryClient();
  const fetchMe = useAuthStore(state => state.fetchMe);
  const agreementInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['referrer-profile'],
    queryFn: () => apiClient.get<{ success: boolean; data: ReferrerProfileResponse }>('/referrals/me/profile').then(response => response.data.data),
  });

  useEffect(() => {
    if (!data) return;
    setFirstName(data.user.firstName || '');
    setLastName(data.user.lastName || '');
    setAvatarFile(null);
    setAvatarPreview('');
  }, [data]);

  const profileLocked = data?.referrer.agreementStatus === 'approved';
  const canUploadAgreement = ['not_submitted', 'rejected', undefined, null].includes(data?.referrer.agreementStatus as any);
  const avatarUrl = avatarPreview || fileUrl(data?.user.avatar);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('firstName', firstName.trim());
      formData.append('lastName', lastName.trim());
      if (avatarFile) formData.append('avatar', avatarFile);
      return apiClient.put('/auth/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: async () => {
      toast.success('Profile updated');
      await fetchMe();
      queryClient.invalidateQueries({ queryKey: ['referrer-profile'] });
      queryClient.invalidateQueries({ queryKey: ['referrer-dashboard'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update profile'),
  });

  const uploadAgreementMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('agreement', file);
      return apiClient.post('/referrals/me/agreement', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      toast.success('Signed agreement submitted for verification');
      if (agreementInputRef.current) agreementInputRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['referrer-profile'] });
      queryClient.invalidateQueries({ queryKey: ['referrer-dashboard'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to upload agreement'),
  });

  const handleAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) { toast.error('Use JPG, PNG, WebP, or GIF for profile image'); return; }
    if (file.size > AVATAR_MAX_SIZE) { toast.error('Profile image must be 5MB or less'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAgreement = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!AGREEMENT_TYPES.includes(file.type)) { toast.error('Upload the signed agreement as PDF, PNG, or JPG'); return; }
    if (file.size > AGREEMENT_MAX_SIZE) { toast.error('Signed agreement must be 10MB or less'); return; }
    uploadAgreementMutation.mutate(file);
  };

  const submitProfile = (event: FormEvent) => {
    event.preventDefault();
    if (profileLocked) return;
    if (!firstName.trim() || !lastName.trim()) { toast.error('First and last name are required'); return; }
    updateProfileMutation.mutate();
  };

  if (isLoading) return <LoadingState label="Loading marketer profile..." />;
  if (!data) return <p className="text-sm text-muted-foreground">Marketer profile not found.</p>;

  return (
    <PageShell>
      <PageHeader title="Marketer Profile" description="Complete your profile and signed agreement verification." />
      <AgreementNotice data={data} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardTitleRow title="Profile details" description={profileLocked ? 'Locked after agreement approval.' : 'Update your name and profile image before approval.'} />
          <CardContent>
            <form onSubmit={submitProfile} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-full bg-muted flex items-center justify-center">
                  {avatarUrl ? <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" /> : <Camera className="h-7 w-7 text-muted-foreground" />}
                </div>
                <div>
                  <Button type="button" variant="outline" disabled={profileLocked} onClick={() => avatarInputRef.current?.click()}>Choose image</Button>
                  <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP, or GIF up to 5MB.</p>
                  <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatar} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" value={firstName} disabled={profileLocked} onChange={event => setFirstName(event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" value={lastName} disabled={profileLocked} onChange={event => setLastName(event.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={data.user.email} disabled />
              </div>

              <Button type="submit" disabled={profileLocked || updateProfileMutation.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {updateProfileMutation.isPending ? 'Saving...' : 'Save profile'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardTitleRow title="Signed marketer agreement" description="Sign and upload your agreement for admin verification." />
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{agreementStatusLabel(data.referrer.agreementStatus)}</span>
              </div>
              {data.referrer.agreementSubmittedAt && (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Submitted</span>
                  <span>{new Date(data.referrer.agreementSubmittedAt).toLocaleString()}</span>
                </div>
              )}
              {data.referrer.signedAgreementFileName && <p className="mt-3 truncate text-muted-foreground">Uploaded: {data.referrer.signedAgreementFileName}</p>}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button asChild variant="outline">
                <a href={fileUrl(data.referrer.agreementTemplateUrl)} download="Midas_Marketer_Referral_Agreement.pdf">
                  <Download className="mr-2 h-4 w-4" /> Download blank agreement
                </a>
              </Button>
              {data.referrer.signedAgreementUrl && (
                <Button asChild variant="outline">
                  <a href={fileUrl(data.referrer.signedAgreementUrl)} target="_blank" rel="noreferrer">
                    <FileText className="mr-2 h-4 w-4" /> View uploaded agreement
                  </a>
                </Button>
              )}
              <Button type="button" disabled={!canUploadAgreement || uploadAgreementMutation.isPending} onClick={() => agreementInputRef.current?.click()} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Upload className="mr-2 h-4 w-4" /> {uploadAgreementMutation.isPending ? 'Uploading...' : 'Upload signed agreement'}
              </Button>
            </div>
            <input ref={agreementInputRef} type="file" accept="application/pdf,image/png,image/jpeg" className="hidden" onChange={handleAgreement} />
            {!canUploadAgreement && <p className="text-xs text-muted-foreground">Upload is locked while pending review or after approval. If rejected, upload will reopen.</p>}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
