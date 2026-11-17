import { useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CalendarDays,
  Clock3,
  Eye,
  FileAudio,
  FileVideo,
  Link2,
  LibraryBig,
  Plus,
  ListChecks,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { discipleshipService, type DiscipleshipClass, type DiscipleshipCourse, type DiscipleshipRequirementDefinition } from "@/services/discipleship";
import { uploadService } from "@/services/upload";
import { churchesService } from "@/services/churches";
import { apiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChurchMultiSelect } from "@/components/ChurchMultiSelect";
import { usersService } from "@/services/users";
import { useRole } from "@/hooks/useRole";
import { ClassRosterDialog } from "@/components/discipleship/ClassRosterDialog";
import { ScheduleClassDialog } from "@/components/discipleship/ScheduleClassDialog";
import { AssessmentQuestionEditorDialog } from "@/components/discipleship/AssessmentQuestionEditorDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type CatalogType = "course" | "checklist" | "approval" | "milestone" | "assessment";
type CatalogTarget = { kind: "course"; item: DiscipleshipCourse } | { kind: "requirement"; item: DiscipleshipRequirementDefinition };

const emptyCatalogForm = () => ({
  churchIds: [] as string[], type: "course" as CatalogType, title: "", description: "", status: "published",
  materialTitle: "", materialKind: "video", materialUrl: "", passScore: "70", maxScore: "100",
  personsInCharge: {} as Record<string, string>,
});

export default function ProgramsPage() {
  const qc = useQueryClient();
  const { hasPermission } = useRole();
  const canManageCourses = hasPermission("discipleship_courses:manage");
  const canManageAttendance = hasPermission("discipleship_attendance:manage");
  const [open, setOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<CatalogTarget | null>(null);
  const [viewingTarget, setViewingTarget] = useState<CatalogTarget | null>(null);
  const [deletingTarget, setDeletingTarget] = useState<CatalogTarget | null>(null);
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [classCourseId, setClassCourseId] = useState<string | null>(null);
  const [editingClass, setEditingClass] = useState<DiscipleshipClass | null>(null);
  const [deletingClass, setDeletingClass] = useState<DiscipleshipClass | null>(null);
  const [managedClassId, setManagedClassId] = useState<string | null>(null);
  const [questionDefinition, setQuestionDefinition] = useState<{ id: string; title: string } | null>(null);
  const [form, setForm] = useState(emptyCatalogForm);
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["discipleship-courses"],
    queryFn: () => discipleshipService.listCourses(true),
  });
  const { data: definitions = [] } = useQuery({
    queryKey: ["discipleship-requirement-definitions"],
    queryFn: () => discipleshipService.listRequirementDefinitions(true),
  });
  const { data: churches = [] } = useQuery({
    queryKey: ["churches-select"],
    queryFn: churchesService.getSelectable,
  });
  const churchUserQueries = useQueries({
    queries: form.churchIds.map(churchId => ({
      queryKey: ["discipleship-person-in-charge", churchId],
      queryFn: () => usersService.getAll({ churchId, status: "active", limit: 100 }),
      staleTime: 60_000,
    })),
  });
  const usersByChurch = new Map(form.churchIds.map((churchId, index) => [churchId, churchUserQueries[index]?.data?.data || []]));
  const create = useMutation({
    mutationFn: async () => {
      if (form.type !== "course") {
        const payload = {
          churchIds: form.churchIds, type: form.type, title: form.title,
          description: form.description || undefined, status: form.status,
          personsInCharge: form.churchIds.map(churchId => ({ churchId, userId: form.personsInCharge[churchId] })),
          ...(form.type === "assessment" ? { passScore: Number(form.passScore), maxScore: Number(form.maxScore) } : {}),
        };
        return editingTarget?.kind === "requirement"
          ? discipleshipService.updateRequirementDefinition(editingTarget.item.id, payload)
          : discipleshipService.createRequirementDefinition(payload);
      }
      let uploadedUrl: string | undefined;
      let materialKind = form.materialKind;
      let materialTitle = form.materialTitle;
      try {
        if (materialFile) {
          const uploaded = await uploadService.uploadDiscipleshipFile(materialFile);
          uploadedUrl = uploaded.url;
          materialTitle = materialTitle || uploaded.name;
          materialKind = uploaded.mimeType.startsWith("video/") ? "video" : uploaded.mimeType.startsWith("audio/") ? "audio" : "document";
        }
        const payload = {
        churchIds: form.churchIds,
        personsInCharge: form.churchIds.map(churchId => ({ churchId, userId: form.personsInCharge[churchId] })),
        title: form.title,
        description: form.description || undefined,
        status: form.status,
        materials:
          materialTitle && (uploadedUrl || form.materialUrl)
            ? [
                {
                  title: materialTitle,
                  kind: materialKind,
                  url: uploadedUrl || form.materialUrl,
                  downloadable: materialKind === "document",
                },
              ]
            : [],
        };
        return editingTarget?.kind === "course"
          ? await discipleshipService.updateCourse(editingTarget.item.id, payload)
          : await discipleshipService.createCourse(payload);
      } catch (error) {
        if (uploadedUrl) await uploadService.deleteFile(uploadedUrl).catch(() => undefined);
        throw error;
      }
    },
    onSuccess: (created) => {
      toast.success(editingTarget ? (form.type === "course" ? "Course updated" : "Requirement updated") : (form.type === "course" ? "Course created" : "Requirement created"));
      if (form.type === "assessment") setQuestionDefinition({ id: created.id, title: created.title });
      setOpen(false);
      setEditingTarget(null);
      setMaterialFile(null);
      setForm(emptyCatalogForm());
      qc.invalidateQueries({ queryKey: ["discipleship-courses"] });
      qc.invalidateQueries({ queryKey: ["discipleship-requirement-definitions"] });
    },
    onError: (error: unknown) =>
      toast.error(apiErrorMessage(error, "Could not create course")),
  });
  const deleteCatalogItem = useMutation({
    mutationFn: (target: CatalogTarget) => target.kind === "course" ? discipleshipService.deleteCourse(target.item.id) : discipleshipService.deleteRequirementDefinition(target.item.id),
    onSuccess: result => { toast.success(result.message); setDeletingTarget(null); qc.invalidateQueries({ queryKey: ["discipleship-courses"] }); qc.invalidateQueries({ queryKey: ["discipleship-requirement-definitions"] }); },
    onError: (error: unknown) => toast.error(apiErrorMessage(error, "Could not remove catalogue item")),
  });
  const deleteClass = useMutation({
    mutationFn: (classId: string) => discipleshipService.deleteClass(classId),
    onSuccess: result => { toast.success(result.message); setDeletingClass(null); qc.invalidateQueries({ queryKey: ["discipleship-courses"] }); },
    onError: (error: unknown) => toast.error(apiErrorMessage(error, "Could not remove class")),
  });
  const openNewItem = () => { setEditingTarget(null); setMaterialFile(null); setForm(emptyCatalogForm()); setOpen(true); };
  const editCourse = (course: DiscipleshipCourse) => {
    const material = course.materials[0];
    setEditingTarget({ kind: "course", item: course });
    setMaterialFile(null);
    setForm({ ...emptyCatalogForm(), churchIds: course.churchIds || [course.churchId], type: "course", title: course.title, description: course.description || "", status: course.status,
      materialTitle: material?.title || "", materialKind: material?.kind || "document", materialUrl: material?.url || "",
      personsInCharge: Object.fromEntries((course.personsInCharge || []).map(item => [item.churchId, item.userId])) });
    setOpen(true);
  };
  const editRequirement = (item: DiscipleshipRequirementDefinition) => {
    setEditingTarget({ kind: "requirement", item });
    setMaterialFile(null);
    setForm({ ...emptyCatalogForm(), churchIds: item.churchIds, type: item.type, title: item.title, description: item.description || "", status: item.status,
      passScore: String(item.passScore ?? 70), maxScore: String(item.maxScore ?? 100), personsInCharge: Object.fromEntries((item.personsInCharge || []).map(assignment => [assignment.churchId, assignment.userId])) });
    setOpen(true);
  };
  const now = Date.now(); const sevenDays = now + 7 * 86400000;
  const allClasses = courses.flatMap((course) => course.classes);
  const upcomingClasses = allClasses.filter(item => new Date(item.startsAt).getTime() >= now && ['scheduled', 'active'].includes(item.status));
  const sessionsThisWeek = allClasses.flatMap(item => item.sessions || []).filter(item => { const time = new Date(item.startsAt).getTime(); return time >= now && time <= sevenDays; }).length;
  const enrollmentCount = allClasses.reduce((sum, item) => sum + (item._count?.enrollments || 0), 0);
  const materialCount = courses.reduce((sum, course) => sum + course.materials.length, 0);
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Discipleship</p>
          <h1 className="font-heading text-2xl font-bold">Learning & requirements</h1>
          <p className="text-sm text-muted-foreground">
            Create reusable workflow requirements, publish courses and schedule church-specific classes.
          </p>
        </div>
        {canManageCourses && <Button onClick={openNewItem}>
          <Plus className="mr-2 h-4 w-4" />
          New catalogue item
        </Button>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <ProgramMetric icon={BookOpen} value={courses.filter(course => course.status === 'published').length} label="Published courses" note={`${courses.filter(course => course.status === 'draft').length} drafts`} />
        <ProgramMetric icon={CalendarDays} value={upcomingClasses.length} label="Upcoming classes" note={`${allClasses.length} classes in total`} />
        <ProgramMetric icon={Clock3} value={sessionsThisWeek} label="Sessions this week" note="Scheduled in the next 7 days" />
        <ProgramMetric icon={Users} value={enrollmentCount} label="Enrollments" note="Across all current classes" />
        <ProgramMetric icon={LibraryBig} value={materialCount} label="Learning materials" note="Documents, audio and video" />
      </div>
      <div>
        <div className="mb-3"><h2 className="font-semibold">Reusable workflow requirements</h2><p className="text-sm text-muted-foreground">Create these once, assign them to churches, then select them in workflow stages.</p></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {definitions.map((item) => <Card key={item.id}><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.description || "No description"}</p></div><Badge variant="secondary">{item.type === "checklist" ? "Manual task" : item.type === "approval" ? "Leader approval" : item.type === "milestone" ? "Dated milestone" : "Assessment"}</Badge></div><p className="mt-3 text-xs text-muted-foreground">Available in {item.churchIds.length} {item.churchIds.length === 1 ? "church" : "churches"}{item.type === "assessment" ? ` · ${item._count?.questions || 0} questions` : ""}</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setViewingTarget({ kind: "requirement", item })}><Eye className="mr-1 h-4 w-4" />View</Button>{canManageCourses && <Button size="sm" variant="outline" onClick={() => editRequirement(item)}><Pencil className="mr-1 h-4 w-4" />Edit</Button>}{item.type === "assessment" && canManageCourses && <Button size="sm" variant="outline" onClick={() => setQuestionDefinition({ id: item.id, title: item.title })}><ListChecks className="mr-1 h-4 w-4" />Questions</Button>}{canManageCourses && <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeletingTarget({ kind: "requirement", item })}><Trash2 className="mr-1 h-4 w-4" />Delete</Button>}</div></CardContent></Card>)}
          {definitions.length === 0 && <p className="text-sm text-muted-foreground">No reusable requirements created yet.</p>}
        </div>
      </div>
      <div><h2 className="font-semibold">Courses and church classes</h2><p className="text-sm text-muted-foreground">Courses can be shared across churches; each scheduled class remains attached to one church.</p></div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading courses…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{course.title}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {course.description || "No description"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2"><Badge>{course.status}</Badge><Button size="sm" variant="outline" onClick={() => setViewingTarget({ kind: "course", item: course })}><Eye className="mr-1 h-4 w-4" />View</Button>{canManageCourses && <Button size="sm" variant="outline" onClick={() => editCourse(course)}><Pencil className="mr-1 h-4 w-4" />Edit</Button>}{canManageCourses && <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeletingTarget({ kind: "course", item: course })}><Trash2 className="h-4 w-4" /></Button>}</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">Available in {course.churchIds?.length || 1} {(course.churchIds?.length || 1) === 1 ? "church" : "churches"}</p>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Curriculum
                  </p>
                  {course.materials.length ? (
                    course.materials.map((m) => (
                      <a
                        key={m.id}
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded border px-3 py-2 text-sm hover:bg-muted"
                      >
                        {m.kind === "video" ? (
                          <FileVideo className="h-4 w-4" />
                        ) : m.kind === "audio" ? (
                          <FileAudio className="h-4 w-4" />
                        ) : (
                          <Link2 className="h-4 w-4" />
                        )}
                        {m.title}
                      </a>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No materials yet.
                    </p>
                  )}
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Classes
                    </p>
                    {canManageCourses && <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setClassCourseId(course.id)}
                    >
                      <CalendarDays className="mr-1 h-3.5 w-3.5" />
                      Schedule
                    </Button>}
                  </div>
                  {course.classes.length ? (
                    course.classes.map(k => (
                      <div key={k.id} className="rounded border p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{k.title}</span>
                          <Badge variant="outline">{k.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(k.startsAt).toLocaleString()} ·{" "}
                          {k._count.enrollments} enrolled · {k.sessions.length}{" "}
                          sessions
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">{(canManageCourses || canManageAttendance) && <Button size="sm" variant="outline" onClick={() => setManagedClassId(k.id)}><Eye className="mr-1 h-4 w-4" />View roster</Button>}{canManageCourses && <Button size="sm" variant="outline" onClick={() => setEditingClass({ ...k, course: { id: course.id, title: course.title } })}><Pencil className="mr-1 h-4 w-4" />Edit</Button>}{canManageCourses && <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeletingClass({ ...k, course: { id: course.id, title: course.title } })}><Trash2 className="mr-1 h-4 w-4" />Delete</Button>}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No classes scheduled.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={nextOpen => { setOpen(nextOpen); if (!nextOpen) setEditingTarget(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTarget ? "Edit learning or requirement item" : "Create learning or requirement item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2"><Label>Item type</Label><Select value={form.type} disabled={!!editingTarget} onValueChange={(type: CatalogType) => setForm({ ...form, type })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="course">Course completion</SelectItem><SelectItem value="checklist">Manual task</SelectItem><SelectItem value="approval">Leader approval</SelectItem><SelectItem value="milestone">Dated milestone</SelectItem><SelectItem value="assessment">Scored assessment</SelectItem></SelectContent></Select></div>
            <ChurchMultiSelect value={form.churchIds} onValueChange={(churchIds) => setForm({ ...form, churchIds, personsInCharge: Object.fromEntries(Object.entries(form.personsInCharge).filter(([churchId]) => churchIds.includes(churchId))) })} helpText="This item will be available when building workflows for every selected church." />
            {form.churchIds.length > 0 && <div className="space-y-3 rounded-md border p-3"><div><p className="text-sm font-medium">Person in charge</p><p className="text-xs text-muted-foreground">Select one active user from each church. This person owns this item for that church.</p></div>{form.churchIds.map(churchId => { const church = churches.find(item => item.id === churchId); const users = usersByChurch.get(churchId) || []; return <div key={churchId} className="grid gap-2 sm:grid-cols-[180px_1fr] sm:items-center"><Label>{church?.name || "Selected church"}</Label><Select value={form.personsInCharge[churchId]} onValueChange={(userId) => setForm(current => ({ ...current, personsInCharge: { ...current.personsInCharge, [churchId]: userId } }))}><SelectTrigger><SelectValue placeholder={churchUserQueries[form.churchIds.indexOf(churchId)]?.isLoading ? "Loading users…" : "Select person in charge"} /></SelectTrigger><SelectContent>{users.map(user => <SelectItem key={user.id} value={user.id}>{user.firstName} {user.lastName} · {user.role?.displayName || user.roleName}</SelectItem>)}</SelectContent></Select></div>; })}</div>}
            <div className="grid gap-2">
              <Label>{form.type === "course" ? "Course title" : "Requirement title"}</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            {form.type === "assessment" && <div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label>Pass score</Label><Input type="number" min="0" value={form.passScore} onChange={(e) => setForm({ ...form, passScore: e.target.value })} /></div><div className="grid gap-2"><Label>Maximum score</Label><Input type="number" min="1" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })} /></div></div>}
            {form.type === "course" && <div className="rounded-md border p-3 space-y-3">
              <p className="text-sm font-medium">
                First curriculum item (optional)
              </p>
              <p className="text-xs text-muted-foreground">
                Upload the actual file to ICIMS or provide an external link.
              </p>
              <Input
                placeholder="Material title (defaults to file name)"
                value={form.materialTitle}
                onChange={(e) =>
                  setForm({ ...form, materialTitle: e.target.value })
                }
              />
              <div className="grid gap-2">
                <Label htmlFor="curriculum-file">Document, audio or video file</Label>
                <Input
                  id="curriculum-file"
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*,audio/*,video/mp4,video/webm,video/quicktime"
                  onChange={(event) => setMaterialFile(event.target.files?.[0] || null)}
                />
                {materialFile && <p className="text-xs text-muted-foreground">{materialFile.name} · {(materialFile.size / 1024 / 1024).toFixed(1)} MB</p>}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or use an external link<span className="h-px flex-1 bg-border" /></div>
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={form.materialKind}
                  onValueChange={(v) => setForm({ ...form, materialKind: v })}
                  disabled={!!materialFile}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  className="col-span-2"
                  disabled={!!materialFile}
                  placeholder="https://…"
                  value={form.materialUrl}
                  onChange={(e) =>
                    setForm({ ...form, materialUrl: e.target.value })
                  }
                />
              </div>
            </div>}
            <Button
              className="w-full"
              disabled={!form.churchIds.length || !form.title || form.churchIds.some(churchId => !form.personsInCharge[churchId]) || create.isPending || (form.type === "assessment" && Number(form.passScore) > Number(form.maxScore))}
              onClick={() => create.mutate()}
            >
              {create.isPending ? (materialFile ? "Uploading and saving…" : "Saving…") : `${editingTarget ? "Save" : "Create"} ${form.type === "course" ? "course" : "requirement"}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!viewingTarget} onOpenChange={open => !open && setViewingTarget(null)}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{viewingTarget?.item.title}</DialogTitle></DialogHeader>{viewingTarget && <div className="space-y-4"><div className="flex flex-wrap gap-2"><Badge>{viewingTarget.item.status}</Badge><Badge variant="secondary">{viewingTarget.kind === "course" ? "Course" : viewingTarget.item.type.replace("_", " ")}</Badge></div><p className="text-sm text-muted-foreground">{viewingTarget.item.description || "No description"}</p><div><p className="text-sm font-medium">Available churches</p><p className="text-sm text-muted-foreground">{(viewingTarget.item.churchIds || []).map(id => churches.find(church => church.id === id)?.name || id).join(", ")}</p></div>{viewingTarget.kind === "course" ? <><div><p className="text-sm font-medium">Curriculum</p><div className="mt-2 space-y-2">{viewingTarget.item.materials.map(material => <a key={material.id} href={material.url} target="_blank" rel="noreferrer" className="block rounded-md border px-3 py-2 text-sm hover:bg-muted">{material.title} · <span className="capitalize text-muted-foreground">{material.kind}</span></a>)}{viewingTarget.item.materials.length === 0 && <p className="text-sm text-muted-foreground">No curriculum materials</p>}</div></div><div><p className="text-sm font-medium">Scheduled classes</p><p className="text-sm text-muted-foreground">{viewingTarget.item.classes.length} class{viewingTarget.item.classes.length === 1 ? "" : "es"}</p></div></> : viewingTarget.item.type === "assessment" && <div><p className="text-sm font-medium">Assessment settings</p><p className="text-sm text-muted-foreground">Pass score {viewingTarget.item.passScore ?? 0} out of {viewingTarget.item.maxScore ?? 0} · {viewingTarget.item._count?.questions || 0} questions</p></div>}</div>}</DialogContent></Dialog>
      <AlertDialog open={!!deletingTarget} onOpenChange={open => !open && setDeletingTarget(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete catalogue item</AlertDialogTitle><AlertDialogDescription>Delete <strong>{deletingTarget?.item.title}</strong>? Items already used by workflows, journeys, enrolments, or assessment attempts will be archived instead of permanently removed.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteCatalogItem.isPending} onClick={() => deletingTarget && deleteCatalogItem.mutate(deletingTarget)}>{deleteCatalogItem.isPending ? "Removing…" : "Delete item"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={!!deletingClass} onOpenChange={open => !open && setDeletingClass(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete class</AlertDialogTitle><AlertDialogDescription>Delete <strong>{deletingClass?.title}</strong>? A class with enrolments or workflow links will be cancelled and retained for history. Active enrolments will be withdrawn.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteClass.isPending} onClick={() => deletingClass && deleteClass.mutate(deletingClass.id)}>{deleteClass.isPending ? "Removing…" : "Delete class"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <ScheduleClassDialog course={courses.find(course => course.id === classCourseId) || null} classItem={editingClass} churches={churches} onOpenChange={open => { if (!open) { setClassCourseId(null); setEditingClass(null); } }} onSaved={() => qc.invalidateQueries({ queryKey: ["discipleship-courses"] })} />
      <ClassRosterDialog classId={managedClassId} canManageAttendance={canManageAttendance} onOpenChange={open => !open && setManagedClassId(null)} />
      <AssessmentQuestionEditorDialog definition={questionDefinition} onOpenChange={open => !open && setQuestionDefinition(null)} />
    </div>
  );
}

function ProgramMetric({ icon: Icon, value, label, note }: { icon: LucideIcon; value: string | number; label: string; note: string }) {
  return <Card><CardContent className="flex items-start gap-3 p-5"><div className="rounded-md bg-primary/10 p-2.5"><Icon className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-semibold tabular-nums">{value}</p><p className="text-xs font-medium">{label}</p><p className="mt-1 text-[11px] text-muted-foreground">{note}</p></div></CardContent></Card>;
}
