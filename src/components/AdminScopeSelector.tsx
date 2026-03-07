import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { locationsService } from '@/services/locations';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AdminScopeSelectorProps {
  role: 'district_overseer' | 'local_admin' | 'regional_leader';
  districts: string[];
  tas: string[];
  regions: string[];
  onDistrictsChange: (v: string[]) => void;
  onTAsChange: (v: string[]) => void;
  onRegionsChange: (v: string[]) => void;
}

export function AdminScopeSelector({
  role,
  districts,
  tas,
  regions,
  onDistrictsChange,
  onTAsChange,
  onRegionsChange,
}: AdminScopeSelectorProps) {
  const [selectedDistrict, setSelectedDistrict] = useState(districts[0] || '');

  useEffect(() => {
    if (districts.length > 0 && districts[0] !== selectedDistrict) {
      setSelectedDistrict(districts[0]);
    }
  }, [districts]);

  const { data: allRegions = [] } = useQuery({
    queryKey: ['all-regions'],
    queryFn: locationsService.getRegions,
  });

  const { data: allDistricts = [] } = useQuery({
    queryKey: ['all-districts'],
    queryFn: async () => {
      const regs = await locationsService.getRegions();
      const allDists: string[] = [];
      for (const r of regs) {
        const d = await locationsService.getDistricts(r);
        allDists.push(...d);
      }
      return [...new Set(allDists)].sort();
    },
  });

  const { data: availableTAs = [] } = useQuery({
    queryKey: ['tas-for-district', selectedDistrict],
    queryFn: () => locationsService.getTAs(selectedDistrict),
    enabled: role === 'local_admin' && !!selectedDistrict,
  });

  const isRegionAll = regions.includes('__all__');
  const isDistrictAll = districts.includes('__all__');
  const isTAAll = tas.includes('__all__');

  if (role === 'regional_leader') {
    return (
      <div className="space-y-2">
        <Label>Regions <span className="text-destructive">*</span></Label>
        <div className="rounded-md border p-3 space-y-2 max-h-44 overflow-y-auto bg-muted/20">
          <div className="flex items-center gap-2">
            <Checkbox
              id="region-all"
              checked={isRegionAll}
              onCheckedChange={c => onRegionsChange(c ? ['__all__'] : [])}
            />
            <label htmlFor="region-all" className="text-sm font-medium cursor-pointer">
              All Regions
            </label>
          </div>
          <div className="border-t pt-2 space-y-1.5">
            {allRegions.map(reg => (
              <div key={reg} className="flex items-center gap-2">
                <Checkbox
                  id={`reg-${reg}`}
                  checked={!isRegionAll && regions.includes(reg)}
                  onCheckedChange={c => {
                    if (isRegionAll) {
                      onRegionsChange(c ? [reg] : []);
                    } else {
                      onRegionsChange(c ? [...regions, reg] : regions.filter(r => r !== reg));
                    }
                  }}
                  disabled={isRegionAll}
                />
                <label htmlFor={`reg-${reg}`} className="text-sm cursor-pointer">{reg}</label>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (role === 'district_overseer') {
    return (
      <div className="space-y-2">
        <Label>Districts <span className="text-destructive">*</span></Label>
        <div className="rounded-md border p-3 space-y-2 max-h-44 overflow-y-auto bg-muted/20">
          <div className="flex items-center gap-2">
            <Checkbox
              id="district-all"
              checked={isDistrictAll}
              onCheckedChange={c => onDistrictsChange(c ? ['__all__'] : [])}
            />
            <label htmlFor="district-all" className="text-sm font-medium cursor-pointer">
              All Districts
            </label>
          </div>
          <div className="border-t pt-2 space-y-1.5">
            {allDistricts.map(dist => (
              <div key={dist} className="flex items-center gap-2">
                <Checkbox
                  id={`dist-${dist}`}
                  checked={!isDistrictAll && districts.includes(dist)}
                  onCheckedChange={c => {
                    if (isDistrictAll) {
                      onDistrictsChange(c ? [dist] : []);
                    } else {
                      onDistrictsChange(c ? [...districts, dist] : districts.filter(d => d !== dist));
                    }
                  }}
                  disabled={isDistrictAll}
                />
                <label htmlFor={`dist-${dist}`} className="text-sm cursor-pointer">{dist}</label>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Local Admin: Single district selection, then TAs
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>District <span className="text-destructive">*</span></Label>
        <Select 
          value={selectedDistrict} 
          onValueChange={(dist) => {
            setSelectedDistrict(dist);
            onDistrictsChange([dist]);
            if (tas.length === 0) {
              onTAsChange([]);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select district" />
          </SelectTrigger>
          <SelectContent>
            {allDistricts.map(d => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedDistrict && (
        <div className="space-y-2">
          <Label>Traditional Authority(ies) <span className="text-destructive">*</span></Label>
          <div className="rounded-md border p-3 space-y-2 max-h-44 overflow-y-auto bg-muted/20">
            <div className="flex items-center gap-2">
              <Checkbox
                id="ta-all"
                checked={isTAAll}
                onCheckedChange={c => onTAsChange(c ? ['__all__'] : [])}
              />
              <label htmlFor="ta-all" className="text-sm font-medium cursor-pointer">
                All Traditional Authorities
              </label>
            </div>
            <div className="border-t pt-2 space-y-1.5">
              {availableTAs.map(ta => (
                <div key={ta} className="flex items-center gap-2">
                  <Checkbox
                    id={`ta-${ta}`}
                    checked={!isTAAll && tas.includes(ta)}
                    onCheckedChange={c => {
                      if (isTAAll) {
                        onTAsChange(c ? [ta] : []);
                      } else {
                        onTAsChange(c ? [...tas, ta] : tas.filter(t => t !== ta));
                      }
                    }}
                    disabled={isTAAll}
                  />
                  <label htmlFor={`ta-${ta}`} className="text-sm cursor-pointer">{ta}</label>
                </div>
              ))}
              {availableTAs.length === 0 && (
                <p className="text-xs text-muted-foreground">Loading...</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
