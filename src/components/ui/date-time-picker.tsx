import * as React from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toDateTimeLocalInputValue } from '@/lib/date-time';

type Props = {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  popoverSide?: 'top' | 'right' | 'bottom' | 'left';
  presentation?: 'popover' | 'centered';
};

function getDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function getTime(value?: string) {
  const date = getDate(value);
  if (!date) return '09:00';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function getDateInputValue(date?: Date) {
  if (!date) return '';
  return format(date, 'yyyy-MM-dd');
}

function combineDateAndTime(date: Date, time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const next = new Date(date);
  next.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return toDateTimeLocalInputValue(next);
}

function combineDateInputAndTime(dateValue: string, time: string, fallbackDate?: Date) {
  const [year, month, day] = dateValue.split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return fallbackDate ? combineDateAndTime(fallbackDate, time) : '';
  }
  return combineDateAndTime(new Date(year, month - 1, day), time);
}

export function DateTimePicker({ value, onChange, disabled, placeholder = 'Pick date and time', className, popoverSide = 'bottom', presentation = 'popover' }: Props) {
  const [open, setOpen] = React.useState(false);
  const selected = getDate(value);
  const time = getTime(value);

  React.useEffect(() => {
    if (!open || presentation !== 'centered') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, presentation]);

  const triggerButton = (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={presentation === 'centered' ? () => setOpen(true) : undefined}
      className={cn('h-10 w-full justify-start gap-2 px-3 text-left font-normal', !selected && 'text-muted-foreground', className)}
    >
      <CalendarIcon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 truncate">
        {selected ? format(selected, 'MMM d, yyyy h:mm a') : placeholder}
      </span>
    </Button>
  );

  const directDateTimeControls = (
    <div className="grid gap-3 border-b p-3 sm:grid-cols-[1fr_8.5rem]">
      <div className="space-y-1.5">
        <div className="text-xs font-medium text-muted-foreground">Date</div>
        <Input
          type="date"
          value={getDateInputValue(selected)}
          onChange={(event) => onChange(combineDateInputAndTime(event.target.value, time, selected))}
          className="h-10"
        />
      </div>
      <div className="space-y-1.5">
        <div className="text-xs font-medium text-muted-foreground">Time</div>
        <Input
          type="time"
          value={time}
          onChange={(event) => onChange(combineDateAndTime(selected || new Date(), event.target.value))}
          className="h-10"
        />
      </div>
    </div>
  );

  const pickerPanel = (
    <>
      <Calendar
        mode="single"
        selected={selected}
        onSelect={(date) => {
          if (!date) return;
          onChange(combineDateAndTime(date, time));
        }}
        initialFocus
      />
      <div className="flex items-center gap-2 border-t p-3">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Input
          type="time"
          value={time}
          onChange={(event) => onChange(combineDateAndTime(selected || new Date(), event.target.value))}
          className="h-9"
        />
      </div>
    </>
  );

  if (presentation === 'centered') {
    return (
      <>
        {triggerButton}
        {open && createPortal(
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-background/70 p-3 backdrop-blur-sm"
            onMouseDown={() => setOpen(false)}
          >
            <div
              className="max-h-[calc(100svh-2rem)] w-[min(22rem,calc(100vw-1.5rem))] overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-xl"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="border-b px-4 py-3 text-sm font-semibold">Pick date and time</div>
              {directDateTimeControls}
              {pickerPanel}
              <div className="flex justify-end border-t p-3">
                <Button type="button" size="sm" onClick={() => setOpen(false)}>Done</Button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {triggerButton}
      </PopoverTrigger>
      <PopoverContent
        className="max-h-[calc(100svh-2rem)] w-auto overflow-y-auto p-0"
        align="start"
        side={popoverSide}
        collisionPadding={16}
      >
        {pickerPanel}
      </PopoverContent>
    </Popover>
  );
}
