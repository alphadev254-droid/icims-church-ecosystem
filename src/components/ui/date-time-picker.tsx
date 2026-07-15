import * as React from 'react';
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

function combineDateAndTime(date: Date, time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const next = new Date(date);
  next.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return toDateTimeLocalInputValue(next);
}

export function DateTimePicker({ value, onChange, disabled, placeholder = 'Pick date and time', className }: Props) {
  const [open, setOpen] = React.useState(false);
  const selected = getDate(value);
  const time = getTime(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn('h-10 w-full justify-start gap-2 px-3 text-left font-normal', !selected && 'text-muted-foreground', className)}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span className="min-w-0 truncate">
            {selected ? format(selected, 'MMM d, yyyy h:mm a') : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
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
      </PopoverContent>
    </Popover>
  );
}
