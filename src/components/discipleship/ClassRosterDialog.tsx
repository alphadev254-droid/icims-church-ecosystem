import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { discipleshipService } from "@/services/discipleship";
import { apiErrorMessage } from "@/lib/api-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AttendanceStatus = "present" | "late" | "absent" | "excused";

export function ClassRosterDialog({ classId, canManageAttendance, onOpenChange }: {
  classId: string | null;
  canManageAttendance: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const { data: roster, isLoading } = useQuery({
    queryKey: ["discipleship-class-roster", classId],
    queryFn: () => discipleshipService.getClassRoster(classId!),
    enabled: !!classId,
  });

  useEffect(() => {
    if (roster?.sessions.length && !roster.sessions.some(session => session.id === sessionId)) setSessionId(roster.sessions[0].id);
  }, [roster, sessionId]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["discipleship-class-roster", classId] });
    queryClient.invalidateQueries({ queryKey: ["discipleship-courses"] });
  };
  const recordAttendance = useMutation({
    mutationFn: ({ enrollmentId, status }: { enrollmentId: string; status: AttendanceStatus }) => discipleshipService.recordSessionAttendance(sessionId, { enrollmentId, status, method: "manual" }),
    onSuccess: result => { refresh(); toast.success(result.courseCompleted ? "Attendance saved and course completed" : "Attendance saved"); },
    onError: (error: unknown) => toast.error(apiErrorMessage(error, "Could not save attendance")),
  });
  const updateSession = useMutation({
    mutationFn: (status: "open" | "completed") => discipleshipService.updateClassSessionStatus(sessionId, status),
    onSuccess: () => { refresh(); toast.success("Session status updated"); },
    onError: (error: unknown) => toast.error(apiErrorMessage(error, "Could not update session")),
  });
  const selectedSession = roster?.sessions.find(session => session.id === sessionId);

  return <><Dialog open={!!classId} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader><DialogTitle>Class roster and attendance</DialogTitle></DialogHeader>
      {isLoading || !roster ? <p className="py-10 text-center text-muted-foreground">Loading class…</p> : <div className="space-y-4">
        <div className="rounded-md border bg-muted/40 p-3"><p className="font-medium">{roster.title}</p><p className="text-sm text-muted-foreground">{roster.course.title} · {new Date(roster.startsAt).toLocaleString()} · {roster.enrollments.length} enrolled</p></div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]"><div className="grid gap-1.5"><Label>Session</Label><Select value={sessionId} onValueChange={setSessionId}><SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger><SelectContent>{roster.sessions.map(session => <SelectItem key={session.id} value={session.id}>{session.title} · {new Date(session.startsAt).toLocaleString()}</SelectItem>)}</SelectContent></Select></div>{canManageAttendance && sessionId && <div className="flex items-end gap-2"><Button variant="outline" onClick={() => updateSession.mutate("open")}>Open check-in</Button><Button variant="outline" onClick={() => updateSession.mutate("completed")}>Close session</Button></div>}</div>
        {selectedSession && <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"><div><span>Status: <strong className="capitalize">{selectedSession.status}</strong></span><span className="ml-4">Check-in code: <strong className="font-mono tracking-wider">{selectedSession.checkInCode}</strong></span></div><Button size="sm" variant="outline" onClick={() => setQrOpen(true)}><QrCode className="mr-2 h-4 w-4" />Display QR</Button></div>}
        <div className="overflow-x-auto rounded-md border"><table className="w-full text-sm"><thead className="bg-muted/60"><tr><th className="px-4 py-3 text-left font-medium">Candidate</th><th className="px-4 py-3 text-left font-medium">Journey</th><th className="px-4 py-3 text-left font-medium">Attendance</th></tr></thead><tbody>{roster.enrollments.map(enrollment => { const record = enrollment.attendance.find(item => item.sessionId === sessionId); return <tr key={enrollment.id} className="border-t"><td className="px-4 py-3"><p className="font-medium">{enrollment.journey?.candidateUser.firstName} {enrollment.journey?.candidateUser.lastName}</p><p className="text-xs text-muted-foreground">{enrollment.journey?.candidateUser.email}</p></td><td className="px-4 py-3 font-mono text-xs">{enrollment.journey?.journeyCode}</td><td className="px-4 py-3">{canManageAttendance ? <Select value={record?.status || "unmarked"} disabled={!sessionId || recordAttendance.isPending} onValueChange={value => value !== "unmarked" && recordAttendance.mutate({ enrollmentId: enrollment.id, status: value as AttendanceStatus })}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unmarked">Not marked</SelectItem><SelectItem value="present">Present</SelectItem><SelectItem value="late">Late</SelectItem><SelectItem value="absent">Absent</SelectItem><SelectItem value="excused">Excused</SelectItem></SelectContent></Select> : <Badge variant="outline">{record?.status || "Not marked"}</Badge>}</td></tr>; })}{roster.enrollments.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No candidates are enrolled in this class yet.</td></tr>}</tbody></table></div>
      </div>}
    </DialogContent>
  </Dialog><Dialog open={qrOpen} onOpenChange={setQrOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Class check-in QR</DialogTitle></DialogHeader>{selectedSession && <div className="space-y-4 text-center"><div className="mx-auto w-fit rounded-xl border bg-white p-4"><QRCodeSVG value={`ICIMS-DISCIPLESHIP:${selectedSession.checkInCode}`} size={280} level="M" includeMargin /></div><div><p className="font-medium">{selectedSession.title}</p><p className="text-sm text-muted-foreground">Candidates scan this from their journey page while the session status is Open.</p><p className="mt-2 font-mono text-lg tracking-widest">{selectedSession.checkInCode}</p></div></div>}</DialogContent></Dialog></>;
}
