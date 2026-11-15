import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, QrCode } from "lucide-react";
import { toast } from "sonner";
import { discipleshipService } from "@/services/discipleship";
import { apiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrScannerDialog } from "@/components/discipleship/QrScannerDialog";

export function CandidateClassCheckIn({ journeyId, onCheckedIn }: { journeyId: string; onCheckedIn: () => void }) {
  const [code, setCode] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const checkIn = useMutation({
    mutationFn: (value: string) => discipleshipService.checkInByCode(journeyId, value.trim()),
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
      <Button className="w-full" onClick={() => setScannerOpen(true)} disabled={checkIn.isPending}><QrCode className="mr-2 h-4 w-4" />Scan QR code</Button>
      <div className="relative flex items-center"><span className="h-px flex-1 bg-border" /><span className="px-2 text-[11px] uppercase text-muted-foreground">or enter code</span><span className="h-px flex-1 bg-border" /></div>
      <div className="space-y-1.5"><Label htmlFor="discipleship-check-in-code">Session code</Label><Input id="discipleship-check-in-code" value={code} onChange={event => setCode(event.target.value.toUpperCase())} onKeyDown={event => { if (event.key === "Enter" && code.trim().length >= 4) checkIn.mutate(code); }} className="font-mono uppercase tracking-widest" placeholder="Enter code" maxLength={40} /></div>
      <p className="text-xs text-muted-foreground">Check-in works only while the facilitator has opened this class session.</p>
      <Button className="w-full" variant="outline" disabled={code.trim().length < 4 || checkIn.isPending} onClick={() => checkIn.mutate(code)}>{checkIn.isPending ? "Checking in…" : "Check in with code"}</Button>
    </CardContent>
    <QrScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onDetected={value => checkIn.mutate(value)} />
  </Card>;
}
