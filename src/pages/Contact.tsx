import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Mail, Phone, MapPin, Clock, HeadphonesIcon, ShoppingCart,
  Wrench, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

const IconFacebook = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const IconX = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const IconYoutube = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12z" />
  </svg>
);
const IconLinkedin = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const departments = [
  { icon: ShoppingCart, title: 'Sales', email: 'sales@icims.org', desc: 'Pricing, demos & onboarding' },
  { icon: HeadphonesIcon, title: 'Support', email: 'support@icims.org', desc: 'Help with your existing account' },
  { icon: Wrench, title: 'Technical', email: 'tech@icims.org', desc: 'API, integrations & developer queries' },
];

const faqs = [
  { q: 'How long does onboarding take?', a: 'Most churches are fully set up within 3–5 business days. Our team guides you through every step.' },
  { q: 'Is there a free trial?', a: 'Yes — enjoy a full 30-day free trial with no credit card required.' },
  { q: 'Can I migrate existing member data?', a: 'Absolutely. We support CSV imports and can assist with data migration from most platforms.' },
  { q: 'Do you offer training?', a: 'We provide live onboarding sessions, video guides, and ongoing webinars for all plan levels.' },
];

const socials = [
  { icon: IconFacebook, label: 'Facebook', href: '#' },
  { icon: IconX, label: 'Twitter / X', href: '#' },
  { icon: IconYoutube, label: 'YouTube', href: '#' },
  { icon: IconLinkedin, label: 'LinkedIn', href: '#' },
];

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    toast.success("Message sent! We'll get back to you shortly.");
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/contact.png" alt="Contact ICIMS" className="h-full w-full object-cover object-bottom" />
          <div className="absolute inset-0 bg-primary/55" />
        </div>
        <div className="container relative z-10 py-24 md:py-36 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary-foreground mb-4">Contact Us</h1>
          <p className="text-primary-foreground/90 text-xl font-medium mb-2">A Place to Belong. A Family in Christ.</p>
          <p className="text-primary-foreground/75 max-w-2xl mx-auto">
            Have questions about ICIMS? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Main contact form + info */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-5">

            {/* Left panel: contact info + hours */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 rounded-2xl bg-primary p-8 flex flex-col gap-8"
            >
              <div>
                <h2 className="font-heading text-2xl font-bold text-primary-foreground mb-1">Get in Touch</h2>
                <p className="text-primary-foreground/60 text-sm">We usually respond within one business day.</p>
              </div>

              <div className="space-y-5">
                {[
                  { icon: Mail, label: 'Email', value: 'info@icims.org' },
                  { icon: Phone, label: 'Phone', value: '+254 700 000 000' },
                  { icon: MapPin, label: 'Address', value: 'Nairobi, Kenya' },
                ].map(c => (
                  <div key={c.label} className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary-foreground/10 flex items-center justify-center flex-shrink-0">
                      <c.icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/50 mb-0.5">{c.label}</p>
                      <p className="text-sm font-medium text-primary-foreground">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Office hours */}
              <div className="border-t border-primary-foreground/15 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-semibold text-primary-foreground">Office Hours</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { day: 'Mon – Fri', time: '8:00 AM – 6:00 PM EAT' },
                    { day: 'Saturday', time: '9:00 AM – 1:00 PM EAT' },
                    { day: 'Sunday', time: 'Closed' },
                  ].map(r => (
                    <div key={r.day} className="flex justify-between text-sm">
                      <span className="text-primary-foreground/60">{r.day}</span>
                      <span className="font-medium text-primary-foreground">{r.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right panel: form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-3 rounded-2xl bg-card border border-border p-8"
            >
              <h2 className="font-heading text-xl font-bold text-foreground mb-6">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" required placeholder="Your name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required placeholder="you@example.com" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input id="phone" type="tel" placeholder="+254 700 000 000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="church">Church / Organisation</Label>
                    <Input id="church" placeholder="Your church name" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" required placeholder="How can we help?" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" required rows={5} placeholder="Tell us more about your enquiry..." />
                </div>
                <Button type="submit" disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90 w-full h-11 text-sm font-semibold">
                  {loading ? 'Sending…' : 'Send Message'}
                </Button>
              </form>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Departments + FAQ side by side */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 items-start">

            {/* Left: Reach the Right Team */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Reach the Right Team</h2>
              <p className="text-muted-foreground text-sm mb-8">Contact the department that best fits your need.</p>
              <div className="grid gap-4">
                {departments.map((d, i) => (
                  <motion.div
                    key={d.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 rounded-xl border border-border bg-card p-5"
                  >
                    <div className="h-11 w-11 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <d.icon className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm">{d.title}</h3>
                      <p className="text-xs text-muted-foreground">{d.desc}</p>
                    </div>
                    <a href={`mailto:${d.email}`} className="text-xs text-accent hover:underline flex-shrink-0">{d.email}</a>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right: FAQ */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Frequently Asked Questions</h2>
              <p className="text-muted-foreground text-sm mb-8">Can't find what you're looking for? Send us a message above.</p>
              <div className="space-y-3">
                {faqs.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-xl border border-border bg-card overflow-hidden"
                  >
                    <button
                      className="w-full flex items-center justify-between p-4 text-left text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    >
                      {f.q}
                      {openFaq === i
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                    </button>
                    {openFaq === i && (
                      <div className="px-4 pb-4 text-sm text-muted-foreground">{f.a}</div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Social / community */}
      <section className="relative overflow-hidden py-16">
        <div className="absolute inset-0">
          <img src="/cta.png" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-primary/75" />
        </div>
        <div className="container relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary-foreground mb-2">Join Our Community</h2>
            <p className="text-primary-foreground/70 mb-8 text-sm">Follow us for updates, tips, and inspiration for your ministry.</p>
            <div className="flex justify-center gap-4">
              {socials.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="h-11 w-11 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors text-primary-foreground"
                >
                  <s.icon />
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
