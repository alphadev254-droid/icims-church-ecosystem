import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, MapPin, Clock, Users, Share2, Copy, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { eventsService } from '@/services/events';

export default function PublicEventPage() {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ guestName: '', guestEmail: '', guestPhone: '' });
  const [fees, setFees] = useState<{ currency: string; baseAmount: number; convenienceFee: number; transactionCost: number; totalAmount: number } | null>(null);
  const [feesLoading, setFeesLoading] = useState(false);
  const [freeSuccess, setFreeSuccess] = useState<{ ticketNumbers: string[]; guestEmail: string } | null>(null);

  const openDialog = async () => {
    setDialogOpen(true);
    if (event?.isFree) return; // no fee fetch needed for free events
    setFeesLoading(true);
    try {
      const result = await eventsService.calculateGuestTicketFees(id!);
      setFees(result);
    } catch {
      // fallback — show base price only
    } finally {
      setFeesLoading(false);
    }
  };

  const { data: event, isLoading } = useQuery({
    queryKey: ['public-event', id],
    queryFn: () => eventsService.getPublicEvent(id!),
    enabled: !!id,
  });

  const eventUrl = window.location.href;

  const copyLink = () => {
    navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    toast.success('Event link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Join our church event: ${event?.title}\n${eventUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareFacebook = () => {
    const url = encodeURIComponent(eventUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guestName.trim() || !form.guestEmail.trim()) {
      toast.error('Full name and email are required');
      return;
    }
    setLoading(true);
    try {
      const result = await eventsService.purchaseGuestTicket({
        eventId: id!,
        guestName: form.guestName.trim(),
        guestEmail: form.guestEmail.trim(),
        guestPhone: form.guestPhone.trim() || undefined,
        quantity: 1,
      });
      if (result.isFree) {
        setFreeSuccess({ ticketNumbers: result.ticketNumbers!, guestEmail: result.guestEmail! });
      } else {
        window.location.href = result.authorization_url!;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to get ticket');
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
          <p className="text-muted-foreground">This event may have been removed or the link is invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-4 sm:py-6">
        <div className="container max-w-4xl px-4">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">{event.title}</h1>
          <p className="text-sm text-primary-foreground/80 mt-1">{event.church?.name}</p>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl px-4 py-6 sm:py-8 space-y-6">
        {/* Event Image */}
        {event.imageUrl && (
          <div className="rounded-lg overflow-hidden">
            <img
              src={`${import.meta.env.VITE_STATIC_URL}${event.imageUrl}`}
              alt={event.title}
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {/* Event Details */}
        <Card>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <p className="text-sm sm:text-base font-medium">Date & Time</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {new Date(event.date).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                {event.time && (
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-4 w-4" />
                    {event.time}
                  </p>
                )}
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="text-sm sm:text-base font-medium">Location</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{event.location}</p>
                </div>
              </div>
            )}

            {event.maxAttendees && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="text-sm sm:text-base font-medium">Capacity</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {event.ticketsSold || 0} / {event.maxAttendees} attendees
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        {event.description && (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-sm sm:text-base font-semibold mb-3">About This Event</h2>
              <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {event.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Share Buttons */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share This Event
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button onClick={copyLink} variant="outline" className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button onClick={shareWhatsApp} variant="outline" className="gap-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                WhatsApp
              </Button>
              <Button onClick={shareFacebook} variant="outline" className="gap-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Get Tickets */}
        {event.requiresTicket && event.allowPublicTicketing && (event.isFree || (event.ticketPrice && event.ticketPrice > 0)) && (
          <Card className="bg-accent/10 border-accent">
            <CardContent className="p-4 sm:p-6 text-center">
              {event.isFree ? (
                <p className="text-base sm:text-lg font-semibold mb-2 text-green-600">Free Event</p>
              ) : (
                <p className="text-base sm:text-lg font-semibold mb-2">
                  Ticket Price: {event.currency} {event.ticketPrice}
                </p>
              )}
              {event.totalTickets && (
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                  {event.totalTickets - (event.ticketsSold || 0)} tickets remaining
                </p>
              )}
              <Button size="lg" className="w-full sm:w-auto" onClick={openDialog}>
                {event.isFree ? 'Get Free Ticket' : 'Get Tickets'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Guest Purchase Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{event?.isFree ? 'Get Your Free Ticket' : 'Get Your Ticket'}</DialogTitle>
            <p className="text-sm text-muted-foreground pt-1">
              {event?.isFree
                ? 'Fill in your details and your free ticket will be sent to your email instantly.'
                : 'Fill in your details to proceed to payment. Your ticket will be sent to your email upon successful payment.'}
            </p>
          </DialogHeader>

          {freeSuccess ? (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg">Ticket Confirmed!</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Your free ticket has been sent to <strong>{freeSuccess.guestEmail}</strong>. Check your inbox.
                </p>
                <div className="w-full bg-muted rounded-md p-3 space-y-1">
                  {freeSuccess.ticketNumbers.map(t => (
                    <p key={t} className="text-xs font-mono text-center">{t}</p>
                  ))}
                </div>
              </div>
            </div>
          ) : (
          <form onSubmit={handlePurchase} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="guestName">Full Name *</Label>
              <Input
                id="guestName"
                placeholder="John Doe"
                value={form.guestName}
                onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="guestEmail">Email Address *</Label>
              <Input
                id="guestEmail"
                type="email"
                placeholder="john@example.com"
                value={form.guestEmail}
                onChange={e => setForm(f => ({ ...f, guestEmail: e.target.value }))}
                required
              />
              <p className="text-xs text-muted-foreground">Your ticket will be sent to this email</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="guestPhone">Phone Number (optional)</Label>
              <Input
                id="guestPhone"
                type="tel"
                placeholder="+265 999 000 000"
                value={form.guestPhone}
                onChange={e => setForm(f => ({ ...f, guestPhone: e.target.value }))}
              />
            </div>
            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
              {event?.isFree ? (
                <div className="flex justify-between font-semibold">
                  <span>Ticket price</span>
                  <span className="text-green-600">Free</span>
                </div>
              ) : feesLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-muted-foreground">Calculating fees...</span>
                </div>
              ) : fees ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ticket price</span>
                    <span>{fees.currency} {fees.baseAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction cost</span>
                    <span>{fees.currency} {fees.transactionCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                    <span>Total</span>
                    <span>{fees.currency} {fees.totalAmount.toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ticket price</span>
                  <span>{event.currency} {event.ticketPrice}</span>
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing...</> : event?.isFree ? 'Get Free Ticket' : 'Proceed to Payment'}
            </Button>
          </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
