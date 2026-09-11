import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { dateFromScheduleInput, scheduleInputFromDate } from './ExactDateSchedulePicker';

export type ScheduleOccurrenceRange = {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
};

type Props = {
  value: ScheduleOccurrenceRange[];
  onChange: (ranges: ScheduleOccurrenceRange[]) => void;
  minimumDate: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
};

function sortRanges(ranges: ScheduleOccurrenceRange[]) {
  return [...ranges].sort((left, right) =>
    `${left.startDate}T${left.startTime}`.localeCompare(`${right.startDate}T${right.startTime}`));
}

function sameDay(left?: Date, right?: Date) {
  return Boolean(left && right
    && left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate());
}

function initialSelection(minimumDate: string, startTime: string): DateRange | undefined {
  const minimum = dateFromScheduleInput(minimumDate);
  if (!minimum) return undefined;

  const [hours, minutes] = startTime.split(':').map(Number);
  const proposedStart = new Date(minimum);
  proposedStart.setHours(hours || 0, minutes || 0, 0, 0);
  const selected = proposedStart.getTime() > Date.now()
    ? minimum
    : new Date(minimum.getFullYear(), minimum.getMonth(), minimum.getDate() + 1);
  return { from: selected, to: selected };
}

export function OccurrenceRangePicker({ value, onChange, minimumDate, defaultStartTime = '09:00', defaultEndTime = '10:00' }: Props) {
  const [dates, setDates] = useState<DateRange | undefined>(() => initialSelection(minimumDate, defaultStartTime));
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState('');

  const saveRange = () => {
    if (!dates?.from) return setError('Select a start date.');
    const startDate = scheduleInputFromDate(dates.from);
    const endDate = scheduleInputFromDate(dates.to ?? dates.from);
    const next = { startDate, endDate, startTime, endTime };
    if (`${endDate}T${endTime}` <= `${startDate}T${startTime}`) return setError('End must be after the occurrence start.');

    const otherRanges = value.filter((_, index) => index !== editingIndex);
    const overlaps = otherRanges.some(range =>
      `${next.startDate}T${next.startTime}` < `${range.endDate}T${range.endTime}`
      && `${next.endDate}T${next.endTime}` > `${range.startDate}T${range.startTime}`);
    if (overlaps) return setError('This occurrence overlaps another selected range.');

    onChange(sortRanges(editingIndex === null
      ? [...value, next]
      : value.map((range, index) => index === editingIndex ? next : range)));
    setDates(undefined);
    setEditingIndex(null);
    setError('');
  };

  const editRange = (range: ScheduleOccurrenceRange, index: number) => {
    setDates({ from: dateFromScheduleInput(range.startDate), to: dateFromScheduleInput(range.endDate) });
    setStartTime(range.startTime);
    setEndTime(range.endTime);
    setEditingIndex(index);
    setError('');
  };

  const selectDates = (next: DateRange | undefined, selectedDay: Date) => {
    if (!dates?.from) {
      setDates(next);
      return;
    }

    if (sameDay(selectedDay, dates.from)) {
      setDates(dates.to && !sameDay(dates.from, dates.to) ? { from: dates.to, to: dates.to } : undefined);
      return;
    }
    if (dates.to && sameDay(selectedDay, dates.to)) {
      setDates({ from: dates.from, to: dates.from });
      return;
    }

    setDates(next);
  };

  const removeSelectedEndpoint = (endpoint: 'start' | 'end') => {
    if (!dates?.from) return;
    if (!dates.to || sameDay(dates.from, dates.to)) {
      setDates(undefined);
    } else if (endpoint === 'start') {
      setDates({ from: dates.to, to: dates.to });
    } else {
      setDates({ from: dates.from, to: dates.from });
    }
    setError('');
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Occurrence range</Label>
        <p className="mb-2 text-xs text-muted-foreground">Select an uninterrupted start and end range, set its times, then add it.</p>
        <div className="rounded-md border border-border bg-background/40">
          <Calendar
            mode="range"
            selected={dates}
            onSelect={selectDates}
            disabled={{ before: dateFromScheduleInput(minimumDate)! }}
            defaultMonth={dates?.from ?? dateFromScheduleInput(minimumDate)}
            numberOfMonths={1}
            className="mx-auto w-fit max-w-full"
            classNames={{
              day_today: 'bg-transparent text-foreground ring-2 ring-inset ring-primary/70 hover:bg-accent/40 aria-selected:bg-primary aria-selected:text-primary-foreground',
            }}
          />
          <div className="space-y-2 border-t px-3 py-2">
            <p className="text-xs text-muted-foreground">Selected range</p>
            {dates?.from ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  Start: {scheduleInputFromDate(dates.from)}
                  <button
                    type="button"
                    aria-label="Remove selected start date"
                    className="ml-1 text-muted-foreground hover:text-foreground"
                    onClick={() => removeSelectedEndpoint('start')}
                  >
                    ×
                  </button>
                </Badge>
                {dates.to && !sameDay(dates.from, dates.to) && (
                  <Badge variant="secondary" className="gap-1">
                    End: {scheduleInputFromDate(dates.to)}
                    <button
                      type="button"
                      aria-label="Remove selected end date"
                      className="ml-1 text-muted-foreground hover:text-foreground"
                      onClick={() => removeSelectedEndpoint('end')}
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No date selected</p>
            )}
          </div>
          <div className="grid gap-3 border-t p-3 sm:grid-cols-2">
            <div><Label>Start time</Label><Input type="time" value={startTime} onChange={event => setStartTime(event.target.value)} /></div>
            <div><Label>End time</Label><Input type="time" value={endTime} onChange={event => setEndTime(event.target.value)} /></div>
          </div>
          <div className="border-t p-3">
            <Button type="button" className="w-full" onClick={saveRange} disabled={!dates?.from || !startTime || !endTime}>
              {editingIndex === null ? 'Add occurrence' : 'Update occurrence'}
            </Button>
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">{value.length} occurrence{value.length === 1 ? '' : 's'} added</p>
        {value.map((range, index) => (
          <div key={`${range.startDate}-${range.startTime}-${range.endDate}-${range.endTime}`} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline">{index + 1}</Badge>
              <span>{range.startDate} {range.startTime}</span>
              <span className="text-muted-foreground">to</span>
              <span>{range.endDate} {range.endTime}</span>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => editRange(range, index)}>Edit</Button>
              <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
