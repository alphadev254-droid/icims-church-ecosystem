import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Calendar, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';

interface BookDemoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIME_SLOTS = [
  '8:00 AM – 9:00 AM EAT',
  '9:00 AM – 10:00 AM EAT',
  '10:00 AM – 11:00 AM EAT',
  '11:00 AM – 12:00 PM EAT',
  '2:00 PM – 3:00 PM EAT',
  '3:00 PM – 4:00 PM EAT',
  '4:00 PM – 5:00 PM EAT',
];

const MEMBER_RANGES = [
  'Under 50',
  '50 – 200',
  '200 – 500',
  '500 – 1,000',
  '1,000 – 5,000',
  '5,000+',
];

export function BookDemoDialog({ open, onOpenChange }: BookDemoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [church, setChurch] = useState('');
  const [country, setCountry] = useState('');
  const [memberCount, setMemberCount] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [message, setMessage] = useState('');

  const reset = () => {
    setName(''); setEmail(''); setPhone(''); setChurch('');
    setCountry(''); setMemberCount(''); setPreferredDate('');
    setPreferredTime(''); setMessage(''); setDone(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !church || !country) return;
    setLoading(true);
    try {
      await apiClient.post('/contact/demo', {
        name, email, phone, church, country,
        memberCount: memberCount || undefined,
        preferredDate: preferredDate || undefined,
        preferredTime: preferredTime || undefined,
        message: message || undefined,
      });
      setDone(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Min date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-accent" />
            Book a Demo
          </DialogTitle>
        </DialogHeader>

        {done ? (
          // ── Success state ──
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-lg">Demo request submitted!</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                We'll reach out to <strong>{email}</strong> within one business day to confirm your session.
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 border px-4 py-3 text-sm text-left w-full space-y-1">
              <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-2">What happens next</p>
              {[
                'Our team reviews your request',
                'We send you a calendar invite with a meeting link',
                'You get a 45-min live walkthrough of ICIMS',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="h-5 w-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">{i + 1}</span>
                  <span className="text-sm text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => handleClose(false)}>
              Close
            </Button>
          </div>
        ) : (
          // ── Form ──
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Full name <span className="text-destructive">*</span></Label>
                <Input placeholder="James Banda" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input type="email" placeholder="you@church.org" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone <span className="text-destructive">*</span></Label>
                <Input type="tel" placeholder="+254 700 000 000" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Country <span className="text-destructive">*</span></Label>
                <Select value={country} onValueChange={setCountry} required>
                  <SelectTrigger className={!country ? 'text-muted-foreground' : ''}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kenya">Kenya</SelectItem>
                    <SelectItem value="Malawi">Malawi</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Church / Organisation <span className="text-destructive">*</span></Label>
              <Input placeholder="Grace Community Church" value={church} onChange={e => setChurch(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label>Approximate membership size <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
              <Select value={memberCount} onValueChange={setMemberCount}>
                <SelectTrigger className={!memberCount ? 'text-muted-foreground' : ''}>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  {MEMBER_RANGES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Preferred date <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                <Input type="date" min={minDate} value={preferredDate} onChange={e => setPreferredDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Preferred time <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                <Select value={preferredTime} onValueChange={setPreferredTime}>
                  <SelectTrigger className={!preferredTime ? 'text-muted-foreground' : ''}>
                    <SelectValue placeholder="Select slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Anything specific you'd like to see? <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
              <Textarea
                rows={3}
                placeholder="e.g. We have 3 branches and need to track giving across all of them..."
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !name || !email || !phone || !church || !country}
              className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
            >
              {loading ? 'Submitting...' : <><span>Book my demo</span><ArrowRight className="h-4 w-4" /></>}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              We'll confirm within one business day. No commitment required.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
