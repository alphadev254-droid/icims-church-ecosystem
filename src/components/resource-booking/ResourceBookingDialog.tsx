import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { dateTimeLocalToIso, toDateTimeLocalInputValue } from '@/lib/date-time';
import { resourceBookingService } from '@/services/resourceBooking';
import { resourceImageUrl } from './ResourceImagesField';

export type BookingActivity = {
  type: 'manual' | 'service' | 'event'; id?: string; churchId: string;
  title: string; startsAt?: string; endsAt?: string;
};

export function ResourceBookingDialog({ open, onOpenChange, activity }: {
  open: boolean; onOpenChange: (open: boolean) => void; activity: BookingActivity | null;
}) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [purpose, setPurpose] = useState('');
  const [availability, setAvailability] = useState<Record<string, { available: boolean; conflict?: { activityTitle: string } }>>({});
  useEffect(() => {
    setSelected([]); setPurpose(''); setAvailability({});
    setTitle(activity?.title || '');
    setStartsAt(activity?.startsAt ? toDateTimeLocalInputValue(activity.startsAt) : '');
    setEndsAt(activity?.endsAt ? toDateTimeLocalInputValue(activity.endsAt) : '');
  }, [activity]);
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['bookable-resources', activity?.churchId],
    queryFn: () => resourceBookingService.resources(activity!.churchId),
    enabled: open && !!activity?.churchId,
  });
  const { data: activityWindow, error: activityError } = useQuery({
    queryKey: ['booking-activity-window', activity?.type, activity?.id, activity?.churchId],
    queryFn: () => resourceBookingService.activityWindow({ churchId: activity!.churchId, activityType: activity!.type as 'service' | 'event', activityId: activity!.id! }),
    enabled: open && !!activity?.id && activity?.type !== 'manual',
    retry: false,
  });
  useEffect(() => {
    if (activityWindow) {
      setTitle(activityWindow.activityTitle);
      setStartsAt(toDateTimeLocalInputValue(activityWindow.startsAt));
      setEndsAt(toDateTimeLocalInputValue(activityWindow.endsAt));
    }
  }, [activityWindow]);
  const { data: existing } = useQuery({
    queryKey: ['resource-bookings', activity?.type, activity?.id],
    queryFn: () => resourceBookingService.bookings({ activityType: activity!.type, activityId: activity!.id!, limit: 100 }),
    enabled: open && !!activity?.id,
  });
  const check = useMutation({
    mutationFn: () => resourceBookingService.availability({ churchId: activity!.churchId, resourceIds: selected, startsAt: dateTimeLocalToIso(startsAt), endsAt: dateTimeLocalToIso(endsAt) }),
    onSuccess: rows => setAvailability(Object.fromEntries(rows.map(row => [row.resourceId, row]))),
    onError: (error: any) => toast.error(error.response?.data?.message || 'Availability check failed'),
  });
  const request = useMutation({
    mutationFn: () => resourceBookingService.request({
      churchId: activity!.churchId, resourceIds: selected, activityType: activity!.type,
      ...(activity!.type === 'manual' ? { activityTitle: title, startsAt: dateTimeLocalToIso(startsAt), endsAt: dateTimeLocalToIso(endsAt) } : { activityId: activity!.id }),
      purpose,
    }),
    onSuccess: bookings => {
      toast.success(bookings.some(item => item.status === 'pending') ? 'Request submitted for approval' : 'Resources booked');
      qc.invalidateQueries({ queryKey: ['resource-bookings'] });
      onOpenChange(false);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Could not book resources'),
  });
  const active = resources.filter(resource => resource.status === 'active');
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <DialogHeader><DialogTitle>Book resources{activity?.title ? ` · ${activity.title}` : ''}</DialogTitle></DialogHeader>
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {activity?.type === 'manual' && <div className="sm:col-span-2"><Label htmlFor="booking-title">Activity</Label><Input id="booking-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Youth rehearsal" /></div>}
          <div><Label htmlFor="booking-start">Starts</Label><Input id="booking-start" type="datetime-local" value={startsAt} onChange={event => { setStartsAt(event.target.value); setAvailability({}); }} disabled={activity?.type !== 'manual'} /></div>
          <div><Label htmlFor="booking-end">Ends</Label><Input id="booking-end" type="datetime-local" value={endsAt} onChange={event => { setEndsAt(event.target.value); setAvailability({}); }} disabled={activity?.type !== 'manual'} /></div>
        </div>
        {activityError && <p className="text-sm text-amber-700">{(activityError as any).response?.data?.message || 'This activity cannot be booked yet.'}</p>}
        <div><Label htmlFor="booking-purpose">Purpose or notes</Label><Textarea id="booking-purpose" value={purpose} onChange={event => setPurpose(event.target.value)} placeholder="What will the resources be used for?" /></div>
        <div>
          <div className="mb-2 flex items-center justify-between"><Label>Choose resources</Label><span className="text-xs text-muted-foreground">{selected.length} selected</span></div>
          {isLoading ? <p className="text-sm text-muted-foreground">Loading resources…</p> : active.length ? <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-3">
            {active.map(resource => <label key={resource.id} className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted">
              <input type="checkbox" className="mt-1" checked={selected.includes(resource.id)} onChange={event => { setSelected(current => event.target.checked ? [...current, resource.id] : current.filter(id => id !== resource.id)); setAvailability({}); }} />
              {resource.images?.[0] && <img src={resourceImageUrl(resource.images[0])} alt={resource.name} className="h-12 w-12 shrink-0 rounded-md object-cover" />}
              <span className="flex-1 text-sm"><strong>{resource.name}</strong><span className="ml-2 text-muted-foreground">{resource.category}{resource.location ? ` · ${resource.location}` : ''}</span><span className="block text-xs text-muted-foreground">{resource.approvalRequired ? 'Approval required' : 'Instant booking'}{resource.scope === 'all_ministry' ? ' · Shared across branches' : ''}</span></span>
              {availability[resource.id] && <span className={`text-xs ${availability[resource.id].available ? 'text-green-700' : 'text-destructive'}`}>{availability[resource.id].available ? 'Available' : `Unavailable${availability[resource.id].conflict ? ` · ${availability[resource.id].conflict.activityTitle}` : ''}`}</span>}
            </label>)}
          </div> : <p className="rounded-md border p-4 text-sm text-muted-foreground">No active resources are available for this branch yet.</p>}
        </div>
        {!!existing?.data?.length && <div><Label>Existing bookings</Label><div className="mt-2 space-y-1 text-sm">{existing.data.map(item => <div key={item.id} className="rounded-md border px-3 py-2">{item.resource.name} · <span className="capitalize">{item.status}</span></div>)}</div></div>}
        <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button><Button variant="outline" disabled={!selected.length || !startsAt || !endsAt || !!activityError || check.isPending} onClick={() => check.mutate()}>Check availability</Button><Button disabled={!selected.length || !startsAt || !endsAt || !title.trim() || !!activityError || (activity?.type !== 'manual' && !activityWindow) || request.isPending} onClick={() => request.mutate()}>{request.isPending ? 'Submitting…' : 'Request booking'}</Button></div>
      </div>
    </DialogContent>
  </Dialog>;
}
