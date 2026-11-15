import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { BookOpen, UserRound, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { discipleshipService, type DiscipleshipMentorAssignment, type DiscipleshipPlacement, type DiscipleshipRequirement, type JourneyOperationsOptions } from "@/services/discipleship";
import { apiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function MentorSupportCard({ journeyId, assignment, options, onSaved }: {
  journeyId: string;
  assignment?: DiscipleshipMentorAssignment | null;
  options?: JourneyOperationsOptions;
  onSaved: () => void;
}) {
  const [mentorId, setMentorId] = useState("");
  const [firstFollowUp, setFirstFollowUp] = useState("");
  const [notes, setNotes] = useState("");
  const [concern, setConcern] = useState(false);
  const [nextFollowUp, setNextFollowUp] = useState("");
  const assignedMentor = options?.mentors.find(item => item.id === assignment?.mentorUserId);
  const assign = useMutation({
    mutationFn: () => discipleshipService.assignMentor(journeyId, { mentorUserId: mentorId, nextFollowUpAt: firstFollowUp ? new Date(firstFollowUp).toISOString() : undefined }),
    onSuccess: () => { toast.success("Mentor assigned"); setMentorId(""); setFirstFollowUp(""); onSaved(); },
    onError: (error: unknown) => toast.error(apiErrorMessage(error, "Could not assign mentor")),
  });
  const followUp = useMutation({
    mutationFn: () => discipleshipService.addMentorFollowUp(journeyId, { notes, concernFlag: concern, nextFollowUpAt: nextFollowUp ? new Date(nextFollowUp).toISOString() : undefined }),
    onSuccess: () => { toast.success("Follow-up recorded"); setNotes(""); setConcern(false); setNextFollowUp(""); onSaved(); },
    onError: (error: unknown) => toast.error(apiErrorMessage(error, "Could not record follow-up")),
  });

  return <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserRound className="h-4 w-4" />Mentor support</CardTitle></CardHeader><CardContent className="space-y-3">
    {assignment ? <div className="rounded-md border bg-muted/40 p-3 text-sm"><p className="font-medium">{assignedMentor ? `${assignedMentor.firstName} ${assignedMentor.lastName}` : "Assigned mentor"}</p><p className="text-xs text-muted-foreground">Next follow-up: {assignment.nextFollowUpAt ? new Date(assignment.nextFollowUpAt).toLocaleString() : "Not scheduled"}</p></div> : <p className="text-sm text-muted-foreground">No mentor assigned yet.</p>}
    <Select value={mentorId} onValueChange={setMentorId}><SelectTrigger><SelectValue placeholder={assignment ? "Reassign mentor" : "Select mentor"} /></SelectTrigger><SelectContent>{options?.mentors.map(mentor => <SelectItem key={mentor.id} value={mentor.id}>{mentor.firstName} {mentor.lastName} · {mentor.role?.displayName || mentor.role?.name?.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select>
    <div className="grid gap-1.5"><Label>First follow-up</Label><Input type="datetime-local" value={firstFollowUp} onChange={event => setFirstFollowUp(event.target.value)} /></div>
    <Button className="w-full" variant="outline" disabled={!mentorId || assign.isPending} onClick={() => assign.mutate()}>{assign.isPending ? "Assigning…" : assignment ? "Reassign mentor" : "Assign mentor"}</Button>
    {assignment && <div className="space-y-3 border-t pt-3"><div className="grid gap-1.5"><Label>Follow-up notes</Label><Textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="Record the conversation and agreed next step" /></div><label className="flex items-center gap-2 text-sm"><Checkbox checked={concern} onCheckedChange={value => setConcern(value === true)} />Flag for pastoral attention</label><div className="grid gap-1.5"><Label>Next follow-up</Label><Input type="datetime-local" value={nextFollowUp} onChange={event => setNextFollowUp(event.target.value)} /></div><Button className="w-full" disabled={!notes.trim() || followUp.isPending} onClick={() => followUp.mutate()}>{followUp.isPending ? "Saving…" : "Record follow-up"}</Button></div>}
  </CardContent></Card>;
}

export function IntegrationPlacementCard({ journeyId, placement, options, onSaved }: { journeyId: string; placement?: DiscipleshipPlacement | null; options?: JourneyOperationsOptions; onSaved: () => void }) {
  const [teamId, setTeamId] = useState(placement?.teamId || "");
  const [cellId, setCellId] = useState(placement?.cellId || "");
  const save = useMutation({
    mutationFn: () => discipleshipService.savePlacement(journeyId, { teamId: teamId || undefined, cellId: cellId || undefined }),
    onSuccess: () => { toast.success("Integration placement saved"); onSaved(); },
    onError: (error: unknown) => toast.error(apiErrorMessage(error, "Could not save placement")),
  });
  return <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><UsersRound className="h-4 w-4" />Integration placement</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-xs text-muted-foreground">Plan the team or cell placement applied when this journey is completed.</p><Select value={teamId || "none"} onValueChange={value => setTeamId(value === "none" ? "" : value)}><SelectTrigger><SelectValue placeholder="Select ministry team" /></SelectTrigger><SelectContent><SelectItem value="none">No team selected</SelectItem>{options?.teams.map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}</SelectContent></Select><Select value={cellId || "none"} onValueChange={value => setCellId(value === "none" ? "" : value)}><SelectTrigger><SelectValue placeholder="Select cell or small group" /></SelectTrigger><SelectContent><SelectItem value="none">No cell selected</SelectItem>{options?.cells.map(cell => <SelectItem key={cell.id} value={cell.id}>{cell.name}</SelectItem>)}</SelectContent></Select><Button className="w-full" variant="outline" disabled={!(teamId || cellId) || save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : "Save placement plan"}</Button></CardContent></Card>;
}

export function CourseEnrollmentDialog({ journeyId, candidateName, requirement, options, onOpenChange, onSaved }: {
  journeyId: string;
  candidateName: string;
  requirement: DiscipleshipRequirement | null;
  options?: JourneyOperationsOptions;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [classId, setClassId] = useState("");
  const eligibleClasses = options?.classes.filter(item => item.courseId === requirement?.courseId) || [];
  const enroll = useMutation({
    mutationFn: () => discipleshipService.enrollCandidate(classId, { journeyId, requirementId: requirement?.id }),
    onSuccess: () => { toast.success("Candidate enrolled in class"); setClassId(""); onOpenChange(false); onSaved(); },
    onError: (error: unknown) => toast.error(apiErrorMessage(error, "Could not enroll candidate")),
  });
  return <Dialog open={!!requirement} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Enroll candidate in class</DialogTitle></DialogHeader><div className="space-y-4"><div><p className="font-medium">{requirement?.name}</p><p className="text-sm text-muted-foreground">Select a current class for {candidateName}. The course requirement completes automatically after all class sessions are attended or excused.</p></div><Select value={classId} onValueChange={setClassId}><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{eligibleClasses.map(item => <SelectItem key={item.id} value={item.id}>{item.title} · {new Date(item.startsAt).toLocaleDateString()} · {item._count.enrollments}{item.capacity ? `/${item.capacity}` : ""} enrolled</SelectItem>)}</SelectContent></Select>{eligibleClasses.length === 0 && <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">No scheduled class is available for this course. Create one under Learning & requirements.</p>}<Button className="w-full" disabled={!classId || enroll.isPending} onClick={() => enroll.mutate()}><BookOpen className="mr-2 h-4 w-4" />{enroll.isPending ? "Enrolling…" : "Enroll candidate"}</Button></div></DialogContent></Dialog>;
}
