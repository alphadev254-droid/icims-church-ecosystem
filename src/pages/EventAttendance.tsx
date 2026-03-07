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
import { ChurchSelect } from '@/components/ChurchSelect';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ExportImportButtons } from '@/components/ExportImportButtons';
import { toast } from 'sonner';
import { STALE_TIME } from '@/lib/query-config';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function EventAttendancePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedEventId, setSelectedEventId] = useState(searchParams.get('eventId') || '');
  const [selectedChurchId, setSelectedChurchId] = useState('');
  const qc = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: eventsService.getAll,
    staleTime: STALE_TIME.DEFAULT,
  });

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
    if (!selectedChurchId) {
      toast.error('Please select a church');
      return;
    }
    const attendedCount = eventTickets.filter((t: any) => t.attended).length;
    createAttendanceMutation.mutate({
      churchId: selectedChurchId,
      eventId: selectedEventId,
      date: new Date().toISOString().split('T')[0],
      totalAttendees: attendedCount,
      newVisitors: 0,
      serviceType: 'Event',
    });
  };

  const selectedEvent = events.find((e: any) => e.id === selectedEventId);
  const attendedCount = eventTickets.filter((t: any) => t.attended).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/attendance')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold">Event Attendance</h1>
            <p className="text-sm text-muted-foreground">Mark attendance for event tickets</p>
          </div>
        </div>
        {selectedEventId && eventTickets.length > 0 && (
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
        )}
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Select Event</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger><SelectValue placeholder="Choose an event" /></SelectTrigger>
                <SelectContent>
                  {events.map((event: any) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title} - {new Date(event.date).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEventId && (
              <div>
                <Label>Select Church</Label>
                <ChurchSelect value={selectedChurchId} onValueChange={setSelectedChurchId} />
              </div>
            )}
          </div>

          {selectedEvent && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">{selectedEvent.title}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedEvent.date).toLocaleDateString()} at {selectedEvent.time}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{attendedCount}/{eventTickets.length}</p>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Attended</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ticket #</TableHead>
                      <TableHead>Status</TableHead>
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
                        <TableCell className="font-medium">
                          {ticket.user.firstName} {ticket.user.lastName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{ticket.user.email}</TableCell>
                        <TableCell className="text-xs font-mono">{ticket.ticketNumber}</TableCell>
                        <TableCell>
                          {ticket.attended && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-xs">Present</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {eventTickets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          No tickets found for this event
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {eventTickets.length > 0 && (
                  <div className="p-4 border-t">
                    <Button
                      onClick={handleSaveAttendance}
                      disabled={!selectedChurchId || createAttendanceMutation.isPending}
                      className="w-full"
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
