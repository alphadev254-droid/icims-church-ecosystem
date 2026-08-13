import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { givingService } from '@/services/giving';

type CampaignOption = {
  id: string;
  name: string;
  category: string;
  currency: string;
  status?: string;
  churchId?: string;
  church?: { id?: string; name: string };
  availableChurches?: Array<{ id: string; name: string }>;
};

type CellOption = { id: string; name: string; zone?: string | null };

type GivingRow = {
  campaignId: string;
  churchId: string;
  amount: string;
  cellId: string;
};

interface MultiGivingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaigns: CampaignOption[];
  initialCampaignId?: string;
  initialChurchId?: string;
  allowedChurchIds?: string[];
  lockInitialCampaign?: boolean;
  lockInitialChurch?: boolean;
  mode: 'member' | 'guest';
  memberChurchId?: string | null;
  memberCells?: CellOption[];
}

function emptyRow(campaignId = '', churchId = ''): GivingRow {
  return { campaignId, churchId, amount: '', cellId: '' };
}

export function MultiGivingDialog({
  open,
  onOpenChange,
  campaigns,
  initialCampaignId,
  initialChurchId,
  allowedChurchIds,
  lockInitialCampaign = false,
  lockInitialChurch = false,
  mode,
  memberChurchId,
  memberCells = [],
}: MultiGivingDialogProps) {
  const activeCampaigns = useMemo(
    () => campaigns.filter(campaign => !campaign.status || campaign.status === 'active'),
    [campaigns],
  );
  const campaignMap = useMemo(() => new Map(activeCampaigns.map(campaign => [campaign.id, campaign])), [activeCampaigns]);
  const [rows, setRows] = useState<GivingRow[]>([emptyRow(initialCampaignId)]);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [publicCellsByCampaign, setPublicCellsByCampaign] = useState<Record<string, CellOption[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const allowedChurchSet = useMemo(
    () => allowedChurchIds?.length ? new Set(allowedChurchIds) : null,
    [allowedChurchIds],
  );

  const getCampaignChurches = (campaignId: string) => {
    const campaign = campaignMap.get(campaignId);
    if (!campaign) return [];
    let churches = campaign.availableChurches?.length
      ? campaign.availableChurches
      : campaign.churchId
        ? [{ id: campaign.churchId, name: campaign.church?.name || 'Church' }]
        : [];
    if (allowedChurchSet) {
      churches = churches.filter(church => allowedChurchSet.has(church.id));
    }
    return churches;
  };

  const getDefaultChurchId = (campaignId: string) => {
    if (mode === 'member') return memberChurchId || '';
    const churches = getCampaignChurches(campaignId);
    if (initialChurchId && churches.some(church => church.id === initialChurchId)) return initialChurchId;
    return '';
  };

  const getDefaultCellId = (campaignId: string, churchId?: string) => {
    const campaign = campaignMap.get(campaignId);
    if (campaign?.category !== 'fellowship_offering') return '';
    if (mode !== 'member') return '';
    const availableInChurch = getCampaignChurches(campaignId).some(church => church.id === churchId);
    if (!availableInChurch) return '';
    return memberCells[0]?.id || '';
  };

  useEffect(() => {
    if (!open) return;
    const campaignId = initialCampaignId || activeCampaigns[0]?.id || '';
    const churchId = getDefaultChurchId(campaignId);
    setRows([{ ...emptyRow(campaignId, churchId), cellId: getDefaultCellId(campaignId, churchId) }]);
  }, [activeCampaigns, initialCampaignId, initialChurchId, memberCells, memberChurchId, open]);

  useEffect(() => {
    if (mode === 'guest') setPublicCellsByCampaign({});
  }, [mode, rows.map(row => `${row.campaignId}:${row.churchId}`).join('|')]);

  useEffect(() => {
    if (!open || mode !== 'guest') return;
    const fellowshipRows = rows.filter(row => {
      const key = `${row.campaignId}:${row.churchId}`;
      return campaignMap.get(row.campaignId)?.category === 'fellowship_offering' && !!row.churchId && !publicCellsByCampaign[key];
    });

    [...new Map(fellowshipRows.map(row => [`${row.campaignId}:${row.churchId}`, row])).values()].forEach(row => {
      const key = `${row.campaignId}:${row.churchId}`;
      givingService.getPublicCampaignCells(row.campaignId, row.churchId || undefined)
        .then(cells => setPublicCellsByCampaign(prev => ({ ...prev, [key]: cells })))
        .catch(() => setPublicCellsByCampaign(prev => ({ ...prev, [key]: [] })));
    });
  }, [campaignMap, mode, open, publicCellsByCampaign, rows]);

  const total = rows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
  const currency = campaignMap.get(rows[0]?.campaignId)?.currency || activeCampaigns[0]?.currency || 'MWK';

  const updateRow = (index: number, patch: Partial<GivingRow>) => {
    setRows(prev => prev.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  };

  const updateRowCampaign = (index: number, campaignId: string) => {
    const churchId = getDefaultChurchId(campaignId);
    updateRow(index, { campaignId, churchId, cellId: getDefaultCellId(campaignId, churchId) });
  };

  const addRow = () => {
    if (lockInitialCampaign) return;
    const nextCampaign = activeCampaigns[0];
    if (!nextCampaign) {
      toast.error('No active giving campaigns are available');
      return;
    }
    const churchId = getDefaultChurchId(nextCampaign.id);
    setRows(prev => [...prev, { ...emptyRow(nextCampaign.id, churchId), cellId: getDefaultCellId(nextCampaign.id, churchId) }]);
  };

  const removeRow = (index: number) => {
    setRows(prev => prev.length === 1 ? prev : prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const getCellsForRow = (row: GivingRow) => mode === 'guest'
    ? publicCellsByCampaign[`${row.campaignId}:${row.churchId}`] || []
    : memberCells;

  const submit = async () => {
    if (mode === 'guest' && (!guestName.trim() || !guestPhone.trim())) {
      toast.error('Full name and phone number are required');
      return;
    }

    const normalized = rows.map(row => ({
      campaignId: row.campaignId,
      churchId: mode === 'member' ? (memberChurchId || undefined) : (row.churchId || undefined),
      amount: parseFloat(row.amount),
      cellId: row.cellId || undefined,
    }));

    if (normalized.some(row => !row.campaignId || !row.amount || row.amount <= 0)) {
      toast.error('Select a campaign and enter a valid amount for each giving line');
      return;
    }

    if (new Set(normalized.map(row => `${row.campaignId}:${row.churchId || ''}`)).size !== normalized.length) {
      toast.error('Each giving line must use a different campaign and church combination');
      return;
    }

    if (mode === 'member') {
      if (!memberChurchId) {
        toast.error('Your account is not linked to a church');
        return;
      }
      const unavailable = normalized.find(row => !getCampaignChurches(row.campaignId).some(church => church.id === memberChurchId));
      if (unavailable) {
        toast.error('This campaign is not available for your church');
        return;
      }
    } else {
      const missingChurch = normalized.some(row => !row.churchId);
      if (missingChurch) {
        toast.error('Select the church for each giving line');
        return;
      }
    }

    for (const row of normalized) {
      const campaign = campaignMap.get(row.campaignId);
      if (campaign?.category === 'fellowship_offering' && !row.cellId) {
        toast.error(`Please select a cell/fellowship for ${campaign.name}`);
        return;
      }
    }

    const checkoutChurchId = normalized[0]?.churchId;

    setIsSubmitting(true);
    try {
      const result = mode === 'guest'
        ? await givingService.guestDonateMultiple({
            items: normalized,
            churchId: checkoutChurchId,
            guestName: guestName.trim(),
            guestEmail: guestEmail.trim() || undefined,
            guestPhone: guestPhone.trim(),
          })
        : await givingService.donateMultiple({ items: normalized, churchId: memberChurchId || checkoutChurchId || undefined });

      if (result?.authorization_url) {
        window.location.href = result.authorization_url;
        return;
      }

      toast.error('Payment link was not returned');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initialize giving');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-2xl max-h-[90svh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{rows.length > 1 ? 'Give Multiple' : 'Give Now'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {mode === 'guest' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Full Name *</Label>
                <Input value={guestName} onChange={event => setGuestName(event.target.value)} placeholder="John Doe" />
              </div>
              <div className="space-y-1">
                <Label>Email (optional)</Label>
                <p className="text-xs text-muted-foreground">Use your church account email, or add one to receive your receipt.</p>
                <Input type="email" value={guestEmail} onChange={event => setGuestEmail(event.target.value)} placeholder="john@example.com" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Phone *</Label>
                <p className="text-xs text-muted-foreground">Use the phone number on your church account so this giving can be linked to you.</p>
                <Input value={guestPhone} onChange={event => setGuestPhone(event.target.value)} placeholder="+265 999 000 000" />
              </div>
            </div>
          )}

          <div className="space-y-3">
            {rows.map((row, index) => {
              const campaign = campaignMap.get(row.campaignId);
              const campaignChurches = getCampaignChurches(row.campaignId);
              const showChurchSelector = mode === 'guest' && campaignChurches.length > 0;
              const showGivingFields = mode !== 'guest' || !!row.churchId;
              const cells = getCellsForRow(row);
              return (
                <div key={index} className="rounded-md border p-2.5 sm:p-3 space-y-3">
                  <div className="grid gap-2">
                    <div className={showChurchSelector ? 'grid grid-cols-2 gap-2' : 'grid gap-2'}>
                      <div className="min-w-0 space-y-1">
                        <Label className="text-[11px] sm:text-xs">Campaign</Label>
                      <Select value={row.campaignId} onValueChange={value => updateRowCampaign(index, value)} disabled={lockInitialCampaign}>
                        <SelectTrigger className="h-9 px-2 text-xs sm:px-3 sm:text-sm"><SelectValue placeholder="Select campaign" /></SelectTrigger>
                        <SelectContent>
                          {activeCampaigns.map(option => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {showChurchSelector && (
                      <div className="min-w-0 space-y-1">
                        <Label className="text-[11px] sm:text-xs">Member church *</Label>
                        <Select value={row.churchId} onValueChange={value => updateRow(index, { churchId: value, cellId: '' })} disabled={lockInitialChurch}>
                          <SelectTrigger className="h-9 px-2 text-xs sm:px-3 sm:text-sm"><SelectValue placeholder="Select member church" /></SelectTrigger>
                          <SelectContent>
                            {campaignChurches.map(church => (
                              <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    </div>
                    {!showGivingFields ? (
                      <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground sm:text-sm">
                        Select your member church first, then enter the giving amount.
                      </div>
                    ) : (
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
                        <div className="min-w-0 space-y-1">
                          <Label className="text-[11px] sm:text-xs">Amount</Label>
                          <Input
                            className="h-9 text-sm"
                            type="number"
                            min="1"
                            value={row.amount}
                            onChange={event => updateRow(index, { amount: event.target.value })}
                            placeholder="0"
                          />
                        </div>
                        {!lockInitialCampaign && (
                          <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeRow(index)} disabled={rows.length === 1}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {showGivingFields && campaign?.category === 'fellowship_offering' && (
                    <div className="space-y-1">
                      <Label className="text-xs sm:text-sm">Cell / Fellowship *</Label>
                      <Select value={row.cellId} onValueChange={value => updateRow(index, { cellId: value })}>
                        <SelectTrigger><SelectValue placeholder="Select cell" /></SelectTrigger>
                        <SelectContent>
                          {cells.length === 0 ? (
                            <SelectItem value="_none" disabled>No cells available</SelectItem>
                          ) : cells.map(cell => (
                            <SelectItem key={cell.id} value={cell.id}>{cell.name}{cell.zone ? ` - ${cell.zone}` : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!lockInitialCampaign && (
            <Button type="button" variant="outline" className="w-full" onClick={addRow}>
              <Plus className="mr-2 h-4 w-4" /> Add another giving
            </Button>
          )}

          <div className="rounded-md bg-muted p-3">
            <div className="flex items-center justify-between text-sm">
              <span>Total giving amount</span>
              <span className="font-semibold">{currency} {total.toLocaleString()}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Transaction cost is calculated on the payment checkout.</p>
          </div>

          <Button className="w-full" onClick={submit} disabled={isSubmitting || total <= 0}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : rows.length > 1 ? 'Give All' : 'Give Now'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
