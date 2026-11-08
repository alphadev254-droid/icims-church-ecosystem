import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { churchesService } from '@/services/churches';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ChurchMultiSelectProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  required?: boolean;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  helpText?: string;
}

export function ChurchMultiSelect({
  value,
  onValueChange,
  required = true,
  label = 'Churches',
  placeholder = 'Select churches',
  disabled = false,
  helpText = 'Members in every selected church will receive this post.',
}: ChurchMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const { data: churches = [], isLoading } = useQuery({
    queryKey: ['churches-select'],
    queryFn: churchesService.getSelectable,
  });

  const selectedChurches = churches.filter(church => value.includes(church.id));
  const toggleChurch = (churchId: string) => {
    onValueChange(
      value.includes(churchId)
        ? value.filter(id => id !== churchId)
        : [...value, churchId],
    );
  };

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={isLoading || disabled}
            className="h-auto min-h-10 w-full justify-between px-3 py-2 font-normal"
          >
            <span className={cn('truncate', value.length === 0 && 'text-muted-foreground')}>
              {isLoading
                ? 'Loading churches...'
                : value.length === 0
                  ? placeholder
                  : `${value.length} ${value.length === 1 ? 'church' : 'churches'} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search churches..." />
            <CommandList>
              <CommandEmpty>No churches found.</CommandEmpty>
              <CommandGroup>
                {churches.map(church => {
                  const selected = value.includes(church.id);
                  return (
                    <CommandItem
                      key={church.id}
                      value={`${church.name} ${church.location ?? ''}`}
                      onSelect={() => toggleChurch(church.id)}
                    >
                      <Check className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                      <span className="truncate">{church.name}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedChurches.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedChurches.map(church => (
            <Badge key={church.id} variant="secondary" className="gap-1 pr-1">
              <span className="max-w-48 truncate">{church.name}</span>
              <button
                type="button"
                onClick={() => toggleChurch(church.id)}
                disabled={disabled}
                className="rounded-sm p-0.5 hover:bg-background/70"
                aria-label={`Remove ${church.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
    </div>
  );
}
