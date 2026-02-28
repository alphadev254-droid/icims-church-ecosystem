import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    toast.success('Message sent! We\'ll get back to you shortly.');
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div>
      <section className="py-20 bg-primary">
        <div className="container text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary-foreground mb-4">Contact Us</h1>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto">
            Have questions about ICIMS? We'd love to hear from you.
          </p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container max-w-4xl">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Get in Touch</h2>
              <div className="space-y-4">
                {[
                  { icon: Mail, label: 'Email', value: 'info@icims.org' },
                  { icon: Phone, label: 'Phone', value: '+254 700 000 000' },
                  { icon: MapPin, label: 'Address', value: 'Nairobi, Kenya' },
                ].map(c => (
                  <div key={c.label} className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <c.icon className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.label}</p>
                      <p className="text-sm text-muted-foreground">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" required placeholder="Your name" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" required placeholder="How can we help?" />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" required rows={5} placeholder="Your message..." />
              </div>
              <Button type="submit" disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90 w-full">
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
