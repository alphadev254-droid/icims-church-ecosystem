import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CalendarDays,
  Clock3,
  FileAudio,
  FileVideo,
  Link2,
  LibraryBig,
  Plus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { discipleshipService } from "@/services/discipleship";
import { uploadService } from "@/services/upload";
import { churchesService } from "@/services/churches";
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

export default function ProgramsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [classCourseId, setClassCourseId] = useState<string | null>(null);
  const [classForm, setClassForm] = useState({
    title: "",
    location: "",
    startsAt: "",
    endsAt: "",
  });
  const [form, setForm] = useState({
    churchId: "",
    title: "",
    description: "",
    status: "published",
    materialTitle: "",
    materialKind: "video",
    materialUrl: "",
  });
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["discipleship-courses"],
    queryFn: () => discipleshipService.listCourses(true),
  });
  const { data: churches = [] } = useQuery({
    queryKey: ["churches-select"],
    queryFn: churchesService.getSelectable,
  });
  const create = useMutation({
    mutationFn: async () => {
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
        return await discipleshipService.createCourse({
        churchId: form.churchId,
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
        });
      } catch (error) {
        if (uploadedUrl) await uploadService.deleteFile(uploadedUrl).catch(() => undefined);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Course created");
      setOpen(false);
      setMaterialFile(null);
      qc.invalidateQueries({ queryKey: ["discipleship-courses"] });
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.message || "Could not create course"),
  });
  const createClass = useMutation({
    mutationFn: () =>
      discipleshipService.createClass(classCourseId!, {
        title: classForm.title,
        location: classForm.location || undefined,
        startsAt: new Date(classForm.startsAt).toISOString(),
        endsAt: classForm.endsAt
          ? new Date(classForm.endsAt).toISOString()
          : undefined,
        reminderMinutes: 1440,
        sessions: [
          {
            title: classForm.title,
            startsAt: new Date(classForm.startsAt).toISOString(),
            endsAt: classForm.endsAt
              ? new Date(classForm.endsAt).toISOString()
              : undefined,
            location: classForm.location || undefined,
          },
        ],
      }),
    onSuccess: () => {
      toast.success("Class scheduled");
      setClassCourseId(null);
      setClassForm({ title: "", location: "", startsAt: "", endsAt: "" });
      qc.invalidateQueries({ queryKey: ["discipleship-courses"] });
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.message || "Could not schedule class"),
  });
  const now = Date.now(); const sevenDays = now + 7 * 86400000;
  const allClasses = courses.flatMap((course) => course.classes);
  const upcomingClasses = allClasses.filter((item: any) => new Date(item.startsAt).getTime() >= now && ['scheduled', 'active'].includes(item.status));
  const sessionsThisWeek = allClasses.flatMap((item: any) => item.sessions).filter((item: any) => { const time = new Date(item.startsAt).getTime(); return time >= now && time <= sevenDays; }).length;
  const enrollmentCount = allClasses.reduce((sum: number, item: any) => sum + (item._count?.enrollments || 0), 0);
  const materialCount = courses.reduce((sum, course) => sum + course.materials.length, 0);
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Discipleship</p>
          <h1 className="font-heading text-2xl font-bold">Courses & classes</h1>
          <p className="text-sm text-muted-foreground">
            Publish curriculum, schedule cohorts and manage session attendance.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New course
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <ProgramMetric icon={BookOpen} value={courses.filter(course => course.status === 'published').length} label="Published courses" note={`${courses.filter(course => course.status === 'draft').length} drafts`} />
        <ProgramMetric icon={CalendarDays} value={upcomingClasses.length} label="Upcoming classes" note={`${allClasses.length} classes in total`} />
        <ProgramMetric icon={Clock3} value={sessionsThisWeek} label="Sessions this week" note="Scheduled in the next 7 days" />
        <ProgramMetric icon={Users} value={enrollmentCount} label="Enrollments" note="Across all current classes" />
        <ProgramMetric icon={LibraryBig} value={materialCount} label="Learning materials" note="Documents, audio and video" />
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading courses…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{course.title}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {course.description || "No description"}
                    </p>
                  </div>
                  <Badge>{course.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setClassCourseId(course.id)}
                    >
                      <CalendarDays className="mr-1 h-3.5 w-3.5" />
                      Schedule
                    </Button>
                  </div>
                  {course.classes.length ? (
                    course.classes.map((k: any) => (
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Church</Label>
              <Select
                value={form.churchId}
                onValueChange={(v) => setForm({ ...form, churchId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select church" />
                </SelectTrigger>
                <SelectContent>
                  {churches.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Course title</Label>
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
            <div className="rounded-md border p-3 space-y-3">
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
            </div>
            <Button
              className="w-full"
              disabled={!form.churchId || !form.title || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending ? (materialFile ? "Uploading and creating…" : "Creating…") : "Create course"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!classCourseId}
        onOpenChange={(v) => !v && setClassCourseId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Class / cohort name</Label>
              <Input
                value={classForm.title}
                onChange={(e) =>
                  setClassForm({ ...classForm, title: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Location</Label>
              <Input
                value={classForm.location}
                onChange={(e) =>
                  setClassForm({ ...classForm, location: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-2 text-sm">
                Starts
                <Input
                  type="datetime-local"
                  value={classForm.startsAt}
                  onChange={(e) =>
                    setClassForm({ ...classForm, startsAt: e.target.value })
                  }
                />
              </label>
              <label className="grid gap-2 text-sm">
                Ends
                <Input
                  type="datetime-local"
                  value={classForm.endsAt}
                  onChange={(e) =>
                    setClassForm({ ...classForm, endsAt: e.target.value })
                  }
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              A check-in code is generated automatically. The default reminder
              is sent 24 hours before class.
            </p>
            <Button
              className="w-full"
              disabled={
                !classForm.title || !classForm.startsAt || createClass.isPending
              }
              onClick={() => createClass.mutate()}
            >
              {createClass.isPending ? "Scheduling…" : "Schedule class"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProgramMetric({ icon: Icon, value, label, note }: any) {
  return <Card><CardContent className="flex items-start gap-3 p-5"><div className="rounded-md bg-primary/10 p-2.5"><Icon className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-semibold tabular-nums">{value}</p><p className="text-xs font-medium">{label}</p><p className="mt-1 text-[11px] text-muted-foreground">{note}</p></div></CardContent></Card>;
}
