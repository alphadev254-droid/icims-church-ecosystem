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
import { Plus, HandCoins, Target, Users, Pencil, Wallet, Eye, Loader2, StopCircle, PlayCircle, Filter, Lock } from 'lucide-react';
import { ExportImportButtons } from '@/components/ExportImportButtons';
import { toast } from 'sonner';
import { STALE_TIME } from '@/lib/query-config';

const campaignSchema = z.object({
  churchId: z.string().min(1, 'Church required'),
  name: z.string().min(1, 'Campaign name required'),
  description: z.string().optional(),
  category: z.enum(['tithe', 'offering', 'partnership', 'welfare', 'missions']),
  subcategory: z.string().optional(),
  targetAmount: z.coerce.number().positive().optional(),
  currency: z.enum(['MWK', 'KSH']).default('MWK'),
  endDate: z.string().optional(),
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
    defaultValues: { category: 'tithe', currency: 'MWK', ...defaultValues },
  });

  const churchId = watch('churchId');
  const category = watch('category');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <ChurchSelect value={churchId} onValueChange={v => setValue('churchId', v)} />
      {errors.churchId && <p className="text-xs text-destructive">{errors.churchId.message}</p>}

      <div>
        <Label>Campaign Name *</Label>
        <Input {...register('name')} placeholder="e.g. Mission to Zomba" />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div>
        <Label>Category *</Label>
        <Select defaultValue={defaultValues?.category ?? 'tithe'} onValueChange={v => setValue('category', v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
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
          <Label>Subcategory</Label>
          <Input {...register('subcategory')} placeholder="e.g. TV Sponsorship, Funeral for John" />
        </div>
      )}

      <div>
        <Label>Description</Label>
        <Textarea {...register('description')} rows={2} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Target Amount*</Label>
          <Input type="number" {...register('targetAmount')} placeholder="" />
        </div>
        <div>
          <Label>Currency*</Label>
          <Select defaultValue={defaultValues?.currency ?? 'MWK'} onValueChange={v => setValue('currency', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MWK">MWK</SelectItem>
              <SelectItem value="KSH">KSH</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>End Date</Label>
        <Input type="date" {...register('endDate')} />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const { hasPermission } = useRole();
  const hasGivingFeature = useHasFeature('giving_tracking');
  const user = useAuthStore(state => state.user);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => givingService.getCampaigns(),
    staleTime: STALE_TIME.DEFAULT,
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

  const canCreate = hasPermission('campaigns:create') && hasGivingFeature;
  const canUpdate = hasPermission('campaigns:update') && hasGivingFeature;
  const canViewDonations = hasPermission('donations:read');
  const isMember = user?.roleName === 'member';

  if (!hasGivingFeature) {
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
  const filteredCampaigns = isMember ? campaigns : statusFilter === 'all' ? campaigns : campaigns.filter(c => c.status === statusFilter);
  const totalRaised = campaigns.reduce((sum, c) => sum + (c.totalRaised || 0), 0);
  const totalDonors = campaigns.reduce((sum, c) => sum + (c.donorCount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Giving Campaigns</h1>
          <p className="text-sm text-muted-foreground">{activeCampaigns.length} active campaigns</p>
        </div>
        <div className="flex gap-2">
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
              <SelectTrigger className="w-36">
                <Filter className="h-4 w-4 mr-2" />
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
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Create Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Create Campaign</DialogTitle></DialogHeader>
                <CampaignForm onSubmit={v => createMutation.mutate(v)} isPending={createMutation.isPending} submitLabel="Create" />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Raised</CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">MWK {totalRaised.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{activeCampaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Donors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{totalDonors}</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map(campaign => {
            const progress = campaign.targetAmount ? (campaign.totalRaised! / campaign.targetAmount) * 100 : 0;
            return (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{campaign.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs capitalize">{campaign.category}</Badge>
                        {campaign.status !== 'active' && <Badge variant="secondary" className="text-xs">{campaign.status}</Badge>}
                      </div>
                    </div>
                    {canUpdate && (
                      <div className="flex gap-1">
                        <button onClick={() => setEditCampaign(campaign)} className="p-1 text-muted-foreground hover:text-foreground">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {campaign.status === 'active' ? (
                          <button onClick={() => setEndCampaignId(campaign.id)} className="p-1 text-muted-foreground hover:text-destructive">
                            <StopCircle className="h-3.5 w-3.5" />
                          </button>
                        ) : campaign.status === 'completed' && (
                          <button onClick={() => setActivateCampaignId(campaign.id)} className="p-1 text-muted-foreground hover:text-green-600">
                            <PlayCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {campaign.description && <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>}
                  
                  {campaign.targetAmount && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{campaign.currency} {campaign.totalRaised?.toLocaleString()} / {campaign.targetAmount.toLocaleString()}</span>
                      </div>
                      <Progress value={Math.min(progress, 100)} className="h-2" />
                      <p className="text-xs text-muted-foreground">{progress.toFixed(0)}% of goal</p>
                    </div>
                  )}

                  {!campaign.targetAmount && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Raised: </span>
                      <span className="font-medium">{campaign.currency} {campaign.totalRaised?.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{campaign.donorCount} donors</span>
                  </div>

                  {isMember ? (
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => setDonateCampaign(campaign)}>
                        <Wallet className="h-3 w-3 mr-1" /> Donate
                      </Button>
                      {campaign.userHasDonated && (
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/dashboard/donations?campaignId=${campaign.id}`)}>
                          <Eye className="h-3 w-3 mr-1" /> My Donations
                        </Button>
                      )}
                    </div>
                  ) : canViewDonations ? (
                    <Button size="sm" variant="outline" className="w-full" onClick={() => navigate(`/dashboard/donations?campaignId=${campaign.id}`)}>
                      <Eye className="h-3 w-3 mr-1" /> View Donations
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
          {filteredCampaigns.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <HandCoins className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No campaigns yet. {canCreate && 'Create your first campaign!'}</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!editCampaign} onOpenChange={open => !open && setEditCampaign(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Campaign</DialogTitle></DialogHeader>
          {editCampaign && (
            <CampaignForm
              defaultValues={{
                churchId: editCampaign.churchId,
                name: editCampaign.name,
                description: editCampaign.description,
                category: editCampaign.category,
                subcategory: editCampaign.subcategory,
                targetAmount: editCampaign.targetAmount,
                currency: editCampaign.currency as 'MWK' | 'KSH',
                endDate: editCampaign.endDate ? new Date(editCampaign.endDate).toISOString().split('T')[0] : undefined,
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
                      <span>{paymentConfirm.details.currency} {paymentConfirm.details.convenienceFee?.toFixed(2)}</span>
                    </div>
                    {paymentConfirm.details.taxAmount > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tax:</span>
                        <span>{paymentConfirm.details.currency} {paymentConfirm.details.taxAmount?.toFixed(2)}</span>
                      </div>
                    )}
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
