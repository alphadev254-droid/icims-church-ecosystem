import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HandCoins, Share2, Copy, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { givingService } from '@/services/giving';

export default function PublicCampaignPage() {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ guestName: '', guestEmail: '', guestPhone: '', amount: '' });
  const [cellId, setCellId] = useState('');
  const [fees, setFees] = useState<{ currency: string; baseAmount: number; convenienceFee: number; systemFeeAmount: number; totalAmount: number } | null>(null);
  const [feesLoading, setFeesLoading] = useState(false);

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['public-campaign', id],
    queryFn: () => givingService.getPublicCampaign(id!),
    enabled: !!id,
  });

  // Load cells for fellowship_offering campaigns
  const { data: cells = [] } = useQuery({
    queryKey: ['public-campaign-cells', id],
    queryFn: () => givingService.getPublicCampaignCells(id!),
    enabled: !!id && campaign?.category === 'fellowship_offering',
  });

  const campaignUrl = window.location.href;

  const copyLink = () => {
    navigator.clipboard.writeText(campaignUrl);
    setCopied(true);
    toast.success('Campaign link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Support our campaign: ${campaign?.name}\n${campaignUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareFacebook = () => {
    const url = encodeURIComponent(campaignUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const fetchFees = async (amount: number) => {
    if (!amount || amount <= 0) { setFees(null); return; }
    setFeesLoading(true);
    try {
      const { default: apiClient } = await import('@/lib/api-client');
      const { data } = await apiClient.get('/payments/guest-donation/fees', {
        params: { campaignId: id, amount },
      });
      setFees(data.data);
    } catch {
      setFees(null);
    } finally {
      setFeesLoading(false);
    }
  };

  const handleAmountBlur = () => {
    const amount = parseFloat(form.amount);
    if (amount > 0) fetchFees(amount);
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guestName.trim() || !form.guestEmail.trim()) {
      toast.error('Full name and email are required');
      return;
    }
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (campaign?.category === 'fellowship_offering' && !cellId) {
      toast.error('Please select your cell/fellowship');
      return;
    }
    setLoading(true);
    try {
      const result = await givingService.guestDonate({
        campaignId: id!,
        amount,
        guestName: form.guestName.trim(),
        guestEmail: form.guestEmail.trim(),
        guestPhone: form.guestPhone.trim() || undefined,
        ...(campaign?.category === 'fellowship_offering' && cellId ? { cellId } : {}),
      });
      window.location.href = result.authorization_url;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initialize donation');
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Campaign Not Found</h1>
          <p className="text-muted-foreground">This campaign may have ended or the link is invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-4 sm:py-6">
        <div className="container max-w-4xl px-4">
          <p className="text-xs sm:text-sm text-primary-foreground/70 uppercase tracking-wide mb-1 capitalize">{campaign.category}</p>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">{campaign.name}</h1>
          <p className="text-sm text-primary-foreground/80 mt-1">{campaign.church?.name}</p>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl px-4 py-6 sm:py-8 space-y-6">

        {/* Description */}
        {campaign.description && (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-sm sm:text-base font-semibold mb-3">About This Campaign</h2>
              <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {campaign.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Share */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share This Campaign
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button onClick={copyLink} variant="outline" className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button onClick={shareWhatsApp} variant="outline" className="gap-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                WhatsApp
              </Button>
              <Button onClick={shareFacebook} variant="outline" className="gap-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Donate CTA */}
        <Card className="bg-accent/10 border-accent">
          <CardContent className="p-4 sm:p-6 text-center">
            <p className="text-base sm:text-lg font-semibold mb-2">Support This Campaign</p>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">Every contribution makes a difference</p>
            <Button size="lg" className="w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
              <HandCoins className="h-4 w-4 mr-2" /> Give Now
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Guest Donation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Give to {campaign.name}</DialogTitle>
            <p className="text-sm text-muted-foreground pt-1">
              Fill in your details to proceed to payment. A receipt will be sent to your email.
            </p>
          </DialogHeader>

          <form onSubmit={handleDonate} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="guestName">Full Name *</Label>
              <Input
                id="guestName"
                placeholder="John Doe"
                value={form.guestName}
                onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="guestEmail">Email Address *</Label>
              <Input
                id="guestEmail"
                type="email"
                placeholder="john@example.com"
                value={form.guestEmail}
                onChange={e => setForm(f => ({ ...f, guestEmail: e.target.value }))}
                required
              />
              <p className="text-xs text-muted-foreground">Your receipt will be sent to this email</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="guestPhone">Phone Number (optional)</Label>
              <Input
                id="guestPhone"
                type="tel"
                placeholder="+265 999 000 000"
                value={form.guestPhone}
                onChange={e => setForm(f => ({ ...f, guestPhone: e.target.value }))}
              />
            </div>

            {/* Cell dropdown — only for fellowship_offering */}
            {campaign?.category === 'fellowship_offering' && (
              <div className="space-y-1">
                <Label>Cell / Fellowship <span className="text-destructive">*</span></Label>
                <Select value={cellId} onValueChange={setCellId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your cell" />
                  </SelectTrigger>
                  <SelectContent>
                    {cells.length === 0 ? (
                      <SelectItem value="_none" disabled>No cells available</SelectItem>
                    ) : (
                      cells.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}{c.zone ? ` — ${c.zone}` : ''}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">This offering will be recorded under your cell</p>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="amount">Amount ({campaign.currency}) *</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                placeholder="Enter amount"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                onBlur={handleAmountBlur}
                required
              />
            </div>

            {form.amount && parseFloat(form.amount) > 0 && (
              <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                {feesLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-muted-foreground">Calculating fees...</span>
                  </div>
                ) : fees ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Giving amount</span>
                      <span>{fees.currency} {fees.baseAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaction cost</span>
                      <span>{fees.currency} {(fees.totalAmount - fees.baseAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                      <span>Total</span>
                      <span>{fees.currency} {fees.totalAmount.toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Donation amount</span>
                    <span>{campaign.currency} {parseFloat(form.amount).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing...</> : 'Proceed to Payment'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
