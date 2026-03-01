import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { eventsService, type ChurchEvent } from '@/services/events';
import { useRole } from '@/hooks/useRole';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChurchSelect } from '@/components/ChurchSelect';
import { Plus, Calendar, MapPin, Clock, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional().default(''),
  date: z.string().min(1, 'Date required'),
  time: z.string().min(1, 'Time required'),
  location: z.string().min(1, 'Location required'),
  type: z.enum(['service', 'meeting', 'conference', 'outreach', 'fellowship']),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).default('upcoming'),
  churchId: z.string().min(1, 'Church selection required'),
});
type FormValues = z.infer<typeof schema>;

function EventForm({ defaultValues, onSubmit, isPending, submitLabel }: {
  defaultValues?: Partial<FormValues>;
  onSubmit: (v: FormValues) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'service', status: 'upcoming', description: '', ...defaultValues },
  });
  
  const churchId = watch('churchId');
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <ChurchSelect 
        value={churchId} 
        onValueChange={value => setValue('churchId', value)}
      />
      {errors.churchId && <p className="text-xs text-destructive mt-1">{errors.churchId.message}</p>}
      
      <div>
        <Label>Title</Label>
        <Input {...register('title')} />
        {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Textarea {...register('description')} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date</Label>
          <Input type="date" {...register('date')} />
          {errors.date && <p className="text-xs text-destructive mt-1">{errors.date.message}</p>}
        </div>
        <div>
          <Label>Time</Label>
          <Input type="time" {...register('time')} />
          {errors.time && <p className="text-xs text-destructive mt-1">{errors.time.message}</p>}
        </div>
      </div>
      <div>
        <Label>Location</Label>
        <Input {...register('location')} />
        {errors.location && <p className="text-xs text-destructive mt-1">{errors.location.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Type</Label>
          <Select defaultValue={defaultValues?.type ?? 'service'} onValueChange={v => setValue('type', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="conference">Conference</SelectItem>
              <SelectItem value="outreach">Outreach</SelectItem>
              <SelectItem value="fellowship">Fellowship</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select defaultValue={defaultValues?.status ?? 'upcoming'} onValueChange={v => setValue('status', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
        {isPending ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}

export default function EventsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<ChurchEvent | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<ChurchEvent | null>(null);
  const { hasPermission } = useRole();
  const qc = useQueryClient();

  const { data: events = [], isLoading } = useQuery({ queryKey: ['events'], queryFn: eventsService.getAll });

  const createMutation = useMutation({
    mutationFn: eventsService.create,
    onSuccess: () => { toast.success('Event created'); qc.invalidateQueries({ queryKey: ['events'] }); setCreateOpen(false); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create event'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => eventsService.update(id, dto),
    onSuccess: () => { toast.success('Event updated'); qc.invalidateQueries({ queryKey: ['events'] }); setEditEvent(null); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });
  const deleteMutation = useMutation({
    mutationFn: eventsService.delete,
    onSuccess: () => { toast.success('Event deleted'); qc.invalidateQueries({ queryKey: ['events'] }); setDeleteEvent(null); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const canCreate = hasPermission('events:create');
  const canUpdate = hasPermission('events:update');
  const canDelete = hasPermission('events:delete');

  const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' | 'outline' =>
    s === 'upcoming' ? 'default' : s === 'completed' ? 'secondary' : s === 'cancelled' ? 'destructive' : 'outline';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Events</h1>
          <p className="text-sm text-muted-foreground">{events.length} total events</p>
        </div>
        {canCreate && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                <Plus className="h-4 w-4" /> Create Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">Create Event</DialogTitle></DialogHeader>
              <EventForm onSubmit={v => createMutation.mutate(v)} isPending={createMutation.isPending} submitLabel="Create Event" />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map(event => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant={statusVariant(event.status)}>{event.status}</Badge>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs capitalize">{event.type}</Badge>
                    {canUpdate && (
                      <button onClick={() => setEditEvent(event)} className="p-1 text-muted-foreground hover:text-foreground transition-colors ml-1">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => setDeleteEvent(event)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">{event.title}</h3>
                {event.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>}
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Calendar className="h-3 w-3" />{new Date(event.date).toLocaleDateString()}</div>
                  <div className="flex items-center gap-2"><Clock className="h-3 w-3" />{event.time}</div>
                  <div className="flex items-center gap-2"><MapPin className="h-3 w-3" />{event.location}</div>
                </div>
              </CardContent>
            </Card>
          ))}
          {events.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>{canCreate ? 'No events yet. Create your first event!' : 'No events scheduled.'}</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!editEvent} onOpenChange={open => !open && setEditEvent(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Edit Event</DialogTitle></DialogHeader>
          {editEvent && (
            <EventForm
              defaultValues={{ 
                title: editEvent.title, 
                description: editEvent.description, 
                date: new Date(editEvent.date).toISOString().split('T')[0], 
                time: editEvent.time, 
                location: editEvent.location, 
                type: editEvent.type, 
                status: editEvent.status,
                churchId: editEvent.churchId 
              }}
              onSubmit={v => updateMutation.mutate({ id: editEvent.id, dto: v })}
              isPending={updateMutation.isPending}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteEvent} onOpenChange={open => !open && setDeleteEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>Delete <strong>{deleteEvent?.title}</strong>? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteEvent && deleteMutation.mutate(deleteEvent.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
