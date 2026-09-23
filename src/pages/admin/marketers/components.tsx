import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function marketerName(marketer: { displayName?: string | null; user?: { firstName?: string; lastName?: string; email?: string } | null }) {
  return marketer.displayName || `${marketer.user?.firstName || ''} ${marketer.user?.lastName || ''}`.trim() || marketer.user?.email || 'Marketer';
}

export function marketerStatusLabel(status?: string | null) {
  if (status === 'approved') return 'Verified';
  if (status === 'pending') return 'Waiting Verification';
  if (status === 'suspended') return 'Suspended';
  if (status === 'rejected') return 'Rejected';
  return status || 'Unknown';
}

export function marketerStatusBadge(status?: string | null) {
  if (status === 'approved') return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Verified</Badge>;
  if (status === 'pending') return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">Waiting</Badge>;
  if (status === 'suspended') return <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">Suspended</Badge>;
  if (status === 'rejected') return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Rejected</Badge>;
  return <Badge variant="outline" className="text-xs capitalize">{status || 'Unknown'}</Badge>;
}

export function payoutStatusBadge(status?: string | null) {
  if (status === 'complete') return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Complete</Badge>;
  if (status === 'unsupported_market') return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Unsupported</Badge>;
  return <Badge variant="outline" className="text-xs capitalize">{status || 'Pending'}</Badge>;
}

export function money(currency?: string | null, value?: number | string | null) {
  const amount = Number(value || 0);
  return `${String(currency || '').toUpperCase() || '—'} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b last:border-0">
      <span className="text-xs text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="text-xs font-medium">{value ?? '—'}</span>
    </div>
  );
}

export function StatusDialog({
  open,
  status,
  reason,
  title = 'Update marketer status',
  isSaving,
  onOpenChange,
  onStatusChange,
  onReasonChange,
  onSave,
}: {
  open: boolean;
  status: string;
  reason: string;
  title?: string;
  isSaving?: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (status: string) => void;
  onReasonChange: (reason: string) => void;
  onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="text-base">{title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending" className="text-xs">Waiting Verification</SelectItem>
                <SelectItem value="approved" className="text-xs">Verified</SelectItem>
                <SelectItem value="suspended" className="text-xs">Suspended</SelectItem>
                <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(status === 'suspended' || status === 'rejected') && (
            <div className="space-y-1">
              <Label className="text-xs">Reason</Label>
              <Input className="h-8 text-xs" value={reason} onChange={event => onReasonChange(event.target.value)} placeholder="Optional admin note" />
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={onSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
