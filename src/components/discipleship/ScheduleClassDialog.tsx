import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { discipleshipService, type DiscipleshipCourse } from "@/services/discipleship";
import { apiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SessionForm = { title: string; startsAt: string; endsAt: string; location: string };
const emptySession = (): SessionForm => ({ title: "", startsAt: "", endsAt: "", location: "" });

export function ScheduleClassDialog({ course, churches, onOpenChange, onSaved }: {
  course: DiscipleshipCourse | null;
  churches: Array<{ id: string; name: string }>;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [churchId, setChurchId] = useState("");
  const [title, setTitle] = useState("");
  const [capacity, setCapacity] = useState("");
  const [sessions, setSessions] = useState<SessionForm[]>([emptySession()]);
  useEffect(() => {
    if (!course) return;
    setChurchId(course.churchIds?.length === 1 ? course.churchIds[0] : "");
    setTitle(`${course.title} class`);
    setCapacity("");
    setSessions([emptySession()]);
  }, [course]);

  const create = useMutation({
    mutationFn: () => {
      const starts = sessions.map(session => new Date(session.startsAt));
      const ends = sessions.map(session => new Date(session.endsAt || session.startsAt));
      return discipleshipService.createClass(course!.id, {
        churchId,
        title,
        startsAt: new Date(Math.min(...starts.map(date => date.getTime()))).toISOString(),
        endsAt: new Date(Math.max(...ends.map(date => date.getTime()))).toISOString(),
        capacity: capacity ? Number(capacity) : undefined,
        reminderMinutes: 1440,
        sessions: sessions.map((session, index) => ({
          title: session.title || `Session ${index + 1}`,
          startsAt: new Date(session.startsAt).toISOString(),
          endsAt: session.endsAt ? new Date(session.endsAt).toISOString() : undefined,
          location: session.location || undefined,
        })),
      });
    },
    onSuccess: () => { toast.success("Class scheduled"); onSaved(); onOpenChange(false); },
    onError: (error: unknown) => toast.error(apiErrorMessage(error, "Could not schedule class")),
  });
  const updateSession = (index: number, patch: Partial<SessionForm>) => setSessions(current => current.map((session, itemIndex) => itemIndex === index ? { ...session, ...patch } : session));
  const valid = !!course && !!churchId && !!title.trim() && sessions.length > 0 && sessions.every(session => session.startsAt && (!session.endsAt || new Date(session.endsAt) > new Date(session.startsAt)));

  return <Dialog open={!!course} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Schedule class</DialogTitle></DialogHeader><div className="space-y-4">
    <div className="rounded-md border bg-muted/40 p-3 text-sm"><p className="font-medium">{course?.title}</p><p className="text-muted-foreground">Create the cohort and all of its teaching sessions.</p></div>
    <div className="grid gap-2"><Label>Church hosting this class</Label><Select value={churchId} onValueChange={setChurchId}><SelectTrigger><SelectValue placeholder="Select church" /></SelectTrigger><SelectContent>{churches.filter(church => course?.churchIds?.includes(church.id)).map(church => <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>)}</SelectContent></Select></div>
    <div className="grid gap-3 sm:grid-cols-[1fr_140px]"><div className="grid gap-2"><Label>Class or cohort name</Label><Input value={title} onChange={event => setTitle(event.target.value)} /></div><div className="grid gap-2"><Label>Capacity</Label><Input type="number" min="1" value={capacity} onChange={event => setCapacity(event.target.value)} placeholder="Unlimited" /></div></div>
    <div className="space-y-3"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Session schedule</p><p className="text-xs text-muted-foreground">Add every class meeting candidates must attend.</p></div><Button size="sm" variant="outline" onClick={() => setSessions(current => [...current, emptySession()])}><Plus className="mr-1 h-4 w-4" />Session</Button></div>{sessions.map((session, index) => <div key={index} className="space-y-3 rounded-md border p-3"><div className="flex items-center justify-between"><p className="text-sm font-medium">Session {index + 1}</p>{sessions.length > 1 && <Button size="icon" variant="ghost" onClick={() => setSessions(current => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button>}</div><Input value={session.title} onChange={event => updateSession(index, { title: event.target.value })} placeholder={`Session ${index + 1} title`} /><div className="grid gap-3 sm:grid-cols-2"><div className="grid gap-1.5"><Label>Starts</Label><Input type="datetime-local" value={session.startsAt} onChange={event => updateSession(index, { startsAt: event.target.value })} /></div><div className="grid gap-1.5"><Label>Ends</Label><Input type="datetime-local" value={session.endsAt} onChange={event => updateSession(index, { endsAt: event.target.value })} /></div></div><div className="grid gap-1.5"><Label>Location</Label><Input value={session.location} onChange={event => updateSession(index, { location: event.target.value })} placeholder="Room, hall or online link" /></div></div>)}</div>
    <p className="text-xs text-muted-foreground">Each session receives a unique check-in code. Candidates complete the course after all sessions are attended or excused.</p>
    <Button className="w-full" disabled={!valid || create.isPending} onClick={() => create.mutate()}>{create.isPending ? "Scheduling…" : "Schedule class"}</Button>
  </div></DialogContent></Dialog>;
}
