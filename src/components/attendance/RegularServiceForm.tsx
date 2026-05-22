import { useState } from 'react';
import { type AttendanceVisitor } from '@/services/attendance';
import { ChurchSelect } from '@/components/ChurchSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { HOW_HEARD, AGE_BRACKETS } from './constants';

interface Props {
  onSubmit: (data: any) => void;
  isPending: boolean;
  defaultValues?: any;
  defaultVisitors?: AttendanceVisitor[];
  submitLabel?: string;
  hideChurchSelect?: boolean;
}

export function RegularServiceForm({ onSubmit, isPending, defaultValues, defaultVisitors = [], submitLabel = 'Save Record', hideChurchSelect = false }: Props) {
  const [churchId, setChurchId] = useState(defaultValues?.churchId ?? '');
  const [date, setDate] = useState(defaultValues?.date ?? '');
  const [serviceType, setServiceType] = useState(defaultValues?.serviceType ?? 'Sunday Service');
  const [maleCount, setMaleCount] = useState(defaultValues?.maleCount?.toString() ?? '');
  const [femaleCount, setFemaleCount] = useState(defaultValues?.femaleCount?.toString() ?? '');
  const [children, setChildren] = useState(defaultValues?.children?.toString() ?? '');
  const [youth, setYouth] = useState(defaultValues?.youth?.toString() ?? '');
  const [youngAdults, setYoungAdults] = useState(defaultValues?.youngAdults?.toString() ?? '');
  const [adults, setAdults] = useState(defaultValues?.adults?.toString() ?? '');
  const [seniors, setSeniors] = useState(defaultValues?.seniors?.toString() ?? '');
  const [notes, setNotes] = useState(defaultValues?.notes ?? '');
  const [visitors, setVisitors] = useState<AttendanceVisitor[]>(defaultVisitors);

  const totalAttendees = (parseInt(maleCount) || 0) + (parseInt(femaleCount) || 0);
  const ageGroupTotal = (parseInt(children) || 0) + (parseInt(youth) || 0) + (parseInt(youngAdults) || 0) + (parseInt(adults) || 0) + (parseInt(seniors) || 0);
  const ageGroupMismatch = ageGroupTotal > 0 && ageGroupTotal !== totalAttendees;

  const addVisitor = () => setVisitors(v => [...v, { name: '' }]);
  const removeVisitor = (i: number) => setVisitors(v => v.filter((_, idx) => idx !== i));
  const updateVisitor = (i: number, field: keyof AttendanceVisitor, value: string) =>
    setVisitors(v => v.map((vis, idx) => idx === i ? { ...vis, [field]: value } : vis));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId || !date || !maleCount || !femaleCount) {
      toast.error('Church, date, and gender fields are required');
      return;
    }
    if (ageGroupMismatch) {
      toast.error(`Age groups total (${ageGroupTotal}) must equal total attendees (${totalAttendees})`);
      return;
    }
    const invalidVisitor = visitors.find(v => !v.name.trim());
    if (invalidVisitor) { toast.error('All visitor rows require a name'); return; }
    onSubmit({
      churchId, date, serviceType, totalAttendees,
      maleCount: parseInt(maleCount), femaleCount: parseInt(femaleCount),
      children: parseInt(children) || 0, youth: parseInt(youth) || 0,
      youngAdults: parseInt(youngAdults) || 0, adults: parseInt(adults) || 0,
      seniors: parseInt(seniors) || 0,
      newVisitors: visitors.length,
      notes,
      visitors: visitors.map(v => ({ ...v, name: v.name.trim() })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!hideChurchSelect && <ChurchSelect value={churchId} onValueChange={setChurchId} />}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date *</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        <div>
          <Label>Service Type *</Label>
          <Select value={serviceType} onValueChange={setServiceType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Sunday Service">Sunday Service</SelectItem>
              <SelectItem value="Midweek Service">Midweek Service</SelectItem>
              <SelectItem value="Prayer Meeting">Prayer Meeting</SelectItem>
              <SelectItem value="Youth Service">Youth Service</SelectItem>
              <SelectItem value="Special Service">Special Service</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium">Gender Breakdown *</Label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div><Label className="text-xs sm:text-sm">Male *</Label><Input type="number" min={0} value={maleCount} onChange={e => setMaleCount(e.target.value)} required /></div>
          <div><Label className="text-xs sm:text-sm">Female *</Label><Input type="number" min={0} value={femaleCount} onChange={e => setFemaleCount(e.target.value)} required /></div>
        </div>
      </div>

      <div className="p-3 bg-muted rounded-md">
        <Label className="text-sm text-muted-foreground">Total Attendees (Auto-calculated)</Label>
        <div className="text-2xl font-bold">{totalAttendees}</div>
      </div>

      <div>
        <Label className="text-sm font-medium">Age Groups <span className="text-muted-foreground text-xs sm:text-sm font-normal">(optional)</span></Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
          <div><Label className="text-xs sm:text-sm">Children (0-12)</Label><Input type="number" min={0} value={children} onChange={e => setChildren(e.target.value)} /></div>
          <div><Label className="text-xs sm:text-sm">Youth (13-17)</Label><Input type="number" min={0} value={youth} onChange={e => setYouth(e.target.value)} /></div>
          <div><Label className="text-xs sm:text-sm">Young Adults (18-35)</Label><Input type="number" min={0} value={youngAdults} onChange={e => setYoungAdults(e.target.value)} /></div>
          <div><Label className="text-xs sm:text-sm">Adults (36-59)</Label><Input type="number" min={0} value={adults} onChange={e => setAdults(e.target.value)} /></div>
          <div><Label className="text-xs sm:text-sm">Seniors (60+)</Label><Input type="number" min={0} value={seniors} onChange={e => setSeniors(e.target.value)} /></div>
        </div>
        {ageGroupMismatch && <p className="text-xs text-destructive mt-2">Age groups total ({ageGroupTotal}) must equal total attendees ({totalAttendees})</p>}
      </div>

      <div>
        <Label>Notes <span className="text-muted-foreground text-xs sm:text-sm">(optional)</span></Label>
        <Input value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      {/* Visitor Details */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-accent" /> Visitor Details
            </Label>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {visitors.length > 0 ? `${visitors.length} visitor${visitors.length > 1 ? 's' : ''} recorded` : 'Record individual visitors for follow-up'}
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addVisitor} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Add Visitor
          </Button>
        </div>

        {visitors.length === 0 && (
          <p className="text-xs sm:text-sm text-muted-foreground text-center py-3 border border-dashed rounded-md">
            No visitors added yet. Click "Add Visitor" to record visitor details.
          </p>
        )}

        {visitors.map((v, i) => (
          <div key={i} className="border rounded-md p-3 space-y-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Visitor #{i + 1}</span>
              <button type="button" onClick={() => removeVisitor(i)} className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs sm:text-sm">Full Name *</Label><Input className="h-9 sm:h-8 text-sm mt-0.5" placeholder="e.g. John Banda" value={v.name} onChange={e => updateVisitor(i, 'name', e.target.value)} /></div>
              <div><Label className="text-xs sm:text-sm">Phone</Label><Input className="h-9 sm:h-8 text-sm mt-0.5" placeholder="+265 ..." value={v.phone ?? ''} onChange={e => updateVisitor(i, 'phone', e.target.value)} /></div>
              <div><Label className="text-xs sm:text-sm">Email</Label><Input className="h-9 sm:h-8 text-sm mt-0.5" type="email" placeholder="john@example.com" value={v.email ?? ''} onChange={e => updateVisitor(i, 'email', e.target.value)} /></div>
              <div><Label className="text-xs sm:text-sm">Residential Area</Label><Input className="h-9 sm:h-8 text-sm mt-0.5" placeholder="e.g. Area 25, Lilongwe" value={v.residentialArea ?? ''} onChange={e => updateVisitor(i, 'residentialArea', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <Label className="text-xs sm:text-sm">Gender</Label>
                <Select value={v.gender ?? ''} onValueChange={val => updateVisitor(i, 'gender', val)}>
                  <SelectTrigger className="h-9 sm:h-8 text-sm mt-0.5"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Age Bracket</Label>
                <Select value={v.ageBracket ?? ''} onValueChange={val => updateVisitor(i, 'ageBracket', val)}>
                  <SelectTrigger className="h-9 sm:h-8 text-sm mt-0.5"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{AGE_BRACKETS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs sm:text-sm">How did you hear?</Label>
                <Select value={v.howHeard ?? ''} onValueChange={val => updateVisitor(i, 'howHeard', val)}>
                  <SelectTrigger className="h-9 sm:h-8 text-sm mt-0.5"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{HOW_HEARD.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs sm:text-sm">Notes <span className="text-muted-foreground">(optional)</span></Label><Input className="h-9 sm:h-8 text-sm mt-0.5" placeholder="Any additional notes" value={v.notes ?? ''} onChange={e => updateVisitor(i, 'notes', e.target.value)} /></div>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
        {isPending ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}
