import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { communicationService, type Announcement, type RecurrenceRulePayload } from '@/services/communication';
import { uploadService } from '@/services/upload';
import { churchesService, Church } from '@/services/churches';
import { useRole } from '@/hooks/useRole';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { PACKAGE_FEATURES } from '@/lib/package-features';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChurchSelect } from '@/components/ChurchSelect';
import TeamCommunicationTab from '@/components/TeamCommunicationTab';
import { Plus, MessageSquare, Bell, Trash2, HandHeart, Pencil, Eye, Paperclip, X, FileText, Image as ImageIcon, Download, Lock, Users, Search, CalendarClock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  content: z.string().min(1, 'Content required'),
  type: z.enum(['announcement', 'prayer_request', 'newsletter']),
  priority: z.enum(['normal', 'urgent']).default('normal'),
  churchId: z.string().min(1, 'Church selection required'),
  deliveryMode: z.enum(['draft', 'now', 'scheduled']).default('now'),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  recurrenceRule: z.object({
    frequency: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']).default('none'),
    interval: z.number().int().positive().default(1),
    daysOfWeek: z.array(z.string()).default([]),
    dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
    monthOfYear: z.number().int().min(1).max(12).nullable().optional(),
    endsAt: z.string().nullable().optional(),
    count: z.number().int().positive().nullable().optional(),
  }).nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.deliveryMode === 'scheduled' && !data.scheduledDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scheduledDate'], message: 'Schedule date required' });
  }
  if (data.deliveryMode === 'scheduled' && !data.scheduledTime) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scheduledTime'], message: 'Schedule time required' });
  }
});
type FormValues = z.infer<typeof schema>;


const TYPE_ICON: Record<string, typeof MessageSquare> = {
  announcement: Bell,
  prayer_request: HandHeart,
  newsletter: MessageSquare,
};

const TYPE_LABEL: Record<string, string> = {
  announcement: 'Announcement',
  prayer_request: 'Prayer Request',
  newsletter: 'Newsletter',
};

const WEEK_DAYS = [
  { value: 'sunday', label: 'Su' },
  { value: 'monday', label: 'Mo' },
  { value: 'tuesday', label: 'Tu' },
  { value: 'wednesday', label: 'We' },
  { value: 'thursday', label: 'Th' },
  { value: 'friday', label: 'Fr' },
  { value: 'saturday', label: 'Sa' },
];

function defaultRecurrenceRule(): NonNullable<FormValues['recurrenceRule']> {
  return {
    frequency: 'none',
    interval: 1,
    daysOfWeek: [],
    dayOfMonth: null,
    monthOfYear: null,
    endsAt: null,
    count: null,
  };
}

function buildScheduledAt(date?: string, time?: string) {
  if (!date || !time) return null;
  return new Date(`${date}T${time}:00`).toISOString();
}

function toDateInputValue(value?: string | null) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function toTimeInputValue(value?: string | null) {
  if (!value) return '';
  return new Date(value).toTimeString().slice(0, 5);
}

function buildAnnouncementPayload(values: FormValues) {
  const { scheduledDate, scheduledTime, recurrenceRule, ...payload } = values;
  const scheduledAt = values.deliveryMode === 'scheduled' ? buildScheduledAt(scheduledDate, scheduledTime) : null;
  const normalizedRecurrence: RecurrenceRulePayload | null = values.deliveryMode === 'scheduled'
    ? { ...defaultRecurrenceRule(), ...recurrenceRule, startsAt: scheduledAt }
    : null;

  return {
    ...payload,
    scheduledAt,
    recurrenceRule: normalizedRecurrence,
  };
}

export default function CommunicationPage() {
  const hasCommunication = useHasFeature('communication');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Announcement | null>(null);
  const [viewItem, setViewItem] = useState<Announcement | null>(null);
  const [formType, setFormType] = useState<'announcement' | 'prayer_request' | 'newsletter'>('announcement');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);
  const [selectedChurch, setSelectedChurch] = useState<string>('all');
  const { user } = useAuth();
  const { hasPermission, role } = useRole();
  const qc = useQueryClient();
  const isMember = role === 'member';
  const hasSchedulerCreationFeature = useHasFeature(PACKAGE_FEATURES.SCHEDULER_EVENT_CREATION);
  const hasSchedulerRecurringFeature = useHasFeature(PACKAGE_FEATURES.SCHEDULER_RECURRING_EVENTS);
  const canCreateSchedule = hasPermission('schedules:create') && hasSchedulerCreationFeature;
  const canUseRecurringSchedules = canCreateSchedule && hasSchedulerRecurringFeature;

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['announcements', selectedChurch],
    queryFn: () => communicationService.getAll({
      churchId: selectedChurch !== 'all' ? selectedChurch : undefined,
    }),
    enabled: isMember || hasCommunication,
  });

  const { data: churches = [] } = useQuery({
    queryKey: ['churches'],
    queryFn: churchesService.getAll,
    enabled: !isMember,
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'announcement',
      priority: 'normal',
      deliveryMode: 'now',
      recurrenceRule: defaultRecurrenceRule(),
    },
  });

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue: setValueEdit, watch: watchEdit, formState: { errors: errorsEdit } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      deliveryMode: 'now',
      recurrenceRule: defaultRecurrenceRule(),
    },
  });

  const churchId = watch('churchId');
  const deliveryMode = watch('deliveryMode') || 'now';
  const recurrenceRule = watch('recurrenceRule') ?? defaultRecurrenceRule();
  const recurrenceFrequency = recurrenceRule.frequency ?? 'none';
  const recurrenceDays = recurrenceRule.daysOfWeek ?? [];
  const editDeliveryMode = watchEdit('deliveryMode') || 'now';
  const editRecurrenceRule = watchEdit('recurrenceRule') ?? defaultRecurrenceRule();
  const editRecurrenceFrequency = editRecurrenceRule.frequency ?? 'none';
  const editRecurrenceDays = editRecurrenceRule.daysOfWeek ?? [];

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Upload files first if any
      let uploadedFiles: any[] = [];
      if (selectedFiles.length > 0) {
        uploadedFiles = await uploadService.uploadCommunicationFiles(selectedFiles);
      }
      // Create announcement with uploaded files
      return communicationService.create({
        ...buildAnnouncementPayload(data),
        attachments: uploadedFiles.length > 0 ? JSON.stringify(uploadedFiles) : undefined,
      });
    },
    onSuccess: () => {
      toast.success('Posted successfully');
      qc.invalidateQueries({ queryKey: ['announcements'] });
      setDialogOpen(false);
      setSelectedFiles([]);
      reset({ type: 'announcement', priority: 'normal', deliveryMode: 'now', recurrenceRule: defaultRecurrenceRule() });
      setFormType('announcement');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to post'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: any }) => {
      // Upload new files if any
      let uploadedFiles: any[] = [];
      if (selectedFiles.length > 0) {
        uploadedFiles = await uploadService.uploadCommunicationFiles(selectedFiles);
      }
      // Merge existing and new files
      const allFiles = [...existingFiles, ...uploadedFiles];
      return communicationService.update(id, {
        ...buildAnnouncementPayload(dto),
        attachments: allFiles.length > 0 ? JSON.stringify(allFiles) : undefined,
      });
    },
    onSuccess: () => {
      toast.success('Updated successfully');
      qc.invalidateQueries({ queryKey: ['announcements'] });
      setEditItem(null);
      setSelectedFiles([]);
      setExistingFiles([]);
      resetEdit();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: communicationService.delete,
    onSuccess: () => {
      toast.success('Deleted');
      qc.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const canCreate = hasPermission('communication:create');
  const canUpdate = hasPermission('communication:update');
  const canDelete = hasPermission('communication:delete');

  // Check if user is admin (not just member) for church communication
  const canCreateChurchPost = canCreate && role !== 'member';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const totalFiles = selectedFiles.length + existingFiles.length + files.length;
    if (totalFiles > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    setSelectedFiles(prev => [...prev, ...Array.from(files)]);
    e.target.value = '';
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = async (index: number, fileUrl: string) => {
    try {
      await uploadService.deleteFile(fileUrl);
      setExistingFiles(prev => prev.filter((_, i) => i !== index));
    } catch (err) {
      toast.error('Failed to delete file');
    }
  };

  const filterByType = (type: string) => items.filter((i: any) => i.type === type);

  const { data: viewStatsData } = useQuery({
    queryKey: ['announcement-view-stats', viewItem?.id],
    queryFn: () => communicationService.getViewStats(viewItem!.id),
    enabled: !!viewItem && !isMember,
    staleTime: 30_000,
  });

  const [viewersDialogId, setViewersDialogId] = useState<string | null>(null);
  const [viewersSearch, setViewersSearch] = useState('');
  const debouncedViewersSearch = useDebounce(viewersSearch, 300);

  const { data: viewersListData, isLoading: isLoadingViewers } = useQuery({
    queryKey: ['announcement-viewers', viewersDialogId, debouncedViewersSearch],
    queryFn: () => communicationService.getViewers(viewersDialogId!, debouncedViewersSearch || undefined),
    enabled: !!viewersDialogId,
    staleTime: 0,
  });

  const renderScheduleFields = ({
    registerForm,
    setFormValue,
    mode,
    rule,
    frequency,
    selectedDays,
    formErrors,
  }: {
    registerForm: any;
    setFormValue: any;
    mode: 'draft' | 'now' | 'scheduled';
    rule: NonNullable<FormValues['recurrenceRule']>;
    frequency: string;
    selectedDays: string[];
    formErrors: any;
  }) => (
    <div className="space-y-3 rounded-md border border-border p-3">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-accent" />
        <Label className="text-xs sm:text-sm">Delivery</Label>
      </div>
      <p className="text-xs text-muted-foreground">
        Choose whether this post should be sent immediately, saved without sending, or sent later.
      </p>
      <Select value={mode} onValueChange={value => {
        setFormValue('deliveryMode', value, { shouldDirty: true, shouldValidate: true });
        if (value !== 'scheduled') setFormValue('recurrenceRule', defaultRecurrenceRule(), { shouldDirty: true });
      }}>
        <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="draft">Draft / Do not send yet</SelectItem>
          <SelectItem value="now">Send now</SelectItem>
          {(canCreateSchedule || mode === 'scheduled') && <SelectItem value="scheduled">Schedule</SelectItem>}
        </SelectContent>
      </Select>
      {!canCreateSchedule && mode !== 'scheduled' && (
        <p className="text-xs text-muted-foreground">Scheduling is not enabled for your role or package.</p>
      )}
      {!canCreateSchedule && mode === 'scheduled' && (
        <p className="text-xs text-destructive">This post has a schedule, but your role or package cannot modify schedules.</p>
      )}

      {mode === 'scheduled' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs sm:text-sm">Send date</Label>
              <p className="mb-1 text-xs text-muted-foreground">The calendar day this post should be delivered.</p>
              <Input type="date" {...registerForm('scheduledDate')} className="h-8 text-xs sm:h-10 sm:text-sm" />
              {formErrors.scheduledDate && <p className="text-xs text-destructive mt-1">{formErrors.scheduledDate.message}</p>}
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Send time</Label>
              <p className="mb-1 text-xs text-muted-foreground">The time of day to send it.</p>
              <Input type="time" {...registerForm('scheduledTime')} className="h-8 text-xs sm:h-10 sm:text-sm" />
              {formErrors.scheduledTime && <p className="text-xs text-destructive mt-1">{formErrors.scheduledTime.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs sm:text-sm">Repeat</Label>
              <p className="mb-1 text-xs text-muted-foreground">Use None for one-time delivery.</p>
              <Select
                value={frequency}
                onValueChange={value => setFormValue('recurrenceRule', { ...defaultRecurrenceRule(), ...rule, frequency: value }, { shouldDirty: true })}
                disabled={!canUseRecurringSchedules}
              >
                <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {(canUseRecurringSchedules || frequency !== 'none') && (
                    <>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {!canUseRecurringSchedules && (
                <p className="mt-1 text-xs text-muted-foreground">Recurring schedules are not enabled for your package.</p>
              )}
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Every</Label>
              <p className="mb-1 text-xs text-muted-foreground">How often to repeat, for example every 2 weeks.</p>
              <Input
                type="number"
                min={1}
                disabled={frequency === 'none' || !canUseRecurringSchedules}
                value={rule.interval ?? 1}
                onChange={event => setFormValue('recurrenceRule', { ...rule, interval: Math.max(1, Number(event.target.value || 1)) }, { shouldDirty: true })}
                className="h-8 text-xs sm:h-10 sm:text-sm"
              />
            </div>
          </div>

          {frequency === 'weekly' && canUseRecurringSchedules && (
            <div>
              <Label className="text-xs sm:text-sm">Repeat on</Label>
              <p className="mb-1 text-xs text-muted-foreground">Pick the weekdays when this should repeat.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {WEEK_DAYS.map(day => {
                  const checked = selectedDays.includes(day.value);
                  return (
                    <Button
                      key={day.value}
                      type="button"
                      size="sm"
                      variant={checked ? 'default' : 'outline'}
                      className="h-8 w-9 p-0 text-xs"
                      onClick={() => {
                        const nextDays = checked ? selectedDays.filter(value => value !== day.value) : [...selectedDays, day.value];
                        setFormValue('recurrenceRule', { ...rule, daysOfWeek: nextDays }, { shouldDirty: true });
                      }}
                    >
                      {day.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {frequency === 'monthly' && canUseRecurringSchedules && (
            <div>
              <Label className="text-xs sm:text-sm">Day of month</Label>
              <p className="mb-1 text-xs text-muted-foreground">The date number to repeat on each month.</p>
              <Input
                type="number"
                min={1}
                max={31}
                value={rule.dayOfMonth ?? ''}
                onChange={event => setFormValue('recurrenceRule', { ...rule, dayOfMonth: event.target.value ? Number(event.target.value) : null }, { shouldDirty: true })}
                className="h-8 text-xs sm:h-10 sm:text-sm"
              />
            </div>
          )}

          {frequency === 'yearly' && canUseRecurringSchedules && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs sm:text-sm">Month</Label>
                <p className="mb-1 text-xs text-muted-foreground">Month number, 1 to 12.</p>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={rule.monthOfYear ?? ''}
                  onChange={event => setFormValue('recurrenceRule', { ...rule, monthOfYear: event.target.value ? Number(event.target.value) : null }, { shouldDirty: true })}
                  className="h-8 text-xs sm:h-10 sm:text-sm"
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Day</Label>
                <p className="mb-1 text-xs text-muted-foreground">Day number, 1 to 31.</p>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={rule.dayOfMonth ?? ''}
                  onChange={event => setFormValue('recurrenceRule', { ...rule, dayOfMonth: event.target.value ? Number(event.target.value) : null }, { shouldDirty: true })}
                  className="h-8 text-xs sm:h-10 sm:text-sm"
                />
              </div>
            </div>
          )}

          {frequency !== 'none' && canUseRecurringSchedules && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs sm:text-sm">End date</Label>
                <p className="mb-1 text-xs text-muted-foreground">Stop repeating after this date.</p>
                <Input
                  type="date"
                  value={rule.endsAt ? String(rule.endsAt).slice(0, 10) : ''}
                  onChange={event => setFormValue('recurrenceRule', { ...rule, endsAt: event.target.value || null, count: null }, { shouldDirty: true })}
                  className="h-8 text-xs sm:h-10 sm:text-sm"
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Or after</Label>
                <p className="mb-1 text-xs text-muted-foreground">Stop after this many sent occurrences.</p>
                <Input
                  type="number"
                  min={1}
                  placeholder="Occurrences"
                  value={rule.count ?? ''}
                  onChange={event => setFormValue('recurrenceRule', { ...rule, count: event.target.value ? Number(event.target.value) : null, endsAt: null }, { shouldDirty: true })}
                  className="h-8 text-xs sm:h-10 sm:text-sm"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (!isMember && !hasCommunication) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Communication</h1>
          <p className="text-sm text-muted-foreground">Announcements, newsletters, and prayer requests</p>
        </div>
        <Alert className="border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Communication & Announcements is not available in your current package.{' '}
            <Link to="/dashboard/packages" className="font-medium underline">
              Upgrade now
            </Link>{' '}
            to unlock communication features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const ItemCard = ({ item }: { item: any }) => {
    const Icon = TYPE_ICON[item.type] ?? Bell;
    const attachments = item.attachments ? JSON.parse(item.attachments) : [];
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="mt-0.5 p-2 bg-accent/10 rounded-md flex-shrink-0">
                <Icon className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-heading font-semibold text-foreground">{item.title}</span>
                  {item.priority === 'urgent' && <Badge variant="destructive" className="text-xs">Urgent</Badge>}
                  {item.scheduledEvent && <Badge variant="outline" className="text-xs">Scheduled</Badge>}
                  {item.scheduledEvent?.recurrenceRule && <Badge variant="secondary" className="text-xs">Repeats</Badge>}
                  {attachments.length > 0 && <Paperclip className="h-3 w-3 text-muted-foreground" />}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-2">{item.content}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {!isMember && item.church && (
                    <p className="text-xs text-muted-foreground">
                      {item.church.name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  {item.scheduledEvent && (
                    <p className="text-xs text-muted-foreground">
                      Sends {new Date(item.scheduledEvent.startAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setViewItem(item);
                      communicationService.recordView(item.id).catch(() => {});
                    }}
                    className="text-xs text-accent hover:underline flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" /> View
                  </button>
                </div>
              </div>
            </div>
            {(canUpdate || canDelete) && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {canUpdate && (
                  <button
                    onClick={() => {
                      setEditItem(item);
                      setExistingFiles(item.attachments ? JSON.parse(item.attachments) : []);
                      setSelectedFiles([]);
                      resetEdit({
                        churchId: item.churchId,
                        title: item.title,
                        content: item.content,
                        type: item.type,
                        priority: item.priority,
                        deliveryMode: item.scheduledEvent ? 'scheduled' : 'now',
                        scheduledDate: toDateInputValue(item.scheduledEvent?.startAt),
                        scheduledTime: toTimeInputValue(item.scheduledEvent?.startAt),
                        recurrenceRule: item.scheduledEvent?.recurrenceRule
                          ? { ...defaultRecurrenceRule(), ...item.scheduledEvent.recurrenceRule }
                          : defaultRecurrenceRule(),
                      });
                    }}
                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ type }: { type: string }) => (
    <div className="text-center py-12 text-muted-foreground col-span-full">
      <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
      <p>{canCreate ? `No ${TYPE_LABEL[type]?.toLowerCase()}s yet.` : `No ${TYPE_LABEL[type]?.toLowerCase()}s posted.`}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl sm:text-2xl font-bold">Communication</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Announcements, newsletters, and prayer requests</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : (
        <Tabs defaultValue="church">
          <TabsList>
            <TabsTrigger value="church">Church Communication</TabsTrigger>
            <TabsTrigger value="team">Team Communication</TabsTrigger>
          </TabsList>

          <TabsContent value="church" className="mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex gap-2 items-center">
                {!isMember && churches.length > 0 && (
                  <Select value={selectedChurch} onValueChange={setSelectedChurch}>
                    <SelectTrigger className="w-40 sm:w-48 h-8 text-xs sm:h-9 sm:text-sm">
                      <SelectValue placeholder="All Churches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Churches</SelectItem>
                      {churches.map((church: Church) => (
                        <SelectItem key={church.id} value={church.id}>
                          {church.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {canCreateChurchPost && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 h-8 text-xs sm:h-9 sm:text-sm self-end sm:self-auto">
                      <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> New Church Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-heading text-sm sm:text-base">Create Post</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(v => {
                    console.log('Form values:', v);
                    console.log('Form errors:', errors);
                    createMutation.mutate(v);
                  })} className="space-y-3">
                    <ChurchSelect 
                      value={churchId} 
                      onValueChange={value => setValue('churchId', value)}
                    />
                    {errors.churchId && <p className="text-xs text-destructive mt-1">{errors.churchId.message}</p>}
                    {!churchId && <p className="text-xs text-amber-600 mt-1">Please select a church</p>}
                    
                    <div>
                      <Label className="text-xs sm:text-sm">Type</Label>
                      <Select
                        value={formType}
                        onValueChange={v => {
                          const t = v as typeof formType;
                          setFormType(t);
                          setValue('type', t, { shouldValidate: true });
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="announcement">Announcement</SelectItem>
                          <SelectItem value="prayer_request">Prayer Request</SelectItem>
                          <SelectItem value="newsletter">Newsletter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm">Priority</Label>
                      <Select value={watch('priority') || 'normal'} onValueChange={v => setValue('priority', v as 'normal' | 'urgent', { shouldValidate: true })}>
                        <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {renderScheduleFields({
                      registerForm: register,
                      setFormValue: setValue,
                      mode: deliveryMode,
                      rule: recurrenceRule,
                      frequency: recurrenceFrequency,
                      selectedDays: recurrenceDays,
                      formErrors: errors,
                    })}
                    <div>
                      <Label className="text-xs sm:text-sm">Title</Label>
                      <Input {...register('title')} className="h-8 text-xs sm:h-10 sm:text-sm" />
                      {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm">{formType === 'prayer_request' ? 'Prayer Request Details' : 'Content'}</Label>
                      <Textarea {...register('content')} rows={4} className="text-xs sm:text-sm" />
                      {errors.content && <p className="text-xs text-destructive mt-1">{errors.content.message}</p>}
                    </div>
                    
                    <div>
                      <Label className="text-xs sm:text-sm">Attachments <span className="text-xs text-muted-foreground">(Max 5 files)</span></Label>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.mp4,.webm,.mov,.avi"
                          onChange={handleFileSelect}
                          disabled={selectedFiles.length >= 5}
                          className="cursor-pointer text-xs sm:text-sm h-8 sm:h-10"
                        />
                        {selectedFiles.length > 0 && (
                          <div className="space-y-1">
                            {selectedFiles.map((file, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs bg-muted p-2 rounded">
                                {file.type?.startsWith('image/') ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                                <span className="flex-1 truncate">{file.name}</span>
                                <span className="text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                                <button type="button" onClick={() => removeSelectedFile(i)} className="text-destructive hover:text-destructive/80">
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button type="submit" disabled={createMutation.isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-8 text-xs sm:h-10 sm:text-sm">
                      {createMutation.isPending ? 'Posting...' : 'Post'}
                    </Button>
                  </form>
                </DialogContent>
                </Dialog>
              )}
            </div>
            <Tabs defaultValue="announcement">
              <div className="overflow-x-auto pb-2">
                <TabsList className="inline-flex w-auto">
                  <TabsTrigger value="announcement" className="whitespace-nowrap">
                    Announcements <Badge variant="secondary" className="ml-2">{filterByType('announcement').length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="prayer_request" className="whitespace-nowrap">
                    Prayer Requests <Badge variant="secondary" className="ml-2">{filterByType('prayer_request').length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="newsletter" className="whitespace-nowrap">
                    Newsletters <Badge variant="secondary" className="ml-2">{filterByType('newsletter').length}</Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              {(['announcement', 'prayer_request', 'newsletter'] as const).map(type => (
                <TabsContent key={type} value={type} className="mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {filterByType(type).length === 0
                      ? <EmptyState type={type} />
                      : filterByType(type).map((item: any) => <ItemCard key={item.id} item={item} />)
                    }
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          <TabsContent value="team" className="mt-4">
            <TeamCommunicationTab churches={churches} isMember={isMember} />
          </TabsContent>
        </Tabs>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={open => !open && setViewItem(null)}>
        <DialogContent className="max-w-sm sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-sm sm:text-base flex items-center gap-2">
              {viewItem && (() => {
                const Icon = TYPE_ICON[viewItem.type] ?? Bell;
                return <Icon className="h-5 w-5 text-accent" />;
              })()}
              {viewItem?.title}
            </DialogTitle>
          </DialogHeader>
          {viewItem && (() => {
            const attachments = viewItem.attachments ? JSON.parse(viewItem.attachments) : [];
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{TYPE_LABEL[viewItem.type]}</Badge>
                  {viewItem.priority === 'urgent' && <Badge variant="destructive">Urgent</Badge>}
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{viewItem.content}</p>
                </div>
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Attachments</Label>
                    <div className="grid gap-2">
                      {attachments.map((file: any, i: number) => {
                        const isVideo = file.mimeType?.startsWith('video/');
                        return isVideo ? (
                          <div key={i} className="rounded-lg overflow-hidden bg-black">
                            <video src={`${import.meta.env.VITE_STATIC_URL}${file.url}`} controls className="w-full" />
                          </div>
                        ) : (
                          <a
                            key={i}
                            href={`${import.meta.env.VITE_STATIC_URL}${file.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-muted rounded hover:bg-muted/80 transition-colors"
                          >
                            {file.mimeType?.startsWith('image/') ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                            <span className="flex-1 text-sm truncate">{file.name}</span>
                            <Download className="h-3 w-3" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Posted on {new Date(viewItem.createdAt).toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                {!isMember && viewStatsData !== undefined && (
                  <div className="border-t pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>Seen by <span className="font-medium text-foreground">{viewStatsData.count}</span> {viewStatsData.count === 1 ? 'person' : 'people'}</span>
                    </div>
                    {viewStatsData.count > 0 && (
                      <button
                        onClick={() => setViewersDialogId(viewItem.id)}
                        className="text-xs text-accent hover:underline"
                      >
                        View viewers
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Viewers Dialog */}
      <Dialog open={!!viewersDialogId} onOpenChange={open => { if (!open) { setViewersDialogId(null); setViewersSearch(''); } }}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" /> Viewers
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-xs"
              placeholder="Search by name or email..."
              value={viewersSearch}
              onChange={e => setViewersSearch(e.target.value)}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoadingViewers ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </div>
            ) : !viewersListData?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {debouncedViewersSearch ? 'No viewers match your search' : 'No viewers yet'}
              </p>
            ) : (
              <div className="divide-y">
                {viewersListData.map((v, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 px-1">
                    <div>
                      <p className="text-sm font-medium">{v.firstName} {v.lastName}</p>
                      <p className="text-xs text-muted-foreground">{v.email ?? ''}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(v.viewedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={open => {
        if (!open) {
          setEditItem(null);
          setSelectedFiles([]);
          setExistingFiles([]);
          resetEdit();
        }
      }}>
        <DialogContent className="max-w-sm sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-sm sm:text-base">Edit Post</DialogTitle>
          </DialogHeader>
          {editItem && (
            <form onSubmit={handleSubmitEdit(v => updateMutation.mutate({ id: editItem.id, dto: v }))} className="space-y-3">
              <ChurchSelect 
                value={editItem.churchId} 
                onValueChange={value => setValueEdit('churchId', value)}
              />
              
              <div>
                <Label className="text-xs sm:text-sm">Type</Label>
                <Select
                  value={editItem.type}
                  onValueChange={v => {
                    const t = v as typeof formType;
                    setFormType(t);
                    setValueEdit('type', t);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="prayer_request">Prayer Request</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Priority</Label>
                <Select value={editItem.priority} onValueChange={v => setValueEdit('priority', v as 'normal' | 'urgent')}>
                  <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {renderScheduleFields({
                registerForm: registerEdit,
                setFormValue: setValueEdit,
                mode: editDeliveryMode,
                rule: editRecurrenceRule,
                frequency: editRecurrenceFrequency,
                selectedDays: editRecurrenceDays,
                formErrors: errorsEdit,
              })}
              <div>
                <Label className="text-xs sm:text-sm">Title</Label>
                <Input {...registerEdit('title')} className="h-8 text-xs sm:h-10 sm:text-sm" />
                {errorsEdit.title && <p className="text-xs text-destructive mt-1">{errorsEdit.title.message}</p>}
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Content</Label>
                <Textarea {...registerEdit('content')} rows={4} className="text-xs sm:text-sm" />
                {errorsEdit.content && <p className="text-xs text-destructive mt-1">{errorsEdit.content.message}</p>}
              </div>
              
              <div>
                <Label className="text-xs sm:text-sm">Attachments <span className="text-xs text-muted-foreground">(Max 5 files)</span></Label>
                <div className="space-y-2">
                  {existingFiles.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Existing files:</p>
                      {existingFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs bg-muted p-2 rounded">
                          {file.mimeType?.startsWith('image/') ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                          <span className="flex-1 truncate">{file.name}</span>
                          <button type="button" onClick={() => removeExistingFile(i, file.url)} className="text-destructive hover:text-destructive/80">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.mp4,.webm,.mov,.avi"
                    onChange={handleFileSelect}
                    disabled={(existingFiles.length + selectedFiles.length) >= 5}
                    className="cursor-pointer text-xs sm:text-sm h-8 sm:h-10"
                  />
                  {selectedFiles.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">New files:</p>
                      {selectedFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs bg-muted p-2 rounded">
                          {file.type?.startsWith('image/') ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                          <span className="flex-1 truncate">{file.name}</span>
                          <span className="text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                          <button type="button" onClick={() => removeSelectedFile(i)} className="text-destructive hover:text-destructive/80">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <Button type="submit" disabled={updateMutation.isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-8 text-xs sm:h-10 sm:text-sm">
                {updateMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
