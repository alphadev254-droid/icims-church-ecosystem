import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Plus, Route, Trash2 } from "lucide-react";
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

type WorkflowStageForm = {
  name: string;
  description: string;
  requirements: Array<{
    name: string;
    type: DiscipleshipRequirement["type"];
    isRequired: boolean;
  }>;
};

const emptyStage = (): WorkflowStageForm => ({
  name: "",
  description: "",
  requirements: [{ name: "", type: "checklist", isRequired: true }],
});
const emptyWorkflow = () => ({
  churchId: "",
  name: "",
  description: "",
  isDefault: false,
  publish: true,
  stages: [emptyStage()],
});

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

  const saveWorkflow = useMutation({
    mutationFn: () =>
      editingId
        ? discipleshipService.updateWorkflow(editingId, {
            ...form,
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
      churchId: workflow.churchId,
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-md bg-primary/10 p-2.5">
              <Route className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {workflows.length}
              </p>
              <p className="text-xs text-muted-foreground">Total workflows</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-2xl font-semibold tabular-nums">
              {publishedCount}
            </p>
            <p className="text-xs text-muted-foreground">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-2xl font-semibold tabular-nums">{draftCount}</p>
            <p className="text-xs text-muted-foreground">Drafts</p>
          </CardContent>
        </Card>
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
            <div className="grid gap-2">
              <Label>Church</Label>
              <Select
                value={form.churchId}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, churchId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select church" />
                </SelectTrigger>
                <SelectContent>
                  {churches.map((church) => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checklist">Checklist</SelectItem>
                          <SelectItem value="approval">Approval</SelectItem>
                          <SelectItem value="course">Course</SelectItem>
                          <SelectItem value="milestone">Milestone</SelectItem>
                          <SelectItem value="assessment">Assessment</SelectItem>
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
                !form.churchId ||
                !form.name ||
                form.stages.some((stage) => !stage.name) ||
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
