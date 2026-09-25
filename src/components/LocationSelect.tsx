import { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { locationsService } from '@/services/locations';
import { Input } from '@/components/ui/input';

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

interface LocationFieldProps {
  label: string;
  value: string;
  options: string[];
  required?: boolean;
  optionalText?: string;
  error?: string;
  loading?: boolean;
  disabled?: boolean;
  placeholder: string;
  manualPlaceholder: string;
  emptyPlaceholder?: string;
  onChange: (value: string) => void;
}

function cleanOptions(options: string[]) {
  return Array.from(new Set(options.map(option => option.trim()).filter(Boolean)));
}

function mergeSelectedOption(options: string[], selected?: string) {
  return cleanOptions(selected ? [...options, selected] : options);
}

function LocationField({
  label,
  value,
  options,
  required,
  optionalText = 'optional',
  error,
  loading,
  disabled,
  placeholder,
  manualPlaceholder,
  emptyPlaceholder,
  onChange,
}: LocationFieldProps) {
  const availableOptions = cleanOptions(options);
  const canSelect = availableOptions.length > 0 || loading;
  const isDisabled = Boolean(disabled || loading);

  return (
    <div className="space-y-1">
      <Label>
        {label}{required
          ? <span className="text-destructive">*</span>
          : <span className="text-muted-foreground text-xs"> ({optionalText})</span>}
      </Label>

      {canSelect ? (
        <Select value={value} onValueChange={onChange} disabled={isDisabled}>
          <SelectTrigger className={error ? 'border-destructive' : ''}>
            <SelectValue placeholder={loading ? 'Loading...' : placeholder} />
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </SelectTrigger>
          <SelectContent>
            {availableOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : (
        <Input
          value={value}
          disabled={disabled}
          className={error ? 'border-destructive' : ''}
          placeholder={emptyPlaceholder || manualPlaceholder}
          onChange={event => onChange(event.target.value)}
        />
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
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
      .then(data => setRegions(mergeSelectedOption(data, selectedRegion)))
      .catch(() => {})
      .finally(() => setLoading(prev => ({ ...prev, regions: false })));
  }, []);

  useEffect(() => {
    if (!selectedRegion) { setDistricts([]); return; }
    setLoading(prev => ({ ...prev, districts: true }));
    locationsService.getDistricts(selectedRegion)
      .then(data => setDistricts(mergeSelectedOption(data, selectedDistrict)))
      .catch(() => {})
      .finally(() => setLoading(prev => ({ ...prev, districts: false })));
  }, [selectedRegion]);

  useEffect(() => {
    if (!selectedRegion || !selectedDistrict) { setTraditionalAuthorities([]); return; }
    setLoading(prev => ({ ...prev, tas: true }));
    locationsService.getTraditionalAuthorities(selectedRegion, selectedDistrict)
      .then(data => setTraditionalAuthorities(mergeSelectedOption(data, selectedTA)))
      .catch(() => {})
      .finally(() => setLoading(prev => ({ ...prev, tas: false })));
  }, [selectedRegion, selectedDistrict]);

  useEffect(() => {
    if (!selectedRegion || !selectedDistrict || !selectedTA) { setVillages([]); return; }
    setLoading(prev => ({ ...prev, villages: true }));
    locationsService.getVillages(selectedRegion, selectedDistrict, selectedTA)
      .then(data => setVillages(mergeSelectedOption(data, selectedVillage)))
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
        <LocationField
          label="Region/Province/County"
          value={selectedRegion}
          options={regions}
          required={required.region}
          error={errors.region}
          loading={loading.regions}
          placeholder="Select region/province/county"
          manualPlaceholder="Type region/province/county"
          onChange={handleRegionChange}
        />

        <LocationField
          label="District/Constituency"
          value={selectedDistrict}
          options={districts}
          required={required.district}
          error={errors.district}
          loading={loading.districts}
          disabled={!selectedRegion}
          placeholder="Select district/constituency"
          manualPlaceholder="Type district/constituency"
          onChange={handleDistrictChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <LocationField
          label="Ward/Traditional Authority"
          value={selectedTA}
          options={traditionalAuthorities}
          required={required.traditionalAuthority}
          error={errors.traditionalAuthority}
          loading={loading.tas}
          disabled={!selectedDistrict}
          placeholder="Select ward/traditional authority"
          manualPlaceholder="Type ward/traditional authority"
          onChange={handleTAChange}
        />

        <LocationField
          label="Village"
          value={selectedVillage}
          options={villages}
          required={required.village}
          error={errors.village}
          loading={loading.villages}
          disabled={!selectedTA}
          placeholder="Select village"
          manualPlaceholder="Type village"
          emptyPlaceholder="Type village (optional)"
          onChange={setSelectedVillage}
        />
      </div>
    </div>
  );
}
