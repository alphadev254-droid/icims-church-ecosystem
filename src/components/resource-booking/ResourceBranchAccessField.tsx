import type { Church } from '@/services/churches';
import type { ResourceInput } from '@/services/resourceBooking';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ResourceScope = ResourceInput['scope'];

interface ResourceBranchAccessFieldProps {
  branches: Church[];
  ownerChurchId: string;
  scope: ResourceScope;
  selectedChurchIds: string[];
  onChange: (scope: ResourceScope, churchIds: string[]) => void;
}

export function ResourceBranchAccessField({
  branches,
  ownerChurchId,
  scope,
  selectedChurchIds,
  onChange,
}: ResourceBranchAccessFieldProps) {
  const selected = new Set(selectedChurchIds);
  const additionalBranchCount = selectedChurchIds.filter(
    churchId => churchId !== ownerChurchId,
  ).length;

  const changeScope = (nextScope: ResourceScope) => {
    onChange(
      nextScope,
      nextScope === 'selected_churches'
        ? [...new Set([ownerChurchId, ...selectedChurchIds].filter(Boolean))]
        : [],
    );
  };

  const toggleBranch = (churchId: string, checked: boolean) => {
    const next = checked
      ? [...new Set([ownerChurchId, ...selectedChurchIds, churchId].filter(Boolean))]
      : selectedChurchIds.filter(id => id !== churchId || id === ownerChurchId);
    onChange(scope, next);
  };

  return (
    <div className="space-y-2 md:col-span-2">
      <Label>Who can book it?</Label>
      <Select value={scope} onValueChange={value => changeScope(value as ResourceScope)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="own_church">Only this branch</SelectItem>
          <SelectItem value="selected_churches">Selected branches</SelectItem>
          <SelectItem value="all_ministry">All ministry branches</SelectItem>
        </SelectContent>
      </Select>

      {scope === 'selected_churches' && (
        <div className="max-h-48 overflow-y-auto rounded-md border">
          {branches.map(branch => {
            const isOwner = branch.id === ownerChurchId;
            const checked = isOwner || selected.has(branch.id);
            return (
              <label
                key={branch.id}
                className="flex cursor-pointer items-center gap-3 border-b px-3 py-2.5 text-sm last:border-b-0 hover:bg-muted/40"
              >
                <Checkbox
                  checked={checked}
                  disabled={isOwner}
                  onCheckedChange={value => toggleBranch(branch.id, value === true)}
                />
                <span className="min-w-0 flex-1 truncate">{branch.name}</span>
                {isOwner && (
                  <span className="text-xs text-muted-foreground">Owning branch</span>
                )}
              </label>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {scope === 'own_church' && 'Only the owning branch can request this item.'}
        {scope === 'all_ministry' && 'Every ministry branch can request this item.'}
        {scope === 'selected_churches' &&
          (additionalBranchCount
            ? `${additionalBranchCount} additional branch${additionalBranchCount === 1 ? '' : 'es'} selected.`
            : 'Select at least one additional branch.')}
      </p>
    </div>
  );
}
