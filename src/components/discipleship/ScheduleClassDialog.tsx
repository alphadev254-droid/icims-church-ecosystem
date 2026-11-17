import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { discipleshipService, type DiscipleshipClass, type DiscipleshipCourse } from "@/services/discipleship";
import { apiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SessionForm = { id?: string; title: string; startsAt: string; endsAt: string; location: string };
const emptySession = (): SessionForm => ({ title: "", startsAt: "", endsAt: "", location: "" });
const toLocalDateTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export function ScheduleClassDialog({ course, classItem = null, churches, onOpenChange, onSaved }: {
  course: DiscipleshipCourse | null;
  classItem?: DiscipleshipClass | null;
  churches: Array<{ id: string; name: string }>;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [churchId, setChurchId] = useState("");
  const [title, setTitle] = useState("");
  const [capacity, setCapacity] = useState("");
  const [sessions, setSessions] = useState<SessionForm[]>([emptySession()]);
  useEffect(() => {
    if (classItem) {
      setChurchId(classItem.churchId || "");
      setTitle(classItem.title);
      setCapacity(classItem.capacity ? String(classItem.capacity) : "");
      setSessions((classItem.sessions || []).map(session => ({ id: session.id, title: session.title, startsAt: toLocalDateTime(session.startsAt), endsAt: toLocalDateTime(session.endsAt), location: session.location || "" })));
      return;
    }
    if (!course) return;
    setChurchId(course.churchIds?.length === 1 ? course.churchIds[0] : "");
    setTitle(`${course.title} class`);
    setCapacity("");
    setSessions([emptySession()]);
  }, [course, classItem]);

  const save = useMutation({
    mutationFn: () => {
      const starts = sessions.map(session => new Date(session.startsAt));
      const ends = sessions.map(session => new Date(session.endsAt || session.startsAt));
      const payload = {
        churchId,
        title,
        startsAt: new Date(Math.min(...starts.map(date => date.getTime()))).toISOString(),
        endsAt: new Date(Math.max(...ends.map(date => date.getTime()))).toISOString(),
        capacity: capacity ? Number(capacity) : undefined,
        reminderMinutes: 1440,
        sessions: sessions.map((session, index) => ({
          id: session.id,
          title: session.title || `Session ${index + 1}`,
          startsAt: new Date(session.startsAt).toISOString(),
          endsAt: session.endsAt ? new Date(session.endsAt).toISOString() : undefined,
          location: session.location || undefined,
        })),
      };
      return classItem ? discipleshipService.updateClass(classItem.id, payload) : discipleshipService.createClass(course!.id, payload);
    },
    onSuccess: () => { toast.success(classItem ? "Class updated" : "Class scheduled"); onSaved(); onOpenChange(false); },
    onError: (error: unknown) => toast.error(apiErrorMessage(error, classItem ? "Could not update class" : "Could not schedule class")),
  });
  const updateSession = (index: number, patch: Partial<SessionForm>) => setSessions(current => current.map((session, itemIndex) => itemIndex === index ? { ...session, ...patch } : session));
  const valid = !!(course || classItem) && !!churchId && !!title.trim() && sessions.length > 0 && sessions.every(session => session.startsAt && (!session.endsAt || new Date(session.endsAt) > new Date(session.startsAt)));

  const activeCourse = course || (classItem?.course ? { ...classItem.course, churchIds: classItem.churchId ? [classItem.churchId] : [] } as DiscipleshipCourse : null);
  return <Dialog open={!!course || !!classItem} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{classItem ? "Edit class" : "Schedule class"}</DialogTitle></DialogHeader><div className="space-y-4">
    <div className="rounded-md border bg-muted/40 p-3 text-sm"><p className="font-medium">{activeCourse?.title}</p><p className="text-muted-foreground">{classItem ? "Update the cohort and its teaching sessions." : "Create the cohort and all of its teaching sessions."}</p></div>
    <div className="grid gap-2"><Label>Church hosting this class</Label><Select value={churchId} onValueChange={setChurchId} disabled={!!classItem}><SelectTrigger><SelectValue placeholder="Select church" /></SelectTrigger><SelectContent>{churches.filter(church => activeCourse?.churchIds?.includes(church.id)).map(church => <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>)}</SelectContent></Select></div>
    <div className="grid gap-3 sm:grid-cols-[1fr_140px]"><div className="grid gap-2"><Label>Class or cohort name</Label><Input value={title} onChange={event => setTitle(event.target.value)} /></div><div className="grid gap-2"><Label>Capacity</Label><Input type="number" min="1" value={capacity} onChange={event => setCapacity(event.target.value)} placeholder="Unlimited" /></div></div>
    <div className="space-y-3"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Session schedule</p><p className="text-xs text-muted-foreground">Add every class meeting candidates must attend.</p></div><Button size="sm" variant="outline" onClick={() => setSessions(current => [...current, emptySession()])}><Plus className="mr-1 h-4 w-4" />Session</Button></div>{sessions.map((session, index) => <div key={index} className="space-y-3 rounded-md border p-3"><div className="flex items-center justify-between"><p className="text-sm font-medium">Session {index + 1}</p>{sessions.length > 1 && <Button size="icon" variant="ghost" onClick={() => setSessions(current => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button>}</div><Input value={session.title} onChange={event => updateSession(index, { title: event.target.value })} placeholder={`Session ${index + 1} title`} /><div className="grid gap-3 sm:grid-cols-2"><div className="grid gap-1.5"><Label>Starts</Label><Input type="datetime-local" value={session.startsAt} onChange={event => updateSession(index, { startsAt: event.target.value })} /></div><div className="grid gap-1.5"><Label>Ends</Label><Input type="datetime-local" value={session.endsAt} onChange={event => updateSession(index, { endsAt: event.target.value })} /></div></div><div className="grid gap-1.5"><Label>Location</Label><Input value={session.location} onChange={event => updateSession(index, { location: event.target.value })} placeholder="Room, hall or online link" /></div></div>)}</div>
    <p className="text-xs text-muted-foreground">Each session receives a unique check-in code. Candidates complete the course after all sessions are attended or excused.</p>
    <Button className="w-full" disabled={!valid || save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : classItem ? "Save class changes" : "Schedule class"}</Button>
  </div></DialogContent></Dialog>;
}
