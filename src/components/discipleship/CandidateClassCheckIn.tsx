import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { discipleshipService } from "@/services/discipleship";
import { apiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CandidateClassCheckIn({ journeyId, onCheckedIn }: { journeyId: string; onCheckedIn: () => void }) {
  const [code, setCode] = useState("");
  const checkIn = useMutation({
    mutationFn: () => discipleshipService.checkInByCode(journeyId, code.trim()),
    onSuccess: result => {
      toast.success(result.courseCompleted ? "Checked in and course completed" : "Class check-in recorded");
      setCode("");
      onCheckedIn();
    },
    onError: (error: unknown) => toast.error(apiErrorMessage(error, "The check-in code is invalid or the session is not open")),
  });

  return <Card>
    <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><KeyRound className="h-4 w-4 text-primary" />Class check-in</CardTitle></CardHeader>
    <CardContent className="space-y-3">
      <div className="space-y-1.5"><Label htmlFor="discipleship-check-in-code">Session code</Label><Input id="discipleship-check-in-code" value={code} onChange={event => setCode(event.target.value.toUpperCase())} onKeyDown={event => { if (event.key === "Enter" && code.trim().length >= 4) checkIn.mutate(); }} className="font-mono uppercase tracking-widest" placeholder="Enter code" maxLength={24} /></div>
      <p className="text-xs text-muted-foreground">Enter the code displayed by the class facilitator while check-in is open.</p>
      <Button className="w-full" variant="outline" disabled={code.trim().length < 4 || checkIn.isPending} onClick={() => checkIn.mutate()}>{checkIn.isPending ? "Checking in…" : "Check in"}</Button>
    </CardContent>
  </Card>;
}
