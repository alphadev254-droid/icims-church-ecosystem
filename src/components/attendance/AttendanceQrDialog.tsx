import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { jsPDF } from 'jspdf';
import { attendanceService, type AttendanceRecord } from '@/services/attendance';
import { buildPublicCheckInUrl } from '@/lib/public-links';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AddAttendeesDialog } from '@/components/attendance/AddAttendeesDialog';
import { ChevronDown, Copy, Download, FileText, ImageIcon, Loader2, Power, QrCode, RefreshCcw, Square, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

function toLocalInputValue(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'attendance';
}

export function AttendanceQrDialog({
  record,
  subdomain,
  canUpdate,
  onClose,
}: {
  record: AttendanceRecord;
  subdomain?: string | null;
  canUpdate: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [localRecord, setLocalRecord] = useState(record);
  const [activeFrom, setActiveFrom] = useState(toLocalInputValue(record.qrActiveFrom));
  const [activeUntil, setActiveUntil] = useState(toLocalInputValue(record.qrActiveUntil));
  const [memberQrInput, setMemberQrInput] = useState('');
  const [manualAddOpen, setManualAddOpen] = useState(false);
  const [visitorForm, setVisitorForm] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestGender: '',
    guestAgeBracket: '',
    guestFirstTime: false,
    invitedBy: '',
  });

  const checkInUrl = useMemo(() => (
    localRecord.qrToken ? buildPublicCheckInUrl(localRecord.qrToken, subdomain) : ''
  ), [localRecord.qrToken, subdomain]);
  const qrImageUrl = checkInUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=16&data=${encodeURIComponent(checkInUrl)}`
    : '';

  const refreshAttendance = (updated: AttendanceRecord) => {
    setLocalRecord(updated);
    setActiveFrom(toLocalInputValue(updated.qrActiveFrom));
    setActiveUntil(toLocalInputValue(updated.qrActiveUntil));
    qc.invalidateQueries({ queryKey: ['attendance'] });
  };

  const saveSettings = useMutation({
    mutationFn: () => attendanceService.updateQrSettings(localRecord.id, {
      digitalCheckInEnabled: true,
      qrActiveFrom: activeFrom || null,
      qrActiveUntil: activeUntil || null,
    }),
    onSuccess: (updated) => {
      refreshAttendance(updated);
      toast.success('QR settings saved');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save QR settings'),
  });

  const activateQr = useMutation({
    mutationFn: () => attendanceService.activateQr(localRecord.id),
    onSuccess: (updated) => {
      refreshAttendance(updated);
      toast.success('QR check-in activated');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to activate QR'),
  });

  const closeQr = useMutation({
    mutationFn: () => attendanceService.closeQr(localRecord.id),
    onSuccess: (updated) => {
      refreshAttendance(updated);
      toast.success('QR check-in closed');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to close QR'),
  });

  const regenerateQr = useMutation({
    mutationFn: () => attendanceService.regenerateQr(localRecord.id),
    onSuccess: (updated) => {
      refreshAttendance(updated);
      toast.success('QR code regenerated');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to regenerate QR'),
  });

  const scanMemberQr = useMutation({
    mutationFn: () => attendanceService.scanMemberQr(localRecord.id, memberQrInput),
    onSuccess: (participant: any, _vars: void, _ctx: unknown) => {
      const memberName = participant.user ? `${participant.user.firstName} ${participant.user.lastName}` : 'Member';
      toast.success(`${memberName} checked in`);
      setMemberQrInput('');
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance-detail', localRecord.id] });
      qc.invalidateQueries({ queryKey: ['attendance-participants', localRecord.id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to scan member QR'),
  });

  const scanVisitor = useMutation({
    mutationFn: () => attendanceService.scanVisitor(localRecord.id, {
      guestName: visitorForm.guestName.trim(),
      guestEmail: visitorForm.guestEmail.trim() || undefined,
      guestPhone: visitorForm.guestPhone.trim() || undefined,
      guestGender: visitorForm.guestGender || undefined,
      guestAgeBracket: visitorForm.guestAgeBracket || undefined,
      guestFirstTime: visitorForm.guestFirstTime,
      invitedBy: visitorForm.invitedBy.trim() || undefined,
    }),
    onSuccess: () => {
      toast.success('Visitor checked in');
      setVisitorForm({
        guestName: '',
        guestEmail: '',
        guestPhone: '',
        guestGender: '',
        guestAgeBracket: '',
        guestFirstTime: false,
        invitedBy: '',
      });
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance-detail', localRecord.id] });
      qc.invalidateQueries({ queryKey: ['attendance-participants', localRecord.id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to check in visitor'),
  });

  const copyLink = async () => {
    if (!checkInUrl) return;
    await navigator.clipboard.writeText(checkInUrl);
    toast.success('Check-in link copied');
  };

  const downloadPng = async () => {
    if (!qrImageUrl) return;
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${safeFileName(localRecord.serviceType || 'attendance')}-check-in-qr.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error('Failed to download PNG');
    }
  };

  const downloadPdf = async () => {
    if (!qrImageUrl) return;
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const title = localRecord.serviceType || 'Attendance Check-in';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text(title, 105, 30, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(new Date(localRecord.date).toLocaleDateString(), 105, 40, { align: 'center' });
      doc.addImage(dataUrl, 'PNG', 55, 55, 100, 100);
      doc.setFontSize(12);
      doc.text('Scan this QR code to check in for attendance.', 105, 170, { align: 'center' });
      const lines = doc.splitTextToSize(checkInUrl, 160);
      doc.setFontSize(9);
      doc.text(lines, 105, 182, { align: 'center' });
      doc.save(`${safeFileName(title)}-check-in-qr.pdf`);
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  const status = localRecord.qrStatus || 'draft';

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">QR Check-in</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 text-center">
              {qrImageUrl ? (
                <img src={qrImageUrl} alt="Attendance check-in QR code" className="mx-auto h-64 w-64 rounded-md bg-white p-2" />
              ) : (
                <div className="mx-auto flex h-64 w-64 flex-col items-center justify-center rounded-md bg-white text-muted-foreground">
                  <QrCode className="h-10 w-10" />
                  <p className="mt-2 text-sm">Save or activate to generate QR</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={copyLink} disabled={!checkInUrl}>
                <Copy className="mr-2 h-4 w-4" /> Copy
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!qrImageUrl}>
                    <Download className="mr-2 h-4 w-4" /> Download QR <ChevronDown className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={downloadPng}>
                    <ImageIcon className="mr-2 h-4 w-4" /> Download PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadPdf}>
                    <FileText className="mr-2 h-4 w-4" /> Download PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {canUpdate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm('Regenerate this QR code? The old QR link will stop working.')) regenerateQr.mutate();
                  }}
                  disabled={regenerateQr.isPending}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" /> Regenerate
                </Button>
              )}
            </div>

            {checkInUrl && (
              <p className="break-all rounded-md bg-muted p-3 text-xs text-muted-foreground">{checkInUrl}</p>
            )}
          </div>

          <div className="space-y-5">
            <div className="rounded-lg border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">{localRecord.serviceType}</p>
                  <p className="text-xs text-muted-foreground">{new Date(localRecord.date).toLocaleDateString()}</p>
                </div>
                <Badge variant={status === 'active' ? 'default' : status === 'closed' ? 'secondary' : 'outline'}>
                  {status}
                </Badge>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Active from</Label>
                  <Input type="datetime-local" value={activeFrom} onChange={e => setActiveFrom(e.target.value)} disabled={!canUpdate} />
                </div>
                <div className="space-y-1.5">
                  <Label>Active until</Label>
                  <Input type="datetime-local" value={activeUntil} onChange={e => setActiveUntil(e.target.value)} disabled={!canUpdate} />
                </div>
              </div>

              {canUpdate && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>
                    {saveSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Window
                  </Button>
                  {status === 'active' ? (
                    <Button variant="outline" onClick={() => closeQr.mutate()} disabled={closeQr.isPending}>
                      <Square className="mr-2 h-4 w-4" /> Close
                    </Button>
                  ) : (
                    <Button onClick={() => activateQr.mutate()} disabled={activateQr.isPending}>
                      <Power className="mr-2 h-4 w-4" /> Activate
                    </Button>
                  )}
                </div>
              )}
            </div>

            {canUpdate && (
              <div className="rounded-lg border p-4">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Check-in Station</h3>
                    <p className="text-xs text-muted-foreground">Scan QR codes, add visitors, or search members manually.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setManualAddOpen(true)} className="gap-2">
                    <UserPlus className="h-4 w-4" /> Manual Add
                  </Button>
                </div>
                <Tabs defaultValue="member" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="member">Member QR</TabsTrigger>
                    <TabsTrigger value="visitor">Visitor</TabsTrigger>
                  </TabsList>
                  <TabsContent value="member" className="mt-4">
                    <h3 className="text-sm font-semibold">Scan Member QR</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Paste or scan a member QR code to mark that member present.
                    </p>
                    <form
                      className="mt-3 flex flex-col gap-2 sm:flex-row"
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (!memberQrInput.trim()) {
                          toast.error('Scan or paste a member QR first');
                          return;
                        }
                        scanMemberQr.mutate();
                      }}
                    >
                      <Input
                        value={memberQrInput}
                        onChange={event => setMemberQrInput(event.target.value)}
                        placeholder="Scan member QR here"
                        autoComplete="off"
                      />
                      <Button type="submit" disabled={scanMemberQr.isPending || status !== 'active'} className="shrink-0">
                        {scanMemberQr.isPending ? 'Checking...' : 'Check In'}
                      </Button>
                    </form>
                  </TabsContent>
                  <TabsContent value="visitor" className="mt-4">
                    <h3 className="text-sm font-semibold">Visitor Check-in</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Add a visitor manually, then continue scanning.
                    </p>
                    <form
                      className="mt-3 space-y-3"
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (!visitorForm.guestName.trim()) {
                          toast.error('Visitor name is required');
                          return;
                        }
                        scanVisitor.mutate();
                      }}
                    >
                      <div className="space-y-1.5">
                        <Label>Name *</Label>
                        <Input value={visitorForm.guestName} onChange={event => setVisitorForm(form => ({ ...form, guestName: event.target.value }))} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Gender</Label>
                          <Select value={visitorForm.guestGender} onValueChange={value => setVisitorForm(form => ({ ...form, guestGender: value }))}>
                            <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Age</Label>
                          <Select value={visitorForm.guestAgeBracket} onValueChange={value => setVisitorForm(form => ({ ...form, guestAgeBracket: value }))}>
                            <SelectTrigger><SelectValue placeholder="Age" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0-12">0-12</SelectItem>
                              <SelectItem value="13-17">13-17</SelectItem>
                              <SelectItem value="18-35">18-35</SelectItem>
                              <SelectItem value="36-59">36-59</SelectItem>
                              <SelectItem value="60+">60+</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label>Phone</Label>
                          <Input value={visitorForm.guestPhone} onChange={event => setVisitorForm(form => ({ ...form, guestPhone: event.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Email</Label>
                          <Input type="email" value={visitorForm.guestEmail} onChange={event => setVisitorForm(form => ({ ...form, guestEmail: event.target.value }))} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Invited by</Label>
                        <Input value={visitorForm.invitedBy} onChange={event => setVisitorForm(form => ({ ...form, invitedBy: event.target.value }))} />
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={visitorForm.guestFirstTime} onCheckedChange={checked => setVisitorForm(form => ({ ...form, guestFirstTime: checked === true }))} />
                        First time visiting
                      </label>
                      <Button type="submit" disabled={scanVisitor.isPending || status !== 'active'} className="w-full">
                        {scanVisitor.isPending ? 'Checking in...' : 'Check In Visitor'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>

        {canUpdate && (
          <AddAttendeesDialog
            record={localRecord}
            open={manualAddOpen}
            onClose={() => setManualAddOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
