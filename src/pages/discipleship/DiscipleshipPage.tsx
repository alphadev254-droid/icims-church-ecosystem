import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpenCheck, ChevronRight, Plus, Route, Search, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { discipleshipService, type DiscipleshipRequirement } from '@/services/discipleship';
import { churchesService } from '@/services/churches';
import { useRole } from '@/hooks/useRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

type WorkflowStageForm = {
  name: string;
  description: string;
  requirements: Array<{ name: string; type: DiscipleshipRequirement['type']; isRequired: boolean }>;
};

const emptyStage = (): WorkflowStageForm => ({ name: '', description: '', requirements: [{ name: '', type: 'checklist', isRequired: true }] });

export default function DiscipleshipPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasPermission } = useRole();
  const canCreateJourney = hasPermission('discipleship_journeys:create');
  const canManageWorkflows = hasPermission('discipleship_workflows:manage');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [journeyDialogOpen, setJourneyDialogOpen] = useState(false);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [journeyForm, setJourneyForm] = useState({ churchId: '', workflowId: '', firstName: '', lastName: '', email: '', phone: '', preferredLanguage: '', referralSource: '', notes: '' });
  const [workflowForm, setWorkflowForm] = useState({ churchId: '', name: '', description: '', isDefault: false, publish: true, stages: [emptyStage()] });

  const { data: journeysResponse, isLoading } = useQuery({
    queryKey: ['discipleship-journeys', search, status],
    queryFn: () => discipleshipService.listJourneys({ search: search || undefined, status: status === 'all' ? undefined : status }),
  });
  const { data: churches = [] } = useQuery({ queryKey: ['churches-select'], queryFn: churchesService.getSelectable, enabled: canCreateJourney || canManageWorkflows });
  const { data: workflows = [] } = useQuery({ queryKey: ['discipleship-workflows', true], queryFn: () => discipleshipService.listWorkflows({ includeDrafts: true }) });
  const publishedWorkflows = useMemo(() => workflows.filter(item => item.status === 'published' && (!journeyForm.churchId || item.churchId === journeyForm.churchId)), [workflows, journeyForm.churchId]);

  const createJourney = useMutation({
    mutationFn: () => discipleshipService.createJourney({
      churchId: journeyForm.churchId, workflowId: journeyForm.workflowId, sourceType: 'direct', consentStatus: 'yes',
      candidate: { firstName: journeyForm.firstName, lastName: journeyForm.lastName, email: journeyForm.email, phone: journeyForm.phone || undefined, preferredLanguage: journeyForm.preferredLanguage || undefined, referralSource: journeyForm.referralSource || undefined },
      notes: journeyForm.notes || undefined,
    }),
    onSuccess: journey => {
      toast.success('Candidate and journey created');
      setJourneyDialogOpen(false);
      qc.invalidateQueries({ queryKey: ['discipleship-journeys'] });
      navigate(`/dashboard/discipleship/journeys/${journey.id}`);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to create journey'),
  });

  const createWorkflow = useMutation({
    mutationFn: () => discipleshipService.createWorkflow({
      ...workflowForm,
      stages: workflowForm.stages.map(stage => ({ ...stage, requirements: stage.requirements.filter(item => item.name.trim()) })),
    }),
    onSuccess: () => {
      toast.success('Workflow created');
      setWorkflowDialogOpen(false);
      setWorkflowForm({ churchId: '', name: '', description: '', isDefault: false, publish: true, stages: [emptyStage()] });
      qc.invalidateQueries({ queryKey: ['discipleship-workflows'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to create workflow'),
  });

  const updateStage = (stageIndex: number, patch: Partial<WorkflowStageForm>) => setWorkflowForm(current => ({
    ...current, stages: current.stages.map((stage, index) => index === stageIndex ? { ...stage, ...patch } : stage),
  }));

  const updateRequirement = (stageIndex: number, requirementIndex: number, patch: Partial<WorkflowStageForm['requirements'][number]>) => {
    const stage = workflowForm.stages[stageIndex];
    updateStage(stageIndex, { requirements: stage.requirements.map((item, index) => index === requirementIndex ? { ...item, ...patch } : item) });
  };

  const journeys = journeysResponse?.data ?? [];
  const activeCount = journeys.filter(item => item.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Discipleship</h1>
          <p className="text-sm text-muted-foreground">Guide candidates through church-defined pathways into membership.</p>
        </div>
        <div className="flex gap-2">
          {canManageWorkflows && <Button variant="outline" onClick={() => setWorkflowDialogOpen(true)}><Route className="mr-2 h-4 w-4" />New workflow</Button>}
          {canCreateJourney && <Button onClick={() => setJourneyDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />New candidate</Button>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-5"><div className="rounded-md bg-primary/10 p-2.5"><Users className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-semibold tabular-nums">{journeysResponse?.pagination.total ?? 0}</p><p className="text-xs text-muted-foreground">Total journeys</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-5"><div className="rounded-md bg-success/10 p-2.5"><BookOpenCheck className="h-5 w-5 text-success" /></div><div><p className="text-2xl font-semibold tabular-nums">{activeCount}</p><p className="text-xs text-muted-foreground">Active on this page</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-5"><div className="rounded-md bg-info/10 p-2.5"><Route className="h-5 w-5 text-info" /></div><div><p className="text-2xl font-semibold tabular-nums">{workflows.filter(item => item.status === 'published').length}</p><p className="text-xs text-muted-foreground">Published workflows</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="journeys">
        <TabsList><TabsTrigger value="journeys">Journeys</TabsTrigger><TabsTrigger value="workflows">Workflows</TabsTrigger></TabsList>
        <TabsContent value="journeys" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search name, email or phone" value={search} onChange={event => setSearch(event.target.value)} /></div>
            <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="paused">Paused</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="withdrawn">Withdrawn</SelectItem></SelectContent></Select>
          </div>
          <Card>
            <CardContent className="p-0">
              {isLoading ? <div className="p-8 text-center text-muted-foreground">Loading journeys…</div> : journeys.length === 0 ? <div className="p-10 text-center"><BookOpenCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><p className="font-medium">No discipleship journeys found</p><p className="text-sm text-muted-foreground">Create a published workflow, then register the first candidate.</p></div> : journeys.map(journey => (
                <button key={journey.id} className="flex w-full items-center gap-4 border-b p-4 text-left transition-colors last:border-0 hover:bg-muted/50" onClick={() => navigate(`/dashboard/discipleship/journeys/${journey.id}`)}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{journey.candidateUser.firstName[0]}{journey.candidateUser.lastName[0]}</div>
                  <div className="min-w-0 flex-1"><p className="truncate font-medium">{journey.candidateUser.firstName} {journey.candidateUser.lastName}</p><p className="truncate text-xs text-muted-foreground">{journey.journeyCode} · {journey.workflow.name} · {journey.church.name}</p></div>
                  <div className="hidden w-40 sm:block"><div className="mb-1 flex justify-between text-xs"><span>{journey.stages[0]?.name || 'Complete'}</span><span>{journey.progressPercent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${journey.progressPercent}%` }} /></div></div>
                  <Badge variant={journey.status === 'completed' ? 'default' : 'secondary'}>{journey.status}</Badge><ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="workflows" className="grid gap-4 md:grid-cols-2">
          {workflows.map(workflow => <Card key={workflow.id}><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-base">{workflow.name}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{workflow.church?.name} · Version {workflow.version}</p></div><Badge variant={workflow.status === 'published' ? 'default' : 'secondary'}>{workflow.status}</Badge></div></CardHeader><CardContent><p className="text-sm text-muted-foreground">{workflow.description || 'No description'}</p><div className="mt-4 space-y-2">{workflow.stages.map(stage => <div key={stage.id} className="rounded-md border px-3 py-2 text-sm"><span className="mr-2 text-muted-foreground">{stage.position}.</span>{stage.name}<span className="ml-2 text-xs text-muted-foreground">({stage.requirements.length} requirements)</span></div>)}</div></CardContent></Card>)}
          {workflows.length === 0 && <p className="text-sm text-muted-foreground">No workflows configured.</p>}
        </TabsContent>
      </Tabs>

      <Dialog open={journeyDialogOpen} onOpenChange={setJourneyDialogOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Register discipleship candidate</DialogTitle></DialogHeader><div className="grid gap-4 py-2">
        <div className="grid gap-2"><Label>Church</Label><Select value={journeyForm.churchId} onValueChange={value => setJourneyForm(current => ({ ...current, churchId: value, workflowId: '' }))}><SelectTrigger><SelectValue placeholder="Select church" /></SelectTrigger><SelectContent>{churches.map(church => <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid gap-2"><Label>Workflow</Label><Select value={journeyForm.workflowId} onValueChange={value => setJourneyForm(current => ({ ...current, workflowId: value }))}><SelectTrigger><SelectValue placeholder="Select published workflow" /></SelectTrigger><SelectContent>{publishedWorkflows.map(workflow => <SelectItem key={workflow.id} value={workflow.id}>{workflow.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label>First name</Label><Input value={journeyForm.firstName} onChange={event => setJourneyForm(current => ({ ...current, firstName: event.target.value }))} /></div><div className="grid gap-2"><Label>Last name</Label><Input value={journeyForm.lastName} onChange={event => setJourneyForm(current => ({ ...current, lastName: event.target.value }))} /></div></div>
        <div className="grid gap-2"><Label>Email</Label><Input type="email" value={journeyForm.email} onChange={event => setJourneyForm(current => ({ ...current, email: event.target.value }))} /><p className="text-xs text-muted-foreground">Required because candidates use a normal ICIMS user account.</p></div>
        <div className="grid gap-2"><Label>Phone</Label><Input value={journeyForm.phone} onChange={event => setJourneyForm(current => ({ ...current, phone: event.target.value }))} /></div>
        <div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label>Preferred language</Label><Input value={journeyForm.preferredLanguage} onChange={event => setJourneyForm(current => ({ ...current, preferredLanguage: event.target.value }))} /></div><div className="grid gap-2"><Label>Referral source</Label><Input value={journeyForm.referralSource} onChange={event => setJourneyForm(current => ({ ...current, referralSource: event.target.value }))} /></div></div>
        <div className="rounded-md border bg-muted/40 p-3 text-sm">By creating this journey, you confirm that the person agreed to enter the church's discipleship process.</div>
        <Button disabled={!journeyForm.churchId || !journeyForm.workflowId || !journeyForm.firstName || !journeyForm.lastName || !journeyForm.email || createJourney.isPending} onClick={() => createJourney.mutate()}>{createJourney.isPending ? 'Creating…' : 'Create candidate and journey'}</Button>
      </div></DialogContent></Dialog>

      <Dialog open={workflowDialogOpen} onOpenChange={setWorkflowDialogOpen}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Create discipleship workflow</DialogTitle></DialogHeader><div className="space-y-4 py-2">
        <div className="grid gap-2"><Label>Church</Label><Select value={workflowForm.churchId} onValueChange={value => setWorkflowForm(current => ({ ...current, churchId: value }))}><SelectTrigger><SelectValue placeholder="Select church" /></SelectTrigger><SelectContent>{churches.map(church => <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid gap-2"><Label>Name</Label><Input placeholder="New Member Foundation" value={workflowForm.name} onChange={event => setWorkflowForm(current => ({ ...current, name: event.target.value }))} /></div>
        <div className="grid gap-2"><Label>Description</Label><Textarea value={workflowForm.description} onChange={event => setWorkflowForm(current => ({ ...current, description: event.target.value }))} /></div>
        {workflowForm.stages.map((stage, stageIndex) => <Card key={stageIndex}><CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base">Stage {stageIndex + 1}</CardTitle>{workflowForm.stages.length > 1 && <Button variant="ghost" size="icon" onClick={() => setWorkflowForm(current => ({ ...current, stages: current.stages.filter((_, index) => index !== stageIndex) }))}><Trash2 className="h-4 w-4" /></Button>}</div></CardHeader><CardContent className="space-y-3"><Input placeholder="Stage name" value={stage.name} onChange={event => updateStage(stageIndex, { name: event.target.value })} /><Textarea placeholder="Stage description" value={stage.description} onChange={event => updateStage(stageIndex, { description: event.target.value })} />{stage.requirements.map((requirement, requirementIndex) => <div key={requirementIndex} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_150px_auto]"><Input placeholder="Requirement" value={requirement.name} onChange={event => updateRequirement(stageIndex, requirementIndex, { name: event.target.value })} /><Select value={requirement.type} onValueChange={(value: DiscipleshipRequirement['type']) => updateRequirement(stageIndex, requirementIndex, { type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="checklist">Checklist</SelectItem><SelectItem value="approval">Approval</SelectItem><SelectItem value="course">Course</SelectItem><SelectItem value="milestone">Milestone</SelectItem><SelectItem value="assessment">Assessment</SelectItem></SelectContent></Select><Button variant="ghost" size="icon" onClick={() => updateStage(stageIndex, { requirements: stage.requirements.filter((_, index) => index !== requirementIndex) })}><Trash2 className="h-4 w-4" /></Button></div>)}<Button variant="outline" size="sm" onClick={() => updateStage(stageIndex, { requirements: [...stage.requirements, { name: '', type: 'checklist', isRequired: true }] })}><Plus className="mr-2 h-4 w-4" />Requirement</Button></CardContent></Card>)}
        <Button variant="outline" onClick={() => setWorkflowForm(current => ({ ...current, stages: [...current.stages, emptyStage()] }))}><Plus className="mr-2 h-4 w-4" />Add stage</Button>
        <div className="flex items-center gap-2"><Checkbox checked={workflowForm.isDefault} onCheckedChange={value => setWorkflowForm(current => ({ ...current, isDefault: value === true }))} /><Label>Use as the default workflow for this church</Label></div>
        <Button className="w-full" disabled={!workflowForm.churchId || !workflowForm.name || workflowForm.stages.some(stage => !stage.name) || createWorkflow.isPending} onClick={() => createWorkflow.mutate()}>{createWorkflow.isPending ? 'Creating…' : 'Publish workflow'}</Button>
      </div></DialogContent></Dialog>
    </div>
  );
}
