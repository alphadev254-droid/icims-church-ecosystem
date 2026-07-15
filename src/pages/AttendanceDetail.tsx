import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '@/services/attendance';
import { useAuthStore } from '@/stores/authStore';
import { useRole } from '@/hooks/useRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Camera, Calendar, QrCode, UserCheck, UserPlus, Users } from 'lucide-react';
import { AttendanceQrDialog } from '@/components/attendance/AttendanceQrDialog';
import { AddAttendeesDialog } from '@/components/attendance/AddAttendeesDialog';
import { ExportImportButtons } from '@/components/ExportImportButtons';

export default function AttendanceDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const { hasPermission } = useRole();
  const [qrOpen, setQrOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [genderFilter, setGenderFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
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
  const getAge = (dateOfBirth?: string | null) => {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDelta = today.getMonth() - dob.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) age -= 1;
    if (age < 0 || age > 130) return null;
    return age;
  };
  const getAgeBracket = (age?: number | null, guestAgeBracket?: string | null) => {
    if (guestAgeBracket) return guestAgeBracket;
    if (age === null || age === undefined) return '';
    if (age <= 12) return '0-12';
    if (age <= 17) return '13-17';
    if (age <= 35) return '18-35';
    if (age <= 59) return '36-59';
    return '60+';
  };
  const getMemberAgeMeta = (memberType?: string | null, dateOfBirth?: string | null) => {
    const normalizedType = (memberType || '').toLowerCase();
    const age = getAge(dateOfBirth);

    if (age === null) {
      return {
        ageLabel: '',
        ageBracket: normalizedType === 'child' ? '0-12' : normalizedType === 'adult' ? '36-59' : '',
      };
    }

    if (normalizedType === 'adult' && age < 18) {
      return { ageLabel: '', ageBracket: '36-59' };
    }

    if (normalizedType === 'child' && age >= 18) {
      return { ageLabel: '', ageBracket: '0-12' };
    }

    return { ageLabel: String(age), ageBracket: getAgeBracket(age) };
  };
  const getParticipantMeta = (participant: typeof participants[number]) => {
    const memberAgeMeta = participant.user
      ? getMemberAgeMeta(participant.user.memberType, participant.user.dateOfBirth)
      : null;
    const memberTypeLabel = participant.user?.memberType
      ? participant.user.memberType
      : participant.ministryMember?.memberType || '';
    const participantType = participant.user
      ? 'Member'
      : participant.ministryMember
        ? 'Ministry member guest'
        : 'Guest';
    return {
      name: participant.user ? `${participant.user.firstName} ${participant.user.lastName}` : participant.guestName || 'Guest',
      contact: participant.user?.email || participant.user?.phone || participant.guestEmail || participant.guestPhone || '-',
      gender: participant.user?.gender || participant.guestGender || '',
      ageLabel: participant.user ? memberAgeMeta?.ageLabel || '' : participant.guestAgeBracket || '',
      ageBracket: participant.user ? memberAgeMeta?.ageBracket || '' : getAgeBracket(null, participant.guestAgeBracket),
      memberTypeLabel,
      participantType,
      homeChurch: participant.user ? participant.user.church?.name || record.church?.name || '' : participant.ministryMember?.church?.name || '',
    };
  };
  const filteredParticipants = participants.filter(participant => {
    const meta = getParticipantMeta(participant);
    const genderMatches = genderFilter === 'all' || meta.gender === genderFilter;
    const ageMatches = ageFilter === 'all' || meta.ageBracket === ageFilter;
    return genderMatches && ageMatches;
  });
  const qrCount = record._count?.participants ?? participantsResponse?.pagination.total ?? 0;
  const maleCount = participants.filter(p => getParticipantMeta(p).gender === 'male').length;
  const femaleCount = participants.filter(p => getParticipantMeta(p).gender === 'female').length;
  const participantExportData = filteredParticipants.map(participant => {
    const meta = getParticipantMeta(participant);
    return {
      name: meta.name,
      contact: meta.contact,
      gender: meta.gender || '',
      age: meta.ageLabel || '',
      ageBracket: meta.ageBracket || '',
      type: meta.participantType,
      memberType: meta.memberTypeLabel || '',
      homeChurch: meta.homeChurch || '',
      method: participant.checkInMethod.replace(/_/g, ' '),
      status: participant.status,
      checkedInAt: new Date(participant.checkedInAt).toLocaleString(),
      userId: participant.userId || '',
      guestName: participant.guestName || '',
      guestEmail: participant.guestEmail || '',
      guestPhone: participant.guestPhone || '',
      guestFirstTime: participant.guestFirstTime ? 'Yes' : 'No',
      invitedBy: participant.invitedBy || '',
      attendanceId: participant.attendanceId,
      participantId: participant.id,
    };
  });
  const participantExportHeaders = [
    { label: 'Name', key: 'name' },
    { label: 'Contact', key: 'contact' },
    { label: 'Gender', key: 'gender' },
    { label: 'Age', key: 'age' },
    { label: 'Age Bracket', key: 'ageBracket' },
    { label: 'Type', key: 'type' },
    { label: 'Member Type', key: 'memberType' },
    { label: 'Home Church', key: 'homeChurch' },
    { label: 'Method', key: 'method' },
    { label: 'Status', key: 'status' },
    { label: 'Checked In', key: 'checkedInAt' },
    { label: 'User ID', key: 'userId' },
    { label: 'Guest Name', key: 'guestName' },
    { label: 'Guest Email', key: 'guestEmail' },
    { label: 'Guest Phone', key: 'guestPhone' },
    { label: 'Guest First Time', key: 'guestFirstTime' },
    { label: 'Invited By', key: 'invitedBy' },
    { label: 'Attendance ID', key: 'attendanceId' },
    { label: 'Participant ID', key: 'participantId' },
  ];

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
        <div className="flex flex-col gap-2 sm:flex-row">
          {canUpdate && (
            <Button variant="outline" onClick={() => setAddOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" /> Add Manual
            </Button>
          )}
          {canUpdate && (
            <Button variant="outline" onClick={() => navigate(`/dashboard/attendance/${record.id}/scan`)} className="gap-2">
              <Camera className="h-4 w-4" /> Scan Attendee QR
            </Button>
          )}
          <Button onClick={() => setQrOpen(true)} className="gap-2">
            <QrCode className="h-4 w-4" /> QR Controls
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Male</CardTitle></CardHeader>
          <CardContent className="font-heading text-2xl font-bold">{maleCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Female</CardTitle></CardHeader>
          <CardContent className="font-heading text-2xl font-bold">{femaleCount}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Attended People
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">{filteredParticipants.length} of {participants.length} shown</p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <ExportImportButtons
                data={participantExportData}
                filename={`attendance-participants-${record.id}`}
                headers={participantExportHeaders}
                pdfTitle={`${record.serviceType} Attendance Participants`}
              />
              <div className="grid grid-cols-2 gap-2 sm:w-[340px]">
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All gender</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={ageFilter} onValueChange={setAgeFilter}>
                  <SelectTrigger><SelectValue placeholder="Age" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ages</SelectItem>
                    <SelectItem value="0-12">0-12</SelectItem>
                    <SelectItem value="13-17">13-17</SelectItem>
                    <SelectItem value="18-35">18-35</SelectItem>
                    <SelectItem value="36-59">36-59</SelectItem>
                    <SelectItem value="60+">60+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-0">
          <div className="space-y-3 sm:hidden">
            {participantsLoading ? (
              <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">Loading participants...</div>
            ) : filteredParticipants.length ? filteredParticipants.map(participant => {
              const meta = getParticipantMeta(participant);
              return (
                <div key={participant.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{meta.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground break-all">{meta.contact}</p>
                    </div>
                    <Badge variant="outline">{meta.participantType}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>Gender: <strong className="text-foreground">{meta.gender || '-'}</strong></span>
                    <span>Age: <strong className="text-foreground">{meta.ageLabel || '-'}</strong></span>
                    <span>Member type: <strong className="text-foreground capitalize">{meta.memberTypeLabel || '-'}</strong></span>
                    <span>Home church: <strong className="text-foreground">{meta.homeChurch || '-'}</strong></span>
                    <span className="col-span-2">Checked in: {new Date(participant.checkedInAt).toLocaleString()}</span>
                  </div>
                </div>
              );
            }) : (
              <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">No participants match the filters.</div>
            )}
          </div>
          <div className="hidden overflow-x-auto sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Member Type</TableHead>
                  <TableHead>Home Church</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Checked In</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participantsLoading ? (
                  <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">Loading participants...</TableCell></TableRow>
                ) : filteredParticipants.length ? filteredParticipants.map(participant => {
                  const meta = getParticipantMeta(participant);
                  return (
                    <TableRow key={participant.id}>
                      <TableCell className="font-medium">{meta.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{meta.contact}</TableCell>
                      <TableCell className="text-sm capitalize text-muted-foreground">{meta.gender || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{meta.ageLabel || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{meta.participantType}</Badge>
                      </TableCell>
                      <TableCell className="text-sm capitalize text-muted-foreground">{meta.memberTypeLabel || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{meta.homeChurch || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{participant.checkInMethod.replace(/_/g, ' ')}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{new Date(participant.checkedInAt).toLocaleString()}</TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">No participants match the filters.</TableCell></TableRow>
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

      {canUpdate && (
        <AddAttendeesDialog
          record={record}
          open={addOpen}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}
