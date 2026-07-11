import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { sharedAccessService } from '@/services/sharedAccess';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CheckCircle2, Church, Loader2, Lock, QrCode, Search, ShieldAlert, XCircle } from 'lucide-react';
import { toast } from 'sonner';

type ScannerStatus = 'idle' | 'starting' | 'scanning' | 'unsupported' | 'error';

export default function PublicAttendanceScanner() {
  const { token = '' } = useParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const scanningRef = useRef(false);
  const scanBusyRef = useRef(false);
  const lastScanRef = useRef<{ value: string; at: number } | null>(null);
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [accessCode, setAccessCode] = useState(() => sessionStorage.getItem(`scanner_code_${token}`) || '');
  const [codeVerified, setCodeVerified] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [recent, setRecent] = useState<any | null>(null);
  const [cameraError, setCameraError] = useState('');

  const validation = useQuery({
    queryKey: ['scanner-link-validation', token],
    queryFn: () => sharedAccessService.validateLink(token),
    enabled: !!token,
  });

  const attendanceQuery = useQuery({
    queryKey: ['scanner-attendance', token],
    queryFn: () => sharedAccessService.getScannerAttendance(token),
    enabled: !!token && validation.data?.valid === true && (!validation.data?.hasAccessCode || codeVerified),
  });

  useEffect(() => {
    if (validation.data?.valid && !validation.data.hasAccessCode) setCodeVerified(true);
  }, [validation.data]);

  const verifyCode = useMutation({
    mutationFn: () => sharedAccessService.verifyCode(token, accessCode),
    onSuccess: (result) => {
      if (result.valid) {
        setCodeVerified(true);
        sessionStorage.setItem(`scanner_code_${token}`, accessCode);
        setCodeError('');
      } else {
        setCodeError(result.message || 'Invalid access code');
      }
    },
    onError: (err: any) => setCodeError(err.response?.data?.message || 'Failed to verify code'),
  });

  const stopCamera = () => {
    scanningRef.current = false;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus('idle');
  };

  const scanMemberQr = useMutation({
    mutationFn: (value: string) => sharedAccessService.scanMemberByScannerLink(token, value, accessCode || undefined),
    onMutate: () => { scanBusyRef.current = true; },
    onSuccess: (participant: any) => {
      setRecent(participant);
      const user = participant.user;
      toast.success(user ? `${user.firstName} ${user.lastName} checked in` : 'Member checked in');
      attendanceQuery.refetch();
      window.setTimeout(() => setRecent(null), 2000);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to check in member'),
    onSettled: () => { scanBusyRef.current = false; },
  });

  const handleDetected = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || scanBusyRef.current) return;
    const now = Date.now();
    if (lastScanRef.current?.value === trimmed && now - lastScanRef.current.at < 3000) return;
    lastScanRef.current = { value: trimmed, at: now };
    scanMemberQr.mutate(trimmed);
  };
  const memberSearch = useQuery({
    queryKey: ['public-scanner-member-search', token, debouncedSearch, accessCode],
    queryFn: () => sharedAccessService.searchMembersByScannerLink(token, { q: debouncedSearch, page: 1, limit: 20, accessCode: accessCode || undefined }),
    enabled: !!token && codeVerified && debouncedSearch.length >= 3,
  });

  const addSelectedMembers = useMutation({
    mutationFn: () => sharedAccessService.addMembersByScannerLink(token, Array.from(selectedIds), accessCode || undefined),
    onMutate: () => { scanBusyRef.current = true; },
    onSuccess: (response) => {
      const first = response.data?.[0];
      if (first) setRecent(first);
      const user = first?.user;
      toast.success(
        response.created === 1 && user
          ? `${user.firstName} ${user.lastName} checked in`
          : `${response.created} member${response.created === 1 ? '' : 's'} checked in${response.skipped ? `, ${response.skipped} skipped` : ''}`
      );
      setSelectedIds(new Set());
      memberSearch.refetch();
      attendanceQuery.refetch();
      window.setTimeout(() => setRecent(null), 2000);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to check in selected members'),
    onSettled: () => { scanBusyRef.current = false; },
  });

  const startCamera = async () => {
    const BarcodeDetectorCtor = (window as any).BarcodeDetector;
    if (!BarcodeDetectorCtor) { setStatus('unsupported'); return; }
    setStatus('starting');
    setCameraError('');
    try {
      const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      scanningRef.current = true;
      setStatus('scanning');
      const tick = async () => {
        if (!scanningRef.current || !videoRef.current) return;
        try {
          if (videoRef.current.readyState >= 2) {
            const codes = await detector.detect(videoRef.current);
            const value = codes?.[0]?.rawValue;
            if (value) handleDetected(value);
          }
        } catch {}
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    } catch (err: any) {
      setStatus('error');
      setCameraError(err?.message || 'Could not open camera');
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchValue.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchValue]);
  useEffect(() => () => stopCamera(), []);

  const invalid = validation.data && !validation.data.valid;
  const church = validation.data?.church;
  const attendance = attendanceQuery.data;
  const recentUser = recent?.user;
  const recentName = recentUser ? `${recentUser.firstName} ${recentUser.lastName}` : 'Attendee';
  const recentContact = recentUser?.phone || recentUser?.email || '';

  if (validation.isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (invalid) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Alert className="max-w-md"><ShieldAlert className="h-4 w-4" /><AlertDescription>{validation.data?.message || 'Invalid scanner link'}</AlertDescription></Alert>
      </div>
    );
  }

  if (validation.data?.hasAccessCode && !codeVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="space-y-5 py-8">
            <div className="text-center"><Lock className="mx-auto h-9 w-9 text-accent" /><h1 className="mt-3 font-heading text-xl font-bold">Scanner Access Code</h1><p className="text-sm text-muted-foreground">Enter the 4-digit code to open scanner mode.</p></div>
            <div className="space-y-2"><Label>Access Code</Label><Input value={accessCode} onChange={e => { setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 4)); setCodeError(''); }} inputMode="numeric" maxLength={4} className="text-center text-xl tracking-[0.4em]" /></div>
            {codeError && <p className="text-center text-sm text-destructive">{codeError}</p>}
            <Button className="w-full" disabled={accessCode.length !== 4 || verifyCode.isPending} onClick={() => verifyCode.mutate()}>{verifyCode.isPending ? 'Verifying...' : 'Open Scanner'}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Church className="h-5 w-5" /></div>
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold">Scan Attendee QR</h1>
          <p className="text-sm text-muted-foreground">{attendanceQuery.isLoading ? 'Loading attendance...' : `${attendance?.serviceType || validation.data?.serviceType || 'Attendance'} · ${attendance?.church?.name || church?.name || 'Church'}`}</p>
          {attendance?._count && <p className="text-xs text-muted-foreground">{attendance._count.participants} checked in</p>}
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative aspect-[3/4] bg-slate-950 sm:aspect-video">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            {status !== 'scanning' && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white"><QrCode className="h-12 w-12 opacity-80" /><p className="text-sm opacity-80">{status === 'unsupported' ? 'Camera QR scanning is not supported. Use manual input below.' : status === 'error' ? cameraError : 'Open the camera and point it at a member QR.'}</p></div>}
            {status === 'scanning' && <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="h-56 w-56 rounded-2xl border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.25)]" /></div>}
            {recent && <div className="absolute inset-x-3 top-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-emerald-950 shadow-lg"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /><div className="min-w-0"><p className="font-semibold">{recentName}</p>{recentContact && <p className="truncate text-sm text-emerald-800">{recentContact}</p>}</div></div></div>}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        {status === 'scanning' || status === 'starting' ? <Button variant="outline" className="flex-1" onClick={stopCamera}><XCircle className="mr-2 h-4 w-4" /> Cancel Scan</Button> : <Button className="flex-1" onClick={startCamera}><Camera className="mr-2 h-4 w-4" /> Open Camera</Button>}
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Search Member</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={event => {
                  setSearchValue(event.target.value);
                  setSelectedIds(new Set());
                }}
                placeholder="Name or email"
                className="pl-9"
                autoComplete="off"
              />
            </div>
            <Button className="min-w-24 px-3 text-xs sm:min-w-32 sm:text-sm" disabled={!selectedIds.size || addSelectedMembers.isPending || scanMemberQr.isPending} onClick={() => addSelectedMembers.mutate()}>
              {addSelectedMembers.isPending ? 'Checking...' : selectedIds.size ? `Check In ${selectedIds.size}` : 'Check In'}
            </Button>
          </div>
          <div className="overflow-hidden rounded-lg border">
            <div className="flex items-center justify-between border-b px-3 py-1.5 text-xs text-muted-foreground">
              <span>{selectedIds.size ? `${selectedIds.size} selected` : 'Select member(s)'}</span>
              {memberSearch.data?.pagination && <span>{memberSearch.data.pagination.total} match{memberSearch.data.pagination.total === 1 ? '' : 'es'}</span>}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {debouncedSearch.length < 3 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">Type 3 letters to search.</div>
              ) : memberSearch.isLoading ? (
                <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Searching...</div>
              ) : (memberSearch.data?.data ?? []).length ? (
                (memberSearch.data?.data ?? []).map((member: any) => {
                  const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unnamed member';
                  const checked = selectedIds.has(member.id);
                  return (
                    <label key={member.id} className={`grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b px-3 py-1.5 last:border-b-0 ${member.alreadyCheckedIn ? 'bg-muted/40 text-muted-foreground' : 'hover:bg-muted/40'}`}>
                      <Checkbox
                        checked={checked}
                        disabled={member.alreadyCheckedIn}
                        onCheckedChange={value => setSelectedIds(current => {
                          const next = new Set(current);
                          if (value === true) next.add(member.id);
                          else next.delete(member.id);
                          return next;
                        })}
                      />
                      <div className="min-w-0 leading-tight">
                        <div className="truncate text-sm font-medium">{name} {member.memberType === 'child' && <span className="text-xs text-accent">(Child)</span>}</div>
                        {member.email && <div className="truncate text-xs text-muted-foreground">{member.email}</div>}
                      </div>
                      <div className="max-w-[110px] truncate text-right text-xs text-muted-foreground sm:max-w-[150px]">{member.alreadyCheckedIn ? 'Checked in' : member.phone || ''}</div>
                    </label>
                  );
                })
              ) : (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">No members found.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}