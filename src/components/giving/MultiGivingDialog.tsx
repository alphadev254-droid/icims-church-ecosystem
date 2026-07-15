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

function emptyRow(campaignId = ''): GivingRow {
  return { campaignId, amount: '', cellId: '' };
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
  const [selectedChurchId, setSelectedChurchId] = useState('');
  const [publicCellsByCampaign, setPublicCellsByCampaign] = useState<Record<string, CellOption[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRows([emptyRow(initialCampaignId || activeCampaigns[0]?.id || '')]);
    setSelectedChurchId(initialChurchId || '');
  }, [activeCampaigns, initialCampaignId, initialChurchId, open]);

  const selectedCampaigns = useMemo(
    () => rows.map(row => campaignMap.get(row.campaignId)).filter(Boolean) as CampaignOption[],
    [campaignMap, rows],
  );
  const allowedChurchSet = useMemo(
    () => allowedChurchIds?.length ? new Set(allowedChurchIds) : null,
    [allowedChurchIds],
  );
  const commonChurches = useMemo(() => {
    if (selectedCampaigns.length === 0) return [];
    const toChurches = (campaign: CampaignOption) => {
      if (campaign.availableChurches?.length) return campaign.availableChurches;
      if (campaign.churchId) return [{ id: campaign.churchId, name: campaign.church?.name || 'Church' }];
      return [];
    };
    let common = toChurches(selectedCampaigns[0]);
    for (const campaign of selectedCampaigns.slice(1)) {
      const ids = new Set(toChurches(campaign).map(church => church.id));
      common = common.filter(church => ids.has(church.id));
    }
    if (allowedChurchSet) {
      common = common.filter(church => allowedChurchSet.has(church.id));
    }
    return common;
  }, [allowedChurchSet, selectedCampaigns]);
  const resolvedChurchId = mode === 'member'
    ? (memberChurchId || '')
    : (commonChurches.length === 1 ? commonChurches[0].id : selectedChurchId);

  useEffect(() => {
    if (mode === 'guest') setPublicCellsByCampaign({});
  }, [mode, resolvedChurchId]);

  useEffect(() => {
    if (!open || mode !== 'guest') return;
    const fellowshipIds = rows
      .map(row => row.campaignId)
      .filter(id => campaignMap.get(id)?.category === 'fellowship_offering' && !!resolvedChurchId && !publicCellsByCampaign[id]);

    [...new Set(fellowshipIds)].forEach(campaignId => {
      givingService.getPublicCampaignCells(campaignId, resolvedChurchId || undefined)
        .then(cells => setPublicCellsByCampaign(prev => ({ ...prev, [campaignId]: cells })))
        .catch(() => setPublicCellsByCampaign(prev => ({ ...prev, [campaignId]: [] })));
    });
  }, [campaignMap, mode, open, publicCellsByCampaign, resolvedChurchId, rows]);

  const selectedIds = rows.map(row => row.campaignId).filter(Boolean);
  const total = rows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
  const currency = campaignMap.get(rows[0]?.campaignId)?.currency || activeCampaigns[0]?.currency || 'MWK';

  const updateRow = (index: number, patch: Partial<GivingRow>) => {
    setRows(prev => prev.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  };

  const addRow = () => {
    if (lockInitialCampaign) return;
    const nextCampaign = activeCampaigns.find(campaign => !selectedIds.includes(campaign.id));
    if (!nextCampaign) {
      toast.error('All available campaigns are already selected');
      return;
    }
    setRows(prev => [...prev, emptyRow(nextCampaign.id)]);
  };

  const removeRow = (index: number) => {
    setRows(prev => prev.length === 1 ? prev : prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const getCellsForRow = (campaignId: string) => mode === 'guest'
    ? publicCellsByCampaign[campaignId] || []
    : memberCells;

  const submit = async () => {
    if (mode === 'guest' && (!guestName.trim() || !guestEmail.trim())) {
      toast.error('Full name and email are required');
      return;
    }

    const normalized = rows.map(row => ({
      campaignId: row.campaignId,
      amount: parseFloat(row.amount),
      cellId: row.cellId || undefined,
    }));

    if (normalized.some(row => !row.campaignId || !row.amount || row.amount <= 0)) {
      toast.error('Select a campaign and enter a valid amount for each giving line');
      return;
    }

    if (new Set(normalized.map(row => row.campaignId)).size !== normalized.length) {
      toast.error('Select each campaign only once');
      return;
    }

    if (mode === 'member') {
      if (!memberChurchId || !commonChurches.some(church => church.id === memberChurchId)) {
        toast.error('This campaign is not available for your church');
        return;
      }
    } else if (!resolvedChurchId) {
      toast.error('Select the church this giving should go to');
      return;
    }

    for (const row of normalized) {
      const campaign = campaignMap.get(row.campaignId);
      if (campaign?.category === 'fellowship_offering' && !row.cellId) {
        toast.error(`Please select a cell/fellowship for ${campaign.name}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const result = mode === 'guest'
        ? await givingService.guestDonateMultiple({
            items: normalized,
            churchId: resolvedChurchId,
            guestName: guestName.trim(),
            guestEmail: guestEmail.trim(),
            guestPhone: guestPhone.trim() || undefined,
          })
        : await givingService.donateMultiple({ items: normalized, churchId: resolvedChurchId });

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

  const showChurchSelector = mode === 'guest' && commonChurches.length > 1;

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
                <Label>Email *</Label>
                <Input type="email" value={guestEmail} onChange={event => setGuestEmail(event.target.value)} placeholder="john@example.com" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Phone (optional)</Label>
                <Input value={guestPhone} onChange={event => setGuestPhone(event.target.value)} placeholder="+265 999 000 000" />
              </div>
            </div>
          )}

          <div className="space-y-3">
            {rows.map((row, index) => {
              const campaign = campaignMap.get(row.campaignId);
              const cells = getCellsForRow(row.campaignId);
              return (
                <div key={index} className="rounded-md border p-2.5 sm:p-3 space-y-3">
                  <div className="grid gap-2">
                    <div className={showChurchSelector ? 'grid grid-cols-2 gap-2' : 'grid gap-2'}>
                      <div className="min-w-0 space-y-1">
                        <Label className="text-[11px] sm:text-xs">Campaign</Label>
                      <Select value={row.campaignId} onValueChange={value => updateRow(index, { campaignId: value, cellId: '' })} disabled={lockInitialCampaign}>
                        <SelectTrigger className="h-9 px-2 text-xs sm:px-3 sm:text-sm"><SelectValue placeholder="Select campaign" /></SelectTrigger>
                        <SelectContent>
                          {activeCampaigns.map(option => {
                            const alreadySelected = selectedIds.includes(option.id) && option.id !== row.campaignId;
                            return (
                              <SelectItem key={option.id} value={option.id} disabled={alreadySelected}>
                                {option.name}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    {showChurchSelector && (
                      <div className="min-w-0 space-y-1">
                        <Label className="text-[11px] sm:text-xs">Church {rows.length > 1 ? '(all)' : ''} *</Label>
                        <Select value={selectedChurchId} onValueChange={setSelectedChurchId} disabled={lockInitialChurch}>
                          <SelectTrigger className="h-9 px-2 text-xs sm:px-3 sm:text-sm"><SelectValue placeholder="Select church" /></SelectTrigger>
                          <SelectContent>
                            {commonChurches.map(church => (
                              <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    </div>
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
                  </div>

                  {campaign?.category === 'fellowship_offering' && (
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
