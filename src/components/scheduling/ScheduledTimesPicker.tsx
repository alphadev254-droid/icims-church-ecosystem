import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function defaultLocalDateTime() {
  const now = new Date();
  const candidate = new Date(now);
  candidate.setMinutes(0, 0, 0);
  candidate.setHours(candidate.getHours() + 1);
  const offset = candidate.getTimezoneOffset() * 60_000;
  return new Date(candidate.getTime() - offset).toISOString().slice(0, 16);
}

function formatLocalDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function ScheduledTimesPicker({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const [draft, setDraft] = useState(defaultLocalDateTime);
  const minimum = useMemo(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  }, []);

  const add = () => {
    if (!draft || new Date(draft).getTime() <= Date.now()) return;
    onChange([...new Set([...value, draft])].sort());
    setDraft(defaultLocalDateTime());
  };

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <div>
        <Label>Selected send times</Label>
        <p className="text-xs text-muted-foreground">Add each exact date and time when this same communication should be sent.</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input type="datetime-local" min={minimum} value={draft} onChange={event => setDraft(event.target.value)} />
        <Button type="button" variant="secondary" onClick={add}>Add send time</Button>
      </div>
      {value.length === 0 ? (
        <p className="text-xs text-muted-foreground">No send times added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {value.map(item => (
            <span key={item} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs">
              {formatLocalDateTime(item)}
              <button type="button" aria-label={`Remove ${formatLocalDateTime(item)}`} onClick={() => onChange(value.filter(entry => entry !== item))}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
