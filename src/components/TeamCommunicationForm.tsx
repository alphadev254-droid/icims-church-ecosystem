import { useState, useRef, useEffect } from 'react';
import { TeamCommunication, type TeamCommunicationRecurrenceRule } from '@/services/teamCommunication';
import { Team } from '@/services/teams';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarClock, Upload, X, FileText, Video, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useRole } from '@/hooks/useRole';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { PACKAGE_FEATURES } from '@/lib/package-features';

interface TeamCommunicationFormProps {
  teams: Team[];
  initialData?: TeamCommunication;
  onSubmit: (data: any) => void;
  isPending: boolean;
}

const WEEK_DAYS = [
  { value: 'sunday', label: 'Su' },
  { value: 'monday', label: 'Mo' },
  { value: 'tuesday', label: 'Tu' },
  { value: 'wednesday', label: 'We' },
  { value: 'thursday', label: 'Th' },
  { value: 'friday', label: 'Fr' },
  { value: 'saturday', label: 'Sa' },
];

function defaultRecurrenceRule(): TeamCommunicationRecurrenceRule {
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

function toDateInputValue(value?: string | null) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function toTimeInputValue(value?: string | null) {
  if (!value) return '';
  return new Date(value).toTimeString().slice(0, 5);
}

function buildScheduledAt(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

export function TeamCommunicationForm({ teams, initialData, onSubmit, isPending }: TeamCommunicationFormProps) {
  const { hasPermission } = useRole();
  const hasSchedulerCreationFeature = useHasFeature(PACKAGE_FEATURES.SCHEDULER_EVENT_CREATION);
  const hasSchedulerRecurringFeature = useHasFeature(PACKAGE_FEATURES.SCHEDULER_RECURRING_EVENTS);
  const canCreateSchedule = hasPermission('schedules:create') && hasSchedulerCreationFeature;
  const canUseRecurringSchedules = canCreateSchedule && hasSchedulerRecurringFeature;
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [teamId, setTeamId] = useState(initialData?.teamId || '');
  const [deliveryMode, setDeliveryMode] = useState<'draft' | 'now' | 'scheduled'>(initialData?.scheduledEvent ? 'scheduled' : 'now');
  const [scheduledDate, setScheduledDate] = useState(toDateInputValue(initialData?.scheduledEvent?.startAt));
  const [scheduledTime, setScheduledTime] = useState(toTimeInputValue(initialData?.scheduledEvent?.startAt));
  const [recurrenceRule, setRecurrenceRule] = useState<TeamCommunicationRecurrenceRule>(
    initialData?.scheduledEvent?.recurrenceRule
      ? { ...defaultRecurrenceRule(), ...initialData.scheduledEvent.recurrenceRule }
      : defaultRecurrenceRule()
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingMedia, setExistingMedia] = useState<{ url: string; type: string; name: string; size: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData?.mediaUrls) {
      setExistingMedia(initialData.mediaUrls);
    }
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      setTeamId(initialData.teamId || '');
      setDeliveryMode(initialData.scheduledEvent ? 'scheduled' : 'now');
      setScheduledDate(toDateInputValue(initialData.scheduledEvent?.startAt));
      setScheduledTime(toTimeInputValue(initialData.scheduledEvent?.startAt));
      setRecurrenceRule(initialData.scheduledEvent?.recurrenceRule
        ? { ...defaultRecurrenceRule(), ...initialData.scheduledEvent.recurrenceRule }
        : defaultRecurrenceRule());
    }
  }, [initialData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const totalMedia = existingMedia.length + selectedFiles.length + files.length;
    if (totalMedia > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    setSelectedFiles([...selectedFiles, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeNewMedia = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const removeExistingMedia = (index: number) => {
    setExistingMedia(existingMedia.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !teamId) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (deliveryMode === 'scheduled' && (!scheduledDate || !scheduledTime)) {
      toast.error('Please select schedule date and time');
      return;
    }

    const scheduledAt = deliveryMode === 'scheduled' ? buildScheduledAt(scheduledDate, scheduledTime) : null;
    onSubmit({
      title,
      content,
      teamId,
      files: selectedFiles,
      existingMedia,
      deliveryMode,
      scheduledAt,
      recurrenceRule: deliveryMode === 'scheduled' ? { ...recurrenceRule, startsAt: scheduledAt } : null,
    });
  };

  const getMediaIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const totalMediaCount = existingMedia.length + selectedFiles.length;
  const recurrenceFrequency = recurrenceRule.frequency ?? 'none';
  const recurrenceDays = recurrenceRule.daysOfWeek ?? [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="team">Team *</Label>
        <Select value={teamId} onValueChange={setTeamId} disabled={!!initialData}>
          <SelectTrigger>
            <SelectValue placeholder="Select team" />
          </SelectTrigger>
          <SelectContent>
            {teams.map(team => (
              <SelectItem key={team.id} value={team.id}>
                {team.color && <div className="w-2 h-2 rounded-full inline-block mr-2" style={{ backgroundColor: team.color }} />}
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3 rounded-md border border-border p-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-accent" />
          <Label>Delivery</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Choose whether this team post should be sent immediately, saved without sending, or sent later.
        </p>
        <Select value={deliveryMode} onValueChange={value => {
          setDeliveryMode(value as 'draft' | 'now' | 'scheduled');
          if (value !== 'scheduled') setRecurrenceRule(defaultRecurrenceRule());
        }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft / Do not send yet</SelectItem>
            <SelectItem value="now">Send now</SelectItem>
            {(canCreateSchedule || deliveryMode === 'scheduled') && <SelectItem value="scheduled">Schedule</SelectItem>}
          </SelectContent>
        </Select>
        {!canCreateSchedule && deliveryMode !== 'scheduled' && (
          <p className="text-xs text-muted-foreground">Scheduling is not enabled for your role or package.</p>
        )}
        {!canCreateSchedule && deliveryMode === 'scheduled' && (
          <p className="text-xs text-destructive">This post has a schedule, but your role or package cannot modify schedules.</p>
        )}

        {deliveryMode === 'scheduled' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Send date</Label>
                <p className="text-xs text-muted-foreground">The calendar day this post should be delivered.</p>
                <Input type="date" value={scheduledDate} onChange={event => setScheduledDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Send time</Label>
                <p className="text-xs text-muted-foreground">The time of day to send it.</p>
                <Input type="time" value={scheduledTime} onChange={event => setScheduledTime(event.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Repeat</Label>
                <p className="text-xs text-muted-foreground">Use None for one-time delivery.</p>
                <Select
                  value={recurrenceFrequency || 'none'}
                  onValueChange={frequency => setRecurrenceRule(prev => ({ ...defaultRecurrenceRule(), ...prev, frequency: frequency as TeamCommunicationRecurrenceRule['frequency'] }))}
                  disabled={!canUseRecurringSchedules}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(canUseRecurringSchedules || recurrenceFrequency !== 'none') && (
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
                  <p className="text-xs text-muted-foreground">Recurring schedules are not enabled for your package.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Every</Label>
                <p className="text-xs text-muted-foreground">How often to repeat, for example every 2 weeks.</p>
                <Input
                  type="number"
                  min={1}
                  disabled={recurrenceFrequency === 'none' || !canUseRecurringSchedules}
                  value={recurrenceRule.interval ?? 1}
                  onChange={event => setRecurrenceRule(prev => ({ ...prev, interval: Math.max(1, Number(event.target.value || 1)) }))}
                />
              </div>
            </div>

            {recurrenceFrequency === 'weekly' && canUseRecurringSchedules && (
              <div className="space-y-2">
                <Label>Repeat on</Label>
                <p className="text-xs text-muted-foreground">Pick the weekdays when this should repeat.</p>
                <div className="flex flex-wrap gap-2">
                  {WEEK_DAYS.map(day => {
                    const checked = recurrenceDays.includes(day.value);
                    return (
                      <Button
                        key={day.value}
                        type="button"
                        size="sm"
                        variant={checked ? 'default' : 'outline'}
                        className="h-8 w-9 p-0 text-xs"
                        onClick={() => {
                          const nextDays = checked ? recurrenceDays.filter(value => value !== day.value) : [...recurrenceDays, day.value];
                          setRecurrenceRule(prev => ({ ...prev, daysOfWeek: nextDays }));
                        }}
                      >
                        {day.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {recurrenceFrequency === 'monthly' && canUseRecurringSchedules && (
              <div className="space-y-2">
                <Label>Day of month</Label>
                <p className="text-xs text-muted-foreground">The date number to repeat on each month.</p>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={recurrenceRule.dayOfMonth ?? ''}
                  onChange={event => setRecurrenceRule(prev => ({ ...prev, dayOfMonth: event.target.value ? Number(event.target.value) : null }))}
                />
              </div>
            )}

            {recurrenceFrequency === 'yearly' && canUseRecurringSchedules && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Month</Label>
                  <p className="text-xs text-muted-foreground">Month number, 1 to 12.</p>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={recurrenceRule.monthOfYear ?? ''}
                    onChange={event => setRecurrenceRule(prev => ({ ...prev, monthOfYear: event.target.value ? Number(event.target.value) : null }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Day</Label>
                  <p className="text-xs text-muted-foreground">Day number, 1 to 31.</p>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={recurrenceRule.dayOfMonth ?? ''}
                    onChange={event => setRecurrenceRule(prev => ({ ...prev, dayOfMonth: event.target.value ? Number(event.target.value) : null }))}
                  />
                </div>
              </div>
            )}

            {recurrenceFrequency !== 'none' && canUseRecurringSchedules && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>End date</Label>
                  <p className="text-xs text-muted-foreground">Stop repeating after this date.</p>
                  <Input
                    type="date"
                    value={recurrenceRule.endsAt ? String(recurrenceRule.endsAt).slice(0, 10) : ''}
                    onChange={event => setRecurrenceRule(prev => ({ ...prev, endsAt: event.target.value || null, count: null }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Or after</Label>
                  <p className="text-xs text-muted-foreground">Stop after this many sent occurrences.</p>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Occurrences"
                    value={recurrenceRule.count ?? ''}
                    onChange={event => setRecurrenceRule(prev => ({ ...prev, count: event.target.value ? Number(event.target.value) : null, endsAt: null }))}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter post title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter post content"
          rows={6}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Attachments</Label>
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={totalMediaCount >= 5}
            className="w-full gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Files ({totalMediaCount}/5)
          </Button>
          
          {/* Existing Media */}
          {existingMedia.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Existing Files</p>
              {existingMedia.map((media, idx) => (
                <div key={`existing-${idx}`} className="flex items-center gap-2 p-2 border rounded text-sm bg-muted/50">
                  {getMediaIcon(media.type)}
                  <span className="flex-1 truncate">{media.name}</span>
                  <span className="text-xs text-muted-foreground">{(media.size / 1024).toFixed(1)} KB</span>
                  <button
                    type="button"
                    onClick={() => removeExistingMedia(idx)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">New Files</p>
              {selectedFiles.map((file, idx) => (
                <div key={`new-${idx}`} className="flex items-center gap-2 p-2 border rounded text-sm">
                  {getMediaIcon(file.type)}
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                  <button
                    type="button"
                    onClick={() => removeNewMedia(idx)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? (initialData ? 'Updating...' : 'Creating...') : (initialData ? 'Update' : 'Create')}
        </Button>
      </div>
    </form>
  );
}
