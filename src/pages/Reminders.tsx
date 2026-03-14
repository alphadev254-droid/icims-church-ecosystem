import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { getUpcomingReminders, Reminder, ReminderStats } from '@/services/reminders';
import { churchesService, Church } from '@/services/churches';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Gift, Heart, Church as ChurchIcon, Cake, Search, Phone, Mail, Bell, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const EMPTY_STATS: ReminderStats = {
  total: 0,
  birthdays: 0,
  weddings: 0,
  memberAnniversaries: 0,
  churchFounded: 0,
  events: 0,
};

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

  // Derive permission as a stable boolean — not the function reference
  const canReadReminders = hasPermission('reminders:read');

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
    const query = searchQuery.toLowerCase();
    
    // Search filter only (church filter is handled by backend)
    // For event reminders
    if (r.type === 'event') {
      const eventTitle = r.event?.title?.toLowerCase() ?? r.eventTitle?.toLowerCase() ?? '';
      return eventTitle.includes(query);
    }
    
    // For other reminders with user object
    if (r.user) {
      const fullName = `${r.user.firstName} ${r.user.lastName}`.toLowerCase();
      return fullName.includes(query);
    }
    
    return false;
  });

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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Birthdays</p>
                <p className="text-2xl font-bold">{stats.birthdays}</p>
              </div>
              <Cake className="h-8 w-8 text-pink-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Weddings</p>
                <p className="text-2xl font-bold">{stats.weddings}</p>
              </div>
              <Heart className="h-8 w-8 text-red-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Anniversaries</p>
                <p className="text-2xl font-bold">{stats.memberAnniversaries}</p>
              </div>
              <Gift className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Events</p>
                <p className="text-2xl font-bold">{stats.events}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        {stats.churchFounded > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Church Founded</p>
                  <p className="text-2xl font-bold">{stats.churchFounded}</p>
                </div>
                <ChurchIcon className="h-8 w-8 text-purple-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {!isMember && churches.length > 0 && (
              <Select value={selectedChurch} onValueChange={setSelectedChurch}>
                <SelectTrigger className="w-full md:w-48">
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
              <SelectTrigger className="w-full md:w-48">
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
              <SelectTrigger className="w-full md:w-40">
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
              : (reminder.user ? `${reminder.user.firstName} ${reminder.user.lastName}` : 'Unknown');
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

                  <h3 className="font-heading font-semibold mb-1">
                    {displayName}
                  </h3>

                  {isEvent && reminder.event?.location && (
                    <p className="text-sm text-muted-foreground mb-2">{reminder.event.location}</p>
                  )}

                  {!isEvent && (reminder.age || reminder.years) && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {reminder.age  && `Turning ${reminder.age}`}
                      {reminder.years && `${reminder.years} ${reminder.years === 1 ? 'year' : 'years'}`}
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
                    <div className="flex gap-2 pt-2 border-t">
                      {contactPhone && (
                        <a
                          href={`tel:${contactPhone}`}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs border rounded-md hover:bg-accent transition-colors"
                          title="Call"
                        >
                          <Phone className="h-3 w-3" /> Call
                        </a>
                      )}
                      {contactEmail && (
                        <a
                          href={`mailto:${contactEmail}`}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs border rounded-md hover:bg-accent transition-colors"
                          title="Email"
                        >
                          <Mail className="h-3 w-3" /> Email
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Reminders;