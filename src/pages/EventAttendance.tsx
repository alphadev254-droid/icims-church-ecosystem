import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { eventsService } from '@/services/events';
import { attendanceService } from '@/services/attendance';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ExportImportButtons } from '@/components/ExportImportButtons';
import { toast } from 'sonner';
import { STALE_TIME } from '@/lib/query-config';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function EventAttendancePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedEventId, setSelectedEventId] = useState(searchParams.get('eventId') || '');
  const qc = useQueryClient();

  const { data: eventsResponse = [] } = useQuery({
    queryKey: ['events'],
    queryFn: eventsService.getAll,
    staleTime: STALE_TIME.DEFAULT,
  });

  const events = Array.isArray(eventsResponse) && eventsResponse[0]?.label
    ? eventsResponse.flatMap((group: any) => group.posts || [])
    : eventsResponse;

  const { data: eventTickets = [], isLoading: isLoadingTickets } = useQuery({
    queryKey: ['event-tickets', selectedEventId],
    queryFn: () => eventsService.getEventTickets(selectedEventId),
    enabled: !!selectedEventId,
    staleTime: 0,
  });

  const markAttendanceMutation = useMutation({
    mutationFn: ({ ticketId, attended }: { ticketId: string; attended: boolean }) =>
      eventsService.markAttendance(ticketId, attended),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-tickets', selectedEventId] });
    },
    onError: () => {
      toast.error('Failed to update attendance');
    },
  });

  const createAttendanceMutation = useMutation({
    mutationFn: attendanceService.create,
    onSuccess: () => {
      toast.success('Attendance recorded successfully');
      navigate('/dashboard/attendance');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to record attendance'),
  });

  const handleSaveAttendance = () => {
    const attendedCount = eventTickets.filter((t: { attended?: boolean }) => t.attended).length;
    createAttendanceMutation.mutate({
      churchId: selectedEvent.churchId,
      eventId: selectedEventId,
      date: new Date().toISOString().split('T')[0],
      totalAttendees: attendedCount,
      serviceType: 'Event',
    });
  };

  const selectedEvent = events.find((e: any) => e.id === selectedEventId);
  const attendedCount = eventTickets.filter((t: any) => t.attended).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/attendance')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold">Event Attendance</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Mark attendance for event tickets</p>
          </div>
        </div>
        {selectedEventId && eventTickets.length > 0 && (
          <div className="self-end sm:self-auto">
          <ExportImportButtons
            data={eventTickets.map((t: any) => ({
              name: `${t.user.firstName} ${t.user.lastName}`,
              email: t.user.email,
              ticketNumber: t.ticketNumber,
              status: t.status,
              attended: t.attended ? 'Yes' : 'No',
            }))}
            filename={`event-attendance-${selectedEvent?.title || 'export'}`}
            headers={[
              { label: 'Name', key: 'name' },
              { label: 'Email', key: 'email' },
              { label: 'Ticket Number', key: 'ticketNumber' },
              { label: 'Status', key: 'status' },
              { label: 'Attended', key: 'attended' },
            ]}
            pdfTitle={`Event Attendance - ${selectedEvent?.title || 'Report'}`}
          />
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-4 sm:pt-6 space-y-4">
          <div>
            <Label className="text-xs sm:text-sm">Select Event</Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue placeholder="Choose an event" /></SelectTrigger>
              <SelectContent>
                {events.map((event: any) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title} - {new Date(event.date).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEvent && (
            <div className="flex items-center justify-between p-3 sm:p-4 bg-muted rounded-lg">
              <div>
                <p className="text-xs sm:text-sm font-medium">{selectedEvent.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(selectedEvent.date).toLocaleDateString()} at {selectedEvent.time}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl sm:text-2xl font-bold">{attendedCount}/{eventTickets.length}</p>
                <p className="text-xs text-muted-foreground">Attended</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEventId && (
        <Card>
          <CardContent className="p-0">
            {isLoadingTickets ? (
              <div className="flex justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table className="min-w-[500px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-xs sm:text-sm">Attended</TableHead>
                        <TableHead className="text-xs sm:text-sm">Name</TableHead>
                        <TableHead className="text-xs sm:text-sm">Email</TableHead>
                        <TableHead className="text-xs sm:text-sm">Ticket #</TableHead>
                        <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventTickets.map((ticket: any) => (
                        <TableRow key={ticket.id} className={ticket.attended ? 'bg-green-100 dark:bg-green-950' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={ticket.attended}
                              disabled={markAttendanceMutation.isPending}
                              onCheckedChange={(checked) =>
                                markAttendanceMutation.mutate({
                                  ticketId: ticket.id,
                                  attended: !!checked,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm font-medium whitespace-nowrap">
                            {ticket.user.firstName} {ticket.user.lastName}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{ticket.user.email}</TableCell>
                          <TableCell className="text-xs font-mono whitespace-nowrap">{ticket.ticketNumber}</TableCell>
                          <TableCell>
                            {ticket.attended && (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="text-xs">Present</span>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {eventTickets.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-xs sm:text-sm text-muted-foreground">
                            No tickets found for this event
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {eventTickets.length > 0 && (
                  <div className="p-4 border-t">
                    <Button
                      onClick={handleSaveAttendance}
                      disabled={createAttendanceMutation.isPending}
                      className="w-full h-8 text-xs sm:h-10 sm:text-sm"
                    >
                      {createAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance Record'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
