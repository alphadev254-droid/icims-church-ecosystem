import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, QrCode, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ScannerStatus = "idle" | "starting" | "scanning" | "unsupported" | "error";
type DetectedCode = { rawValue?: string };
type BarcodeDetectorInstance = { detect(source: HTMLVideoElement): Promise<DetectedCode[]> };
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorInstance;

export function QrScannerDialog({ open, onOpenChange, onDetected }: { open: boolean; onOpenChange: (open: boolean) => void; onDetected: (value: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const scanningRef = useRef(false);
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [error, setError] = useState("");

  const stop = () => {
    scanningRef.current = false;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
  };

  useEffect(() => () => stop(), []);
  useEffect(() => { if (!open) stop(); }, [open]);

  const start = async () => {
    const Detector = (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
    if (!Detector) { setStatus("unsupported"); return; }
    setStatus("starting"); setError("");
    try {
      const detector = new Detector({ formats: ["qr_code"] });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      scanningRef.current = true; setStatus("scanning");
      const scanFrame = async () => {
        if (!scanningRef.current || !videoRef.current) return;
        try {
          if (videoRef.current.readyState >= 2) {
            const value = (await detector.detect(videoRef.current))[0]?.rawValue?.trim();
            if (value) { stop(); onOpenChange(false); onDetected(value); return; }
          }
        } catch { /* Individual camera frames may fail while focus adjusts. */ }
        frameRef.current = requestAnimationFrame(scanFrame);
      };
      frameRef.current = requestAnimationFrame(scanFrame);
    } catch (caught) {
      stop(); setStatus("error");
      setError(caught instanceof Error ? caught.message : "Camera access could not be started");
    }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Scan class QR code</DialogTitle></DialogHeader><div className="space-y-4">
    <div className="relative aspect-square overflow-hidden rounded-lg border bg-black"><video ref={videoRef} muted playsInline className="h-full w-full object-cover" />{status !== "scanning" && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted p-6 text-center"><QrCode className="h-12 w-12 text-primary" /><p className="text-sm text-muted-foreground">Point your camera at the QR code displayed by the class facilitator.</p></div>}</div>
    {status === "unsupported" && <div className="flex gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm"><ShieldAlert className="h-5 w-5 shrink-0" /><span>This browser does not support camera QR scanning. Enter the session code manually, or use a current Chrome or Edge browser.</span></div>}
    {status === "error" && <p className="text-sm text-destructive">{error || "Camera access failed. Check the browser permission and try again."}</p>}
    {status !== "scanning" && status !== "unsupported" && <Button className="w-full" onClick={start} disabled={status === "starting"}>{status === "starting" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Starting camera…</> : <><Camera className="mr-2 h-4 w-4" />Start camera</>}</Button>}
    {status === "scanning" && <Button className="w-full" variant="outline" onClick={stop}>Stop camera</Button>}
  </div></DialogContent></Dialog>;
}
