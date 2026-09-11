import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';

export function dateFromScheduleInput(value?: string | null) {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

export function scheduleInputFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function scheduleInputInTimeZone(value: string | Date, timezone = 'UTC') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function normalizeScheduleDates(values: string[]) {
  return [...new Set(values.filter(value => dateFromScheduleInput(value)))].sort();
}

type ExactDateSchedulePickerProps = {
  value: string[];
  onChange: (dates: string[]) => void;
  minimumDate?: string;
  defaultDate?: string;
  label?: string;
  description?: string;
  emptyMessage?: string;
};

export function ExactDateSchedulePicker({
  value,
  onChange,
  minimumDate,
  defaultDate,
  label = 'Dates',
  description = 'Select every calendar date when this item should occur.',
  emptyMessage = 'No dates selected',
}: ExactDateSchedulePickerProps) {
  const normalized = normalizeScheduleDates(value);
  const selected = normalized
    .map(dateFromScheduleInput)
    .filter((date): date is Date => Boolean(date));
  const minimum = dateFromScheduleInput(minimumDate);

  return (
    <div>
      <Label>{label}</Label>
      <p className="mb-2 text-xs text-muted-foreground">{description}</p>
      <div className="rounded-md border border-border bg-background/40">
        <Calendar
          mode="multiple"
          selected={selected}
          defaultMonth={selected[0] ?? dateFromScheduleInput(defaultDate) ?? minimum}
          onSelect={dates => onChange(normalizeScheduleDates((dates ?? []).map(scheduleInputFromDate)))}
          disabled={minimum ? { before: minimum } : undefined}
          className="mx-auto w-fit max-w-full"
        />
        <div className="space-y-2 border-t px-3 py-2">
          <p className="text-xs text-muted-foreground">
            {normalized.length > 0
              ? `${normalized.length} date${normalized.length === 1 ? '' : 's'} selected`
              : emptyMessage}
          </p>
          {normalized.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {normalized.map(date => {
                const parsed = dateFromScheduleInput(date);
                return (
                  <Badge key={date} variant="secondary" className="gap-1">
                    {parsed?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) ?? date}
                    <button
                      type="button"
                      aria-label={`Remove ${date}`}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                      onClick={() => onChange(normalized.filter(item => item !== date))}
                    >
                      ×
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
