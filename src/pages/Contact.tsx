import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Clock, HeadphonesIcon, ShoppingCart, Wrench, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { usePageMeta } from '@/hooks/usePageMeta';

const IconFacebook = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const IconX = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const IconYoutube = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12z" />
  </svg>
);

const departments = [
  { icon: ShoppingCart,   title: 'Sales',     email: 'support@churchcentral.church', desc: 'Pricing, demos and onboarding' },
  { icon: HeadphonesIcon, title: 'Support',   email: 'support@churchcentral.church', desc: 'Help with your existing account' },
  { icon: Wrench,         title: 'Technical', email: 'support@churchcentral.church', desc: 'API, integrations and developer queries' },
];

const faqs = [
  { q: 'How long does onboarding take?',      a: 'Most churches are fully set up within 3-5 business days. Our team guides you through every step.' },
  { q: 'Can I migrate existing member data?', a: 'Absolutely. We support CSV imports and can assist with data migration from most platforms.' },
  { q: 'Do you offer training?',              a: 'We provide live onboarding sessions, video guides, and ongoing webinars for all plan levels.' },
  { q: 'What countries do you support?',      a: 'ICIMS currently supports Kenya and Malawi with local payment gateways. More countries coming soon.' },
];

const inView = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4 } }),
};

export default function ContactPage() {
  usePageMeta({
    title: 'Contact Us',
    description: 'Get in touch with the ICIMS team. Reach our sales, support or technical departments.',
    canonical: 'https://churchcentral.church/contact',
    ogImage: 'https://churchcentral.church/contact.png',
  });

  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const data = {
      name:    (form.elements.namedItem('name')    as HTMLInputElement).value,
      email:   (form.elements.namedItem('email')   as HTMLInputElement).value,
      phone:   (form.elements.namedItem('phone')   as HTMLInputElement).value || undefined,
      church:  (form.elements.namedItem('church')  as HTMLInputElement).value || undefined,
      subject: (form.elements.namedItem('subject') as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    };
    try {
      const { default: apiClient } = await import('@/lib/api-client');
      await apiClient.post('/contact', data);
      toast.success("Message sent! We will get back to you within one business day.");
      form.reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-x-hidden">

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/contact.png" alt="Contact ICIMS" className="h-full w-full object-cover object-bottom" />
          <div className="absolute inset-0 bg-black/68" />
        </div>
        <div className="container relative z-10 py-28 md:py-36">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-xl">
            <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-4">Contact us</p>
            <h1 className="font-heading text-5xl md:text-6xl font-bold text-white leading-tight mb-5">
              Let us talk.
            </h1>
            <p className="text-white/65 text-lg leading-relaxed">
              Questions about pricing, onboarding, or the platform? We respond within one business day.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FORM + INFO */}
      <section className="py-24 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-5 gap-12">

            {/* Info panel */}
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-2 space-y-8">
              <div>
                <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-3">Reach us</p>
                <h2 className="font-heading text-3xl font-bold text-foreground leading-tight mb-2">We are here to help.</h2>
                <p className="text-muted-foreground text-sm">Usually respond within one business day.</p>
              </div>
              <div className="space-y-4">
                {[
                  { icon: Mail,   label: 'Email',   value: 'support@churchcentral.church' },
                  { icon: Phone,  label: 'Phone',   value: '+254 700 000 000' },
                  { icon: MapPin, label: 'Address', value: 'Nairobi, Kenya' },
                ].map(c => (
                  <div key={c.label} className="flex items-start gap-4">
                    <div className="h-9 w-9 rounded-lg border border-border bg-muted flex items-center justify-center shrink-0">
                      <c.icon className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">{c.label}</p>
                      <p className="text-sm font-medium text-foreground">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border border-border rounded-xl p-5 bg-card">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-semibold text-foreground">Office hours</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { day: 'Mon - Fri',  time: '8:00 AM - 6:00 PM EAT' },
                    { day: 'Saturday',   time: '9:00 AM - 1:00 PM EAT' },
                    { day: 'Sunday',     time: 'Closed' },
                  ].map(r => (
                    <div key={r.day} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{r.day}</span>
                      <span className="font-medium text-foreground">{r.time}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-semibold">Follow us</p>
                <div className="flex gap-2">
                  {[{ icon: IconFacebook, label: 'Facebook' }, { icon: IconX, label: 'X' }, { icon: IconYoutube, label: 'YouTube' }].map(s => (
                    <a key={s.label} href="#" aria-label={s.label}
                      className="h-9 w-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-accent/40 transition-colors">
                      <s.icon />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="lg:col-span-3 border border-border rounded-2xl p-8 bg-card">
              <h2 className="font-heading text-xl font-bold text-foreground mb-6">Send a message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    <Label htmlFor="phone">Phone <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
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
                <Button type="submit" disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90 w-full h-11 gap-2">
                  {loading ? 'Sending...' : <><span>Send message</span><ArrowRight className="h-4 w-4" /></>}
                </Button>
              </form>
            </motion.div>

          </div>
        </div>
      </section>

      {/* DEPARTMENTS + FAQ */}
      <section className="py-24 bg-foreground dark:bg-card border-t border-border">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16">

            {/* Departments */}
            <div>
              <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-3">Departments</p>
              <h2 className="font-heading text-3xl font-bold text-background dark:text-foreground leading-tight mb-2">Reach the right team.</h2>
              <p className="text-background/55 dark:text-muted-foreground text-sm mb-8">Contact the department that best fits your need.</p>
              <div className="space-y-3">
                {departments.map((d, i) => (
                  <motion.div key={d.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={inView}
                    className="flex items-center gap-4 rounded-xl border border-background/10 dark:border-border bg-background/5 dark:bg-muted/30 p-4">
                    <div className="h-10 w-10 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                      <d.icon className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-background dark:text-foreground text-sm">{d.title}</h3>
                      <p className="text-xs text-background/50 dark:text-muted-foreground">{d.desc}</p>
                    </div>
                    <a href={`mailto:${d.email}`} className="text-xs text-accent hover:underline shrink-0 hidden sm:block">{d.email}</a>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div>
              <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-3">FAQ</p>
              <h2 className="font-heading text-3xl font-bold text-background dark:text-foreground leading-tight mb-2">Common questions.</h2>
              <p className="text-background/55 dark:text-muted-foreground text-sm mb-8">Can not find what you are looking for? Send us a message above.</p>
              <div className="space-y-2">
                {faqs.map((f, i) => (
                  <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={inView}
                    className="rounded-xl border border-background/10 dark:border-border bg-background/5 dark:bg-muted/20 overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between p-4 text-left text-sm font-medium text-background dark:text-foreground hover:bg-background/5 dark:hover:bg-muted/40 transition-colors"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    >
                      <span>{f.q}</span>
                      {openFaq === i
                        ? <ChevronUp className="h-4 w-4 text-background/40 dark:text-muted-foreground shrink-0 ml-3" />
                        : <ChevronDown className="h-4 w-4 text-background/40 dark:text-muted-foreground shrink-0 ml-3" />}
                    </button>
                    {openFaq === i && (
                      <div className="px-4 pb-4 text-sm text-background/60 dark:text-muted-foreground leading-relaxed border-t border-background/10 dark:border-border pt-3">
                        {f.a}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
