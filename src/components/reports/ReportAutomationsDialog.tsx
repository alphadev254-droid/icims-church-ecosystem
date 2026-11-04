import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReportAutomation, ReportAutomationInput, ReportType, reportAutomationService } from '@/services/reportAutomations';

const REPORTS: Array<{ type: ReportType; label: string; filters: string[] }> = [
  { type: 'membership', label: 'Membership Report', filters: ['churchId', 'status', 'cellId', 'teamId'] },
  { type: 'giving', label: 'Giving Report', filters: ['churchId', 'category', 'campaignId', 'cellId'] },
  { type: 'giving_by_member', label: 'Giving by Member', filters: ['churchId', 'category', 'campaignId'] },
  { type: 'pledges', label: 'Pledge Report', filters: ['churchId', 'status', 'category', 'campaignId'] },
  { type: 'attendance', label: 'Attendance Report', filters: ['churchId', 'serviceType'] },
  { type: 'cell_groups', label: 'Cell Groups Report', filters: ['churchId', 'cellId'] },
  { type: 'cell_visitors', label: 'Cell Visitors Report', filters: ['churchId', 'cellId'] },
  { type: 'church_visitors', label: 'Church Visitors Report', filters: ['churchId', 'serviceType'] },
  { type: 'transactions', label: 'Transactions Report', filters: ['churchId', 'type', 'campaignId'] },
];

type Option = { id: string; name: string; churchId?: string };
type Props = {
  open: boolean; onOpenChange: (open: boolean) => void; initialReportType?: ReportType | null;
  currentFilters?: Record<string, string | string[]>;
  churches: Option[]; cells: Option[]; teams: Option[]; campaigns: Option[];
  canCreate: boolean; canUpdate: boolean; canDelete: boolean;
};

const defaultInput = (type: ReportType): ReportAutomationInput => ({
  reportType: type, name: REPORTS.find(r => r.type === type)?.label ?? 'Scheduled report', filters: {},
  periodPreset: 'previous_month', frequency: 'monthly', dayOfWeek: 1, dayOfMonth: 1,
  timeOfDay: '08:00', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', format: 'xlsx',
  recipients: { includeMinistryAdmin: true, userIds: [], emails: [] }, isActive: true,
});

export function ReportAutomationsDialog(props: Props) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ReportAutomationInput | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [extraEmails, setExtraEmails] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [debouncedRecipientSearch, setDebouncedRecipientSearch] = useState('');
  const { data: automations = [], isLoading } = useQuery({ queryKey: ['report-automations'], queryFn: () => reportAutomationService.list(), enabled: props.open });
  const { data: automationContext } = useQuery({ queryKey: ['report-automation-context'], queryFn: reportAutomationService.context, enabled: props.open });
  const canSearchRecipients = recipientSearch.length === 0 || recipientSearch.length >= 3;
  const { data: users = [], isFetching: recipientsLoading } = useQuery({
    queryKey: ['report-automation-recipients', debouncedRecipientSearch],
    queryFn: () => reportAutomationService.recipients(debouncedRecipientSearch || undefined),
    enabled: props.open && !!editing && (debouncedRecipientSearch.length === 0 || debouncedRecipientSearch.length >= 3),
  });
  const visibleRecipientUsers = canSearchRecipients ? users : [];

  useEffect(() => {
    if (!props.open) { setEditing(null); setEditingId(null); setRecipientSearch(''); setDebouncedRecipientSearch(''); }
  }, [props.open]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (recipientSearch.length === 0 || recipientSearch.length >= 3) setDebouncedRecipientSearch(recipientSearch);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [recipientSearch]);

  useEffect(() => {
    if (automationContext?.timezone && editing && !editingId && editing.timezone !== automationContext.timezone) {
      setEditing(current => current ? { ...current, timezone: automationContext.timezone } : current);
    }
  }, [automationContext?.timezone, editing, editingId]);

  const visible = useMemo(() => props.initialReportType ? automations.filter(a => a.reportType === props.initialReportType) : automations, [automations, props.initialReportType]);
  const report = editing ? REPORTS.find(r => r.type === editing.reportType)! : null;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['report-automations'] });
  const saveMutation = useMutation({
    mutationFn: (input: ReportAutomationInput) => editingId ? reportAutomationService.update(editingId, input) : reportAutomationService.create(input),
    onSuccess: () => { invalidate(); setEditing(null); setEditingId(null); toast.success('Report automation saved'); },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Could not save report automation'),
  });
  const deleteMutation = useMutation({ mutationFn: reportAutomationService.remove, onSuccess: () => { invalidate(); toast.success('Report automation deleted'); }, onError: () => toast.error('Could not delete report automation') });

  const startNew = (type = props.initialReportType || 'membership') => {
    setEditing({ ...defaultInput(type), timezone: automationContext?.timezone || defaultInput(type).timezone }); setEditingId(null); setExtraEmails('');
  };
  const startEdit = (item: ReportAutomation) => {
    setEditing({ ...item, recipients: item.recipients as any }); setEditingId(item.id); setExtraEmails(item.recipients.emails.join(', '));
  };
  const set = <K extends keyof ReportAutomationInput>(key: K, value: ReportAutomationInput[K]) => setEditing(prev => prev ? { ...prev, [key]: value } : prev);
  const setFilter = (key: string, value: string) => setEditing(prev => prev ? { ...prev, filters: { ...prev.filters, [key]: value } } : prev);
  const selectedChurch = typeof editing?.filters.churchId === 'string' ? editing.filters.churchId : 'all';
  const optionsFor = (key: string): Option[] => key === 'churchId' ? props.churches : key === 'cellId' ? props.cells.filter(x => selectedChurch === 'all' || x.churchId === selectedChurch) : key === 'teamId' ? props.teams : props.campaigns;
  const fixedOptions: Record<string, Array<{ id: string; name: string }>> = {
    status: editing?.reportType === 'pledges' ? [{ id: 'pending', name: 'Pending' }, { id: 'partial', name: 'Partial' }, { id: 'fulfilled', name: 'Fulfilled' }, { id: 'overdue', name: 'Overdue' }] : [{ id: 'active', name: 'Active' }, { id: 'inactive', name: 'Inactive' }],
    category: ['tithe', 'offering', 'fellowship_offering', 'partnership', 'welfare', 'missions'].map(id => ({ id, name: id.replaceAll('_', ' ') })),
    serviceType: ['Sunday Service', 'Midweek Service', 'Communion Service', 'Prayer Meeting', 'Youth Service', 'Special Service', 'Event'].map(id => ({ id, name: id })),
    type: [{ id: 'donation', name: 'Giving' }, { id: 'event_ticket', name: 'Event Ticket' }],
  };

  return <Dialog open={props.open} onOpenChange={props.onOpenChange}>
    <DialogContent className="w-[calc(100vw-1rem)] max-w-4xl max-h-[92svh] overflow-y-auto">
      <DialogHeader><DialogTitle>{props.initialReportType ? `${REPORTS.find(r => r.type === props.initialReportType)?.label} automation` : 'Automated reports'}</DialogTitle></DialogHeader>
      {!editing ? <div className="space-y-4">
        <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Configure recurring Excel reports and their recipients.</p>{props.canCreate && <Button size="sm" onClick={() => startNew()}><Plus className="mr-2 h-4 w-4" />New automation</Button>}</div>
        {isLoading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading automations…</p> : visible.length === 0 ? <div className="rounded-lg border border-dashed p-8 text-center"><CalendarClock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">No automated reports configured</p><p className="mt-1 text-sm text-muted-foreground">Create one to receive a moving-period report on schedule.</p></div> : <div className="space-y-2">{visible.map(item => <div key={item.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><p className="font-medium">{item.name}</p><span className={`rounded-full px-2 py-0.5 text-xs ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{item.isActive ? 'Enabled' : 'Disabled'}</span></div><p className="text-xs text-muted-foreground">{item.frequency === 'weekly' ? 'Weekly' : 'Monthly'} at {item.timeOfDay} · {item.timezone}</p><p className="text-xs text-muted-foreground">Next run: {item.nextRunAt ? new Date(item.nextRunAt).toLocaleString() : 'Not scheduled'}</p></div><div className="flex gap-2">{props.canUpdate && <Button size="sm" variant="outline" onClick={() => startEdit(item)}><Pencil className="mr-2 h-3.5 w-3.5" />Edit</Button>}{props.canDelete && <Button size="icon" variant="outline" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}</div></div>)}</div>}
      </div> : <div className="space-y-5">
        {!props.initialReportType && <div><Label>Report</Label><Select value={editing.reportType} onValueChange={v => setEditing({ ...defaultInput(v as ReportType), timezone: automationContext?.timezone || defaultInput(v as ReportType).timezone })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{REPORTS.map(r => <SelectItem key={r.type} value={r.type}>{r.label}</SelectItem>)}</SelectContent></Select></div>}
        <div><Label>Automation name</Label><Input value={editing.name} onChange={e => set('name', e.target.value)} /></div>
        <section className="rounded-lg border p-4 space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-medium">1. Report scope</h3><p className="text-xs text-muted-foreground">Choose the same filters available on this report card.</p></div>{props.currentFilters && <Button type="button" size="sm" variant="outline" onClick={() => set('filters', props.currentFilters!)}>Use current card filters</Button>}</div><div className="grid gap-3 sm:grid-cols-2">{report?.filters.map(key => { const values = fixedOptions[key] || optionsFor(key); return <div key={key}><Label className="capitalize">{key.replace(/Id$/, '').replace(/([A-Z])/g, ' $1')}</Label><Select value={(editing.filters[key] as string) || 'all'} onValueChange={v => setFilter(key, v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{values.map(option => <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>)}</SelectContent></Select></div>; })}</div></section>
        <section className="rounded-lg border p-4 space-y-3"><h3 className="font-medium">2. Reporting period</h3><Select value={editing.periodPreset} onValueChange={v => set('periodPreset', v as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="previous_week">Previous week</SelectItem><SelectItem value="previous_month">Previous month</SelectItem><SelectItem value="current_month_to_date">Current month to date</SelectItem><SelectItem value="last_30_days">Last 30 days</SelectItem><SelectItem value="previous_quarter">Previous quarter</SelectItem></SelectContent></Select></section>
        <section className="rounded-lg border p-4 space-y-3"><h3 className="font-medium">3. Delivery schedule</h3><div className="grid gap-3 sm:grid-cols-2"><div><Label>Frequency</Label><Select value={editing.frequency} onValueChange={v => set('frequency', v as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select></div>{editing.frequency === 'weekly' ? <div><Label>Day of week</Label><Select value={String(editing.dayOfWeek ?? 1)} onValueChange={v => set('dayOfWeek', Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d, i) => <SelectItem key={d} value={String(i)}>{d}</SelectItem>)}</SelectContent></Select></div> : <div><Label>Day of month</Label><Input type="number" min={1} max={28} value={editing.dayOfMonth ?? 1} onChange={e => set('dayOfMonth', Number(e.target.value))} /></div>}<div><Label>Sending time</Label><Input type="time" value={editing.timeOfDay} onChange={e => set('timeOfDay', e.target.value)} /></div><div><Label>Ministry timezone</Label><Input value={editing.timezone} readOnly className="bg-muted" /><p className="mt-1 text-xs text-muted-foreground">Managed from the ministry settings.</p></div></div><p className="text-xs text-muted-foreground">Excel (.xlsx) is the available delivery format.</p></section>
        <section className="rounded-lg border p-4 space-y-3"><h3 className="font-medium">4. Recipients</h3><label className="flex items-center gap-2 text-sm"><Checkbox checked={editing.recipients.includeMinistryAdmin} onCheckedChange={v => set('recipients', { ...editing.recipients, includeMinistryAdmin: v === true })} /> Ministry administrator</label><div><Label>Selected system users</Label><p className="mb-2 text-xs text-muted-foreground">Only administrators and users assigned a staff/custom role are available. Normal members are excluded.</p><Input value={recipientSearch} placeholder="Search name or email (minimum 3 characters)" onChange={e => setRecipientSearch(e.target.value)} />{!canSearchRecipients && <p className="mt-1 text-xs text-muted-foreground">Enter at least 3 characters to search.</p>}<div className="mt-2 max-h-36 overflow-y-auto rounded-md border p-2 space-y-1">{recipientsLoading && canSearchRecipients ? <p className="p-2 text-sm text-muted-foreground">Searching…</p> : visibleRecipientUsers.length === 0 ? <p className="p-2 text-sm text-muted-foreground">{canSearchRecipients ? 'No eligible users found.' : 'Search will start after 3 characters.'}</p> : visibleRecipientUsers.map(u => <label key={u.id} className="flex items-start gap-2 rounded p-1 text-sm hover:bg-muted"><Checkbox checked={editing.recipients.userIds.includes(u.id)} onCheckedChange={checked => set('recipients', { ...editing.recipients, userIds: checked ? [...editing.recipients.userIds, u.id] : editing.recipients.userIds.filter(id => id !== u.id) })} /><span>{u.firstName} {u.lastName}<span className="block text-xs text-muted-foreground">{u.email}{u.church?.name ? ` · ${u.church.name}` : ''}</span></span></label>)}</div></div><div><Label>Additional email addresses</Label><Input value={extraEmails} placeholder="finance@example.com, pastor@example.com" onChange={e => { setExtraEmails(e.target.value); set('recipients', { ...editing.recipients, emails: e.target.value.split(',').map(x => x.trim()).filter(Boolean) }); }} /></div></section>
        <section className="rounded-lg border p-4 space-y-3"><div><h3 className="font-medium">5. Automation status</h3><p className="text-xs text-muted-foreground">Inactive schedules remain saved but will not generate or send reports.</p></div><div><Label>Status</Label><Select value={editing.isActive ? 'active' : 'inactive'} onValueChange={value => set('isActive', value === 'active')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div></section>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setEditing(null); setEditingId(null); }}>Cancel</Button><Button disabled={saveMutation.isPending || !editing.name.trim()} onClick={() => saveMutation.mutate(editing)}>{saveMutation.isPending ? 'Saving…' : 'Save automation'}</Button></div>
      </div>}
    </DialogContent>
  </Dialog>;
}
