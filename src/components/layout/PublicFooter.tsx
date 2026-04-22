import { Church, Mail, Phone, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';

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

export default function PublicFooter() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterLoading(true);
    try {
      const { default: apiClient } = await import('@/lib/api-client');
      await apiClient.post('/contact', {
        name: newsletterEmail,
        email: newsletterEmail,
        subject: 'Newsletter subscription',
        message: `${newsletterEmail} has subscribed to product updates and ministry insights from the ICIMS website footer.`,
      });
      toast.success('Subscribed! We will keep you updated.');
      setNewsletterEmail('');
    } catch {
      toast.error('Could not subscribe. Please try again.');
    } finally {
      setNewsletterLoading(false);
    }
  };
  return (
    <footer className="bg-foreground dark:bg-zinc-950 text-background dark:text-foreground">
      <div className="container py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">

          {/* Brand col */}
          <div className="md:col-span-4">
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <img src="/icims-logo.jpg" alt="ICIMS" className="h-12 w-12 object-cover rounded-full" />
            </Link>
            <p className="text-background/55 dark:text-foreground/50 text-sm leading-relaxed mb-6 max-w-xs">
              Integrated Church Information Management System â€” empowering ministries to grow with clarity, accountability, and confidence.
            </p>
            <div className="flex items-center gap-3">
              <a href="mailto:support@churchcentral.church" className="flex items-center gap-1.5 text-xs text-background/50 dark:text-foreground/40 hover:text-background dark:hover:text-foreground transition-colors">
                <Mail className="h-3.5 w-3.5" /> support@churchcentral.church
              </a>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <a href="tel:+254113765336" className="flex items-center gap-1.5 text-xs text-background/50 dark:text-foreground/40 hover:text-background dark:hover:text-foreground transition-colors">
                <Phone className="h-3.5 w-3.5" /> +254113765336
              </a>
            </div>
            <div className="flex gap-3 mt-5">
              {[
                { icon: IconFacebook, label: 'Facebook' },
                { icon: IconX, label: 'X / Twitter' },
              ].map(s => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="h-8 w-8 rounded-md border border-background/15 dark:border-foreground/15 flex items-center justify-center text-background/50 dark:text-foreground/40 hover:text-background dark:hover:text-foreground hover:border-background/30 dark:hover:border-foreground/30 transition-colors"
                >
                  <s.icon />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-background/40 dark:text-foreground/40 mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/features', label: 'Features' },
                { to: '/pricing',  label: 'Pricing' },
                { to: '/about',    label: 'About' },
                { to: '/contact',  label: 'Contact' },
                { to: '/register', label: 'Get started' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-background/60 dark:text-foreground/55 hover:text-background dark:hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-background/40 dark:text-foreground/40 mb-4">Modules</h4>
            <ul className="space-y-2.5 text-sm text-background/60 dark:text-foreground/55">
              <li>Membership</li>
              <li>Giving & Offerings</li>
              <li>Event Management</li>
              <li>Attendance</li>
              <li>Performance KPIs</li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-background/40 dark:text-foreground/40 mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm text-background/60 dark:text-foreground/55">
              <li>Documentation</li>
              <li>Help Center</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-background/40 dark:text-foreground/40 mb-4">Stay updated</h4>
            <p className="text-xs text-background/50 dark:text-foreground/45 mb-3 leading-relaxed">
              Get product updates and ministry insights.
            </p>
            <form onSubmit={handleNewsletter} className="flex gap-2">
              <Input
                type="email"
                required
                placeholder="your@email.com"
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                className="h-8 text-xs bg-background/10 dark:bg-foreground/5 border-background/20 dark:border-foreground/15 text-background dark:text-foreground placeholder:text-background/30 dark:placeholder:text-foreground/30 focus-visible:ring-accent"
              />
              <Button type="submit" size="sm" disabled={newsletterLoading} className="h-8 w-8 p-0 bg-accent text-accent-foreground hover:bg-accent/90 shrink-0">
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-background/10 dark:border-foreground/10">
        <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-background/40 dark:text-foreground/35">
          <span>&copy; {new Date().getFullYear()} ICIMS. All rights reserved.</span>
          <span>Built for ministries across Africa and beyond.</span>
        </div>
      </div>
    </footer>
  );
}
