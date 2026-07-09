import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import {
  createScheduledReminder,
  deleteScheduledReminder,
  getScheduledReminderLogs,
  getScheduledReminders,
  getUpcomingReminders,
  Reminder,
  ReminderStats,
  ScheduledReminder,
  ScheduledReminderLog,
} from '@/services/reminders';
import { givingService, type GivingCampaign } from '@/services/giving';
import { churchesService, Church } from '@/services/churches';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Gift, Heart, Church as ChurchIcon, Cake, Search, Phone, Mail, Bell, Lock, X, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const STATIC_BASE = (import.meta.env.VITE_STATIC_URL || 'http://localhost:5000').replace(/\/+$/, '');
const getAvatarUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${STATIC_BASE}${path}`;
};

const EMPTY_STATS: ReminderStats = {
  total: 0,
  birthdays: 0,
  weddings: 0,
  memberAnniversaries: 0,
  churchFounded: 0,
  events: 0,
};

const DEFAULT_SCHEDULED_FORM = {
  churchId: '',
  campaignId: 'all',
  type: 'giving' as 'giving' | 'pledge',
  audience: 'all_members' as 'all_members' | 'active_pledges' | 'overdue_pledges' | 'not_given_this_month',
  channelEmail: true,
  channelPush: true,
  title: 'Giving Reminder',
  message: 'Hi {firstName}, this is a friendly reminder from your church.',
  scheduleKind: 'monthly_days' as 'monthly_days' | 'pledge_deadline',
  scheduleDays: '5',
  deadlineOffsets: '-7,0,3',
};

function parseNumberCsv(value: string) {
  return value
    .split(',')
    .map(part => Number(part.trim()))
    .filter(Number.isFinite);
}

const Reminders = () => {
  const { user } = useAuth();
  const { hasPermission } = useRole();
  const hasRemindersFeature = useHasFeature('reminders_management');
  const isMember = user?.roleName === 'member';

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [stats, setStats] = useState<ReminderStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedChurch, setSelectedChurch] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [daysFilter, setDaysFilter] = useState(30);
  const [churches, setChurches] = useState<Church[]>([]);
  const [campaigns, setCampaigns] = useState<GivingCampaign[]>([]);
  const [scheduledReminders, setScheduledReminders] = useState<ScheduledReminder[]>([]);
  const [scheduledLogs, setScheduledLogs] = useState<ScheduledReminderLog[]>([]);
  const [scheduledLogPagination, setScheduledLogPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [logStatusFilter, setLogStatusFilter] = useState('all');
  const [logChannelFilter, setLogChannelFilter] = useState('all');
  const [logReminderFilter, setLogReminderFilter] = useState('all');
  const [logStartDate, setLogStartDate] = useState('');
  const [logEndDate, setLogEndDate] = useState('');
  const [scheduledForm, setScheduledForm] = useState(DEFAULT_SCHEDULED_FORM);
  const [scheduledLoading, setScheduledLoading] = useState(false);
  const [scheduledSaving, setScheduledSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'scheduled' | 'history'>('upcoming');
  const [expandedAvatar, setExpandedAvatar] = useState<{ src: string; name: string } | null>(null);

  // Derive permission as a stable boolean — not the function reference
  const canReadReminders = hasPermission('reminders:read');
  const canManageScheduled = !isMember && canReadReminders;

  // Fetch churches for filter (only for non-members)
  useEffect(() => {
    if (!isMember) {
      console.log('Fetching churches for filter...');
      churchesService.getAll()
        .then((data) => {
          console.log('Churches fetched:', data.length);
          setChurches(data);
        })
        .catch(err => console.error('Failed to fetch churches:', err));
    }
  }, [isMember]);

  useEffect(() => {
    if (!canManageScheduled) return;
    givingService.getCampaigns()
      .then(data => setCampaigns(Array.isArray(data) ? data as GivingCampaign[] : []))
      .catch(err => console.error('Failed to fetch campaigns for reminders:', err));
  }, [canManageScheduled]);

  useEffect(() => {
    if (!scheduledForm.churchId && churches.length > 0) {
      setScheduledForm(prev => ({ ...prev, churchId: churches[0].id }));
    }
  }, [churches, scheduledForm.churchId]);

  const fetchScheduled = useCallback(async () => {
    if (!canManageScheduled) return;
    try {
      setScheduledLoading(true);
      const [rulesResponse, logsResponse] = await Promise.all([
        getScheduledReminders(selectedChurch !== 'all' ? { churchId: selectedChurch } : undefined),
        getScheduledReminderLogs({
          page: scheduledLogPagination.page,
          limit: scheduledLogPagination.limit,
          status: logStatusFilter !== 'all' ? logStatusFilter : undefined,
          channel: logChannelFilter !== 'all' ? logChannelFilter : undefined,
          reminderId: logReminderFilter !== 'all' ? logReminderFilter : undefined,
          startDate: logStartDate || undefined,
          endDate: logEndDate || undefined,
        }),
      ]);
      setScheduledReminders(rulesResponse.data);
      setScheduledLogs(logsResponse.data);
      setScheduledLogPagination(logsResponse.pagination);
    } catch (error) {
      console.error('Failed to fetch scheduled reminders:', error);
    } finally {
      setScheduledLoading(false);
    }
  }, [canManageScheduled, selectedChurch, scheduledLogPagination.page, scheduledLogPagination.limit, logStatusFilter, logChannelFilter, logReminderFilter, logStartDate, logEndDate]);

  useEffect(() => {
    fetchScheduled();
  }, [fetchScheduled]);

  const fetchReminders = useCallback(async () => {
    if ((!isMember && !hasRemindersFeature) || !canReadReminders) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const params: Record<string, any> = { days: daysFilter };
      if (selectedType !== 'all') params.type = selectedType;
      if (selectedChurch !== 'all') params.churchId = selectedChurch;

      const response = await getUpcomingReminders(params);
      setReminders(response.data);
      setStats(response.stats);
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    } finally {
      setLoading(false);
    }
  }, [isMember, hasRemindersFeature, canReadReminders, daysFilter, selectedType, selectedChurch]);
  // ^^^ stable primitives only — no function references in deps

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // ---------- helpers ----------
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'birthday':          return <Cake    className="h-4 w-4 text-pink-500"   />;
      case 'wedding':           return <Heart   className="h-4 w-4 text-red-500"    />;
      case 'member_anniversary':return <Gift    className="h-4 w-4 text-blue-500"   />;
      case 'church_founded':    return <ChurchIcon  className="h-4 w-4 text-purple-500" />;
      case 'event':             return <Calendar className="h-4 w-4 text-green-500" />;
      default:                  return <Bell    className="h-4 w-4"                 />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'birthday':           return 'Birthday';
      case 'wedding':            return 'Wedding Anniversary';
      case 'member_anniversary': return 'Member Anniversary';
      case 'church_founded':     return 'Church Founded';
      case 'event':              return 'Event';
      default:                   return type;
    }
  };

  const getDaysLabel = (days: number) => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  };

  const filteredReminders = reminders.filter((r) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    if (r.type === 'event') {
      const eventTitle = r.event?.title?.toLowerCase() ?? r.eventTitle?.toLowerCase() ?? '';
      return eventTitle.includes(query);
    }
    
    if (r.user) {
      const fullName = `${r.user.firstName} ${r.user.lastName}`.toLowerCase();
      return fullName.includes(query);
    }
    
    // If no user object, show it (don't hide due to missing data)
    return true;
  });

  const filteredCampaigns = campaigns.filter(campaign => {
    if (!scheduledForm.churchId) return true;
    return campaign.churchId === scheduledForm.churchId;
  });

  const handleCreateScheduledReminder = async () => {
    if (!scheduledForm.churchId) {
      toast.error('Select a church');
      return;
    }
    const scheduleDays = parseNumberCsv(scheduledForm.scheduleDays);
    const deadlineOffsets = parseNumberCsv(scheduledForm.deadlineOffsets);
    if (scheduledForm.scheduleKind === 'monthly_days' && scheduleDays.length === 0) {
      toast.error('Enter at least one monthly day');
      return;
    }
    if (scheduledForm.scheduleKind === 'pledge_deadline' && deadlineOffsets.length === 0) {
      toast.error('Enter at least one pledge deadline offset');
      return;
    }

    try {
      setScheduledSaving(true);
      await createScheduledReminder({
        churchId: scheduledForm.churchId,
        campaignId: scheduledForm.campaignId === 'all' ? null : scheduledForm.campaignId,
        type: scheduledForm.type,
        audience: scheduledForm.audience,
        channelEmail: scheduledForm.channelEmail,
        channelPush: scheduledForm.channelPush,
        title: scheduledForm.title,
        message: scheduledForm.message,
        scheduleKind: scheduledForm.scheduleKind,
        scheduleDays,
        deadlineOffsets,
      });
      toast.success('Scheduled reminder created');
      setScheduledForm(prev => ({ ...DEFAULT_SCHEDULED_FORM, churchId: prev.churchId }));
      fetchScheduled();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create scheduled reminder');
    } finally {
      setScheduledSaving(false);
    }
  };

  const handleDeleteScheduledReminder = async (id: string) => {
    if (!confirm('Delete this scheduled reminder?')) return;
    try {
      await deleteScheduledReminder(id);
      toast.success('Scheduled reminder deleted');
      fetchScheduled();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete scheduled reminder');
    }
  };

  // ---------- guards ----------
  if (!isMember && !hasRemindersFeature) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Reminders</h1>
          <p className="text-sm text-muted-foreground">Track birthdays, anniversaries, and upcoming events</p>
        </div>
        <Alert className="border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Reminders Management is not available in your current package.{' '}
            <Link to="/dashboard/packages" className="font-medium underline">
              Upgrade to Standard or Premium
            </Link>{' '}
            to unlock reminders features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!canReadReminders) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Reminders</h1>
          <p className="text-sm text-muted-foreground">You don't have permission to view reminders.</p>
        </div>
      </div>
    );
  }

  // ---------- render ----------
  return (
    <div className="space-y-6">
      {/* Avatar lightbox */}
      {expandedAvatar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setExpandedAvatar(null)}
        >
          <div className="relative" onClick={e => e.stopPropagation()}>
            <img
              src={expandedAvatar.src}
              alt={expandedAvatar.name}
              className="max-h-[80vh] max-w-[80vw] rounded-xl shadow-2xl object-contain"
            />
            <p className="text-center text-white text-sm mt-2 font-medium">{expandedAvatar.name}</p>
            <button
              onClick={() => setExpandedAvatar(null)}
              className="absolute -top-3 -right-3 bg-background rounded-full p-1 shadow-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Reminders</h1>
          <p className="text-sm text-muted-foreground">
            {user?.roleName === 'member'
              ? 'Your upcoming celebrations'
              : 'Upcoming celebrations across your churches'}
          </p>
        </div>
      </div>

      {canManageScheduled && (
        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 sm:w-[460px]">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="history">Sent History</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {activeTab === 'upcoming' && (
        <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Birthdays</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.birthdays}</p>
              </div>
              <Cake className="h-6 w-6 sm:h-8 sm:w-8 text-pink-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Weddings</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.weddings}</p>
              </div>
              <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Anniversaries</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.memberAnniversaries}</p>
              </div>
              <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Events</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.events}</p>
              </div>
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        {stats.churchFounded > 0 && (
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Church Founded</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats.churchFounded}</p>
                </div>
                <ChurchIcon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 relative min-w-[160px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 sm:pl-9 h-8 text-xs sm:h-10 sm:text-sm"
              />
            </div>
            {!isMember && churches.length > 0 && (
              <Select value={selectedChurch} onValueChange={setSelectedChurch}>
                <SelectTrigger className="w-full sm:w-44 h-8 text-xs sm:h-10 sm:text-sm">
                  <SelectValue placeholder="All Churches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Churches</SelectItem>
                  {churches.map((church) => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-44 h-8 text-xs sm:h-10 sm:text-sm">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="birthday">Birthdays</SelectItem>
                <SelectItem value="wedding">Weddings</SelectItem>
                <SelectItem value="member_anniversary">Anniversaries</SelectItem>
                <SelectItem value="event">Events</SelectItem>
                {user?.roleName === 'ministry_admin' && (
                  <SelectItem value="church_founded">Church Founded</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Select value={daysFilter.toString()} onValueChange={(v) => setDaysFilter(Number(v))}>
              <SelectTrigger className="w-full sm:w-36 h-8 text-xs sm:h-10 sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Next 7 Days</SelectItem>
                <SelectItem value="14">Next 14 Days</SelectItem>
                <SelectItem value="30">Next 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reminders List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : filteredReminders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-heading text-lg font-semibold mb-2">No Reminders</h3>
            <p className="text-sm text-muted-foreground">No upcoming celebrations in the selected period.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredReminders.map((reminder) => {
            const isEvent = reminder.type === 'event';
            const displayName = isEvent 
              ? (reminder.event?.title || reminder.eventTitle || 'Event')
              : (reminder.user ? `${reminder.user.firstName} ${reminder.user.lastName}` : '—');
            const contactPhone = isEvent ? reminder.event?.contactPhone : reminder.user?.phone;
            const contactEmail = isEvent ? reminder.event?.contactEmail : reminder.user?.email;

            return (
              <Card key={reminder.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(reminder.type)}
                      <span className="text-xs font-medium text-muted-foreground capitalize">
                        {getTypeLabel(reminder.type)}
                      </span>
                    </div>
                    <Badge
                      variant={
                        reminder.daysUntil === 0 ? 'default'
                        : reminder.daysUntil <= 3 ? 'secondary'
                        : 'outline'
                      }
                      className="text-xs"
                    >
                      {getDaysLabel(reminder.daysUntil)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 mb-1">
                    {isEvent && reminder.event && (() => {
                      const imgSrc = getAvatarUrl(reminder.event.imageUrl);
                      return imgSrc ? (
                        <button
                          onClick={() => setExpandedAvatar({ src: imgSrc, name: displayName })}
                          className="shrink-0 rounded-lg overflow-hidden border-2 border-accent/30 hover:border-accent transition-colors"
                          title="View event image"
                        >
                          <img src={imgSrc} alt={displayName} className="h-10 w-10 object-cover" />
                        </button>
                      ) : null;
                    })()}
                    {!isEvent && reminder.user && (() => {
                      const avatarSrc = getAvatarUrl(reminder.user.avatar);
                      return avatarSrc ? (
                        <button
                          onClick={() => setExpandedAvatar({ src: avatarSrc, name: displayName })}
                          className="shrink-0 rounded-full overflow-hidden border-2 border-accent/30 hover:border-accent transition-colors"
                          title="View photo"
                        >
                          <img src={avatarSrc} alt={displayName} className="h-10 w-10 object-cover" />
                        </button>
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm border border-accent/20">
                          {reminder.user.firstName[0]}{reminder.user.lastName[0]}
                        </div>
                      );
                    })()}
                    <h3 className="font-heading font-semibold">{displayName}</h3>
                  </div>

                  {isEvent && reminder.event?.location && (
                    <p className="text-sm text-muted-foreground mb-2">{reminder.event.location}</p>
                  )}

                  {!isEvent && (reminder.age || reminder.years) && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {reminder.age && `Turning ${reminder.age}`}
                      {reminder.years && `${reminder.years} ${reminder.years === 1 ? 'year' : 'years'}`}
                      {reminder.type === 'birthday' && reminder.originalDate && (
                        <span className="ml-1">
                          ({new Date(reminder.originalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                        </span>
                      )}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground mb-3">
                    {new Date(reminder.upcomingDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>

                  {user?.roleName !== 'member' && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <ChurchIcon className="h-3 w-3" />
                      {reminder.church.name}
                    </div>
                  )}

                  {(contactPhone || contactEmail) && (
                    <div className="pt-2 border-t space-y-1">
                      {contactEmail && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span>{contactEmail}</span>
                        </div>
                      )}
                      {contactPhone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{contactPhone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
        </>
      )}

      {canManageScheduled && activeTab === 'scheduled' && (
        <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div>
                <h2 className="font-heading text-lg font-semibold">Create Scheduled Reminder</h2>
                <p className="text-xs text-muted-foreground">Send giving or pledge reminders by month day or pledge deadline.</p>
              </div>
              <div>
                <label className="text-xs font-medium">Church</label>
                <Select value={scheduledForm.churchId} onValueChange={value => setScheduledForm(prev => ({ ...prev, churchId: value, campaignId: 'all' }))}>
                  <SelectTrigger><SelectValue placeholder="Select church" /></SelectTrigger>
                  <SelectContent>
                    {churches.map(church => <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium">Type</label>
                  <Select value={scheduledForm.type} onValueChange={value => setScheduledForm(prev => ({ ...prev, type: value as any, scheduleKind: value === 'pledge' ? prev.scheduleKind : 'monthly_days' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="giving">Giving</SelectItem>
                      <SelectItem value="pledge">Pledge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium">Audience</label>
                  <Select value={scheduledForm.audience} onValueChange={value => setScheduledForm(prev => ({ ...prev, audience: value as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_members">All members</SelectItem>
                      <SelectItem value="not_given_this_month">Not given this month</SelectItem>
                      <SelectItem value="active_pledges">Active pledges</SelectItem>
                      <SelectItem value="overdue_pledges">Overdue pledges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Campaign</label>
                <Select value={scheduledForm.campaignId} onValueChange={value => setScheduledForm(prev => ({ ...prev, campaignId: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All campaigns</SelectItem>
                    {filteredCampaigns.map(campaign => <SelectItem key={campaign.id} value={campaign.id}>{campaign.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium">Schedule</label>
                <Select value={scheduledForm.scheduleKind} onValueChange={value => setScheduledForm(prev => ({ ...prev, scheduleKind: value as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly_days">Monthly days</SelectItem>
                    <SelectItem value="pledge_deadline">Pledge deadline offsets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {scheduledForm.scheduleKind === 'monthly_days' ? (
                <div>
                  <label className="text-xs font-medium">Days of month</label>
                  <Input value={scheduledForm.scheduleDays} onChange={e => setScheduledForm(prev => ({ ...prev, scheduleDays: e.target.value }))} placeholder="5,6,8" />
                  <p className="mt-1 text-xs text-muted-foreground">Example: 5,6,8 sends on those days every month.</p>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-medium">Deadline offsets</label>
                  <Input value={scheduledForm.deadlineOffsets} onChange={e => setScheduledForm(prev => ({ ...prev, deadlineOffsets: e.target.value }))} placeholder="-7,0,3" />
                  <p className="mt-1 text-xs text-muted-foreground">Use -7 before, 0 on deadline, 3 after deadline.</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  Email
                  <Switch checked={scheduledForm.channelEmail} onCheckedChange={checked => setScheduledForm(prev => ({ ...prev, channelEmail: checked }))} />
                </label>
                <label className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  Push
                  <Switch checked={scheduledForm.channelPush} onCheckedChange={checked => setScheduledForm(prev => ({ ...prev, channelPush: checked }))} />
                </label>
              </div>
              <div>
                <label className="text-xs font-medium">Title</label>
                <Input value={scheduledForm.title} onChange={e => setScheduledForm(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium">Message</label>
                <Textarea rows={4} value={scheduledForm.message} onChange={e => setScheduledForm(prev => ({ ...prev, message: e.target.value }))} />
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Variables: {'{firstName}'} works for all reminders. {'{campaignName}'} works for pledge reminders or when one campaign is selected; with All campaigns it becomes general text. {'{balance}'} and {'{deadline}'} are for pledge reminders only.
                </p>
              </div>
              <Button className="w-full" disabled={scheduledSaving} onClick={handleCreateScheduledReminder}>
                <Plus className="h-4 w-4" /> {scheduledSaving ? 'Saving...' : 'Create Reminder'}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {scheduledLoading ? (
              <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading scheduled reminders...</CardContent></Card>
            ) : scheduledReminders.length === 0 ? (
              <Card><CardContent className="p-6 text-sm text-muted-foreground">No scheduled reminders yet.</CardContent></Card>
            ) : scheduledReminders.map(reminder => (
              <Card key={reminder.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{reminder.title}</h3>
                      <Badge variant={reminder.isActive ? 'default' : 'secondary'}>{reminder.isActive ? 'Active' : 'Paused'}</Badge>
                      <Badge variant="outline">{reminder.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{reminder.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {reminder.scheduleKind === 'monthly_days'
                        ? `Monthly on day(s): ${reminder.scheduleDays.join(', ')}`
                        : `Pledge offsets: ${reminder.deadlineOffsets.join(', ')}`}
                      {' '}· {reminder.channelEmail ? 'Email' : ''}{reminder.channelEmail && reminder.channelPush ? ' + ' : ''}{reminder.channelPush ? 'Push' : ''}
                      {' '}· Sent logs: {reminder._count?.logs ?? 0}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteScheduledReminder(reminder.id)}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {canManageScheduled && activeTab === 'history' && (
        <div className="space-y-3">
          <Card>
            <CardContent className="space-y-3 p-3 sm:p-4">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
                <Select value={logStatusFilter} onValueChange={value => { setLogStatusFilter(value); setScheduledLogPagination(prev => ({ ...prev, page: 1 })); }}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="queued">Queued</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={logChannelFilter} onValueChange={value => { setLogChannelFilter(value); setScheduledLogPagination(prev => ({ ...prev, page: 1 })); }}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Channel" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All channels</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={logReminderFilter} onValueChange={value => { setLogReminderFilter(value); setScheduledLogPagination(prev => ({ ...prev, page: 1 })); }}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Reminder" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All reminders</SelectItem>
                    {scheduledReminders.map(reminder => (
                      <SelectItem key={reminder.id} value={reminder.id}>{reminder.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="date" className="h-9" value={logStartDate} onChange={e => { setLogStartDate(e.target.value); setScheduledLogPagination(prev => ({ ...prev, page: 1 })); }} />
                <Input type="date" className="h-9" value={logEndDate} onChange={e => { setLogEndDate(e.target.value); setScheduledLogPagination(prev => ({ ...prev, page: 1 })); }} />
                <Button
                  variant="outline"
                  className="h-9"
                  onClick={() => {
                    setLogStatusFilter('all');
                    setLogChannelFilter('all');
                    setLogReminderFilter('all');
                    setLogStartDate('');
                    setLogEndDate('');
                    setScheduledLogPagination(prev => ({ ...prev, page: 1 }));
                  }}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {scheduledLogs.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">No scheduled reminder sends found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reminder</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Scheduled For</TableHead>
                      <TableHead className="hidden lg:table-cell">Sent At</TableHead>
                      <TableHead className="hidden xl:table-cell">Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="max-w-[220px] truncate font-medium">{log.reminder.title}</TableCell>
                        <TableCell className="capitalize">{log.channel}</TableCell>
                        <TableCell className="max-w-[220px] truncate text-muted-foreground">{log.recipientEmail || log.userId || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={log.status === 'failed' ? 'destructive' : 'outline'}>{log.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{new Date(log.scheduledFor).toLocaleDateString()}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">{log.sentAt ? new Date(log.sentAt).toLocaleString() : '-'}</TableCell>
                        <TableCell className="hidden xl:table-cell max-w-[260px] truncate text-xs text-destructive">{log.error || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Page {scheduledLogPagination.page} of {Math.max(scheduledLogPagination.totalPages, 1)} · {scheduledLogPagination.total} log(s)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={scheduledLogPagination.page <= 1}
                onClick={() => setScheduledLogPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={scheduledLogPagination.page >= scheduledLogPagination.totalPages}
                onClick={() => setScheduledLogPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;
