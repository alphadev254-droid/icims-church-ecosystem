import { useState } from "react";
import { MoreHorizontal, PauseCircle, PlayCircle, UserRoundX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type StatusChange = "active" | "paused" | "withdrawn";

export function JourneyStatusActions({ status, isSaving, onConfirm }: { status: string; isSaving: boolean; onConfirm: (status: StatusChange, reason: string) => Promise<void> }) {
  const [change, setChange] = useState<StatusChange | null>(null);
  const [reason, setReason] = useState("");
  const close = () => { setChange(null); setReason(""); };
  const title = change === "paused" ? "Pause this journey?" : change === "withdrawn" ? "Withdraw this candidate?" : "Resume this journey?";
  const description = change === "withdrawn" ? "Withdrawal closes this journey and records the reason for dropout reporting. This action cannot be reversed from the interface." : change === "paused" ? "The candidate remains in the current stage, but progression stops until staff resume the journey." : "The candidate can continue from the same stage and completed requirements.";
  return <>
    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="Journey actions"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{status === "active" && <DropdownMenuItem onClick={() => setChange("paused")}><PauseCircle className="mr-2 h-4 w-4" />Pause journey</DropdownMenuItem>}{status === "paused" && <DropdownMenuItem onClick={() => setChange("active")}><PlayCircle className="mr-2 h-4 w-4" />Resume journey</DropdownMenuItem>}{["active", "paused"].includes(status) && <DropdownMenuItem className="text-destructive" onClick={() => setChange("withdrawn")}><UserRoundX className="mr-2 h-4 w-4" />Withdraw candidate</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu>
    <AlertDialog open={!!change} onOpenChange={open => !open && close()}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader><div className="grid gap-2"><Label htmlFor="journey-status-reason">Reason</Label><Textarea id="journey-status-reason" value={reason} onChange={event => setReason(event.target.value)} placeholder="Record why this status is changing" /></div><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={reason.trim().length < 3 || isSaving} onClick={async event => { event.preventDefault(); if (!change || reason.trim().length < 3) return; try { await onConfirm(change, reason.trim()); close(); } catch { /* The parent mutation displays the API error and the dialog remains open. */ } }}>{isSaving ? "Saving…" : "Confirm change"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>;
}
