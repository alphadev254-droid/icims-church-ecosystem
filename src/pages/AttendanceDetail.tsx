import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '@/services/attendance';
import { useAuthStore } from '@/stores/authStore';
import { useRole } from '@/hooks/useRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Calendar, QrCode, UserCheck, Users } from 'lucide-react';
import { AttendanceQrDialog } from '@/components/attendance/AttendanceQrDialog';

export default function AttendanceDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const { hasPermission } = useRole();
  const [qrOpen, setQrOpen] = useState(false);
  const canUpdate = hasPermission('attendance:update');

  const { data: record, isLoading } = useQuery({
    queryKey: ['attendance-detail', id],
    queryFn: () => attendanceService.getById(id),
    enabled: !!id,
  });

  const { data: participantsResponse, isLoading: participantsLoading } = useQuery({
    queryKey: ['attendance-participants', id],
    queryFn: () => attendanceService.getParticipants(id, { limit: 200 }),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        <Card><CardContent className="py-10 text-center text-muted-foreground">Attendance record not found.</CardContent></Card>
      </div>
    );
  }

  const participants = participantsResponse?.data ?? [];
  const qrCount = record._count?.participants ?? participantsResponse?.pagination.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/attendance')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold">{record.serviceType}</h1>
            <p className="text-sm text-muted-foreground">
              {record.church?.name || 'Church'} · {new Date(record.date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Button onClick={() => setQrOpen(true)} className="gap-2">
          <QrCode className="h-4 w-4" /> QR Controls
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="font-heading text-2xl font-bold">{record.totalAttendees}</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">QR Check-ins</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="font-heading text-2xl font-bold">{qrCount}</span>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Visitors</CardTitle></CardHeader>
          <CardContent className="font-heading text-2xl font-bold">{record.newVisitors ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">QR Status</CardTitle></CardHeader>
          <CardContent>
            <Badge variant={record.qrStatus === 'active' ? 'default' : record.qrStatus === 'closed' ? 'secondary' : 'outline'}>
              {record.qrStatus || 'draft'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Attended People
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Checked In</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participantsLoading ? (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Loading participants...</TableCell></TableRow>
                ) : participants.length ? participants.map(participant => {
                  const name = participant.user
                    ? `${participant.user.firstName} ${participant.user.lastName}`
                    : participant.guestName || 'Guest';
                  const contact = participant.user?.email || participant.user?.phone || participant.guestEmail || participant.guestPhone || '-';
                  return (
                    <TableRow key={participant.id}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{contact}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{participant.user ? (participant.user.memberType === 'child' ? 'Member (child)' : 'Member') : 'Guest'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{participant.checkInMethod.replace(/_/g, ' ')}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{new Date(participant.checkedInAt).toLocaleString()}</TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No QR participants checked in yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {qrOpen && (
        <AttendanceQrDialog
          record={record}
          subdomain={user?.subdomain}
          canUpdate={canUpdate}
          onClose={() => setQrOpen(false)}
        />
      )}
    </div>
  );
}
