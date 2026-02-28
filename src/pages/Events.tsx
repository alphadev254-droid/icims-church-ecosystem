import { useEffect, useState } from 'react';
import { eventsApi } from '@/services/api';
import type { Event } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Calendar, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = () => eventsApi.getAll().then(r => { if (r.success) setEvents(r.data); });
  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const event: Event = {
      id: crypto.randomUUID(),
      title: form.get('title') as string,
      description: form.get('description') as string,
      churchId: 'c1',
      date: form.get('date') as string,
      time: form.get('time') as string,
      location: form.get('location') as string,
      type: (form.get('type') as Event['type']) || 'service',
      status: 'upcoming',
      attendeeCount: 0,
      createdBy: '1',
    };
    await eventsApi.create(event);
    toast.success('Event created');
    setDialogOpen(false);
    load();
  };

  const statusVariant = (s: string) => {
    if (s === 'upcoming') return 'default';
    if (s === 'completed') return 'secondary';
    if (s === 'cancelled') return 'destructive';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Events</h1>
          <p className="text-sm text-muted-foreground">{events.length} total events</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
              <Plus className="h-4 w-4" /> Create Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Create Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><Label>Title</Label><Input name="title" required /></div>
              <div><Label>Description</Label><Textarea name="description" rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Date</Label><Input name="date" type="date" required /></div>
                <div><Label>Time</Label><Input name="time" type="time" required /></div>
              </div>
              <div><Label>Location</Label><Input name="location" required /></div>
              <div>
                <Label>Type</Label>
                <Select name="type" defaultValue="service">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="outreach">Outreach</SelectItem>
                    <SelectItem value="fellowship">Fellowship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Create Event</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map(event => (
          <Card key={event.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <Badge variant={statusVariant(event.status)}>{event.status}</Badge>
                <Badge variant="outline" className="text-xs capitalize">{event.type}</Badge>
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-2">{event.title}</h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Calendar className="h-3 w-3" /> {event.date}</div>
                <div className="flex items-center gap-2"><Clock className="h-3 w-3" /> {event.time}</div>
                <div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {event.location}</div>
              </div>
            </CardContent>
          </Card>
        ))}
        {events.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No events yet. Create your first event!</p>
          </div>
        )}
      </div>
    </div>
  );
}
