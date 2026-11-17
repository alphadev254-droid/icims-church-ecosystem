import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Church, Eye, Layers3, ListChecks, Pencil, Plus, Route, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import {
  discipleshipService,
  type DiscipleshipRequirement,
  type DiscipleshipWorkflow,
} from "@/services/discipleship";
import { churchesService } from "@/services/churches";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ChurchMultiSelect } from "@/components/ChurchMultiSelect";
import { apiErrorMessage } from "@/lib/api-error";

type WorkflowStageForm = {
  name: string;
  description: string;
  requirements: Array<{
    name: string;
    type: DiscipleshipRequirement["type"];
    definitionId?: string;
    courseId?: string;
    classId?: string;
    isRequired: boolean;
  }>;
};

type WorkflowForm = ReturnType<typeof emptyWorkflow>;
type SavedWorkflowDraft = {
  editingId: string | null;
  form: WorkflowForm;
  savedAt: string;
};

const WORKFLOW_DRAFT_KEY = "icims:discipleship-workflow-builder:v1";

const emptyStage = (): WorkflowStageForm => ({
  name: "",
  description: "",
  requirements: [{ name: "", type: "checklist", isRequired: true }],
});
const emptyWorkflow = () => ({
  churchIds: [] as string[],
  name: "",
  description: "",
  isDefault: false,
  publish: true,
  stages: [emptyStage()],
});

const requirementHelp: Record<DiscipleshipRequirement["type"], string> = {
  checklist: "A leader manually confirms a task was done, such as an orientation or welcome call.",
  approval: "An authorised leader reviews the candidate and records an approval decision.",
  course: "The candidate must complete a linked course or a specific scheduled class.",
  milestone: "Records a dated event such as baptism, membership reception or commissioning.",
  assessment: "Requires a scored assessment that must meet its configured pass mark.",
};
const requirementTypeLabels: Record<DiscipleshipRequirement["type"], string> = {
  checklist: "manual task",
  approval: "leader approval",
  course: "course",
  milestone: "milestone",
  assessment: "assessment",
};

export default function WorkflowsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useRole();
  const canManageWorkflows = hasPermission("discipleship_workflows:manage");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingWorkflow, setViewingWorkflow] = useState<DiscipleshipWorkflow | null>(null);
  const [deletingWorkflow, setDeletingWorkflow] = useState<DiscipleshipWorkflow | null>(null);
  const [form, setForm] = useState(emptyWorkflow);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ["discipleship-workflows", true],
    queryFn: () => discipleshipService.listWorkflows({ includeDrafts: true }),
  });
  const { data: churches = [] } = useQuery({
    queryKey: ["churches-select"],
    queryFn: churchesService.getSelectable,
    enabled: canManageWorkflows,
  });
  const { data: courses = [] } = useQuery({
    queryKey: ["discipleship-courses", "workflow-editor"],
    queryFn: () => discipleshipService.listCourses(false),
    enabled: canManageWorkflows,
  });
  const { data: requirementDefinitions = [] } = useQuery({
    queryKey: ["discipleship-requirement-definitions", "workflow-editor"],
    queryFn: () => discipleshipService.listRequirementDefinitions(false),
    enabled: canManageWorkflows,
  });

  const saveWorkflow = useMutation({
    mutationFn: () =>
      editingId
        ? discipleshipService.updateWorkflow(editingId, {
            ...form,
            churchId: form.churchIds[0],
            stages: form.stages.map((stage) => ({
              ...stage,
              requirements: stage.requirements.filter((item) =>
                item.name.trim(),
              ),
            })),
          })
        : discipleshipService.createWorkflow({
            ...form,
            stages: form.stages.map((stage) => ({
              ...stage,
              requirements: stage.requirements.filter((item) =>
                item.name.trim(),
              ),
            })),
          }),
    onSuccess: () => {
      toast.success(
        editingId ? "New workflow version published" : "Workflow created",
      );
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyWorkflow());
      localStorage.removeItem(WORKFLOW_DRAFT_KEY);
      setLastSavedAt(null);
      queryClient.invalidateQueries({ queryKey: ["discipleship-workflows"] });
    },
    onError: (error: unknown) =>
      toast.error(apiErrorMessage(error, "Failed to create workflow")),
  });
  const deleteWorkflow = useMutation({
    mutationFn: (id: string) => discipleshipService.deleteWorkflow(id),
    onSuccess: result => {
      toast.success(result.message);
      setDeletingWorkflow(null);
      queryClient.invalidateQueries({ queryKey: ["discipleship-workflows"] });
    },
    onError: (error: unknown) => toast.error(apiErrorMessage(error, "Could not remove workflow")),
  });

  const saveProgress = (showConfirmation = true) => {
    const savedAt = new Date().toISOString();
    const draft: SavedWorkflowDraft = { editingId, form, savedAt };
    localStorage.setItem(WORKFLOW_DRAFT_KEY, JSON.stringify(draft));
    setLastSavedAt(savedAt);
    if (showConfirmation) toast.success("Workflow progress saved on this device");
  };

  const restoreSavedDraft = (): SavedWorkflowDraft | null => {
    try {
      const raw = localStorage.getItem(WORKFLOW_DRAFT_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw) as SavedWorkflowDraft;
      return saved?.form?.stages?.length ? saved : null;
    } catch {
      localStorage.removeItem(WORKFLOW_DRAFT_KEY);
      return null;
    }
  };

  const openNewWorkflow = () => {
    const saved = restoreSavedDraft();
    if (saved && saved.editingId === null) {
      setForm(saved.form);
      setLastSavedAt(saved.savedAt);
      toast.info("Your saved workflow progress was restored");
    } else {
      setForm(emptyWorkflow());
      setLastSavedAt(null);
    }
    setEditingId(null);
    setDialogOpen(true);
  };

  useEffect(() => {
    if (!dialogOpen) return;
    const timer = window.setTimeout(() => {
      const savedAt = new Date().toISOString();
      const draft: SavedWorkflowDraft = { editingId, form, savedAt };
      localStorage.setItem(WORKFLOW_DRAFT_KEY, JSON.stringify(draft));
      setLastSavedAt(savedAt);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [dialogOpen, editingId, form]);

  const editWorkflow = (workflow: (typeof workflows)[number]) => {
    const existingForm: WorkflowForm = {
      churchIds: [workflow.churchId],
      name: workflow.name,
      description: workflow.description || "",
      isDefault: workflow.isDefault,
      publish: true,
      stages: workflow.stages.map((stage) => ({
        name: stage.name,
        description: stage.description || "",
        requirements: stage.requirements.map((item) => ({
          name: item.name,
          type: item.type,
          definitionId: item.definitionId || undefined,
          courseId: item.courseId || undefined,
          classId: item.classId || undefined,
          isRequired: item.isRequired,
        })),
      })),
    };
    const saved = restoreSavedDraft();
    if (saved?.editingId === workflow.id) {
      setForm(saved.form);
      setLastSavedAt(saved.savedAt);
      toast.info("Your saved changes were restored");
    } else {
      setForm(existingForm);
      setLastSavedAt(null);
    }
    setEditingId(workflow.id);
    setDialogOpen(true);
  };
  const moveStage = (index: number, direction: -1 | 1) =>
    setForm((current) => {
      const stages = [...current.stages];
      const target = index + direction;
      if (target < 0 || target >= stages.length) return current;
      [stages[index], stages[target]] = [stages[target], stages[index]];
      return { ...current, stages };
    });

  const updateStage = (stageIndex: number, patch: Partial<WorkflowStageForm>) =>
    setForm((current) => ({
      ...current,
      stages: current.stages.map((stage, index) =>
        index === stageIndex ? { ...stage, ...patch } : stage,
      ),
    }));

  const updateRequirement = (
    stageIndex: number,
    requirementIndex: number,
    patch: Partial<WorkflowStageForm["requirements"][number]>,
  ) => {
    const stage = form.stages[stageIndex];
    updateStage(stageIndex, {
      requirements: stage.requirements.map((item, index) =>
        index === requirementIndex ? { ...item, ...patch } : item,
      ),
    });
  };

  const publishedCount = workflows.filter(
    (item) => item.status === "published",
  ).length;
  const draftCount = workflows.filter((item) => item.status === "draft").length;
  const publishedWorkflows = workflows.filter((item) => item.status === "published");
  const stageCount = publishedWorkflows.reduce((sum, item) => sum + item.stages.length, 0);
  const requirementCount = publishedWorkflows.reduce((sum, item) => sum + item.stages.reduce((stageSum, stage) => stageSum + stage.requirements.length, 0), 0);
  const defaultChurches = new Set(publishedWorkflows.filter((item) => item.isDefault).map((item) => item.churchId)).size;
  const validationIssues = useMemo(() => {
    const issues: string[] = [];
    if (form.churchIds.length === 0) issues.push("Select at least one church");
    if (!form.name.trim()) issues.push("Enter a workflow name");
    form.stages.forEach((stage, stageIndex) => {
      if (!stage.name.trim()) issues.push(`Enter a name for stage ${stageIndex + 1}`);
      stage.requirements.forEach((requirement, requirementIndex) => {
        const missing = requirement.type === "course" ? !requirement.courseId : requirement.type === "assessment" ? !requirement.definitionId : !requirement.name.trim();
        if (missing) issues.push(`${requirement.type === "assessment" || requirement.type === "course" ? "Select a saved" : "Name the"} ${requirementTypeLabels[requirement.type]} for stage ${stageIndex + 1}, item ${requirementIndex + 1}`);
      });
    });
    return issues;
  }, [form]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Discipleship</p>
          <h1 className="font-heading text-2xl font-bold">Workflows</h1>
          <p className="text-sm text-muted-foreground">
            Design the stages and requirements candidates follow.
          </p>
        </div>
        {canManageWorkflows && (
          <Button onClick={openNewWorkflow}>
            <Plus className="mr-2 h-4 w-4" />
            New workflow
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <WorkflowMetric icon={Route} value={publishedCount} label="Published pathways" note={`${draftCount} drafts awaiting publication`} />
        <WorkflowMetric icon={Layers3} value={stageCount} label="Active stages" note="Across published pathways" />
        <WorkflowMetric icon={ListChecks} value={requirementCount} label="Requirements" note="Completion checks configured" />
        <WorkflowMetric icon={Church} value={defaultChurches} label="Churches covered" note="With a default pathway" />
        <WorkflowMetric icon={Route} value={workflows.length} label="All versions" note="Includes archived history" />
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">
          Loading workflows…
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {workflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{workflow.name}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {workflow.church?.name} · Version {workflow.version}
                    </p>
                  </div>
                  <Badge
                    variant={
                      workflow.status === "published" ? "default" : "secondary"
                    }
                  >
                    {workflow.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {workflow.description || "No description"}
                </p>
                <div className="mt-4 space-y-2">
                  {workflow.stages.map((stage) => (
                    <div
                      key={stage.id}
                      className="rounded-md border px-3 py-2 text-sm"
                    >
                      <span className="mr-2 text-muted-foreground">
                        {stage.position}.
                      </span>
                      {stage.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({stage.requirements.length} requirements)
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setViewingWorkflow(workflow)}><Eye className="mr-2 h-4 w-4" />View</Button>
                  {canManageWorkflows && workflow.status !== "archived" && <Button variant="outline" size="sm" onClick={() => editWorkflow(workflow)}><Pencil className="mr-2 h-4 w-4" />Edit as new version</Button>}
                  {canManageWorkflows && <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeletingWorkflow(workflow)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
          {workflows.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No workflows configured.
            </p>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex max-h-[92vh] flex-col overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="px-6 pt-6">
              {editingId
                ? "Edit discipleship workflow"
                : "Create discipleship workflow"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto px-6 py-2">
            <div className="rounded-md border bg-muted/40 p-3 text-sm"><p className="font-medium">How a workflow works</p><p className="mt-1 text-muted-foreground">Candidates move through stages in order. Required items block advancement; optional items can remain incomplete without stopping the journey.</p></div>
            <ChurchMultiSelect
              value={form.churchIds}
              onValueChange={(churchIds) => setForm((current) => ({ ...current, churchIds }))}
              disabled={!!editingId}
              label={editingId ? "Church" : "Churches"}
              placeholder="Select one or more churches"
              helpText={editingId
                ? "A published workflow version remains assigned to its original church."
                : "A separate, independently editable workflow will be created for every selected church."}
            />
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                placeholder="New Member Foundation"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            {form.stages.map((stage, stageIndex) => (
              <Card key={stageIndex}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Stage {stageIndex + 1}
                    </CardTitle>
                    <div>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={stageIndex === 0}
                        onClick={() => moveStage(stageIndex, -1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={stageIndex === form.stages.length - 1}
                        onClick={() => moveStage(stageIndex, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      {form.stages.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              stages: current.stages.filter(
                                (_, index) => index !== stageIndex,
                              ),
                            }))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Stage name"
                    value={stage.name}
                    onChange={(event) =>
                      updateStage(stageIndex, { name: event.target.value })
                    }
                  />
                  <Textarea
                    placeholder="Stage description"
                    value={stage.description}
                    onChange={(event) =>
                      updateStage(stageIndex, {
                        description: event.target.value,
                      })
                    }
                  />
                  {stage.requirements.map((requirement, requirementIndex) => (
                    <div
                      key={requirementIndex}
                      className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_150px_auto]"
                    >
                      <Select
                        value={requirement.type}
                        onValueChange={(
                          value: DiscipleshipRequirement["type"],
                        ) =>
                          updateRequirement(stageIndex, requirementIndex, {
                            type: value,
                            name: "",
                            definitionId: undefined,
                            courseId: undefined,
                            classId: undefined,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checklist">Manual task</SelectItem>
                          <SelectItem value="approval">Leader approval</SelectItem>
                          <SelectItem value="course">Course completion</SelectItem>
                          <SelectItem value="milestone">Dated milestone</SelectItem>
                          <SelectItem value="assessment">Scored assessment</SelectItem>
                        </SelectContent>
                      </Select>
                      {requirement.type === "course" ? (
                        <Select value={requirement.courseId} onValueChange={(value) => { const selected = courses.find(item => item.id === value); updateRequirement(stageIndex, requirementIndex, { courseId: value, classId: undefined, definitionId: undefined, name: selected?.title || "" }); }}>
                          <SelectTrigger><SelectValue placeholder="Select a saved course" /></SelectTrigger>
                          <SelectContent>{courses.filter(course => form.churchIds.length > 0 && form.churchIds.every(churchId => (course.churchIds || [course.churchId]).includes(churchId))).map(course => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : (
                        <Select value={requirement.definitionId} onValueChange={(value) => { const selected = requirementDefinitions.find(item => item.id === value); updateRequirement(stageIndex, requirementIndex, { definitionId: value, courseId: undefined, classId: undefined, name: selected?.title || "" }); }}>
                          <SelectTrigger><SelectValue placeholder="Select a saved requirement" /></SelectTrigger>
                          <SelectContent>{requirementDefinitions.filter(item => item.type === requirement.type && form.churchIds.length > 0 && form.churchIds.every(churchId => item.churchIds.includes(churchId))).map(item => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          updateStage(stageIndex, {
                            requirements: stage.requirements.filter(
                              (_, index) => index !== requirementIndex,
                            ),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="flex items-start gap-2 sm:col-span-3"><Checkbox id={`required-${stageIndex}-${requirementIndex}`} checked={requirement.isRequired} onCheckedChange={(checked) => updateRequirement(stageIndex, requirementIndex, { isRequired: checked === true })} /><div><Label htmlFor={`required-${stageIndex}-${requirementIndex}`}>Required before moving to the next stage</Label><p className="mt-1 text-xs text-muted-foreground">{requirementHelp[requirement.type]}</p></div></div>
                      {!["course", "assessment"].includes(requirement.type) && <div className="grid gap-1.5 sm:col-span-3"><Label>Requirement name</Label><Input value={requirement.name} placeholder={requirement.type === "checklist" ? "For example: Welcome call completed" : requirement.type === "approval" ? "For example: Pastor approval" : "For example: Baptism"} onChange={event => updateRequirement(stageIndex, requirementIndex, { name: event.target.value, definitionId: undefined })} /><p className="text-xs text-muted-foreground">Type a one-off requirement here, or select a saved requirement above for reuse.</p></div>}
                      {requirement.type === "course" && requirement.courseId && (
                        <div className="grid gap-2 sm:col-span-3 sm:grid-cols-2">
                          <div className="grid gap-1.5 sm:col-span-2"><Label>Specific class (optional)</Label><Select value={requirement.classId || "any"} disabled={form.churchIds.length !== 1} onValueChange={(value) => updateRequirement(stageIndex, requirementIndex, { classId: value === "any" ? undefined : value })}><SelectTrigger><SelectValue placeholder="Any class in this course" /></SelectTrigger><SelectContent><SelectItem value="any">Any current or future class</SelectItem>{courses.find(course => course.id === requirement.courseId)?.classes.filter(item => item.status !== "cancelled" && item.churchId === form.churchIds[0]).map(item => <SelectItem key={item.id} value={item.id}>{item.title} · {new Date(item.startsAt).toLocaleDateString()}</SelectItem>)}</SelectContent></Select></div>
                          <p className="text-xs text-muted-foreground sm:col-span-2">The selected course is shared by every church in this workflow. A specific local class can only be chosen for a one-church workflow.</p>
                        </div>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateStage(stageIndex, {
                        requirements: [
                          ...stage.requirements,
                          { name: "", type: "checklist", isRequired: true },
                        ],
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Requirement
                  </Button>
                </CardContent>
              </Card>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  stages: [...current.stages, emptyStage()],
                }))
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add stage
            </Button>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.isDefault}
                onCheckedChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    isDefault: value === true,
                  }))
                }
              />
              <Label>Use as the default workflow for this church</Label>
            </div>
            {editingId && (
              <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                Publishing creates a new version. Candidates already in progress
                remain on their original stage snapshot.
              </p>
            )}
          </div>
          <div className="border-t bg-background px-6 py-4">
            {validationIssues.length > 0 && (
              <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <p className="font-medium">Complete these items before publishing</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                  {validationIssues.slice(0, 5).map((issue) => <li key={issue}>{issue}</li>)}
                  {validationIssues.length > 5 && <li>{validationIssues.length - 5} more items need attention</li>}
                </ul>
              </div>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                {lastSavedAt ? `Progress saved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Progress saves automatically on this device"}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => saveProgress(true)}>Save progress</Button>
                <Button
                  disabled={saveWorkflow.isPending}
                  onClick={() => {
                    if (validationIssues.length) {
                      toast.error(validationIssues[0]);
                      return;
                    }
                    saveWorkflow.mutate();
                  }}
                >
                  {saveWorkflow.isPending ? "Publishing…" : editingId ? "Publish new version" : "Publish workflow"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!viewingWorkflow} onOpenChange={open => !open && setViewingWorkflow(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{viewingWorkflow?.name}</DialogTitle></DialogHeader>
          {viewingWorkflow && <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2"><Badge>{viewingWorkflow.status}</Badge><span className="text-sm text-muted-foreground">{viewingWorkflow.church?.name} · Version {viewingWorkflow.version}{viewingWorkflow.isDefault ? " · Default workflow" : ""}</span></div>
            <p className="text-sm text-muted-foreground">{viewingWorkflow.description || "No description"}</p>
            {viewingWorkflow.stages.map(stage => <div key={stage.id} className="rounded-md border p-4"><p className="font-medium">{stage.position}. {stage.name}</p>{stage.description && <p className="mt-1 text-sm text-muted-foreground">{stage.description}</p>}<div className="mt-3 space-y-2">{stage.requirements.map(requirement => <div key={requirement.id} className="flex items-start justify-between gap-3 rounded-md bg-muted/50 px-3 py-2 text-sm"><div><p>{requirement.name}</p><p className="text-xs capitalize text-muted-foreground">{requirement.type.replace("_", " ")}</p></div><Badge variant={requirement.isRequired ? "default" : "secondary"}>{requirement.isRequired ? "Required" : "Optional"}</Badge></div>)}</div></div>)}
          </div>}
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deletingWorkflow} onOpenChange={open => !open && setDeletingWorkflow(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete workflow</AlertDialogTitle><AlertDialogDescription>Delete <strong>{deletingWorkflow?.name}</strong>? If a journey already uses this version, it will be archived instead so historical records remain valid.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteWorkflow.isPending} onClick={() => deletingWorkflow && deleteWorkflow.mutate(deletingWorkflow.id)}>{deleteWorkflow.isPending ? "Removing…" : "Delete workflow"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WorkflowMetric({ icon: Icon, value, label, note }: { icon: LucideIcon; value: string | number; label: string; note: string }) {
  return <Card><CardContent className="flex items-start gap-3 p-5"><div className="rounded-md bg-primary/10 p-2.5"><Icon className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-semibold tabular-nums">{value}</p><p className="text-xs font-medium">{label}</p><p className="mt-1 text-[11px] text-muted-foreground">{note}</p></div></CardContent></Card>;
}
