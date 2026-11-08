import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, CheckCircle2, Circle, Clock3, Mail, Phone, Route } from 'lucide-react';
import { toast } from 'sonner';
import { discipleshipService, type DiscipleshipRequirement } from '@/services/discipleship';
import { useRole } from '@/hooks/useRole';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function JourneyDetailPage() {
  const { journeyId } = useParams<{ journeyId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasPermission } = useRole();
  const canUpdate = hasPermission('discipleship_journeys:update');
  const canAdvance = hasPermission('discipleship_journeys:advance');
  const [selectedRequirement, setSelectedRequirement] = useState<DiscipleshipRequirement | null>(null);
  const [completionNote, setCompletionNote] = useState('');

  const { data: journey, isLoading, isError } = useQuery({
    queryKey: ['discipleship-journey', journeyId],
    queryFn: () => discipleshipService.getJourney(journeyId!),
    enabled: !!journeyId,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['discipleship-journey', journeyId] });
  const completeRequirement = useMutation({
    mutationFn: () => discipleshipService.completeRequirement(journeyId!, selectedRequirement!.id, journey!.version, completionNote || undefined),
    onSuccess: () => { toast.success('Requirement completed'); setSelectedRequirement(null); setCompletionNote(''); refresh(); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Could not complete requirement'); if (error.response?.status === 409) refresh(); },
  });
  const advance = useMutation({
    mutationFn: () => discipleshipService.advance(journeyId!, journey!.version),
    onSuccess: result => { toast.success(result.status === 'completed' ? 'Journey completed' : 'Advanced to the next stage'); refresh(); },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Could not advance journey'); if (error.response?.status === 409) refresh(); },
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (isError || !journey) return <div className="space-y-4"><Button variant="ghost" onClick={() => navigate('/dashboard/discipleship')}><ArrowLeft className="mr-2 h-4 w-4" />Back to Discipleship</Button><p className="text-muted-foreground">Journey not found or you do not have access.</p></div>;

  const candidateName = `${journey.candidateUser.firstName} ${journey.candidateUser.lastName}`;
  const activeStage = journey.currentStage;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-3 -ml-2" onClick={() => navigate('/dashboard/discipleship')}><ArrowLeft className="mr-2 h-4 w-4" />Discipleship</Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><div className="flex items-center gap-2"><h1 className="font-heading text-2xl font-bold">{candidateName}</h1><Badge variant={journey.status === 'completed' ? 'default' : 'secondary'}>{journey.status}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{journey.journeyCode} · {journey.workflow.name} v{journey.workflow.version} · {journey.church.name}</p></div>
          {canAdvance && journey.status === 'active' && <Button disabled={!journey.availableActions.canAdvance || advance.isPending} onClick={() => advance.mutate()}>{advance.isPending ? 'Advancing…' : activeStage && journey.stages.at(-1)?.id === activeStage.id ? 'Complete journey' : 'Advance stage'}</Button>}
        </div>
      </div>

      {journey.blockingRequirements.length > 0 && <div className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground"><strong>{journey.blockingRequirements.length} required item{journey.blockingRequirements.length === 1 ? '' : 's'} remaining.</strong> <span className="text-muted-foreground">Complete them before advancing from {activeStage?.name}.</span></div>}

      <Card><CardContent className="p-5"><div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-medium">Overall progress</p><p className="text-xs text-muted-foreground">Current stage: {activeStage?.name || 'Complete'}</p></div><span className="text-2xl font-semibold tabular-nums">{journey.progressPercent}%</span></div><div className="mb-5 h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${journey.progressPercent}%` }} /></div><ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{journey.stages.map(stage => <li key={stage.id} className={`rounded-md border p-3 transition-colors ${stage.status === 'active' ? 'border-primary bg-primary/5' : 'bg-card'}`}><div className="flex items-center gap-2">{stage.status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-success" /> : stage.status === 'active' ? <Clock3 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground" />}<span className="text-sm font-medium">{stage.name}</span></div><p className="mt-1 text-xs capitalize text-muted-foreground">{stage.status?.replace('_', ' ')}</p></li>)}</ol></CardContent></Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Tabs defaultValue="requirements">
          <TabsList><TabsTrigger value="requirements">Requirements</TabsTrigger><TabsTrigger value="history">History</TabsTrigger></TabsList>
          <TabsContent value="requirements" className="space-y-4">
            {journey.stages.map(stage => <Card key={stage.id}><CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base">{stage.position}. {stage.name}</CardTitle><Badge variant="outline" className="capitalize">{stage.status?.replace('_', ' ')}</Badge></div>{stage.description && <p className="text-sm text-muted-foreground">{stage.description}</p>}</CardHeader><CardContent className="space-y-2">{stage.requirements.length === 0 ? <p className="text-sm text-muted-foreground">No requirements configured.</p> : stage.requirements.map(requirement => <div key={requirement.id} className="flex items-start gap-3 rounded-md border bg-card p-3"><div className="mt-0.5">{requirement.status === 'completed' ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{requirement.name}</p><Badge variant="outline" className="text-[10px] uppercase tracking-wide">{requirement.type}</Badge>{requirement.isRequired && <span className="text-xs font-medium text-warning-foreground">Required</span>}</div>{requirement.description && <p className="mt-1 text-sm text-muted-foreground">{requirement.description}</p>}{requirement.completedAt && <p className="mt-1 text-xs text-muted-foreground">Completed {new Date(requirement.completedAt).toLocaleDateString()}</p>}</div>{canUpdate && stage.status === 'active' && requirement.status === 'pending' && requirement.type === 'checklist' && <Button size="sm" variant="outline" onClick={() => setSelectedRequirement(requirement)}><Check className="mr-1 h-4 w-4" />Complete</Button>}</div>)}</CardContent></Card>)}
          </TabsContent>
          <TabsContent value="history"><Card><CardContent className="p-5"><div className="space-y-4">{journey.auditEvents.map(event => <div key={event.id} className="flex gap-3 border-b pb-3 last:border-0"><Route className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="text-sm font-medium">{event.action.replace('.', ' ')}</p><p className="text-xs text-muted-foreground">{event.actor.firstName} {event.actor.lastName} · {new Date(event.createdAt).toLocaleString()}</p></div></div>)}</div></CardContent></Card></TabsContent>
        </Tabs>

        <div className="space-y-4">
          <Card><CardHeader><CardTitle className="text-base">Candidate</CardTitle></CardHeader><CardContent className="space-y-3"><div><p className="font-medium">{candidateName}</p><p className="text-xs text-muted-foreground">{journey.candidateUser.membershipType}</p></div><a href={`mailto:${journey.candidateUser.email}`} className="flex items-center gap-2 text-sm hover:underline"><Mail className="h-4 w-4" />{journey.candidateUser.email}</a>{journey.candidateUser.phone && <a href={`tel:${journey.candidateUser.phone}`} className="flex items-center gap-2 text-sm hover:underline"><Phone className="h-4 w-4" />{journey.candidateUser.phone}</a>}</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Journey information</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><div><p className="text-xs text-muted-foreground">Started</p><p>{new Date(journey.startedAt).toLocaleDateString()}</p></div><div><p className="text-xs text-muted-foreground">Language</p><p>{journey.candidate.preferredLanguage || 'Not specified'}</p></div><div><p className="text-xs text-muted-foreground">Referral source</p><p>{journey.candidate.referralSource || 'Not specified'}</p></div><div><p className="text-xs text-muted-foreground">Portal access</p><p>{journey.candidateUser.loginEnabled ? 'Enabled' : 'Not invited'}</p></div></CardContent></Card>
        </div>
      </div>

      <Dialog open={!!selectedRequirement} onOpenChange={open => { if (!open) { setSelectedRequirement(null); setCompletionNote(''); } }}><DialogContent><DialogHeader><DialogTitle>Complete requirement</DialogTitle></DialogHeader><div className="space-y-4"><div><p className="font-medium">{selectedRequirement?.name}</p><p className="text-sm text-muted-foreground">Confirm that this requirement has been fulfilled.</p></div><div className="grid gap-2"><Label>Completion note</Label><Textarea value={completionNote} onChange={event => setCompletionNote(event.target.value)} placeholder="Optional evidence or comment" /></div><Button className="w-full" disabled={completeRequirement.isPending} onClick={() => completeRequirement.mutate()}>{completeRequirement.isPending ? 'Saving…' : 'Mark complete'}</Button></div></DialogContent></Dialog>
    </div>
  );
}
