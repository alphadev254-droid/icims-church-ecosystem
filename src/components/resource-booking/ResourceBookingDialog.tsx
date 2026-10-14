import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [bookingType, setBookingType] = useState<'manual' | 'service' | 'event'>('manual');
  const [bookingActivityId, setBookingActivityId] = useState('');
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [purpose, setPurpose] = useState('');
  const [availability, setAvailability] = useState<Record<string, { available: boolean; conflict?: { activityTitle: string } }>>({});
  useEffect(() => {
    setSelected([]); setPurpose(''); setAvailability({});
    setBookingType(activity?.type || 'manual'); setBookingActivityId(activity?.id || '');
    setTitle(activity?.title || '');
    setStartsAt(activity?.startsAt ? toDateTimeLocalInputValue(activity.startsAt) : '');
    setEndsAt(activity?.endsAt ? toDateTimeLocalInputValue(activity.endsAt) : '');
  }, [activity]);
  const effectiveType = activity?.type === 'manual' ? bookingType : activity?.type || 'manual';
  const effectiveActivityId = activity?.type === 'manual' ? bookingActivityId : activity?.id || '';
  const { data: activityOptions } = useQuery({
    queryKey: ['resource-bookable-activities', activity?.churchId],
    queryFn: () => resourceBookingService.activities(activity?.churchId),
    enabled: open && activity?.type === 'manual',
  });
  const currentOptions = effectiveType === 'service' ? activityOptions?.services || [] : effectiveType === 'event' ? activityOptions?.events || [] : [];
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['bookable-resources', activity?.churchId],
    queryFn: () => resourceBookingService.resources(activity!.churchId),
    enabled: open && !!activity?.churchId,
  });
  const { data: activityWindow, error: activityError } = useQuery({
    queryKey: ['booking-activity-window', effectiveType, effectiveActivityId, activity?.churchId],
    queryFn: () => resourceBookingService.activityWindow({ churchId: activity!.churchId, activityType: effectiveType as 'service' | 'event', activityId: effectiveActivityId }),
    enabled: open && !!effectiveActivityId && effectiveType !== 'manual',
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
    queryKey: ['resource-bookings', effectiveType, effectiveActivityId],
    queryFn: () => resourceBookingService.bookings({ activityType: effectiveType, activityId: effectiveActivityId, limit: 100 }),
    enabled: open && !!effectiveActivityId,
  });
  const check = useMutation({
    mutationFn: () => resourceBookingService.availability({ churchId: activity!.churchId, resourceIds: selected, startsAt: dateTimeLocalToIso(startsAt), endsAt: dateTimeLocalToIso(endsAt) }),
    onSuccess: rows => setAvailability(Object.fromEntries(rows.map(row => [row.resourceId, row]))),
    onError: (error: any) => toast.error(error.response?.data?.message || 'Availability check failed'),
  });
  const request = useMutation({
    mutationFn: () => resourceBookingService.request({
      churchId: activity!.churchId, resourceIds: selected, activityType: effectiveType,
      ...(effectiveType === 'manual' ? { activityTitle: title } : { activityId: effectiveActivityId }),
      startsAt: dateTimeLocalToIso(startsAt), endsAt: dateTimeLocalToIso(endsAt),
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
    <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-3xl overflow-y-auto sm:max-w-3xl lg:max-w-4xl">
      <DialogHeader><DialogTitle>Book resources{activity?.title ? ` · ${activity.title}` : ''}</DialogTitle><DialogDescription>Choose the rooms or equipment needed for this activity. You can check availability before submitting.</DialogDescription></DialogHeader>
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {activity?.type === 'manual' && <div className="sm:col-span-2"><Label>Booking is for</Label><Select value={bookingType} onValueChange={value => { setBookingType(value as typeof bookingType); setBookingActivityId(''); setTitle(''); setStartsAt(''); setEndsAt(''); setAvailability({}); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manual">Other activity</SelectItem><SelectItem value="service">Service</SelectItem><SelectItem value="event">Event</SelectItem></SelectContent></Select></div>}
          {activity?.type === 'manual' && effectiveType !== 'manual' && <div className="sm:col-span-2"><Label>Select a future {effectiveType}</Label><Select value={bookingActivityId} onValueChange={value => { const option = currentOptions.find(item => item.id === value); setBookingActivityId(value); setTitle(option?.title || ''); setStartsAt(option?.startsAt ? toDateTimeLocalInputValue(option.startsAt) : ''); setEndsAt(option?.endsAt ? toDateTimeLocalInputValue(option.endsAt) : ''); setAvailability({}); }}><SelectTrigger><SelectValue placeholder={`Choose a ${effectiveType}`} /></SelectTrigger><SelectContent>{currentOptions.map(option => <SelectItem key={option.id} value={option.id}>{option.title} · {option.churchName} · {new Date(option.startsAt).toLocaleString()}</SelectItem>)}</SelectContent></Select></div>}
          {effectiveType === 'manual' && <div className="sm:col-span-2"><Label htmlFor="booking-title">What activity is this for?</Label><Input id="booking-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Youth rehearsal" /></div>}
          <div><Label htmlFor="booking-start">Booking starts</Label><Input id="booking-start" type="datetime-local" value={startsAt} onChange={event => { setStartsAt(event.target.value); setAvailability({}); }} /></div>
          <div><Label htmlFor="booking-end">Booking ends</Label><Input id="booking-end" type="datetime-local" value={endsAt} onChange={event => { setEndsAt(event.target.value); setAvailability({}); }} /></div>
        </div>
        {effectiveType !== 'manual' && !effectiveActivityId && <p className="text-sm text-muted-foreground">Choose the {effectiveType} to load its scheduled time. You can adjust the booking times below.</p>}
        {activityError && <p className="text-sm text-amber-700">We couldn’t load the scheduled times. Enter the intended booking start and end below; the activity will still be verified when you submit.</p>}
        <div><Label htmlFor="booking-purpose">How will these resources be used? (optional)</Label><Textarea id="booking-purpose" value={purpose} onChange={event => setPurpose(event.target.value)} placeholder="Add any setup needs or notes for the approver" /></div>
        <div>
          <div className="mb-2 flex items-center justify-between"><Label>Select rooms or equipment</Label><span className="text-xs text-muted-foreground">{selected.length} selected</span></div>
          {isLoading ? <p className="text-sm text-muted-foreground">Loading resources…</p> : active.length ? <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border p-3">
            {active.map(resource => <label key={resource.id} className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted">
              <input type="checkbox" className="mt-1" checked={selected.includes(resource.id)} onChange={event => { setSelected(current => event.target.checked ? [...current, resource.id] : current.filter(id => id !== resource.id)); setAvailability({}); }} />
              {resource.images?.[0] && <img src={resourceImageUrl(resource.images[0])} alt={resource.name} className="h-12 w-12 shrink-0 rounded-md object-cover" />}
              <span className="flex-1 text-sm"><strong>{resource.name}</strong><span className="ml-2 text-muted-foreground">{resource.category}{resource.location ? ` · ${resource.location}` : ''}</span><span className="block text-xs text-muted-foreground">{resource.approvalRequired ? 'Approval required' : 'Instant booking'}{resource.scope === 'all_ministry' ? ' · Shared across all branches' : resource.scope === 'selected_churches' ? ' · Shared with selected branches' : ''}</span></span>
              {availability[resource.id] && <span className={`text-xs ${availability[resource.id].available ? 'text-green-700' : 'text-destructive'}`}>{availability[resource.id].available ? 'Available' : `Unavailable${availability[resource.id].conflict ? ` · ${availability[resource.id].conflict.activityTitle}` : ''}`}</span>}
            </label>)}
          </div> : <p className="rounded-md border p-4 text-sm text-muted-foreground">No active resources are available for this branch yet.</p>}
        </div>
        {!!existing?.data?.length && <div><Label>Existing bookings</Label><div className="mt-2 space-y-1 text-sm">{existing.data.map(item => <div key={item.id} className="rounded-md border px-3 py-2">{item.resource.name} · <span className="capitalize">{item.status}</span></div>)}</div></div>}
        <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button><Button variant="outline" disabled={!selected.length || !startsAt || !endsAt || check.isPending} onClick={() => check.mutate()}>Check availability</Button><Button disabled={!selected.length || !startsAt || !endsAt || (effectiveType === 'manual' && !title.trim()) || (effectiveType !== 'manual' && !effectiveActivityId) || request.isPending} onClick={() => request.mutate()}>{request.isPending ? 'Submitting…' : 'Request booking'}</Button></div>
      </div>
    </DialogContent>
  </Dialog>;
}
