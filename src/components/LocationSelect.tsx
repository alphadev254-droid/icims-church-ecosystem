import { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { locationsService } from '@/services/locations';

export type LocationValue = {
  region?: string;
  district?: string;
  traditionalAuthority?: string;
  village?: string;
};

interface LocationSelectProps {
  defaultValues?: LocationValue;
  onChange?: (value: LocationValue) => void;
  required?: {
    region?: boolean;
    district?: boolean;
    traditionalAuthority?: boolean;
    village?: boolean;
  };
  errors?: {
    region?: string;
    district?: string;
    traditionalAuthority?: string;
    village?: string;
  };
}

export function LocationSelect({
  defaultValues = {},
  onChange,
  required = { region: true, district: true, traditionalAuthority: true },
  errors = {},
}: LocationSelectProps) {
  const [selectedRegion, setSelectedRegion] = useState(defaultValues.region || '');
  const [selectedDistrict, setSelectedDistrict] = useState(defaultValues.district || '');
  const [selectedTA, setSelectedTA] = useState(defaultValues.traditionalAuthority || '');
  const [selectedVillage, setSelectedVillage] = useState(defaultValues.village || '');

  const [regions, setRegions] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>(
    defaultValues.district ? [defaultValues.district] : []
  );
  const [traditionalAuthorities, setTraditionalAuthorities] = useState<string[]>(
    defaultValues.traditionalAuthority ? [defaultValues.traditionalAuthority] : []
  );
  const [villages, setVillages] = useState<string[]>(
    defaultValues.village ? [defaultValues.village] : []
  );

  const [loading, setLoading] = useState({ regions: false, districts: false, tas: false, villages: false });

  // Keep latest onChange in a ref so the emit effect doesn't loop on inline functions
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  // ─── Data loading ──────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(prev => ({ ...prev, regions: true }));
    locationsService.getRegions()
      .then(setRegions)
      .catch(() => {})
      .finally(() => setLoading(prev => ({ ...prev, regions: false })));
  }, []);

  useEffect(() => {
    if (!selectedRegion) { setDistricts([]); return; }
    setLoading(prev => ({ ...prev, districts: true }));
    locationsService.getDistricts(selectedRegion)
      .then(setDistricts)
      .catch(() => {})
      .finally(() => setLoading(prev => ({ ...prev, districts: false })));
  }, [selectedRegion]);

  useEffect(() => {
    if (!selectedRegion || !selectedDistrict) { setTraditionalAuthorities([]); return; }
    setLoading(prev => ({ ...prev, tas: true }));
    locationsService.getTraditionalAuthorities(selectedRegion, selectedDistrict)
      .then(setTraditionalAuthorities)
      .catch(() => {})
      .finally(() => setLoading(prev => ({ ...prev, tas: false })));
  }, [selectedRegion, selectedDistrict]);

  useEffect(() => {
    if (!selectedRegion || !selectedDistrict || !selectedTA) { setVillages([]); return; }
    setLoading(prev => ({ ...prev, villages: true }));
    locationsService.getVillages(selectedRegion, selectedDistrict, selectedTA)
      .then(setVillages)
      .catch(() => {})
      .finally(() => setLoading(prev => ({ ...prev, villages: false })));
  }, [selectedRegion, selectedDistrict, selectedTA]);

  // ─── Emit on selection change (only when values change, not on callback churn) ─

  useEffect(() => {
    onChangeRef.current?.({
      region: selectedRegion || undefined,
      district: selectedDistrict || undefined,
      traditionalAuthority: selectedTA || undefined,
      village: selectedVillage || undefined,
    });
  }, [selectedRegion, selectedDistrict, selectedTA, selectedVillage]);

  // ─── Handlers — clear cascading selections when parent changes ─────────────

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    setSelectedDistrict('');
    setSelectedTA('');
    setSelectedVillage('');
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    setSelectedTA('');
    setSelectedVillage('');
  };

  const handleTAChange = (ta: string) => {
    setSelectedTA(ta);
    setSelectedVillage('');
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>
            Region/Province/County{required.region
              ? <span className="text-destructive">*</span>
              : <span className="text-muted-foreground text-xs"> (optional)</span>}
          </Label>
          <Select value={selectedRegion} onValueChange={handleRegionChange}>
            <SelectTrigger className={errors.region ? 'border-destructive' : ''}>
              <SelectValue placeholder={loading.regions ? 'Loading...' : 'Select region/province/county'} />
              {loading.regions && <Loader2 className="h-4 w-4 animate-spin" />}
            </SelectTrigger>
            <SelectContent>
              {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.region && <p className="text-xs text-destructive">{errors.region}</p>}
        </div>

        <div className="space-y-1">
          <Label>
            District{required.district
              ? <span className="text-destructive">*</span>
              : <span className="text-muted-foreground text-xs"> (optional)</span>}
          </Label>
          <Select value={selectedDistrict} onValueChange={handleDistrictChange} disabled={!selectedRegion}>
            <SelectTrigger className={errors.district ? 'border-destructive' : ''}>
              <SelectValue placeholder={loading.districts ? 'Loading...' : 'Select district'} />
              {loading.districts && <Loader2 className="h-4 w-4 animate-spin" />}
            </SelectTrigger>
            <SelectContent>
              {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.district && <p className="text-xs text-destructive">{errors.district}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>
            Traditional Authority{required.traditionalAuthority
              ? <span className="text-destructive">*</span>
              : <span className="text-muted-foreground text-xs"> (optional)</span>}
          </Label>
          <Select value={selectedTA} onValueChange={handleTAChange} disabled={!selectedDistrict}>
            <SelectTrigger className={errors.traditionalAuthority ? 'border-destructive' : ''}>
              <SelectValue placeholder={loading.tas ? 'Loading...' : 'Select traditional authority'} />
              {loading.tas && <Loader2 className="h-4 w-4 animate-spin" />}
            </SelectTrigger>
            <SelectContent>
              {traditionalAuthorities.map(ta => <SelectItem key={ta} value={ta}>{ta}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.traditionalAuthority && <p className="text-xs text-destructive">{errors.traditionalAuthority}</p>}
        </div>

        <div className="space-y-1">
          <Label>Village <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Select value={selectedVillage} onValueChange={setSelectedVillage} disabled={!selectedTA}>
            <SelectTrigger>
              <SelectValue placeholder={loading.villages ? 'Loading...' : 'Select village'} />
              {loading.villages && <Loader2 className="h-4 w-4 animate-spin" />}
            </SelectTrigger>
            <SelectContent>
              {villages.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
