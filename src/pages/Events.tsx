import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { eventsService, type ChurchEvent } from '@/services/events';
import { paymentService } from '@/services/payments';
import { useRole } from '@/hooks/useRole';
import { useHasFeature, useCheckLimit } from '@/hooks/usePackageFeatures';
import apiClient from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Plus, Calendar, MapPin, Clock, Pencil, Trash2, Ticket, Upload, X, Eye, Maximize2, Wallet, Lock } from 'lucide-react';
import { ExportImportButtons } from '@/components/ExportImportButtons';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { Link } from 'react-router-dom';

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional().default(''),
  date: z.string().min(1, 'Date required'),
  endDate: z.string().min(1, 'End date required'),
  time: z.string().min(1, 'Time required'),
  location: z.string().min(1, 'Location required'),
  type: z.enum(['service', 'meeting', 'conference', 'outreach', 'fellowship']),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).default('upcoming'),
  churchId: z.string().min(1, 'Church selection required'),
  requiresTicket: z.boolean().default(false),
  isFree: z.boolean().default(true),
  ticketPrice: z.number().optional(),
  currency: z.enum(['MWK', 'KSH']).optional(),
  totalTickets: z.number().positive().optional().nullable(),
  ticketSalesCutoff: z.string().optional(),
  imageUrl: z.string().optional(),
}).refine(data => new Date(data.endDate) >= new Date(data.date), {
  message: 'End date must be on or after start date',
  path: ['endDate'],
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
    defaultValues: { type: 'service', status: 'upcoming', description: '', requiresTicket: false, isFree: true, ...defaultValues },
  });
  
  const churchId = watch('churchId');
  const requiresTicket = watch('requiresTicket');
  const isFree = watch('isFree');
  const imageUrl = watch('imageUrl');
  const imageFileRef = useRef<File | null>(null);

  const getImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('data:') || path.startsWith('http')) return path;
    const baseURL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
    return baseURL + path;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setValue('imageUrl', reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Compress image in background
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true
      });
      imageFileRef.current = compressed;
    } catch {
      imageFileRef.current = file;
    }
  };

  const handleFormSubmit = async (values: FormValues) => {
    if (imageFileRef.current) {
      const formData = new FormData();
      formData.append('image', imageFileRef.current, imageFileRef.current.name);
      try {
        const { data } = await apiClient.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        values.imageUrl = data.url;
      } catch (err) {
        console.error('Image upload failed:', err);
        toast.error('Failed to upload image');
        values.imageUrl = '';
      }
    } else if (!values.imageUrl || values.imageUrl.startsWith('data:')) {
      values.imageUrl = '';
    }
    onSubmit(values);
  };
  
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <ChurchSelect 
        value={churchId} 
        onValueChange={value => setValue('churchId', value)}
      />
      {errors.churchId && <p className="text-xs text-destructive mt-1">{errors.churchId.message}</p>}
      
      <div>
        <Label>Name of the Event</Label>
        <Input {...register('title')} />
        {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Textarea {...register('description')} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start Date</Label>
          <Input type="date" {...register('date')} />
          {errors.date && <p className="text-xs text-destructive mt-1">{errors.date.message}</p>}
        </div>
        <div>
          <Label>End Date</Label>
          <Input type="date" {...register('endDate')} />
          {errors.endDate && <p className="text-xs text-destructive mt-1">{errors.endDate.message}</p>}
        </div>
      </div>
      <div>
        <Label>Time</Label>
        <Input type="time" {...register('time')} />
        {errors.time && <p className="text-xs text-destructive mt-1">{errors.time.message}</p>}
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
      
      <div>
        <Label>Event Image <span className="text-muted-foreground text-xs">(optional)</span></Label>
        {imageUrl ? (
          <div className="relative">
            <img src={getImageUrl(imageUrl)} alt="Event" className="w-full h-32 object-cover rounded-md" />
            <button
              type="button"
              onClick={() => { setValue('imageUrl', ''); imageFileRef.current = null; }}
              className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-accent/50 transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Click to upload</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <input type="checkbox" id="requiresTicket" {...register('requiresTicket')} className="h-4 w-4" />
        <Label htmlFor="requiresTicket" className="cursor-pointer">Requires Ticket</Label>
      </div>
      
      {requiresTicket && (
        <>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isFree" {...register('isFree')} className="h-4 w-4" />
            <Label htmlFor="isFree" className="cursor-pointer">Free Event</Label>
          </div>
          
          {!isFree && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ticket Price</Label>
                <Input type="number" step="0.01" {...register('ticketPrice', { valueAsNumber: true })} />
              </div>
              <div>
                <Label>Currency</Label>
                <Select defaultValue={defaultValues?.currency ?? 'MWK'} onValueChange={v => setValue('currency', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MWK">MWK</SelectItem>
                    <SelectItem value="KSH">KSH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <div>
            <Label>Total Tickets <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input type="number" {...register('totalTickets', { valueAsNumber: true, setValueAs: v => v === '' || isNaN(v) ? null : v })} placeholder="Leave empty for unlimited" />
          </div>
          
          <div>
            <Label>Ticket Sales Cutoff <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input type="datetime-local" {...register('ticketSalesCutoff')} />
            <p className="text-xs text-muted-foreground mt-1">Stop ticket sales at this date/time</p>
          </div>
        </>
      )}
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
  const [expandImage, setExpandImage] = useState<string | null>(null);
  const [viewEvent, setViewEvent] = useState<ChurchEvent | null>(null);
  const [paymentConfirm, setPaymentConfirm] = useState<{ event: ChurchEvent; details: any } | null>(null);
  const { hasPermission } = useRole();
  const hasEventsFeature = useHasFeature('events_management');
  const user = useAuthStore(state => state.user);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: events = [], isLoading } = useQuery({ 
    queryKey: ['events'], 
    queryFn: eventsService.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const eventLimit = useCheckLimit('max_events_per_month', events.length);

  const createMutation = useMutation({
    mutationFn: (dto: FormValues) => {
      if (!eventLimit.allowed) {
        throw new Error(eventLimit.message);
      }
      return eventsService.create(dto);
    },
    onSuccess: () => { toast.success('Event created'); qc.invalidateQueries({ queryKey: ['events'] }); setCreateOpen(false); },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message || 'Failed to create event'),
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

  const canCreate = hasPermission('events:create') && hasEventsFeature;
  const canUpdate = hasPermission('events:update') && hasEventsFeature;
  const canDelete = hasPermission('events:delete') && hasEventsFeature;
  const canViewTickets = hasPermission('tickets:read');
  const canViewAllTickets = hasPermission('tickets:create'); // Admin can view all tickets
  const canPay = hasPermission('payments:pay');
  const isMember = user?.roleName === 'member';

  if (!hasEventsFeature) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Events</h1>
          <p className="text-sm text-muted-foreground">Manage church events and ticketing</p>
        </div>
        <Alert className="border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Events Management is not available in your current package.{' '}
            <Link to="/dashboard/packages" className="font-medium underline">Upgrade now</Link>
            {' '}to unlock event management features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const canBookTicket = (event: ChurchEvent) => {
    if (event.status === 'completed' || event.status === 'cancelled') return false;
    if (event.ticketSalesCutoff && new Date(event.ticketSalesCutoff) < new Date()) return false;
    if (event.totalTickets && event.ticketsSold >= event.totalTickets) return false;
    // Check if event has ended using endDate
    if (new Date(event.endDate) < new Date()) return false;
    return true;
  };

  const handleFreeTicket = async (event: ChurchEvent) => {
    const toastId = toast.loading('Generating ticket...');
    try {
      const ticket = await eventsService.bookTicket({ eventId: event.id });
      toast.loading('Downloading ticket...', { id: toastId });
      await eventsService.downloadTicket(ticket.id, ticket.ticketNumber);
      toast.success('Ticket generated and downloaded', { id: toastId });
      qc.invalidateQueries({ queryKey: ['events'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate ticket', { id: toastId });
    }
  };

  const handleDownloadTicket = async (event: ChurchEvent) => {
    if (!event.userTicketId || !event.userTicketNumber) return;
    const toastId = toast.loading('Downloading ticket...');
    try {
      await eventsService.downloadTicket(event.userTicketId, event.userTicketNumber);
      toast.success('Ticket downloaded', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to download ticket', { id: toastId });
    }
  };

  const handlePayment = async (event: ChurchEvent) => {
    if (!user?.email) return toast.error('User email not found');
    try {
      const response = await paymentService.initializePayment({
        eventId: event.id,
        amount: event.ticketPrice || 0,
        email: user.email,
      });
      setPaymentConfirm({ event, details: response });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment initialization failed');
    }
  };

  const proceedToPayment = () => {
    if (paymentConfirm?.details?.authorization_url) {
      window.location.href = paymentConfirm.details.authorization_url;
    }
  };

  const getImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('data:') || path.startsWith('http')) return path;
    const baseURL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
    return baseURL + path;
  };

  const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' | 'outline' =>
    s === 'upcoming' ? 'default' : s === 'completed' ? 'secondary' : s === 'cancelled' ? 'destructive' : 'outline';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Events</h1>
          <p className="text-sm text-muted-foreground">{events.length} total events</p>
        </div>
        <div className="flex gap-2">
          <ExportImportButtons
            data={events.map(e => ({
              title: e.title,
              date: new Date(e.date).toLocaleDateString(),
              time: e.time,
              location: e.location,
              type: e.type,
              status: e.status,
              requiresTicket: e.requiresTicket ? 'Yes' : 'No',
              ticketPrice: e.ticketPrice || 0,
              ticketsSold: e.ticketsSold || 0,
            }))}
            filename="events"
            headers={[
              { label: 'Title', key: 'title' },
              { label: 'Date', key: 'date' },
              { label: 'Time', key: 'time' },
              { label: 'Location', key: 'location' },
              { label: 'Type', key: 'type' },
              { label: 'Status', key: 'status' },
              { label: 'Requires Ticket', key: 'requiresTicket' },
              { label: 'Ticket Price', key: 'ticketPrice' },
              { label: 'Tickets Sold', key: 'ticketsSold' },
            ]}
            pdfTitle="Events Report"
          />
          {canCreate && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                  <Plus className="h-4 w-4" /> Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="font-heading">Create Event</DialogTitle></DialogHeader>
                <EventForm onSubmit={v => createMutation.mutate(v)} isPending={createMutation.isPending} submitLabel="Create Event" />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map(event => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              {event.imageUrl && (
                <img 
                  src={getImageUrl(event.imageUrl)} 
                  alt={event.title}
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => setExpandImage(getImageUrl(event.imageUrl))}
                  loading="lazy"
                />
              )}
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant={statusVariant(event.status)}>{event.status}</Badge>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs capitalize">{event.type}</Badge>
                    <button onClick={() => setViewEvent(event)} className="p-1 text-muted-foreground hover:text-foreground transition-colors ml-1">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    {canUpdate && (
                      <button onClick={() => setEditEvent(event)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
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
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {new Date(event.date).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2"><Clock className="h-3 w-3" />{event.time}</div>
                  <div className="flex items-center gap-2"><MapPin className="h-3 w-3" />{event.location}</div>
                  {event.requiresTicket && (
                    <div className="flex items-center gap-2">
                      <Ticket className="h-3 w-3" />
                      {event.isFree ? 'Free' : `${event.currency} ${event.ticketPrice}`}
                      {event.totalTickets && ` • ${event.ticketsSold}/${event.totalTickets} sold`}
                    </div>
                  )}
                </div>
                {event.requiresTicket && canViewAllTickets && (
                  <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => navigate(`/dashboard/events/${event.id}/tickets`)}>
                    <Ticket className="h-3 w-3 mr-1" /> View All Tickets
                  </Button>
                )}
                {event.requiresTicket && event.isFree && isMember && event.userHasTicket && (
                  <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => handleDownloadTicket(event)}>
                    <Ticket className="h-3 w-3 mr-1" /> Download Ticket
                  </Button>
                )}
                {event.requiresTicket && event.isFree && isMember && !event.userHasTicket && canBookTicket(event) && (
                  <Button size="sm" className="w-full mt-2 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => handleFreeTicket(event)}>
                    <Ticket className="h-3 w-3 mr-1" /> Generate Ticket
                  </Button>
                )}
                {event.requiresTicket && !event.isFree && canViewTickets && event.userHasTicket && canBookTicket(event) && (
                  <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => navigate(`/dashboard/my-tickets?eventId=${event.id}`)}>
                    <Eye className="h-3 w-3 mr-1" /> View My Ticket
                  </Button>
                )}
                {event.requiresTicket && !event.isFree && isMember && !event.userHasTicket && canBookTicket(event) && (
                  <Button size="sm" className="w-full mt-2 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => handlePayment(event)}>
                    <Wallet className="h-3 w-3 mr-1" /> Pay {event.currency} {event.ticketPrice}
                  </Button>
                )}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Edit Event</DialogTitle></DialogHeader>
          {editEvent && (
            <EventForm
              defaultValues={{ 
                title: editEvent.title, 
                description: editEvent.description, 
                date: new Date(editEvent.date).toISOString().split('T')[0], 
                endDate: new Date(editEvent.endDate).toISOString().split('T')[0],
                time: editEvent.time, 
                location: editEvent.location, 
                type: editEvent.type, 
                status: editEvent.status,
                churchId: editEvent.churchId,
                requiresTicket: editEvent.requiresTicket,
                isFree: editEvent.isFree,
                ticketPrice: editEvent.ticketPrice,
                currency: editEvent.currency,
                totalTickets: editEvent.totalTickets,
                ticketSalesCutoff: editEvent.ticketSalesCutoff ? new Date(editEvent.ticketSalesCutoff).toISOString().slice(0, 16) : undefined,
                imageUrl: editEvent.imageUrl,
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

      <Dialog open={!!viewEvent} onOpenChange={() => setViewEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">{viewEvent?.title}</DialogTitle></DialogHeader>
          {viewEvent && (
            <div className="space-y-4">
              {viewEvent.imageUrl && <img src={getImageUrl(viewEvent.imageUrl)} alt={viewEvent.title} className="w-full rounded-md" />}
              <div className="flex gap-2">
                <Badge variant={statusVariant(viewEvent.status)}>{viewEvent.status}</Badge>
                <Badge variant="outline" className="capitalize">{viewEvent.type}</Badge>
              </div>
              {viewEvent.description && <p className="text-sm text-muted-foreground">{viewEvent.description}</p>}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span className="font-medium">Date:</span> {new Date(viewEvent.date).toLocaleDateString()} - {new Date(viewEvent.endDate).toLocaleDateString()}</div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4" /><span className="font-medium">Time:</span> {viewEvent.time}</div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /><span className="font-medium">Location:</span> {viewEvent.location}</div>
                {viewEvent.requiresTicket && (
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4" />
                    <span className="font-medium">Ticket:</span>
                    {viewEvent.isFree ? 'Free' : `${viewEvent.currency} ${viewEvent.ticketPrice}`}
                    {viewEvent.totalTickets && ` • ${viewEvent.ticketsSold}/${viewEvent.totalTickets} sold`}
                  </div>
                )}
                {viewEvent.ticketSalesCutoff && (
                  <div className="text-xs text-muted-foreground">Sales end: {new Date(viewEvent.ticketSalesCutoff).toLocaleString()}</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!expandImage} onOpenChange={() => setExpandImage(null)}>
        <DialogContent className="max-w-4xl">
          <img src={expandImage || ''} alt="Event" className="w-full" />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!paymentConfirm} onOpenChange={() => setPaymentConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>You are about to purchase a ticket for <strong>{paymentConfirm?.event.title}</strong></p>
                {paymentConfirm?.details && (
                  <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Ticket Price:</span>
                      <span className="font-medium">{paymentConfirm.details.currency} {paymentConfirm.details.baseAmount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Convenience Fee:</span>
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
            <AlertDialogAction onClick={proceedToPayment} className="bg-accent text-accent-foreground hover:bg-accent/90">
              Proceed to Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
