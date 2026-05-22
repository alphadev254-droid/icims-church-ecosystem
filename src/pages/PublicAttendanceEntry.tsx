import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { sharedAccessService } from '@/services/sharedAccess';
import { RegularServiceForm } from '@/components/attendance/RegularServiceForm';
import { EditAttendanceForm } from '@/components/attendance/EditAttendanceForm';
import { ViewAttendanceDialog } from '@/components/attendance/ViewAttendanceDialog';
import { VisitorsManageDialog } from '@/components/attendance/VisitorsManageDialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertCircle, Church, Eye, Pencil, UserCheck, ClipboardList, Lock, ShieldCheck, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function PublicAttendanceEntry() {
  const { token } = useParams<{ token: string }>();

  // Check sessionStorage for persisted code verification (survives F5)
  const getPersistedVerified = () => {
    if (!token) return false;
    return sessionStorage.getItem(`attendance_code_${token}`) === 'verified';
  };

  // Validation state
  const [validationState, setValidationState] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [linkInfo, setLinkInfo] = useState<{ type?: string; serviceType?: string | null; church?: { id: string; name: string }; hasAccessCode?: boolean } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Access code verification state
  const [codeVerifying, setCodeVerifying] = useState(false);
  const [codeVerified, setCodeVerified] = useState(getPersistedVerified);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');

  // Attendance records state
  const [records, setRecords] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0); // Increment to reset form

  // View dialog state
  const [viewRecord, setViewRecord] = useState<any | null>(null);

  // Edit dialog state
  const [editRecord, setEditRecord] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Visitors dialog state
  const [visitorsRecord, setVisitorsRecord] = useState<any | null>(null);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setValidationState('invalid');
      setErrorMessage('No access token provided');
      return;
    }

    const validate = async () => {
      try {
        const result = await sharedAccessService.validateLink(token);
        if (result.valid) {
          setValidationState('valid');
          setLinkInfo(result);
          if (!result.hasAccessCode) {
            setCodeVerified(true);
            sessionStorage.setItem(`attendance_code_${token}`, 'verified');
            fetchRecords();
          }
        } else {
          setValidationState('invalid');
          setErrorMessage(result.message || 'Invalid or expired link');
        }
      } catch (err: any) {
        setValidationState('invalid');
        setErrorMessage(err.response?.data?.message || 'Failed to validate access link');
      }
    };

    validate();
  }, [token]);

  const fetchRecords = async () => {
    if (!token) return;
    setRecordsLoading(true);
    try {
      const data = await sharedAccessService.getAttendanceByLink(token);
      setRecords(data);
    } catch {
      // Non-critical — silently fail
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      const result = await sharedAccessService.submitAttendance(token, formData);
      if (result.success) {
        toast.success('Attendance recorded successfully');
        fetchRecords();     // Refresh the records list
        setFormKey(k => k + 1); // Reset the form for another entry
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (formData: any) => {
    if (!token || !editRecord) return;
    setIsUpdating(true);
    try {
      const result = await sharedAccessService.updateAttendance(token, editRecord.id, formData);
      if (result.success) {
        toast.success('Attendance record updated');
        setEditRecord(null);
        fetchRecords();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update record');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!token) return;
    if (!accessCodeInput || accessCodeInput.length !== 4) {
      setCodeError('Please enter a 4-digit code');
      return;
    }
    setCodeVerifying(true);
    setCodeError('');
    try {
      const result = await sharedAccessService.verifyCode(token, accessCodeInput);
      if (result.valid) {
        setCodeVerified(true);
        sessionStorage.setItem(`attendance_code_${token}`, 'verified');
        fetchRecords();
      } else {
        setCodeError(result.message || 'Invalid code');
      }
    } catch (err: any) {
      setCodeError(err.response?.data?.message || 'Failed to verify code');
    } finally {
      setCodeVerifying(false);
    }
  };

  const handleLogout = () => {
    if (token) {
      sessionStorage.removeItem(`attendance_code_${token}`);
    }
    setCodeVerified(false);
    setAccessCodeInput('');
    setCodeError('');
    setRecords([]);
  };

  // ── Loading State ──────────────────────────────────────────────────
  if (validationState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
            <p className="text-muted-foreground">Validating access link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Invalid State ──────────────────────────────────────────────────
  if (validationState === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h2 className="text-xl font-semibold">Access Link Invalid</h2>
            <p className="text-muted-foreground text-center">{errorMessage}</p>
            <p className="text-xs text-muted-foreground text-center">
              Please contact your church administrator to request a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Code Entry Screen ─────────────────────────────────────────────
  if (!codeVerified && linkInfo?.hasAccessCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="flex flex-col items-center justify-center py-10 space-y-6">
            <div className="rounded-full bg-accent/10 p-4">
              <Lock className="h-10 w-10 text-accent" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Access Code Required</h2>
              <p className="text-sm text-muted-foreground">
                This link is protected. Enter the 4-digit access code provided by your administrator.
              </p>
            </div>
            <div className="w-full space-y-3">
              <div>
                <Label htmlFor="access-code">4-Digit Code</Label>
                <Input
                  id="access-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="[0-9]*"
                  placeholder="Enter code"
                  value={accessCodeInput}
                  onChange={e => {
                    setAccessCodeInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                    setCodeError('');
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') handleVerifyCode(); }}
                  className="text-center text-2xl tracking-[0.5em] h-14"
                  autoFocus
                />
              </div>
              {codeError && (
                <p className="text-sm text-destructive text-center">{codeError}</p>
              )}
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                onClick={handleVerifyCode}
                disabled={codeVerifying || accessCodeInput.length !== 4}
              >
                {codeVerifying ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
                ) : (
                  <><ShieldCheck className="h-4 w-4" /> Verify Code</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <Card>
          <CardHeader className="text-center relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="absolute top-2 right-2 text-destructive gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-xs hidden sm:inline">Logout</span>
            </Button>
            <div className="flex justify-center mb-2">
              <Church className="h-10 w-10 text-accent" />
            </div>
            <CardTitle className="font-heading text-xl">Attendance Entry</CardTitle>
            {linkInfo?.church && (
              <CardDescription>
                Recording attendance for <strong>{linkInfo.church.name}</strong>
                {linkInfo?.serviceType && <> &mdash; {linkInfo.serviceType}</>}
              </CardDescription>
            )}
          </CardHeader>
        </Card>

        {/* Attendance Form */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">New Attendance Record</CardTitle>
          </CardHeader>
          <CardContent>
            <RegularServiceForm
              key={formKey}
              onSubmit={handleFormSubmit}
              isPending={isSubmitting}
              submitLabel="Record Attendance"
              hideChurchSelect
              defaultValues={{
                churchId: linkInfo?.church?.id || '',
                serviceType: linkInfo?.serviceType || 'Sunday Service',
                date: new Date().toISOString().split('T')[0],
              }}
            />
          </CardContent>
        </Card>

        {/* Attendance Records Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              Submitted Records
            </CardTitle>
            {recordsLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </CardHeader>
          <CardContent className="p-0">
            {records.length === 0 && !recordsLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No attendance records submitted yet via this link.
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead className="text-right">Male</TableHead>
                    <TableHead className="text-right">Female</TableHead>
                    <TableHead className="text-right">Children</TableHead>
                    <TableHead className="text-right">Youth</TableHead>
                    <TableHead className="text-right">Adults</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Visitors</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm whitespace-nowrap">{new Date(r.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{r.serviceType}</TableCell>
                      <TableCell className="text-right">{r.maleCount ?? 0}</TableCell>
                      <TableCell className="text-right">{r.femaleCount ?? 0}</TableCell>
                      <TableCell className="text-right">{r.children ?? 0}</TableCell>
                      <TableCell className="text-right">{r.youth ?? 0}</TableCell>
                      <TableCell className="text-right">{r.adults ?? 0}</TableCell>
                      <TableCell className="text-right font-medium">{r.totalAttendees}</TableCell>
                      <TableCell className="text-right">{r.newVisitors ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewRecord(r)}
                            className="p-1.5 text-muted-foreground hover:text-accent transition-colors"
                            title="View details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setVisitorsRecord(r)}
                            className="p-1.5 text-muted-foreground hover:text-accent transition-colors"
                            title="View / manage visitors"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setEditRecord(r)}
                            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Attendance Dialog */}
        {viewRecord && (
          <ViewAttendanceDialog
            record={viewRecord}
            onClose={() => setViewRecord(null)}
          />
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editRecord} onOpenChange={open => !open && setEditRecord(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">Edit Attendance</DialogTitle>
            </DialogHeader>
            {editRecord && (
              <EditAttendanceForm
                record={editRecord}
                onSubmit={handleEditSubmit}
                isPending={isUpdating}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Visitors Manage Dialog */}
        {visitorsRecord && (
          <VisitorsManageDialog
            record={visitorsRecord}
            token={token}
            canUpdate
            onClose={() => setVisitorsRecord(null)}
          />
        )}

      </div>
    </div>
  );
}
