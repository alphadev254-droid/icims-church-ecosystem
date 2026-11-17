import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock3, Eye, RefreshCw, Search, UserPlus, UsersRound, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { discipleshipService, type DiscipleshipIntakeCandidate } from "@/services/discipleship";
import { churchesService } from "@/services/churches";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiErrorMessage } from "@/lib/api-error";

const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts.shift() || "", lastName: parts.join(" ") || "Visitor" };
};

export default function IntakePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DiscipleshipIntakeCandidate | null>(null);
  const [viewing, setViewing] = useState<DiscipleshipIntakeCandidate | null>(null);
  const [intakeEdit, setIntakeEdit] = useState({ status: "pending" as DiscipleshipIntakeCandidate["status"], notes: "" });
  const [form, setForm] = useState({ workflowId: "", firstName: "", lastName: "", email: "", phone: "", preferredLanguage: "", notes: "" });

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["discipleship-intake", status],
    queryFn: () => discipleshipService.listIntakeCandidates(status),
  });
  const { data: churches = [] } = useQuery({ queryKey: ["churches-select"], queryFn: churchesService.getSelectable });
  const { data: workflows = [] } = useQuery({ queryKey: ["discipleship-workflows", false], queryFn: () => discipleshipService.listWorkflows() });

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? candidates.filter(candidate => [candidate.name, candidate.email, candidate.phone].some(value => value?.toLowerCase().includes(term))) : candidates;
  }, [candidates, search]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["discipleship-intake"] });
  const sync = useMutation({
    mutationFn: discipleshipService.syncFirstTimers,
    onSuccess: result => { invalidate(); toast.success(result.created ? `${result.created} First Timer candidate${result.created === 1 ? "" : "s"} added` : "First Timer intake is up to date"); },
    onError: (error: unknown) => toast.error(apiErrorMessage(error, "Could not sync First Timer check-ins")),
  });
  const update = useMutation({
    mutationFn: ({ id, nextStatus, notes }: { id: string; nextStatus: DiscipleshipIntakeCandidate["status"]; notes?: string }) => discipleshipService.updateIntakeCandidate(id, { status: nextStatus, notes }),
    onSuccess: result => { invalidate(); if (viewing?.id === result.id) setViewing(result); },
    onError: (error: unknown) => toast.error(apiErrorMessage(error, "Could not update candidate")),
  });
  const createJourney = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("No candidate selected");
      const journey = await discipleshipService.createJourney({
        churchId: selected.churchId,
        workflowId: form.workflowId,
        sourceType: selected.sourceType,
        sourceRecordId: selected.sourceRecordId,
        consentStatus: "yes",
        candidate: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || undefined,
          preferredLanguage: form.preferredLanguage || undefined,
          referralSource: selected.sourceType === "attendance" ? "First Timer service check-in" : "Evangelism",
        },
        notes: form.notes || selected.notes || undefined,
      });
      return journey;
    },
    onSuccess: journey => { invalidate(); setSelected(null); toast.success("Candidate journey started"); navigate(`/dashboard/discipleship/journeys/${journey.id}`); },
    onError: (error: unknown) => toast.error(apiErrorMessage(error, "Could not start the journey")),
  });

  const beginJourney = (candidate: DiscipleshipIntakeCandidate) => {
    const name = splitName(candidate.name);
    setSelected(candidate);
    setForm({ workflowId: "", firstName: name.firstName, lastName: name.lastName, email: candidate.email || "", phone: candidate.phone || "", preferredLanguage: "", notes: candidate.notes || "" });
  };
  const viewCandidate = (candidate: DiscipleshipIntakeCandidate) => {
    setViewing(candidate);
    setIntakeEdit({ status: candidate.status, notes: candidate.notes || "" });
  };
  const selectedChurch = churches.find(church => church.id === selected?.churchId);
  const availableWorkflows = workflows.filter(workflow => workflow.churchId === selected?.churchId && workflow.status === "published");
  const counts = candidates.reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.status]: (acc[item.status] || 0) + 1 }), {});

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-sm font-medium text-primary">Discipleship</p><h1 className="font-heading text-2xl font-bold">First Timer intake</h1><p className="text-sm text-muted-foreground">Every First Timer checked into a service appears here automatically for consent and follow-up.</p></div>
      <Button variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending}><RefreshCw className={`mr-2 h-4 w-4 ${sync.isPending ? "animate-spin" : ""}`} />Sync check-ins</Button>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={UsersRound} value={candidates.length} label="Intake candidates" />
      <Metric icon={Clock3} value={counts.pending || 0} label="Awaiting contact" />
      <Metric icon={CheckCircle2} value={(counts.consented || 0) + (counts.converted || 0)} label="Consented" />
      <Metric icon={XCircle} value={counts.declined || 0} label="Declined" />
    </div>
    <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, email or phone" /></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="pending">Awaiting contact</SelectItem><SelectItem value="contacted">Contacted</SelectItem><SelectItem value="consented">Consented</SelectItem><SelectItem value="declined">Declined</SelectItem><SelectItem value="converted">Journey started</SelectItem></SelectContent></Select></div>
    <Card><CardContent className="p-0">
      {isLoading ? <p className="p-10 text-center text-muted-foreground">Loading First Timer intake…</p> : visible.length === 0 ? <div className="p-10 text-center"><UsersRound className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><p className="font-medium">No First Timers in this view</p><p className="text-sm text-muted-foreground">New service check-ins will appear automatically.</p></div> : visible.map(candidate => <div key={candidate.id} className="flex flex-col gap-3 border-b p-4 last:border-0 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{candidate.name}</p><Badge variant={candidate.status === "converted" ? "default" : "secondary"}>{candidate.status.replace("_", " ")}</Badge></div><p className="mt-1 truncate text-xs text-muted-foreground">{candidate.email || "Email not captured"} · {candidate.phone || "Phone not captured"} · {new Date(candidate.promptedAt).toLocaleString()}</p><p className="mt-1 text-xs text-muted-foreground">{churches.find(church => church.id === candidate.churchId)?.name || "Church"} · {candidate.sourceType === "attendance" ? "Service First Timer" : "Evangelism"}</p></div>
        <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => viewCandidate(candidate)}><Eye className="mr-1 h-4 w-4" />View</Button>{candidate.status === "pending" && <Button size="sm" variant="outline" onClick={() => update.mutate({ id: candidate.id, nextStatus: "contacted" })}>Mark contacted</Button>}{candidate.status !== "declined" && candidate.status !== "converted" && <Button size="sm" onClick={() => beginJourney(candidate)}><UserPlus className="mr-2 h-4 w-4" />Start journey</Button>}{candidate.status !== "converted" && candidate.status !== "declined" && <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: candidate.id, nextStatus: "declined" })}>Declined</Button>}</div>
      </div>)}
    </CardContent></Card>
    <Dialog open={!!viewing} onOpenChange={open => !open && setViewing(null)}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Intake candidate</DialogTitle></DialogHeader>{viewing && <div className="space-y-4"><div className="rounded-md border bg-muted/40 p-3"><p className="font-medium">{viewing.name}</p><p className="text-sm text-muted-foreground">{viewing.email || "Email not captured"} · {viewing.phone || "Phone not captured"}</p><p className="mt-1 text-xs text-muted-foreground">{churches.find(church => church.id === viewing.churchId)?.name || "Church"} · Added {new Date(viewing.promptedAt).toLocaleString()}</p></div><div className="grid gap-2"><Label>Status</Label><Select value={intakeEdit.status} disabled={viewing.status === "converted"} onValueChange={(status: DiscipleshipIntakeCandidate["status"]) => setIntakeEdit(current => ({ ...current, status }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Awaiting contact</SelectItem><SelectItem value="contacted">Contacted</SelectItem><SelectItem value="consented">Consented</SelectItem><SelectItem value="declined">Declined</SelectItem>{viewing.status === "converted" && <SelectItem value="converted">Journey started</SelectItem>}</SelectContent></Select></div><div className="grid gap-2"><Label>Follow-up notes</Label><Textarea value={intakeEdit.notes} onChange={event => setIntakeEdit(current => ({ ...current, notes: event.target.value }))} /></div><Button className="w-full" disabled={viewing.status === "converted" || update.isPending} onClick={() => update.mutate({ id: viewing.id, nextStatus: intakeEdit.status, notes: intakeEdit.notes || undefined })}>{update.isPending ? "Saving…" : "Save intake changes"}</Button>{viewing.status === "converted" && <p className="text-xs text-muted-foreground">This intake has already created a journey. Continue managing the candidate from Journeys.</p>}</div>}</DialogContent></Dialog>
    <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Start discipleship journey</DialogTitle></DialogHeader><div className="grid gap-4 py-2">
      <div className="rounded-md border bg-muted/40 p-3 text-sm"><p className="font-medium">{selected?.name}</p><p className="text-muted-foreground">{selectedChurch?.name} · First Timer service check-in</p></div>
      <div className="grid gap-2"><Label>Published workflow</Label><Select value={form.workflowId} onValueChange={workflowId => setForm(current => ({ ...current, workflowId }))}><SelectTrigger><SelectValue placeholder="Select the pathway" /></SelectTrigger><SelectContent>{availableWorkflows.map(workflow => <SelectItem key={workflow.id} value={workflow.id}>{workflow.name}</SelectItem>)}</SelectContent></Select>{availableWorkflows.length === 0 && <p className="text-xs text-destructive">Publish a workflow for this church before starting the journey.</p>}</div>
      <div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label>First name</Label><Input value={form.firstName} onChange={event => setForm(current => ({ ...current, firstName: event.target.value }))} /></div><div className="grid gap-2"><Label>Last name</Label><Input value={form.lastName} onChange={event => setForm(current => ({ ...current, lastName: event.target.value }))} /></div></div>
      <div className="grid gap-2"><Label>Email</Label><Input type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} /><p className="text-xs text-muted-foreground">Required to create the candidate’s ICIMS identity. Enter it here if the check-in did not capture it.</p></div>
      <div className="grid gap-2"><Label>Phone</Label><Input value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} /></div>
      <div className="grid gap-2"><Label>Preferred language</Label><Input value={form.preferredLanguage} onChange={event => setForm(current => ({ ...current, preferredLanguage: event.target.value }))} /></div>
      <div className="grid gap-2"><Label>Intake notes</Label><Textarea value={form.notes} onChange={event => setForm(current => ({ ...current, notes: event.target.value }))} /></div>
      <div className="rounded-md border bg-muted/40 p-3 text-sm">Starting the journey confirms that the person agreed to enter the church’s discipleship process.</div>
      <Button disabled={!form.workflowId || !form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || createJourney.isPending} onClick={() => createJourney.mutate()}>{createJourney.isPending ? "Starting journey…" : "Confirm consent and start journey"}</Button>
    </div></DialogContent></Dialog>
  </div>;
}

function Metric({ icon: Icon, value, label }: { icon: LucideIcon; value: number; label: string }) {
  return <Card><CardContent className="flex items-center gap-3 p-5"><div className="rounded-md bg-primary/10 p-2.5"><Icon className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-semibold tabular-nums">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card>;
}
