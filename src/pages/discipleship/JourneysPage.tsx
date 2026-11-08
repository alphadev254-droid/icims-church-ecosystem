import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpenCheck, ChevronRight, Plus, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { discipleshipService } from '@/services/discipleship';
import { churchesService } from '@/services/churches';
import { useRole } from '@/hooks/useRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function JourneysPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useRole();
  const canCreateJourney = hasPermission('discipleship_journeys:create');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ churchId: '', workflowId: '', firstName: '', lastName: '', email: '', phone: '', preferredLanguage: '', referralSource: '', notes: '' });

  const { data: journeysResponse, isLoading } = useQuery({
    queryKey: ['discipleship-journeys', search, status],
    queryFn: () => discipleshipService.listJourneys({ search: search || undefined, status: status === 'all' ? undefined : status }),
  });
  const { data: churches = [] } = useQuery({ queryKey: ['churches-select'], queryFn: churchesService.getSelectable, enabled: canCreateJourney });
  const { data: workflows = [] } = useQuery({ queryKey: ['discipleship-workflows', false], queryFn: () => discipleshipService.listWorkflows(), enabled: canCreateJourney });
  const publishedWorkflows = useMemo(
    () => workflows.filter(item => item.status === 'published' && (!form.churchId || item.churchId === form.churchId)),
    [workflows, form.churchId],
  );

  const createJourney = useMutation({
    mutationFn: () => discipleshipService.createJourney({
      churchId: form.churchId,
      workflowId: form.workflowId,
      sourceType: 'direct',
      consentStatus: 'yes',
      candidate: {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        preferredLanguage: form.preferredLanguage || undefined,
        referralSource: form.referralSource || undefined,
      },
      notes: form.notes || undefined,
    }),
    onSuccess: journey => {
      toast.success('Candidate and journey created');
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['discipleship-journeys'] });
      navigate(`/dashboard/discipleship/journeys/${journey.id}`);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to create journey'),
  });

  const journeys = journeysResponse?.data ?? [];
  const activeCount = journeys.filter(item => item.status === 'active').length;
  const completedCount = journeys.filter(item => item.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Discipleship</p>
          <h1 className="font-heading text-2xl font-bold">Journeys</h1>
          <p className="text-sm text-muted-foreground">Track candidates as they progress through their discipleship pathway.</p>
        </div>
        {canCreateJourney && <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />New candidate</Button>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-5"><div className="rounded-md bg-primary/10 p-2.5"><Users className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-semibold tabular-nums">{journeysResponse?.pagination.total ?? 0}</p><p className="text-xs text-muted-foreground">Total journeys</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-5"><div className="rounded-md bg-success/10 p-2.5"><BookOpenCheck className="h-5 w-5 text-success" /></div><div><p className="text-2xl font-semibold tabular-nums">{activeCount}</p><p className="text-xs text-muted-foreground">Active on this page</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-5"><div className="rounded-md bg-info/10 p-2.5"><BookOpenCheck className="h-5 w-5 text-info" /></div><div><p className="text-2xl font-semibold tabular-nums">{completedCount}</p><p className="text-xs text-muted-foreground">Completed on this page</p></div></CardContent></Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search name, email or phone" value={search} onChange={event => setSearch(event.target.value)} /></div>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="paused">Paused</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="withdrawn">Withdrawn</SelectItem></SelectContent></Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-8 text-center text-muted-foreground">Loading journeys…</div> : journeys.length === 0 ? (
            <div className="p-10 text-center"><BookOpenCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><p className="font-medium">No discipleship journeys found</p><p className="text-sm text-muted-foreground">Create a published workflow, then register the first candidate.</p></div>
          ) : journeys.map(journey => (
            <button key={journey.id} className="flex w-full items-center gap-4 border-b p-4 text-left transition-colors last:border-0 hover:bg-muted/50" onClick={() => navigate(`/dashboard/discipleship/journeys/${journey.id}`)}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{journey.candidateUser.firstName[0]}{journey.candidateUser.lastName[0]}</div>
              <div className="min-w-0 flex-1"><p className="truncate font-medium">{journey.candidateUser.firstName} {journey.candidateUser.lastName}</p><p className="truncate text-xs text-muted-foreground">{journey.journeyCode} · {journey.workflow.name} · {journey.church.name}</p></div>
              <div className="hidden w-40 sm:block"><div className="mb-1 flex justify-between text-xs"><span>{journey.stages[0]?.name || 'Complete'}</span><span>{journey.progressPercent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${journey.progressPercent}%` }} /></div></div>
              <Badge variant={journey.status === 'completed' ? 'default' : 'secondary'}>{journey.status}</Badge><ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>Register discipleship candidate</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Church</Label><Select value={form.churchId} onValueChange={value => setForm(current => ({ ...current, churchId: value, workflowId: '' }))}><SelectTrigger><SelectValue placeholder="Select church" /></SelectTrigger><SelectContent>{churches.map(church => <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Workflow</Label><Select value={form.workflowId} onValueChange={value => setForm(current => ({ ...current, workflowId: value }))}><SelectTrigger><SelectValue placeholder="Select published workflow" /></SelectTrigger><SelectContent>{publishedWorkflows.map(workflow => <SelectItem key={workflow.id} value={workflow.id}>{workflow.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label>First name</Label><Input value={form.firstName} onChange={event => setForm(current => ({ ...current, firstName: event.target.value }))} /></div><div className="grid gap-2"><Label>Last name</Label><Input value={form.lastName} onChange={event => setForm(current => ({ ...current, lastName: event.target.value }))} /></div></div>
            <div className="grid gap-2"><Label>Email</Label><Input type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} /><p className="text-xs text-muted-foreground">Required because candidates use a normal ICIMS user account.</p></div>
            <div className="grid gap-2"><Label>Phone</Label><Input value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label>Preferred language</Label><Input value={form.preferredLanguage} onChange={event => setForm(current => ({ ...current, preferredLanguage: event.target.value }))} /></div><div className="grid gap-2"><Label>Referral source</Label><Input value={form.referralSource} onChange={event => setForm(current => ({ ...current, referralSource: event.target.value }))} /></div></div>
            <div className="rounded-md border bg-muted/40 p-3 text-sm">By creating this journey, you confirm that the person agreed to enter the church's discipleship process.</div>
            <Button disabled={!form.churchId || !form.workflowId || !form.firstName || !form.lastName || !form.email || createJourney.isPending} onClick={() => createJourney.mutate()}>{createJourney.isPending ? 'Creating…' : 'Create candidate and journey'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
