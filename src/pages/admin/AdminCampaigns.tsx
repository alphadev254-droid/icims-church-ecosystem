import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Megaphone, Pencil, Send, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { systemCampaignApi, type SystemCampaign } from '@/services/systemNotifications';
import { adminApi } from '@/services/adminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

const emptyForm = {
  title: '', summary: '', message: '', category: 'general', priority: 'normal', visibilityPolicy: 'standard',
  audienceType: 'all_ministries' as SystemCampaign['audienceType'], audienceFilters: { ministryIds: [] as string[] },
  channels: { inApp: true as const, email: true, push: false }, actionLabel: '', actionUrl: '',
};

export default function AdminCampaigns() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const { data: campaigns = [], isLoading } = useQuery({ queryKey: ['system-campaigns'], queryFn: () => systemCampaignApi.list().then(r => r.data.data) });
  const { data: ministries = [] } = useQuery({ queryKey: ['admin-ministries'], queryFn: () => adminApi.getMinistries().then(r => r.data.data) });
  const selectedNames = useMemo(() => ministries.filter(m => form.audienceFilters.ministryIds.includes(m.id)).map(m => m.label), [ministries, form.audienceFilters.ministryIds]);

  const preview = useMutation({
    mutationFn: () => systemCampaignApi.preview({ audienceType: form.audienceType, audienceFilters: form.audienceFilters }),
    onSuccess: result => setPreviewCount(result.data.data.count),
    onError: (error: any) => toast.error(error.response?.data?.message || 'Could not preview audience'),
  });
  const saveCampaign = useMutation({
    mutationFn: async (sendNow: boolean) => {
      const saved = editingId
        ? await systemCampaignApi.update(editingId, form)
        : await systemCampaignApi.create(form);
      return sendNow ? systemCampaignApi.send(saved.data.data.id) : saved;
    },
    onSuccess: (_result, sent) => {
      toast.success(sent ? 'Campaign queued for delivery' : editingId ? 'Draft updated' : 'Campaign saved as draft');
      setForm(emptyForm); setEditingId(null); setPreviewCount(null); queryClient.invalidateQueries({ queryKey: ['system-campaigns'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Campaign could not be saved'),
  });
  const sendExisting = useMutation({ mutationFn: systemCampaignApi.send, onSuccess: r => { toast.success(r.data.message); queryClient.invalidateQueries({ queryKey: ['system-campaigns'] }); }, onError: (e: any) => toast.error(e.response?.data?.message || 'Could not send campaign') });
  const remove = useMutation({ mutationFn: systemCampaignApi.remove, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system-campaigns'] }) });

  const toggleMinistry = (id: string) => setForm(current => ({ ...current, audienceFilters: { ...current.audienceFilters, ministryIds: current.audienceFilters.ministryIds.includes(id) ? current.audienceFilters.ministryIds.filter(value => value !== id) : [...current.audienceFilters.ministryIds, id] } }));
  const editDraft = (campaign: SystemCampaign) => {
    setEditingId(campaign.id);
    setPreviewCount(null);
    setForm({
      title: campaign.title,
      summary: campaign.summary || '',
      message: campaign.message,
      category: campaign.category,
      priority: campaign.priority,
      visibilityPolicy: campaign.visibilityPolicy,
      audienceType: campaign.audienceType,
      audienceFilters: { ...campaign.audienceFilters, ministryIds: campaign.audienceFilters.ministryIds || [] },
      channels: { inApp: true, email: Boolean(campaign.channels.email), push: Boolean(campaign.channels.push) },
      actionLabel: campaign.actionLabel || '',
      actionUrl: campaign.actionUrl || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const cancelEditing = () => { setEditingId(null); setForm(emptyForm); setPreviewCount(null); };
  const valid = form.title.trim().length >= 2 && form.message.trim().length >= 2 && (form.audienceType !== 'selected_ministries' || form.audienceFilters.ministryIds.length > 0);

  return <div className="space-y-5">
    <div><h1 className="font-heading text-2xl font-bold">Campaign Messages</h1><p className="text-sm text-muted-foreground">Send official ICIMS updates to ministry administrator accounts.</p></div>
    <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Megaphone className="h-4 w-4" />{editingId ? 'Edit draft campaign' : 'New campaign'}{editingId && <Badge variant="secondary" className="ml-auto">Editing draft</Badge>}</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2"><Input placeholder="Campaign title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /><Input placeholder="Short summary (optional)" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} /></div>
        <Textarea className="min-h-36" placeholder="Write the system update or announcement…" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Select value={form.category} onValueChange={category => setForm({ ...form, category })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['general','system_update','maintenance','new_feature','billing','policy','security'].map(v => <SelectItem key={v} value={v}>{v.replace('_',' ')}</SelectItem>)}</SelectContent></Select>
          <Select value={form.priority} onValueChange={priority => setForm({ ...form, priority })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['normal','important','urgent'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
          <Select value={form.visibilityPolicy} onValueChange={visibilityPolicy => setForm({ ...form, visibilityPolicy })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="standard">Standard</SelectItem><SelectItem value="mandatory">Mandatory</SelectItem></SelectContent></Select>
        </div>
        <Select value={form.audienceType} onValueChange={(audienceType: SystemCampaign['audienceType']) => { setForm({ ...form, audienceType }); setPreviewCount(null); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all_ministries">All active ministries</SelectItem><SelectItem value="selected_ministries">Selected ministries</SelectItem><SelectItem value="filtered">Filter ministries</SelectItem></SelectContent></Select>
        {form.audienceType === 'selected_ministries' && <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border p-3">{ministries.map(m => <label key={m.id} className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={form.audienceFilters.ministryIds.includes(m.id)} onCheckedChange={() => toggleMinistry(m.id)} /><span>{m.label}</span><span className="ml-auto text-xs text-muted-foreground">{m.country}</span></label>)}</div>}
        {form.audienceType === 'filtered' && <div className="grid gap-3 sm:grid-cols-2"><Input placeholder="Country (e.g. Malawi)" value={form.audienceFilters.country || ''} onChange={e => setForm({ ...form, audienceFilters: { ...form.audienceFilters, country: e.target.value || undefined } })} /><Select value={form.audienceFilters.status || 'active'} onValueChange={status => setForm({ ...form, audienceFilters: { ...form.audienceFilters, status } })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active accounts</SelectItem><SelectItem value="suspended">Suspended accounts</SelectItem></SelectContent></Select></div>}
        <div className="flex flex-wrap items-center gap-5 rounded-md border p-3 text-sm"><span className="font-medium">Channels</span><label className="flex items-center gap-2"><Checkbox checked disabled />In-app</label><label className="flex items-center gap-2"><Checkbox checked={form.channels.email} onCheckedChange={email => setForm({ ...form, channels: { ...form.channels, email: email === true } })} />Email</label></div>
        <div className="grid gap-3 sm:grid-cols-2"><Input placeholder="Action label (optional)" value={form.actionLabel} onChange={e => setForm({ ...form, actionLabel: e.target.value })} /><Input placeholder="Internal link, e.g. /dashboard/packages" value={form.actionUrl} onChange={e => setForm({ ...form, actionUrl: e.target.value })} /></div>
        <div className="rounded-md bg-muted p-3 text-sm">Audience: <strong>{previewCount === null ? 'Preview required before sending' : `${previewCount} ministry account${previewCount === 1 ? '' : 's'}`}</strong>{selectedNames.length > 0 && <span className="block truncate text-xs text-muted-foreground">{selectedNames.join(', ')}</span>}</div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!valid || preview.isPending} onClick={() => preview.mutate()}>Preview audience</Button><Button variant="outline" disabled={!valid || saveCampaign.isPending} onClick={() => saveCampaign.mutate(false)}>{editingId ? 'Update draft' : 'Save draft'}</Button><Button disabled={!valid || previewCount === null || previewCount < 1 || saveCampaign.isPending} onClick={() => { if (confirm(`Save and send this campaign to ${previewCount} ministry account(s)?`)) saveCampaign.mutate(true); }}><Send className="mr-2 h-4 w-4" />{editingId ? 'Update & send' : 'Send now'}</Button>{editingId && <Button variant="ghost" onClick={cancelEditing}><X className="mr-2 h-4 w-4" />Cancel editing</Button>}</div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Campaign history</CardTitle></CardHeader><CardContent className="space-y-3">{isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : campaigns.length === 0 ? <p className="text-sm text-muted-foreground">No campaigns yet.</p> : campaigns.map(c => <div key={c.id} className={`rounded-md border p-3 ${editingId === c.id ? 'border-accent bg-accent/5' : ''}`}><div className="flex items-start justify-between gap-2"><div><p className="font-medium">{c.title}</p><p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()} · {c._count?.recipients || 0} recipients</p></div><Badge variant={c.status === 'sent' ? 'default' : 'secondary'}>{c.status}</Badge></div><p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.summary || c.message}</p>{c.status === 'draft' && <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => editDraft(c)}><Pencil className="mr-1 h-3.5 w-3.5" />Edit</Button><Button size="sm" onClick={() => { if (confirm('Send this draft now?')) sendExisting.mutate(c.id); }}><Mail className="mr-1 h-3.5 w-3.5" />Send</Button><Button size="sm" variant="ghost" onClick={() => remove.mutate(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div>}</div>)}</CardContent></Card>
    </div>
  </div>;
}
