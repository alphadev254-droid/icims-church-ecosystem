import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AgeRangeFilterProps {
  minAge: number | undefined;
  maxAge: number | undefined;
  onMinAgeChange: (value: number | undefined) => void;
  onMaxAgeChange: (value: number | undefined) => void;
  onClear: () => void;
}

export function AgeRangeFilter({ minAge, maxAge, onMinAgeChange, onMaxAgeChange, onClear }: AgeRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [tempMin, setTempMin] = useState<string>(minAge?.toString() || '');
  const [tempMax, setTempMax] = useState<string>(maxAge?.toString() || '');

  const hasFilter = minAge !== undefined || maxAge !== undefined;

  const handleApply = () => {
    onMinAgeChange(tempMin ? parseInt(tempMin) : undefined);
    onMaxAgeChange(tempMax ? parseInt(tempMax) : undefined);
    setOpen(false);
  };

  const handleClear = () => {
    setTempMin('');
    setTempMax('');
    onClear();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 relative">
          <Filter className="h-4 w-4" />
          Age Range
          {hasFilter && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {minAge || 0}-{maxAge || '∞'}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Filter by Age Range</h4>
            {hasFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minAge" className="text-xs">Min Age</Label>
              <Input
                id="minAge"
                type="number"
                min="0"
                max="120"
                placeholder="e.g., 17"
                value={tempMin}
                onChange={(e) => setTempMin(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAge" className="text-xs">Max Age</Label>
              <Input
                id="maxAge"
                type="number"
                min="0"
                max="120"
                placeholder="e.g., 45"
                value={tempMax}
                onChange={(e) => setTempMax(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            {tempMin && tempMax ? (
              <p>Show users aged {tempMin} to {tempMax} years</p>
            ) : tempMin ? (
              <p>Show users aged {tempMin} years and above</p>
            ) : tempMax ? (
              <p>Show users aged {tempMax} years and below</p>
            ) : (
              <p>Enter age range to filter users</p>
            )}
          </div>

          <Button onClick={handleApply} className="w-full" size="sm">
            Apply Filter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
