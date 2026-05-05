import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { givingService, type GivingCampaign } from '@/services/giving';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Handshake, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface PledgeDialogProps {
  campaign: GivingCampaign;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PledgeDialog({ campaign, open, onOpenChange }: PledgeDialogProps) {
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      givingService.createPledge({
        campaignId: campaign.id,
        pledgedAmount: Number(amount),
        fulfillmentDeadline: deadline || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-pledges'] });
      setDone(true);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to submit pledge');
    },
  });

  const handleClose = (open: boolean) => {
    if (!open) {
      setAmount('');
      setDeadline('');
      setNotes('');
      setDone(false);
    }
    onOpenChange(open);
  };

  // Minimum date = today
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="h-4 w-4 text-accent" />
            Make a Pledge
          </DialogTitle>
        </DialogHeader>

        {done ? (
          // ── Success state ──
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-accent" />
            <div>
              <p className="font-semibold text-lg">Pledge submitted!</p>
              <p className="text-sm text-muted-foreground mt-1">
                You've pledged <strong>{campaign.currency} {Number(amount).toLocaleString()}</strong> to{' '}
                <strong>{campaign.name}</strong>.
              </p>
              {deadline && (
                <p className="text-xs text-muted-foreground mt-1">
                  Fulfillment deadline: {new Date(deadline).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={() => handleClose(false)}>
                Close
              </Button>
              <Button
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => { handleClose(false); navigate('/dashboard/pledges'); }}
              >
                View My Pledges
              </Button>
            </div>
          </div>
        ) : (
          // ── Form ──
          <div className="space-y-4">
            {/* Campaign info */}
            <div className="rounded-md bg-muted/50 border px-3 py-2 flex items-center justify-between">
              <span className="text-sm font-medium">{campaign.name}</span>
              <Badge variant="outline" className="text-xs capitalize">{campaign.category.replace('_', ' ')}</Badge>
            </div>

            <div className="space-y-1.5">
              <Label>
                Pledge Amount <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground w-10 shrink-0">{campaign.currency}</span>
                <Input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This is the total amount you commit to give to this campaign.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>
                Fulfillment Deadline{' '}
                <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </Label>
              <Input
                type="date"
                min={today}
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The date by which you plan to complete your pledge.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>
                Notes{' '}
                <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </Label>
              <Textarea
                rows={2}
                placeholder="Any additional notes..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={!amount || Number(amount) <= 0 || mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {mutation.isPending ? 'Submitting...' : 'Submit Pledge'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
