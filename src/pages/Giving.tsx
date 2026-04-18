import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { givingService, type GivingCampaign } from '@/services/giving';
import { useRole } from '@/hooks/useRole';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChurchSelect } from '@/components/ChurchSelect';
import { Plus, HandCoins, Target, Users, Pencil, Wallet, Eye, Loader2, StopCircle, PlayCircle, Filter, Lock, Share2, Copy, Check } from 'lucide-react';
import { ExportImportButtons } from '@/components/ExportImportButtons';
import { toast } from 'sonner';
import { STALE_TIME } from '@/lib/query-config';

const campaignSchema = z.object({
  churchId: z.string().min(1, 'Church required'),
  name: z.string().min(1, 'Campaign name required'),
  description: z.string().optional(),
  category: z.enum(['tithe', 'offering', 'partnership', 'welfare', 'missions']),
  subcategory: z.string().optional(),
  targetAmount: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) || num <= 0 ? undefined : num;
    },
    z.number().positive().optional()
  ),
  currency: z.enum(['MWK', 'KES']).default('MWK'),
  endDate: z.string().optional(),
  allowPublicDonations: z.boolean().default(false),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

function CampaignForm({ defaultValues, onSubmit, isPending, submitLabel }: {
  defaultValues?: Partial<CampaignFormValues>;
  onSubmit: (v: CampaignFormValues) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: { category: 'tithe', currency: 'MWK', allowPublicDonations: false, ...defaultValues },
  });

  const churchId = watch('churchId');
  const category = watch('category');
  const allowPublicDonations = watch('allowPublicDonations');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
      <ChurchSelect value={churchId} onValueChange={v => setValue('churchId', v)} />
      {errors.churchId && <p className="text-xs text-destructive">{errors.churchId.message}</p>}

      <div>
        <Label className="text-xs sm:text-sm">Campaign Name *</Label>
        <Input className="h-8 text-xs sm:h-10 sm:text-sm" {...register('name')} placeholder="e.g. Mission to Zomba" />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div>
        <Label className="text-xs sm:text-sm">Category *</Label>
        <Select defaultValue={defaultValues?.category ?? 'tithe'} onValueChange={v => setValue('category', v as any)}>
          <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tithe">Tithe</SelectItem>
            <SelectItem value="offering">Offering</SelectItem>
            <SelectItem value="partnership">Partnership</SelectItem>
            <SelectItem value="welfare">Welfare</SelectItem>
            <SelectItem value="missions">Missions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {category !== 'tithe' && category !== 'offering' && (
        <div>
          <Label className="text-xs sm:text-sm">Subcategory</Label>
          <Input className="h-8 text-xs sm:h-10 sm:text-sm" {...register('subcategory')} placeholder="e.g. TV Sponsorship, Funeral for John" />
        </div>
      )}

      <div>
        <Label className="text-xs sm:text-sm">Description</Label>
        <Textarea className="text-xs sm:text-sm" {...register('description')} rows={2} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label className="text-xs sm:text-sm">Target Amount (Optional)</Label>
          <Input className="h-8 text-xs sm:h-10 sm:text-sm" type="number" {...register('targetAmount')} placeholder="" />
        </div>
        <div>
          <Label className="text-xs sm:text-sm">Currency*</Label>
          <Select defaultValue={defaultValues?.currency ?? 'MWK'} onValueChange={v => setValue('currency', v as any)}>
            <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MWK">MWK</SelectItem>
              <SelectItem value="KES">KES</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs sm:text-sm">End Date</Label>
        <Input className="h-8 text-xs sm:h-10 sm:text-sm" type="date" {...register('endDate')} />
      </div>

      <div className="flex items-center gap-3 rounded-md border p-2 sm:p-3">
        <input
          type="checkbox"
          id="allowPublicDonations"
          checked={allowPublicDonations}
          onChange={e => setValue('allowPublicDonations', e.target.checked)}
          className="h-4 w-4"
        />
        <div>
          <Label htmlFor="allowPublicDonations" className="cursor-pointer font-medium text-xs sm:text-sm">Allow Public Donations</Label>
          <p className="text-xs text-muted-foreground">Generate a public link so anyone can donate without logging in</p>
        </div>
      </div>

      <Button type="submit" size="sm" disabled={isPending} className="w-full h-8 text-xs sm:h-10 sm:text-sm">
        {isPending ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}

export default function GivingPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<GivingCampaign | null>(null);
  const [donateCampaign, setDonateCampaign] = useState<GivingCampaign | null>(null);
  const [donateAmount, setDonateAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentConfirm, setPaymentConfirm] = useState<{ campaign: GivingCampaign; details: any } | null>(null);
  const [endCampaignId, setEndCampaignId] = useState<string | null>(null);
  const [activateCampaignId, setActivateCampaignId] = useState<string | null>(null);
  const [copiedCampaignId, setCopiedCampaignId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [churchFilter, setChurchFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { hasPermission } = useRole();
  const hasGivingFeature = useHasFeature('giving_tracking');
  const user = useAuthStore(state => state.user);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const isMember = user?.roleName === 'member';

  const { data: campaignsResponse = [], isLoading } = useQuery({
    queryKey: ['campaigns', churchFilter, categoryFilter],
    queryFn: () => givingService.getCampaigns({
      churchId: churchFilter !== 'all' ? churchFilter : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
    }),
    staleTime: STALE_TIME.DEFAULT,
  });

  const campaigns = Array.isArray(campaignsResponse) && campaignsResponse[0]?.label
    ? campaignsResponse.flatMap((group: any) => group.posts || [])
    : campaignsResponse;
  const groupedCampaigns = Array.isArray(campaignsResponse) && campaignsResponse[0]?.label
    ? campaignsResponse
    : [];

  const { data: churches = [] } = useQuery({
    queryKey: ['churches'],
    queryFn: async () => {
      const { data } = await apiClient.get('/churches');
      return data.data || [];
    },
    enabled: !isMember,
  });

  const createMutation = useMutation({
    mutationFn: givingService.createCampaign,
    onSuccess: () => {
      toast.success('Campaign created');
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      setCreateOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create campaign'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => givingService.updateCampaign(id, dto),
    onSuccess: () => {
      toast.success('Campaign updated');
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      setEditCampaign(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const endCampaignMutation = useMutation({
    mutationFn: (id: string) => givingService.updateCampaign(id, { status: 'completed' }),
    onSuccess: () => {
      toast.success('Campaign ended');
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      setEndCampaignId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to end campaign'),
  });

  const activateCampaignMutation = useMutation({
    mutationFn: (id: string) => givingService.updateCampaign(id, { status: 'active' }),
    onSuccess: () => {
      toast.success('Campaign activated');
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      setActivateCampaignId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to activate campaign'),
  });

  const copyPublicLink = (campaignId: string) => {
    const url = `${window.location.origin}/giving/${campaignId}`;
    navigator.clipboard.writeText(url);
    setCopiedCampaignId(campaignId);
    toast.success('Public link copied!');
    setTimeout(() => setCopiedCampaignId(null), 2000);
  };

  const shareWhatsApp = (campaign: GivingCampaign) => {
    const url = `${window.location.origin}/giving/${campaign.id}`;
    const text = encodeURIComponent(`Support our campaign: ${campaign.name}\n${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareFacebook = (campaignId: string) => {
    const url = encodeURIComponent(`${window.location.origin}/giving/${campaignId}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const canCreate = hasPermission('campaigns:create') && hasGivingFeature;
  const canUpdate = hasPermission('campaigns:update') && hasGivingFeature;
  const canViewDonations = hasPermission('donations:read');

  if (!isMember && !hasGivingFeature) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Giving Campaigns</h1>
          <p className="text-sm text-muted-foreground">Manage giving and donations</p>
        </div>
        <Alert className="border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Giving & Donations is not available in your current package.{' '}
            <Link to="/dashboard/packages" className="font-medium underline">Upgrade now</Link>
            {' '}to unlock giving management features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleDonate = async () => {
    if (!donateCampaign || !donateAmount) return;
    const amount = parseFloat(donateAmount);
    if (amount <= 0) return toast.error('Invalid amount');

    setIsProcessing(true);
    try {
      const response = await givingService.donate({
        campaignId: donateCampaign.id,
        amount,
      });
      setPaymentConfirm({ campaign: donateCampaign, details: response });
      setDonateCampaign(null);
      setDonateAmount('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initialize donation');
    } finally {
      setIsProcessing(false);
    }
  };

  const proceedToPayment = () => {
    if (paymentConfirm?.details?.authorization_url) {
      window.location.href = paymentConfirm.details.authorization_url;
    }
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const totalRaised = isMember 
    ? campaigns.reduce((sum, c) => sum + (c.userTotalDonated || 0), 0)
    : campaigns.reduce((sum, c) => sum + (c.totalRaised || 0), 0);
  const totalDonors = campaigns.reduce((sum, c) => sum + (c.donorCount || 0), 0);

  const renderCampaignCard = (campaign: any) => {
    const progress = campaign.targetAmount ? (campaign.totalRaised! / campaign.targetAmount) * 100 : 0;
    const publicUrl = `${window.location.origin}/giving/${campaign.id}`;
    return (
      <Card key={campaign.id} className=''>
        <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-base leading-snug break-words">{campaign.name}</CardTitle>
              <div className="flex flex-wrap items-center gap-1 mt-1">
                <Badge variant="outline" className="text-xs capitalize px-1.5 py-0">{campaign.category}</Badge>
                {campaign.status !== 'active' && <Badge variant="secondary" className="text-xs px-1.5 py-0">{campaign.status}</Badge>}
                {campaign.allowPublicDonations && campaign.status === 'active' && (
                  <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50 px-1.5 py-0">Public</Badge>
                )}
              </div>
            </div>
            {canUpdate && (
              <div className="flex gap-0.5 shrink-0">
                <button onClick={() => setEditCampaign(campaign)} className="p-1 text-muted-foreground hover:text-foreground rounded" title="Edit">
                  <Pencil className="h-3 w-3" />
                </button>
                {campaign.allowPublicDonations && (
                  <button onClick={() => copyPublicLink(campaign.id)} className="p-1 text-muted-foreground hover:text-foreground rounded" title="Copy public link">
                    {copiedCampaignId === campaign.id ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  </button>
                )}
                {campaign.status === 'active' ? (
                  <button onClick={() => setEndCampaignId(campaign.id)} className="p-1 text-muted-foreground hover:text-destructive rounded" title="End campaign">
                    <StopCircle className="h-3 w-3" />
                  </button>
                ) : campaign.status === 'completed' && (
                  <button onClick={() => setActivateCampaignId(campaign.id)} className="p-1 text-muted-foreground hover:text-green-600 rounded" title="Reactivate">
                    <PlayCircle className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 pb-3 space-y-2">
          {campaign.description && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
          )}

          {isMember ? (
            <div className="text-xs">
              <span className="text-muted-foreground">Your Total: </span>
              <span className="font-medium">{campaign.currency} {(campaign.userTotalDonated || 0).toLocaleString()}</span>
            </div>
          ) : (
            <>
              {campaign.targetAmount ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{campaign.currency} {campaign.totalRaised?.toLocaleString()} / {campaign.targetAmount.toLocaleString()}</span>
                  </div>
                  <Progress value={Math.min(progress, 100)} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">{progress.toFixed(0)}% of goal</p>
                </div>
              ) : (
                <div className="text-xs">
                  <span className="text-muted-foreground">Raised: </span>
                  <span className="font-medium">{campaign.currency} {campaign.totalRaised?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{campaign.donorCount} donors</span>
              </div>
            </>
          )}

          {/* Public link + share — shown to admins when allowPublicDonations is on */}
          {campaign.allowPublicDonations && !isMember && (
            <div className="rounded-md border bg-muted/40 p-2 space-y-1.5">
              <p className="text-xs font-medium flex items-center gap-1">
                <Share2 className="h-3 w-3 shrink-0" /> Public donation link
              </p>
              <div className="flex items-center gap-1 rounded border bg-background px-1.5 py-0.5 min-w-0">
                <span className="text-xs text-muted-foreground truncate flex-1 font-mono min-w-0">{publicUrl}</span>
                <button onClick={() => copyPublicLink(campaign.id)} className="shrink-0 text-muted-foreground hover:text-foreground p-0.5" title="Copy link">
                  {copiedCampaignId === campaign.id ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <div className="flex gap-1">
                <button onClick={() => shareWhatsApp(campaign)} className="flex-1 flex items-center justify-center gap-1 text-xs px-1.5 py-1 rounded border bg-background hover:bg-muted">
                  <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                  WhatsApp
                </button>
                <button onClick={() => shareFacebook(campaign.id)} className="flex-1 flex items-center justify-center gap-1 text-xs px-1.5 py-1 rounded border bg-background hover:bg-muted">
                  <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                  Facebook
                </button>
              </div>
            </div>
          )}

          {isMember ? (
            <div className="flex gap-1.5 pt-1">
              <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => setDonateCampaign(campaign)}>
                <Wallet className="h-3 w-3 mr-1" /> Donate
              </Button>
              {campaign.userHasDonated && (
                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => navigate(`/dashboard/donations?campaignId=${campaign.id}`)}>
                  <Eye className="h-3 w-3 mr-1" /> My Donations
                </Button>
              )}
            </div>
          ) : canViewDonations ? (
            <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => navigate(`/dashboard/donations?campaignId=${campaign.id}`)}>
              <Eye className="h-3 w-3 mr-1" /> View Donations
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">Giving Campaigns</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{activeCampaigns.length} active campaigns</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isMember && churches.length > 1 && (
            <Select value={churchFilter} onValueChange={setChurchFilter}>
              <SelectTrigger className="w-40 h-8 text-xs sm:h-9 sm:text-sm">
                <SelectValue placeholder="Filter by church" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {churches.map((church: any) => (
                  <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {!isMember && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-32 h-8 text-xs sm:h-9 sm:text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="tithe">Tithe</SelectItem>
                <SelectItem value="offering">Offering</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="welfare">Welfare</SelectItem>
                <SelectItem value="missions">Missions</SelectItem>
              </SelectContent>
            </Select>
          )}
          <ExportImportButtons
            data={campaigns.map(c => ({
              name: c.name,
              category: c.category,
              subcategory: c.subcategory || '',
              status: c.status,
              targetAmount: c.targetAmount || 0,
              totalRaised: c.totalRaised || 0,
              donorCount: c.donorCount || 0,
              currency: c.currency,
              endDate: c.endDate ? new Date(c.endDate).toLocaleDateString() : '',
            }))}
            filename="giving-campaigns"
            headers={[
              { label: 'Name', key: 'name' },
              { label: 'Category', key: 'category' },
              { label: 'Subcategory', key: 'subcategory' },
              { label: 'Status', key: 'status' },
              { label: 'Target Amount', key: 'targetAmount' },
              { label: 'Total Raised', key: 'totalRaised' },
              { label: 'Donor Count', key: 'donorCount' },
              { label: 'Currency', key: 'currency' },
              { label: 'End Date', key: 'endDate' },
            ]}
            pdfTitle="Giving Campaigns Report"
          />
          {!isMember && (
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-24 h-8 text-xs sm:h-9 sm:text-sm">
                <Filter className="h-3 w-3 mr-1 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          )}
          {canCreate && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs sm:h-9 sm:text-sm gap-1">
                  <Plus className="h-3 w-3" /> <span className="hidden sm:inline">Create Campaign</span><span className="sm:hidden">Create</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="text-base sm:text-lg">Create Campaign</DialogTitle></DialogHeader>
                <CampaignForm
                  onSubmit={v => {
                    console.log('Campaign form values:', v);
                    createMutation.mutate(v);
                  }}
                  isPending={createMutation.isPending}
                  submitLabel="Create"
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {!isMember && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card>
            <CardContent className="flex items-center justify-between p-3 sm:p-4">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Raised</p>
                <p className="text-sm sm:text-base font-bold truncate">MWK {totalRaised.toLocaleString()}</p>
              </div>
              <HandCoins className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-3 sm:p-4">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Active</p>
                <p className="text-sm sm:text-base font-bold">{activeCampaigns.length}</p>
              </div>
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-3 sm:p-4">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Donors</p>
                <p className="text-sm sm:text-base font-bold">{totalDonors}</p>
              </div>
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <HandCoins className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No campaigns yet. {canCreate && 'Create your first campaign!'}</p>
        </div>
      ) : groupedCampaigns.length > 0 ? (
        groupedCampaigns.map((group: any) => (
          <div key={group.label} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">{group.label}</h3>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
              {group.posts.map((campaign: any) => renderCampaignCard(campaign))}
            </div>
          </div>
        ))
      ) : (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign: any) => renderCampaignCard(campaign))}
        </div>
      )}

      <Dialog open={!!editCampaign} onOpenChange={open => !open && setEditCampaign(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-base sm:text-lg">Edit Campaign</DialogTitle></DialogHeader>
          {editCampaign && (
            <CampaignForm
              defaultValues={{
                churchId: editCampaign.churchId,
                name: editCampaign.name,
                description: editCampaign.description,
                category: editCampaign.category,
                subcategory: editCampaign.subcategory,
                targetAmount: editCampaign.targetAmount,
                currency: editCampaign.currency as 'MWK' | 'KES',
                endDate: editCampaign.endDate ? new Date(editCampaign.endDate).toISOString().split('T')[0] : undefined,
                allowPublicDonations: editCampaign.allowPublicDonations,
              }}
              onSubmit={v => updateMutation.mutate({ id: editCampaign.id, dto: v })}
              isPending={updateMutation.isPending}
              submitLabel="Update"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!donateCampaign} onOpenChange={open => !open && setDonateCampaign(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Donate to {donateCampaign?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount ({donateCampaign?.currency})</Label>
              <Input type="number" value={donateAmount} onChange={e => setDonateAmount(e.target.value)} placeholder="Enter amount" />
            </div>
            <Button onClick={handleDonate} disabled={isProcessing} className="w-full">
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Continue to Payment'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!activateCampaignId} onOpenChange={() => setActivateCampaignId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to activate this campaign? This will allow the campaign to accept donations again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => activateCampaignId && activateCampaignMutation.mutate(activateCampaignId)}>
              Activate Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!endCampaignId} onOpenChange={() => setEndCampaignId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this campaign? This action will mark the campaign as completed and stop accepting new donations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => endCampaignId && endCampaignMutation.mutate(endCampaignId)}>
              End Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!paymentConfirm} onOpenChange={() => setPaymentConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Donation</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>You are about to donate to <strong>{paymentConfirm?.campaign.name}</strong></p>
                {paymentConfirm?.details && (
                  <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Base Amount:</span>
                      <span className="font-medium">{paymentConfirm.details.currency} {paymentConfirm.details.baseAmount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Transaction Cost:</span>
                      <span>{paymentConfirm.details.currency} {((paymentConfirm.details.convenienceFee ?? 0) + (paymentConfirm.details.systemFeeAmount ?? 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base pt-2 border-t">
                      <span>Total Amount:</span>
                      <span>{paymentConfirm.details.currency} {paymentConfirm.details.totalAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={proceedToPayment}>
              Proceed to Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
