import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addMonths, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Circle, Download, Filter, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { calendarService, CalendarActivity, CalendarActivityType } from '@/services/calendar';
import { churchesService } from '@/services/churches';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { PACKAGE_FEATURES } from '@/lib/package-features';
import { ExportImportButtons } from '@/components/ExportImportButtons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ACTIVITY_TYPES: Array<{ value: CalendarActivityType; label: string; color: string }> = [
  { value: 'event', label: 'Events', color: 'bg-blue-500' },
  { value: 'attendance', label: 'Services', color: 'bg-emerald-500' },
  { value: 'cell_meeting', label: 'Cell Meetings', color: 'bg-amber-500' },
  { value: 'reminder', label: 'Reminders', color: 'bg-pink-500' },
  { value: 'giving_deadline', label: 'Giving Deadlines', color: 'bg-violet-500' },
  { value: 'pledge_due', label: 'Pledge Due Dates', color: 'bg-red-500' },
];

function toDateInput(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function getMonthDays(month: Date) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfMonth(month);
  const days: Date[] = [];
  const current = new Date(start);

  while (current <= end || days.length % 7 !== 0) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

function activityLabel(type: CalendarActivityType) {
  return ACTIVITY_TYPES.find(item => item.value === type)?.label ?? type;
}

function activityColor(type: CalendarActivityType) {
  return ACTIVITY_TYPES.find(item => item.value === type)?.color ?? 'bg-muted-foreground';
}

function activityDate(activity: CalendarActivity) {
  return new Date(activity.startsAt);
}

export default function CalendarPage() {
  const { user } = useAuth();
  const { hasPermission } = useRole();
  const hasCalendarFeature = useHasFeature(PACKAGE_FEATURES.CALENDAR);
  const isMember = user?.roleName === 'member';
  const canReadCalendar = hasPermission('calendar:read');
  const canExportCalendar = hasPermission('calendar:export');
  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [churchId, setChurchId] = useState('all');
  const [selectedTypes, setSelectedTypes] = useState<CalendarActivityType[]>(ACTIVITY_TYPES.map(type => type.value));

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  const { data: churches = [] } = useQuery({
    queryKey: ['churches', 'calendar'],
    queryFn: churchesService.getSelectable,
    enabled: !isMember && canReadCalendar,
  });

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['calendar-activities', toDateInput(monthStart), toDateInput(monthEnd), churchId, selectedTypes],
    queryFn: () => calendarService.getActivities({
      startDate: toDateInput(monthStart),
      endDate: toDateInput(monthEnd),
      churchId: churchId !== 'all' ? churchId : undefined,
      types: selectedTypes,
    }),
    enabled: canReadCalendar && hasCalendarFeature && selectedTypes.length > 0,
  });

  const days = useMemo(() => getMonthDays(month), [month]);
  const selectedDayActivities = activities.filter(activity => isSameDay(activityDate(activity), selectedDay));
  const exportRows = activities.map(activity => ({
    date: format(activityDate(activity), 'yyyy-MM-dd'),
    type: activityLabel(activity.type),
    title: activity.title,
    church: activity.churchName || '',
    status: activity.status || '',
  }));

  if (!canReadCalendar) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Calendar</h1>
        <p className="text-sm text-muted-foreground">You don't have permission to view the calendar.</p>
      </div>
    );
  }

  if (!hasCalendarFeature) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Calendar</h1>
          <p className="text-sm text-muted-foreground">Church activities, meetings, reminders, and due dates.</p>
        </div>
        <Alert className="border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Calendar is not available in your current package.{' '}
            <Link to="/dashboard/packages" className="font-medium underline">Upgrade now</Link>
            {' '}to unlock the calendar.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold sm:text-2xl">Calendar</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {activities.length} activities in {format(month, 'MMMM yyyy')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isMember && churches.length > 0 && (
            <Select value={churchId} onValueChange={setChurchId}>
              <SelectTrigger className="h-9 w-44 text-xs sm:text-sm">
                <SelectValue placeholder="All churches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {churches.map(church => (
                  <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {canExportCalendar && (
            <ExportImportButtons
              data={exportRows}
              filename={`calendar-${format(month, 'yyyy-MM')}`}
              headers={[
                { label: 'Date', key: 'date' },
                { label: 'Type', key: 'type' },
                { label: 'Title', key: 'title' },
                { label: 'Church', key: 'church' },
                { label: 'Status', key: 'status' },
              ]}
              pdfTitle={`Calendar - ${format(month, 'MMMM yyyy')}`}
            />
          )}
          {!canExportCalendar && (
            <Button variant="outline" size="sm" disabled className="h-8 gap-1 text-xs">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setMonth(subMonths(month, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-40 text-center text-sm font-semibold sm:text-base">{format(month, 'MMMM yyyy')}</div>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setMonth(addMonths(month, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setMonth(new Date()); setSelectedDay(new Date()); }}>
                Today
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Filter className="h-3.5 w-3.5" /> Types
              </span>
              {ACTIVITY_TYPES.map(type => (
                <label key={type.value} className="flex items-center gap-1.5">
                  <Checkbox
                    checked={selectedTypes.includes(type.value)}
                    onCheckedChange={(checked) => {
                      setSelectedTypes(prev => checked
                        ? [...prev, type.value]
                        : prev.filter(value => value !== type.value));
                    }}
                  />
                  <span className="inline-flex items-center gap-1">
                    <span className={`h-2 w-2 rounded-full ${type.color}`} />
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardContent className="p-2 sm:p-4">
            <div className="grid grid-cols-7 border-b text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="py-2">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map(day => {
                const dayActivities = activities.filter(activity => isSameDay(activityDate(activity), day));
                const selected = isSameDay(day, selectedDay);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`min-h-[92px] border-b border-r p-2 text-left transition hover:bg-muted/60 sm:min-h-[118px] ${selected ? 'bg-accent/10 ring-1 ring-inset ring-accent' : ''} ${!isSameMonth(day, month) ? 'bg-muted/30 text-muted-foreground' : ''}`}
                  >
                    <span className="text-xs font-medium sm:text-sm">{format(day, 'd')}</span>
                    <div className="mt-2 space-y-1">
                      {dayActivities.slice(0, 3).map(activity => (
                        <div key={activity.id} className="flex items-center gap-1 truncate text-[11px]">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${activityColor(activity.type)}`} />
                          <span className="truncate">{activity.title}</span>
                        </div>
                      ))}
                      {dayActivities.length > 3 && (
                        <div className="text-[11px] text-muted-foreground">+{dayActivities.length - 3} more</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-4">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-accent" />
                <h2 className="font-heading text-base font-semibold">{format(selectedDay, 'EEEE, MMMM d')}</h2>
              </div>
              <p className="text-xs text-muted-foreground">{selectedDayActivities.length} activities scheduled</p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
              </div>
            ) : selectedDayActivities.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nothing scheduled for this day.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayActivities.map(activity => (
                  <div key={activity.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Circle className={`h-2.5 w-2.5 fill-current ${activityColor(activity.type).replace('bg-', 'text-')}`} />
                          <Badge variant="secondary" className="text-[11px]">{activityLabel(activity.type)}</Badge>
                        </div>
                        <h3 className="mt-2 truncate text-sm font-semibold">{activity.title}</h3>
                        <p className="text-xs text-muted-foreground">{activity.churchName || 'Church'}</p>
                      </div>
                      {activity.status && <Badge variant="outline" className="text-[11px]">{activity.status}</Badge>}
                    </div>
                    {activity.description && (
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{activity.description}</p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">{format(activityDate(activity), 'p')}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
