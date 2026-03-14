import { useState, useRef, useEffect } from 'react';
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChurchSelect } from '@/components/ChurchSelect';
import {
  Plus, Calendar, MapPin, Clock, Pencil, Trash2, Ticket,
  Upload, X, Eye, Wallet, Lock, Copy, Check,
} from 'lucide-react';
import { ExportImportButtons } from '@/components/ExportImportButtons';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { Link } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
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
  contactEmail: z.string().email('Valid email required').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  requiresTicket: z.boolean().default(false),
  isFree: z.boolean().default(true),
  ticketPrice: z.number().nullable().optional(),
  currency: z.enum(['MWK', 'KSH']).optional(),
  totalTickets: z.preprocess(
    (val) =>
      val === '' || val === null || val === undefined || (typeof val === 'number' && isNaN(val as number))
        ? undefined
        : val,
    z.number().positive().optional(),
  ),
  ticketSalesCutoff: z.string().optional(),
  allowPublicTicketing: z.boolean().default(false),
  imageUrl: z.string().nullable().optional(),
}).refine((data) => new Date(data.endDate) >= new Date(data.date), {
  message: 'End date must be on or after start date',
  path: ['endDate'],
});

type FormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const getImageUrl = (path?: string): string => {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('http')) return path;
  const base = (import.meta.env.VITE_STATIC_URL || 'http://localhost:5000').replace(/['"]|\/$|^\/api$/g, '');
  return `${base}${path}`;
};

const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (s === 'upcoming') return 'default';
  if (s === 'completed') return 'secondary';
  if (s === 'cancelled') return 'destructive';
  return 'outline';
};

// ---------------------------------------------------------------------------
// EventForm
// ---------------------------------------------------------------------------
interface EventFormProps {
  defaultValues?: Partial<FormValues>;
  onSubmit: (v: FormValues) => void;
  isPending: boolean;
  submitLabel: string;
}

function EventForm({ defaultValues, onSubmit, isPending, submitLabel }: EventFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const imageFileRef = useRef<File | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'service',
      status: 'upcoming',
      description: '',
      requiresTicket: false,
      isFree: true,
      allowPublicTicketing: false,
      currency: 'MWK',
      ...defaultValues,
    },
  });

  // Ensure controlled fields are synced when defaultValues arrive (critical for edit mode)
  useEffect(() => {
    if (defaultValues?.churchId) setValue('churchId', defaultValues.churchId);
    if (defaultValues?.type) setValue('type', defaultValues.type);
    if (defaultValues?.status) setValue('status', defaultValues.status);
    if (defaultValues?.currency) setValue('currency', defaultValues.currency);
    if (defaultValues?.requiresTicket !== undefined) setValue('requiresTicket', defaultValues.requiresTicket);
    if (defaultValues?.isFree !== undefined) setValue('isFree', defaultValues.isFree);
    if (defaultValues?.allowPublicTicketing !== undefined) setValue('allowPublicTicketing', defaultValues.allowPublicTicketing);
    if (defaultValues?.imageUrl) setValue('imageUrl', defaultValues.imageUrl);
  }, []); // run once on mount — defaultValues won't change between mounts

  const churchId = watch('churchId');
  const requiresTicket = watch('requiresTicket');
  const isFree = watch('isFree');
  const imageUrl = watch('imageUrl');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Immediate preview
    const reader = new FileReader();
    reader.onloadend = () => setValue('imageUrl', reader.result as string);
    reader.readAsDataURL(file);

    // Compress in background
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      });
      imageFileRef.current = compressed;
    } catch {
      imageFileRef.current = file;
    }
  };

  const handleFormSubmit = async (values: FormValues) => {
    console.log('[EventForm] Submit data:', values);
    // Upload new image if one was selected
    if (imageFileRef.current) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', imageFileRef.current, imageFileRef.current.name);
      try {
        const { data } = await apiClient.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        values.imageUrl = data.url;
      } catch (err) {
        toast.error('Failed to upload image');
        return;
      } finally {
        setIsUploading(false);
      }
    } else if (values.imageUrl?.startsWith('data:')) {
      values.imageUrl = '';
    }
    onSubmit(values);
  };

  const busy = isPending || isUploading;

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit, (errs) => {
        console.log('[EventForm] Validation errors:', errs);
        const firstError = Object.values(errs)[0];
        toast.error(firstError?.message || 'Please fix validation errors');
      })}
      className="space-y-4"
    >
      {/* Church */}
      <div>
        <ChurchSelect value={churchId} onValueChange={(v) => setValue('churchId', v, { shouldValidate: true })} />
        {errors.churchId && <p className="text-xs text-destructive mt-1">{errors.churchId.message}</p>}
      </div>

      {/* Title */}
      <div>
        <Label>Name of the Event</Label>
        <Input {...register('title')} />
        {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div>
        <Label>
          Description <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Textarea {...register('description')} rows={2} />
      </div>

      {/* Dates */}
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

      {/* Time */}
      <div>
        <Label>Time</Label>
        <Input type="time" {...register('time')} />
        {errors.time && <p className="text-xs text-destructive mt-1">{errors.time.message}</p>}
      </div>

      {/* Location */}
      <div>
        <Label>Location</Label>
        <Input {...register('location')} />
        {errors.location && <p className="text-xs text-destructive mt-1">{errors.location.message}</p>}
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Enquiries Email <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input type="email" {...register('contactEmail')} placeholder="info@church.com" />
          {errors.contactEmail && <p className="text-xs text-destructive mt-1">{errors.contactEmail.message}</p>}
        </div>
        <div>
          <Label>Enquiries Phone <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input {...register('contactPhone')} placeholder="+265..." />
        </div>
      </div>

      {/* Type / Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Type</Label>
          <Select
            value={watch('type') || 'service'}
            onValueChange={(v) => setValue('type', v as FormValues['type'], { shouldValidate: true })}
          >
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
          <Select
            value={watch('status') || 'upcoming'}
            onValueChange={(v) => setValue('status', v as FormValues['status'], { shouldValidate: true })}
          >
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

      {/* Image */}
      <div>
        <Label>
          Event Image <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        {imageUrl ? (
          <div className="relative">
            <img
              src={getImageUrl(imageUrl)}
              alt="Event preview"
              className="w-full h-32 object-cover rounded-md"
            />
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

      {/* Requires Ticket */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="requiresTicket"
          {...register('requiresTicket')}
          className="h-4 w-4"
        />
        <Label htmlFor="requiresTicket" className="cursor-pointer">Requires Ticket</Label>
      </div>

      {requiresTicket && (
        <>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFree"
              {...register('isFree')}
              className="h-4 w-4"
            />
            <Label htmlFor="isFree" className="cursor-pointer">Free Event</Label>
          </div>

          {!isFree && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ticket Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('ticketPrice', { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label>Currency</Label>
                <Select
                  value={watch('currency') ?? 'MWK'}
                  onValueChange={(v) => setValue('currency', v as FormValues['currency'], { shouldValidate: true })}
                >
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
            <Label>
              Total Tickets <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              type="number"
              placeholder="Leave empty for unlimited"
              {...register('totalTickets', { valueAsNumber: true })}
            />
          </div>

          <div>
            <Label>
              Ticket Sales Cutoff <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input type="datetime-local" {...register('ticketSalesCutoff')} />
            <p className="text-xs text-muted-foreground mt-1">Stop ticket sales at this date/time</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allowPublicTicketing"
              {...register('allowPublicTicketing')}
              className="h-4 w-4"
            />
            <Label htmlFor="allowPublicTicketing" className="cursor-pointer">
              Allow public ticket purchasing
              <span className="block text-xs text-muted-foreground font-normal">Guests can buy tickets without an account via the public event page</span>
            </Label>
          </div>
        </>
      )}

      <Button
        type="submit"
        disabled={busy}
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
      >
        {busy ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// EventsPage
// ---------------------------------------------------------------------------
export default function EventsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<ChurchEvent | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<ChurchEvent | null>(null);
  const [expandImage, setExpandImage] = useState<string | null>(null);
  const [viewEvent, setViewEvent] = useState<ChurchEvent | null>(null);
  const [paymentConfirm, setPaymentConfirm] = useState<{ event: ChurchEvent; details: any } | null>(null);
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);
  const [churchFilter, setChurchFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ church: 'all', startDate: '', endDate: '' });

  const { hasPermission } = useRole();
  const hasEventsFeature = useHasFeature('events_management');
  const user = useAuthStore((state) => state.user);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const isMember = user?.roleName === 'member';

  const { data: eventsResponse, isLoading } = useQuery({
    queryKey: ['events', appliedFilters.church, appliedFilters.startDate, appliedFilters.endDate],
    queryFn: () => {
      const churchId = appliedFilters.church !== 'all' ? appliedFilters.church : undefined;
      const params: any = {};
      if (appliedFilters.startDate) params.startDate = appliedFilters.startDate;
      if (appliedFilters.endDate) params.endDate = appliedFilters.endDate;
      return eventsService.getAll(churchId, params);
    },
    staleTime: 5 * 60 * 1000,
  });

  const events = Array.isArray(eventsResponse) 
    ? eventsResponse.flatMap((group: any) => group.posts || [])
    : [];
  
  const groupedEvents = Array.isArray(eventsResponse) && eventsResponse[0]?.label 
    ? eventsResponse
    : [];

  const { data: churches = [] } = useQuery({
    queryKey: ['churches'],
    queryFn: async () => {
      const { data } = await apiClient.get('/churches');
      return data.data || [];
    },
    enabled: !isMember,
  });

  const eventLimit = useCheckLimit('max_events_per_month', events.length);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (dto: FormValues) => {
      if (!eventLimit.allowed) throw new Error(eventLimit.message);
      return eventsService.create(dto);
    },
    onSuccess: () => {
      toast.success('Event created');
      qc.invalidateQueries({ queryKey: ['events'] });
      setCreateOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message || 'Failed to create event'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<FormValues> }) =>
      eventsService.update(id, dto),
    onSuccess: () => {
      toast.success('Event updated');
      qc.invalidateQueries({ queryKey: ['events'] });
      setEditEvent(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: eventsService.delete,
    onSuccess: () => {
      toast.success('Event deleted');
      qc.invalidateQueries({ queryKey: ['events'] });
      setDeleteEvent(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  // Permissions
  const canCreate = hasPermission('events:create') && hasEventsFeature;
  const canUpdate = hasPermission('events:update') && hasEventsFeature;
  const canDelete = hasPermission('events:delete') && hasEventsFeature;
  const canViewTickets = hasPermission('tickets:read');
  const canViewAllTickets = hasPermission('tickets:create');

  // Feature gate
  if (!isMember && !hasEventsFeature) {
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

  // Ticket booking eligibility
  const canBookTicket = (event: ChurchEvent): boolean => {
    if (event.status === 'completed' || event.status === 'cancelled') return false;
    if (event.ticketSalesCutoff && new Date(event.ticketSalesCutoff) < new Date()) return false;
    if (event.totalTickets && event.ticketsSold >= event.totalTickets) return false;
    if (new Date(event.endDate) < new Date()) return false;
    return true;
  };

  // Ticket actions
  const handleFreeTicket = async (event: ChurchEvent) => {
    const id = toast.loading('Generating ticket…');
    try {
      const ticket = await eventsService.bookTicket({ eventId: event.id });
      toast.loading('Downloading ticket…', { id });
      await eventsService.downloadTicket(ticket.id, ticket.ticketNumber);
      toast.success('Ticket generated and downloaded', { id });
      qc.invalidateQueries({ queryKey: ['events'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate ticket', { id });
    }
  };

  const handleDownloadTicket = async (event: ChurchEvent) => {
    if (!event.userTicketId || !event.userTicketNumber) return;
    const id = toast.loading('Downloading ticket…');
    try {
      await eventsService.downloadTicket(event.userTicketId, event.userTicketNumber);
      toast.success('Ticket downloaded', { id });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to download ticket', { id });
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

  // Share helpers
  const copyEventLink = (eventId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/events/${eventId}`);
    setCopiedEventId(eventId);
    toast.success('Event link copied!');
    setTimeout(() => setCopiedEventId(null), 2000);
  };

  const shareWhatsApp = (event: ChurchEvent) => {
    const url = `${window.location.origin}/events/${event.id}`;
    const text = encodeURIComponent(`Join our church event: ${event.title}\n${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareFacebook = (eventId: string) => {
    const url = encodeURIComponent(`${window.location.origin}/events/${eventId}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  // Edit default values helper — ensures consistent date formatting
  const buildEditDefaults = (e: ChurchEvent): Partial<FormValues> => ({
    title: e.title,
    description: e.description ?? '',
    date: new Date(e.date).toISOString().split('T')[0],
    endDate: new Date(e.endDate).toISOString().split('T')[0],
    time: e.time,
    location: e.location,
    contactEmail: (e as any).contactEmail ?? '',
    contactPhone: (e as any).contactPhone ?? '',
    type: e.type,
    status: e.status,
    churchId: e.churchId,
    requiresTicket: e.requiresTicket,
    isFree: e.isFree,
    allowPublicTicketing: (e as any).allowPublicTicketing ?? false,
    ticketPrice: e.ticketPrice,
    currency: e.currency,
    totalTickets: e.totalTickets,
    ticketSalesCutoff: e.ticketSalesCutoff
      ? new Date(e.ticketSalesCutoff).toISOString().slice(0, 16)
      : undefined,
    imageUrl: e.imageUrl ?? undefined,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Events</h1>
          <p className="text-sm text-muted-foreground">{events.length} total events</p>
        </div>
        <div className="flex gap-2">
          {!isMember && churches.length > 1 && (
            <div className="flex gap-2 items-end">
              <div>
                <Label className="text-xs">Church</Label>
                <Select value={churchFilter} onValueChange={setChurchFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by church" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Churches</SelectItem>
                    {churches.map((church: any) => (
                      <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Start Date</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40" />
              </div>
              <div>
                <Label className="text-xs">End Date</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40" />
              </div>
              <Button 
                size="sm"
                onClick={() => setAppliedFilters({ church: churchFilter, startDate, endDate })}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Apply
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => {
                  setChurchFilter('all');
                  setStartDate('');
                  setEndDate('');
                  setAppliedFilters({ church: 'all', startDate: '', endDate: '' });
                }}
              >
                Clear
              </Button>
            </div>
          )}
          <ExportImportButtons
            data={events.map((e) => ({
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
                <DialogHeader>
                  <DialogTitle className="font-heading">Create Event</DialogTitle>
                </DialogHeader>
                <EventForm
                  onSubmit={(v) => {
                    console.log('Event form values:', v);
                    createMutation.mutate(v);
                  }}
                  isPending={createMutation.isPending}
                  submitLabel="Create Event"
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Events grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : groupedEvents.length > 0 ? (
        groupedEvents.map((group: any) => (
          <div key={group.label} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">{group.label}</h3>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {group.posts.map((event: any) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              {event.imageUrl && (
                <img
                  src={getImageUrl(event.imageUrl)}
                  alt={event.title}
                  className="w-full h-32 object-cover cursor-pointer rounded-t-lg"
                  onClick={() => setExpandImage(getImageUrl(event.imageUrl))}
                  loading="lazy"
                />
              )}
              <CardContent className="p-3">
                {/* Badges + actions row */}
                <div className="flex flex-wrap items-start justify-between gap-1 mb-2">
                  <div className="flex gap-1">
                    <Badge variant={statusVariant(event.status)} className="text-xs">{event.status}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">{event.type}</Badge>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => setViewEvent(event)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      title="View details"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                    {canUpdate && (
                      <button
                        onClick={() => setEditEvent(event)}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit event"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setDeleteEvent(event)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete event"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-heading font-semibold text-sm mb-1.5">{event.title}</h3>

                {/* Meta */}
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </div>
                  <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{event.time}</div>
                  <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{event.location}</div>
                  {event.requiresTicket && (
                    <div className="flex items-center gap-1.5">
                      <Ticket className="h-3 w-3" />
                      {event.isFree ? 'Free' : `${event.currency} ${event.ticketPrice}`}
                    </div>
                  )}
                </div>

                {/* Admin: view all tickets */}
                {event.requiresTicket && canViewAllTickets && (
                  <Button
                    size="sm" variant="outline"
                    className="w-full mt-2 h-7 text-xs"
                    onClick={() => navigate(`/dashboard/events/${event.id}/tickets`)}
                  >
                    <Ticket className="h-3 w-3 mr-1" /> Tickets
                  </Button>
                )}

                {/* Member: download existing free ticket */}
                {event.requiresTicket && event.isFree && isMember && event.userHasTicket && (
                  <Button
                    size="sm" variant="outline"
                    className="w-full mt-2 h-7 text-xs"
                    onClick={() => handleDownloadTicket(event)}
                  >
                    <Ticket className="h-3 w-3 mr-1" /> Download
                  </Button>
                )}

                {/* Member: get free ticket */}
                {event.requiresTicket && event.isFree && isMember && !event.userHasTicket && canBookTicket(event) && (
                  <Button
                    size="sm"
                    className="w-full mt-2 h-7 text-xs bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={() => handleFreeTicket(event)}
                  >
                    <Ticket className="h-3 w-3 mr-1" /> Get Ticket
                  </Button>
                )}

                {/* Member: view paid ticket */}
                {event.requiresTicket && !event.isFree && canViewTickets && event.userHasTicket && canBookTicket(event) && (
                  <Button
                    size="sm" variant="outline"
                    className="w-full mt-2 h-7 text-xs"
                    onClick={() => navigate(`/dashboard/my-tickets?eventId=${event.id}`)}
                  >
                    <Eye className="h-3 w-3 mr-1" /> My Ticket
                  </Button>
                )}

                {/* Member: pay for ticket */}
                {event.requiresTicket && !event.isFree && isMember && !event.userHasTicket && canBookTicket(event) && (
                  <Button
                    size="sm"
                    className="w-full mt-2 h-7 text-xs bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={() => handlePayment(event)}
                  >
                    <Wallet className="h-3 w-3 mr-1" /> Pay {event.currency} {event.ticketPrice}
                  </Button>
                )}

                {/* Share row */}
                <div className="flex gap-1 mt-2 items-center">
                  <span className='text-xs'>Share event link:</span>
                  <Button
                    size="sm" variant="ghost"
                    className="flex-1 h-7 px-2"
                    onClick={() => copyEventLink(event.id)}
                    title="Copy event link"
                  >
                    {copiedEventId === event.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    className="flex-1 h-7 px-2"
                    onClick={() => shareWhatsApp(event)}
                    title="Share via WhatsApp"
                  >
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    className="flex-1 h-7 px-2"
                    onClick={() => shareFacebook(event.id)}
                    title="Share via Facebook"
                  >
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </Button>
                </div>
              </CardContent>
            </Card>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>{canCreate ? 'No events yet. Create your first event!' : 'No events scheduled.'}</p>
        </div>
      )}

      {/* Edit Dialog — key prop forces full remount so useEffect fires fresh */}
      <Dialog open={!!editEvent} onOpenChange={(open) => { if (!open) setEditEvent(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Event</DialogTitle>
          </DialogHeader>
          {editEvent && (
            <EventForm
              key={editEvent.id}
              defaultValues={buildEditDefaults(editEvent)}
              onSubmit={(v) => updateMutation.mutate({ id: editEvent.id, dto: v })}
              isPending={updateMutation.isPending}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteEvent} onOpenChange={(open) => { if (!open) setDeleteEvent(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleteEvent?.title}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteEvent && deleteMutation.mutate(deleteEvent.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Dialog */}
      <Dialog open={!!viewEvent} onOpenChange={() => setViewEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{viewEvent?.title}</DialogTitle>
          </DialogHeader>
          {viewEvent && (
            <div className="space-y-4">
              {viewEvent.imageUrl && (
                <img src={getImageUrl(viewEvent.imageUrl)} alt={viewEvent.title} className="w-full rounded-md" />
              )}
              <div className="flex gap-2">
                <Badge variant={statusVariant(viewEvent.status)}>{viewEvent.status}</Badge>
                <Badge variant="outline" className="capitalize">{viewEvent.type}</Badge>
              </div>
              {viewEvent.description && (
                <p className="text-sm text-muted-foreground">{viewEvent.description}</p>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Date:</span>
                  {new Date(viewEvent.date).toLocaleDateString()} – {new Date(viewEvent.endDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Time:</span> {viewEvent.time}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">Location:</span> {viewEvent.location}
                </div>
                {viewEvent.requiresTicket && (
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4" />
                    <span className="font-medium">Ticket:</span>
                    {viewEvent.isFree ? 'Free' : `${viewEvent.currency} ${viewEvent.ticketPrice}`}
                    {viewEvent.totalTickets && ` • ${viewEvent.ticketsSold}/${viewEvent.totalTickets} sold`}
                  </div>
                )}
                {viewEvent.ticketSalesCutoff && (
                  <div className="text-xs text-muted-foreground">
                    Sales end: {new Date(viewEvent.ticketSalesCutoff).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Expand Image Dialog */}
      <Dialog open={!!expandImage} onOpenChange={() => setExpandImage(null)}>
        <DialogContent className="max-w-4xl">
          <img src={expandImage || ''} alt="Event" className="w-full" />
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation Dialog */}
      <AlertDialog open={!!paymentConfirm} onOpenChange={() => setPaymentConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You are about to purchase a ticket for{' '}
                  <strong>{paymentConfirm?.event.title}</strong>
                </p>
                {paymentConfirm?.details && (
                  <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Ticket Price:</span>
                      <span className="font-medium">
                        {paymentConfirm.details.currency} {paymentConfirm.details.baseAmount?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Convenience Fee:</span>
                      <span>{paymentConfirm.details.currency} {paymentConfirm.details.convenienceFee?.toFixed(2)}</span>
                    </div>
                    {paymentConfirm.details.systemFeeAmount > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tax:</span>
                        <span>{paymentConfirm.details.currency} {paymentConfirm.details.systemFeeAmount?.toFixed(2)}</span>
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
            <AlertDialogAction
              onClick={proceedToPayment}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Proceed to Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}