import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Church, Layers3, ListChecks, Pencil, Plus, Route, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  discipleshipService,
  type DiscipleshipRequirement,
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
import { ChurchMultiSelect } from "@/components/ChurchMultiSelect";

type WorkflowStageForm = {
  name: string;
  description: string;
  requirements: Array<{
    name: string;
    type: DiscipleshipRequirement["type"];
    courseId?: string;
    classId?: string;
    isRequired: boolean;
  }>;
};

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

export default function WorkflowsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useRole();
  const canManageWorkflows = hasPermission("discipleship_workflows:manage");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyWorkflow);

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
      queryClient.invalidateQueries({ queryKey: ["discipleship-workflows"] });
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.message || "Failed to create workflow"),
  });

  const editWorkflow = (workflow: (typeof workflows)[number]) => {
    setEditingId(workflow.id);
    setForm({
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
          courseId: item.courseId || undefined,
          classId: item.classId || undefined,
          isRequired: item.isRequired,
        })),
      })),
    });
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
          <Button onClick={() => setDialogOpen(true)}>
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
                {canManageWorkflows && workflow.status !== "archived" && (
                  <Button
                    className="mt-4"
                    variant="outline"
                    size="sm"
                    onClick={() => editWorkflow(workflow)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit as new version
                  </Button>
                )}
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
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? "Edit discipleship workflow"
                : "Create discipleship workflow"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
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
                      <Input
                        placeholder="Requirement"
                        value={requirement.name}
                        onChange={(event) =>
                          updateRequirement(stageIndex, requirementIndex, {
                            name: event.target.value,
                          })
                        }
                      />
                      <Select
                        value={requirement.type}
                        onValueChange={(
                          value: DiscipleshipRequirement["type"],
                        ) =>
                          updateRequirement(stageIndex, requirementIndex, {
                            type: value,
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
                      {requirement.type === "course" && (
                        <div className="grid gap-2 sm:col-span-3 sm:grid-cols-2">
                          <div className="grid gap-1.5"><Label>Linked course</Label><Select value={requirement.courseId} disabled={form.churchIds.length !== 1} onValueChange={(value) => updateRequirement(stageIndex, requirementIndex, { courseId: value, classId: undefined })}><SelectTrigger><SelectValue placeholder={form.churchIds.length === 1 ? "Select published course" : "Select exactly one church first"} /></SelectTrigger><SelectContent>{courses.filter(course => course.churchId === form.churchIds[0]).map(course => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select></div>
                          <div className="grid gap-1.5"><Label>Specific class (optional)</Label><Select value={requirement.classId || "any"} disabled={!requirement.courseId} onValueChange={(value) => updateRequirement(stageIndex, requirementIndex, { classId: value === "any" ? undefined : value })}><SelectTrigger><SelectValue placeholder="Any class in this course" /></SelectTrigger><SelectContent><SelectItem value="any">Any current or future class</SelectItem>{courses.find(course => course.id === requirement.courseId)?.classes.filter((item: any) => item.status !== "cancelled").map((item: any) => <SelectItem key={item.id} value={item.id}>{item.title} · {new Date(item.startsAt).toLocaleDateString()}</SelectItem>)}</SelectContent></Select></div>
                          <p className="text-xs text-muted-foreground sm:col-span-2">Course and class links belong to one church, so a course requirement can only be used when exactly one church is selected. Selecting a class assigns that exact cohort; “Any class” allows enrollment later.</p>
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
            <Button
              className="w-full"
              disabled={
                form.churchIds.length === 0 ||
                !form.name ||
                form.stages.some((stage) => !stage.name) ||
                form.stages.some((stage) => stage.requirements.some((requirement) => requirement.type === "course" && (!requirement.courseId || form.churchIds.length !== 1))) ||
                saveWorkflow.isPending
              }
              onClick={() => saveWorkflow.mutate()}
            >
              {saveWorkflow.isPending
                ? "Saving…"
                : editingId
                  ? "Publish new version"
                  : "Publish workflow"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WorkflowMetric({ icon: Icon, value, label, note }: any) {
  return <Card><CardContent className="flex items-start gap-3 p-5"><div className="rounded-md bg-primary/10 p-2.5"><Icon className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-semibold tabular-nums">{value}</p><p className="text-xs font-medium">{label}</p><p className="mt-1 text-[11px] text-muted-foreground">{note}</p></div></CardContent></Card>;
}
