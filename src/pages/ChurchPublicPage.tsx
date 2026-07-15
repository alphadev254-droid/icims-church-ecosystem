import { useEffect, useState } from 'react';
import type React from 'react';
import type { NavLink, PageData } from './church-public/types';
import { parseServiceTimes, resolveImg } from './church-public/utils';
import { Navbar } from './church-public/Navbar';
import { Hero } from './church-public/Hero';
import { About } from './church-public/About';
import { Services } from './church-public/Services';
import { Ministries } from './church-public/Ministries';
import { Sermons } from './church-public/Sermons';
import { Events } from './church-public/Events';
import { Give } from './church-public/Give';
import { Visit } from './church-public/Visit';
import { Contact } from './church-public/Contact';
import { Footer } from './church-public/Footer';
import { SignInDialog } from './church-public/SignInDialog';
import { MultiGivingDialog } from '@/components/giving/MultiGivingDialog';
import { PublicQrCheckIn } from '@/components/attendance/PublicQrCheckIn';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Check, Clock, Loader2, MapPin } from 'lucide-react';
import { eventsService } from '@/services/events';
import { toast } from 'sonner';

const defaultHero = 'https://media.aircnc.co.ke/media-images/fa70812b-0345-4d35-b45b-3488def7c3e3.webp';
const defaultGold = '#d89b12';
const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

function currentHref() {
  const hash = window.location.hash || '#home';
  return hash === '#' ? '#home' : hash;
}

function ResponsiveStyles() {
  return (
    <style>{`
      .cp-page * { box-sizing: border-box; }
      .cp-page img, .cp-page iframe { max-width: 100%; }
      .cp-section-title, .cp-hero-title, .cp-page h1, .cp-page h2, .cp-page h3 {
        overflow-wrap: anywhere;
      }
      @media (min-width: 1200px) {
        .cp-hero-title { font-size: clamp(2.4rem, 4.8vw, 4.35rem) !important; }
        .cp-give-impact-title { font-size: clamp(2.2rem, 4.9vw, 4.45rem) !important; }
        .cp-section-title { font-size: clamp(1.75rem, 3.2vw, 2.55rem) !important; }
      }
      @media (max-width: 1024px) {
        .cp-card-grid { grid-template-columns: repeat(2, 1fr) !important; }
        .cp-home-hero { grid-template-columns: 1fr !important; }
        .cp-give-impact-title { max-width: 100% !important; }
        .cp-give-impact-copy { max-width: 760px !important; }
        .cp-sermon-grid { grid-template-columns: 1fr !important; }
      }
      @media (max-width: 768px) {
        .cp-navbar { padding: 0 16px !important; }
        .cp-nav-inner { height: 60px !important; }
        .cp-brand-name { font-size: 17px !important; max-width: 160px !important; }
        .cp-mobile-menu { padding: 8px 0 14px !important; }
        .cp-page section, .cp-page .cp-section { padding-left: 18px !important; padding-right: 18px !important; }
        .cp-hero { padding: 56px 18px 64px !important; }
        .cp-home-hero { grid-template-columns: 1fr !important; gap: 36px !important; }
        .cp-page-hero { padding-top: 38px !important; padding-bottom: 42px !important; }
        .cp-hero-title { font-size: clamp(2rem, 9.5vw, 2.85rem) !important; overflow-wrap: anywhere !important; line-height: 1.08 !important; }
        .cp-hero-copy { font-size: 15px !important; }
        .cp-hero-actions { flex-direction: column !important; align-items: stretch !important; }
        .cp-hero-actions a { width: 100% !important; text-align: center !important; justify-content: center !important; }
        .cp-section-title { font-size: clamp(1.65rem, 7.4vw, 2.25rem) !important; overflow-wrap: anywhere !important; line-height: 1.12 !important; }
        .cp-section-head { flex-direction: column !important; align-items: flex-start !important; }
        .cp-two-col, .cp-contact-grid, .cp-visit-grid, .cp-sermon-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
        .cp-visit-form-grid { grid-template-columns: 1fr !important; gap: 0 !important; }
        .cp-ministry-grid { grid-template-columns: 1fr !important; }
        .cp-card-grid { grid-template-columns: 1fr !important; }
        .cp-services-strip { grid-template-columns: 1fr !important; }
        .cp-service-row { grid-template-columns: 1fr !important; gap: 4px !important; }
        .cp-countdown-grid { grid-template-columns: repeat(2, 1fr) !important; }
        .cp-sermon-list-card { grid-template-columns: 1fr !important; }
        .cp-event-card-action, .cp-give-card-action { width: 100% !important; justify-content: center !important; text-align: center !important; }
        .cp-give-impact { padding-top: 50px !important; padding-bottom: 56px !important; }
        .cp-give-impact-title { font-size: clamp(2rem, 9vw, 2.7rem) !important; max-width: 100% !important; line-height: 1.12 !important; }
        .cp-give-impact-copy { font-size: 15px !important; max-width: 100% !important; }
        .cp-give-impact-stats { gap: 18px !important; display: grid !important; grid-template-columns: 1fr !important; }
        .cp-give-impact-actions { flex-direction: column !important; align-items: stretch !important; }
        .cp-give-impact-actions a { width: 100% !important; justify-content: center !important; }
        .cp-trust-strip { flex-direction: column !important; align-items: flex-start !important; }
        .cp-trust-items { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
        .cp-map { height: 240px !important; }
        .cp-footer { padding: 40px 18px 28px !important; }
        .cp-footer .cp-footer-grid {
          grid-template-columns: 1fr 1fr !important;
          gap: 26px 20px !important;
        }
        .cp-footer .cp-footer-brand {
          grid-column: 1 / -1 !important;
        }
        .cp-footer .cp-footer-explore,
        .cp-footer .cp-footer-contact {
          min-width: 0 !important;
        }
        .cp-footer .cp-footer-contact span {
          overflow-wrap: anywhere !important;
        }
        .cp-auth-dialog {
          width: calc(100% - 24px) !important;
          max-height: 92svh !important;
          grid-template-columns: 1fr !important;
          overflow-y: auto !important;
        }
        .cp-auth-side {
          width: auto !important;
          min-height: auto !important;
          padding: 28px 24px !important;
          gap: 28px !important;
          border-right: none !important;
          border-bottom: 1px solid rgba(255,255,255,0.08) !important;
        }
        .cp-auth-main { padding: 34px 24px 28px !important; }
        .cp-auth-side h2 { font-size: clamp(1.65rem, 7vw, 2.2rem) !important; }
        .cp-auth-main h3 { font-size: clamp(1.55rem, 6.6vw, 2rem) !important; }
      }
      @media (max-width: 420px) {
        .cp-navbar { padding: 0 12px !important; }
        .cp-brand-name { max-width: 132px !important; font-size: 16px !important; }
        .cp-page section, .cp-page .cp-section { padding-left: 14px !important; padding-right: 14px !important; }
        .cp-hero-title { font-size: clamp(1.85rem, 9.5vw, 2.45rem) !important; }
        .cp-section-title { font-size: clamp(1.5rem, 7.8vw, 2rem) !important; }
        .cp-give-impact-title { font-size: clamp(1.8rem, 9vw, 2.35rem) !important; }
      }
    `}</style>
  );
}

function PageHero({ eyebrow, title, copy, accent }: {
  eyebrow: string;
  title: React.ReactNode;
  copy: string;
  accent: string;
}) {
  return (
    <section style={{ background: '#121D39', padding: '48px 28px 52px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: accent, margin: '0 0 10px',
        }}>
          {eyebrow.replace('Partner With The Mission', 'Give')}
        </p>
        <h1 className="cp-section-title" style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          color: '#fff',
          fontSize: 'clamp(1.85rem, 3.8vw, 3rem)',
          lineHeight: 1.08, fontWeight: 800,
          maxWidth: 760, margin: '0 0 12px',
        }}>
          {title}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 1.65, maxWidth: 560, margin: 0 }}>
          {copy}
        </p>
      </div>
    </section>
  );
}

function getPublicDetailRoute() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts.length === 2 && (parts[0] === 'giving' || parts[0] === 'events')) {
    return { type: parts[0] as 'giving' | 'events', id: parts[1] };
  }
  if (parts.length === 2 && parts[0] === 'check-in') {
    return { type: 'check-in' as const, id: parts[1] };
  }
  return null;
}

function PublicGivingDetail({ campaign, campaigns, accent, ministryName }: {
  campaign: NonNullable<PageData['campaigns'][number]>;
  campaigns: PageData['campaigns'];
  accent: string;
  ministryName: string;
}) {
  const [giveOpen, setGiveOpen] = useState(false);

  return (
    <>
      <PageHero
        eyebrow="Give"
        title={<>{campaign.name}</>}
        copy={`Support ${ministryName} through secure online giving.`}
        accent={accent}
      />
      <section className="cp-section" style={{ background: '#fff', padding: '44px 28px 64px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 0.6fr)', gap: 24 }} className="cp-two-col">
          <article style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, boxShadow: '0 8px 30px rgba(18,29,57,0.08)' }}>
            <p style={{ margin: '0 0 10px', color: accent, textTransform: 'uppercase', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em' }}>
              {campaign.category.replace(/_/g, ' ')}
            </p>
            <h2 className="cp-section-title" style={{ fontFamily: 'Georgia, serif', color: '#121D39', fontSize: 'clamp(1.7rem, 3vw, 2.45rem)', margin: '0 0 14px', lineHeight: 1.1 }}>
              {campaign.name}
            </h2>
            <p style={{ color: '#64748b', lineHeight: 1.75, whiteSpace: 'pre-wrap', margin: 0 }}>
              {campaign.description || 'Thank you for partnering with this giving campaign.'}
            </p>
          </article>
          <aside style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, background: '#f8fafc', alignSelf: 'start' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>Currency</p>
            <p style={{ margin: '2px 0 18px', color: '#121D39', fontWeight: 800, fontSize: 22 }}>{campaign.currency}</p>
            {campaign.targetAmount ? (
              <>
                <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>Target</p>
                <p style={{ margin: '2px 0 18px', color: '#121D39', fontWeight: 800, fontSize: 22 }}>{campaign.currency} {campaign.targetAmount.toLocaleString()}</p>
              </>
            ) : null}
            <Button className="w-full" style={{ background: accent, color: '#121D39' }} onClick={() => setGiveOpen(true)}>
              Give Now
            </Button>
            <p style={{ margin: '12px 0 0', color: '#64748b', fontSize: 12, lineHeight: 1.5 }}>
              You can add other giving items before checkout.
            </p>
          </aside>
        </div>
      </section>
      <MultiGivingDialog
        open={giveOpen}
        onOpenChange={setGiveOpen}
        campaigns={campaigns}
        initialCampaignId={campaign.id}
        mode="guest"
      />
    </>
  );
}

function PublicEventDetail({ event, accent }: {
  event: NonNullable<PageData['events'][number]>;
  accent: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feesLoading, setFeesLoading] = useState(false);
  const [fees, setFees] = useState<any>(null);
  const [freeSuccess, setFreeSuccess] = useState<{ ticketNumbers: string[]; guestEmail: string } | null>(null);
  const [form, setForm] = useState({ guestName: '', guestEmail: '', guestPhone: '' });
  const eventDate = new Date(event.date);
  const eventImage = resolveImg(event.imageUrl);

  const openTicketDialog = async () => {
    setDialogOpen(true);
    if (event.isFree) return;
    setFeesLoading(true);
    try {
      setFees(await eventsService.calculateGuestTicketFees(event.id));
    } catch {
      setFees(null);
    } finally {
      setFeesLoading(false);
    }
  };

  const submitTicket = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    if (!form.guestName.trim() || !form.guestEmail.trim()) {
      toast.error('Full name and email are required');
      return;
    }
    setLoading(true);
    try {
      const result = await eventsService.purchaseGuestTicket({
        eventId: event.id,
        guestName: form.guestName.trim(),
        guestEmail: form.guestEmail.trim(),
        guestPhone: form.guestPhone.trim() || undefined,
        quantity: 1,
      });
      if (result.isFree) {
        setFreeSuccess({ ticketNumbers: result.ticketNumbers || [], guestEmail: result.guestEmail || form.guestEmail });
      } else if (result.authorization_url) {
        window.location.href = result.authorization_url;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to get ticket');
      setLoading(false);
    }
  };

  return (
    <>
      <section
        className="cp-page-hero"
        style={{
          position: 'relative',
          background: eventImage ? `linear-gradient(90deg, rgba(18,29,57,0.88), rgba(18,29,57,0.58)), url(${eventImage}) center/cover no-repeat` : '#121D39',
          padding: '76px 28px 82px',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: accent,
            margin: '0 0 10px',
          }}>
            Event
          </p>
          <h1 className="cp-section-title" style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            color: '#fff',
            fontSize: 'clamp(2rem, 4.4vw, 3.4rem)',
            lineHeight: 1.05,
            fontWeight: 800,
            maxWidth: 860,
            margin: '0 0 14px',
          }}>
            {event.title}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 15, lineHeight: 1.65, maxWidth: 620, margin: 0 }}>
            {event.location || 'Join us for this upcoming church event.'}
          </p>
        </div>
      </section>
      <section className="cp-section" style={{ background: '#fff', padding: '44px 28px 64px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 0.6fr)', gap: 24 }} className="cp-two-col">
          <article style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, boxShadow: '0 8px 30px rgba(18,29,57,0.08)' }}>
            <h2 className="cp-section-title" style={{ fontFamily: 'Georgia, serif', color: '#121D39', fontSize: 'clamp(1.7rem, 3vw, 2.45rem)', margin: '0 0 16px', lineHeight: 1.1 }}>
              {event.title}
            </h2>
            <div style={{ display: 'grid', gap: 10, color: '#475569', fontSize: 14, marginBottom: 20 }}>
              <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Calendar size={16} color={accent} /> {eventDate.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              {event.time && <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Clock size={16} color={accent} /> {event.time}</span>}
              {event.location && <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><MapPin size={16} color={accent} /> {event.location}</span>}
            </div>
            <p style={{ color: '#64748b', lineHeight: 1.75, whiteSpace: 'pre-wrap', margin: 0 }}>
              {event.description || 'More details will be shared soon.'}
            </p>
          </article>
          <aside style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, background: '#f8fafc', alignSelf: 'start' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>Admission</p>
            <p style={{ margin: '2px 0 18px', color: '#121D39', fontWeight: 800, fontSize: 22 }}>
              {!event.requiresTicket ? 'No ticket needed' : event.isFree ? 'Free' : `${event.currency} ${event.ticketPrice?.toLocaleString()}`}
            </p>
            {event.requiresTicket ? (
              <Button className="w-full" style={{ background: accent, color: '#121D39' }} onClick={openTicketDialog}>
                {event.isFree ? 'Get Free Ticket' : 'Get Ticket'}
              </Button>
            ) : (
              <p style={{ margin: 0, color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>You can attend this event without booking a ticket.</p>
            )}
          </aside>
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{event.isFree ? 'Get Your Free Ticket' : 'Get Your Ticket'}</DialogTitle></DialogHeader>
          {freeSuccess ? (
            <div className="space-y-3 text-center">
              <Check className="mx-auto h-8 w-8 text-green-600" />
              <p className="font-semibold">Ticket Confirmed</p>
              <p className="text-sm text-muted-foreground">Your ticket has been sent to {freeSuccess.guestEmail}.</p>
            </div>
          ) : (
            <form onSubmit={submitTicket} className="space-y-4">
              <div className="space-y-1"><Label>Full Name *</Label><Input value={form.guestName} onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Email *</Label><Input type="email" value={form.guestEmail} onChange={e => setForm(f => ({ ...f, guestEmail: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Phone (optional)</Label><Input value={form.guestPhone} onChange={e => setForm(f => ({ ...f, guestPhone: e.target.value }))} /></div>
              {!event.isFree && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  {feesLoading ? 'Calculating fees...' : fees ? (
                    <div className="space-y-1">
                      <div className="flex justify-between"><span>Ticket</span><span>{fees.currency} {fees.baseAmount.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Transaction cost</span><span>{fees.currency} {fees.transactionCost.toLocaleString()}</span></div>
                      <div className="flex justify-between border-t pt-1 font-semibold"><span>Total</span><span>{fees.currency} {fees.totalAmount.toLocaleString()}</span></div>
                    </div>
                  ) : `${event.currency} ${event.ticketPrice?.toLocaleString()}`}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : event.isFree ? 'Get Free Ticket' : 'Proceed to Payment'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ChurchPublicPage({ slug }: { slug: string }) {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [activeHref, setActiveHref] = useState('#home');
  const detailRoute = getPublicDetailRoute();
  const isCheckInRoute = detailRoute?.type === 'check-in';

  useEffect(() => {
    if (isCheckInRoute) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/p/${slug}`)
      .then(r => {
        if (!r.ok) {
          setNotFound(true);
          setLoading(false);
          return null;
        }
        return r.json();
      })
      .then(json => {
        if (json?.success) setData(json.data);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [slug, isCheckInRoute]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const syncHash = () => {
      setActiveHref(currentHref());
      setMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#111822', color: 'rgba(255,255,255,0.5)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: 15,
      }}>
        Loading...
      </div>
    );
  }

  if (isCheckInRoute) {
    const fallbackName = slug
      .split('-')
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Church';

    return (
      <div className="cp-page" style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#101a30',
        background: '#fff',
        overflowX: 'hidden',
      }}>
        <ResponsiveStyles />
        <PublicQrCheckIn
          token={detailRoute.id}
          accent={defaultGold}
          ministryName={data?.ministryName || fallbackName}
          onRequireSignIn={() => setSignInOpen(true)}
        />
        <SignInDialog
          open={signInOpen}
          onClose={() => setSignInOpen(false)}
          accent={defaultGold}
          ministryName={data?.ministryName || fallbackName}
          logoInitial={(data?.ministryName || fallbackName).charAt(0).toUpperCase()}
        />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', gap: 14,
        background: '#111822',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <p style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>404</p>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#fff', margin: 0 }}>Page not found</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>This church page does not exist or has not been published yet.</p>
      </div>
    );
  }

  const { profile, ministryName, events = [], campaigns = [], churches, sermons = [], ministries = [] } = data;
  const accent = profile.primaryColor || defaultGold;
  const serviceTimes = parseServiceTimes(profile.serviceTimes);
  const logoSrc = resolveImg(profile.logoUrl);
  const bannerSrc = resolveImg(profile.bannerUrl) ?? defaultHero;
  const pastorSrc = resolveImg(profile.pastorPhoto);

  const hasAbout = !!(profile.aboutText || profile.pastorName || profile.visionText || profile.missionText);
  const hasServices = serviceTimes.length > 0;
  const hasContact = !!(profile.phone || profile.email || profile.address);
  const hasEvents = events.length > 0;
  const hasCampaigns = campaigns.length > 0;
  const hasSermons = sermons.length > 0;
  const hasMinistries = ministries.length > 0;

  const navLinks: NavLink[] = [
    { label: 'Home', href: '#home', show: true },
    { label: 'About', href: '#about', show: hasAbout || hasServices },
    { label: 'Ministries', href: '#ministries', show: hasMinistries },
    { label: 'Sermons', href: '#sermons', show: hasSermons },
    { label: 'Events', href: '#events', show: hasEvents },
    { label: 'Give', href: '#give', show: hasCampaigns },
    { label: 'Visit', href: '#visit', show: true },
    { label: 'Contact', href: '#contact', show: hasContact },
  ].filter(link => link.show);

  const page = detailRoute ? detailRoute.type : (activeHref.replace('#', '') || 'home');
  const detailCampaign = detailRoute?.type === 'giving' ? campaigns.find(campaign => campaign.id === detailRoute.id) : null;
  const detailEvent = detailRoute?.type === 'events' ? events.find(event => event.id === detailRoute.id) : null;

  return (
    <div className="cp-page" style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#101a30',
      background: '#fff',
      overflowX: 'hidden',
    }}>
      <ResponsiveStyles />
      <Navbar
        ministryName={ministryName}
        logoSrc={logoSrc}
        accent={accent}
        scrolled={scrolled}
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen(open => !open)}
        onMenuClose={() => setMenuOpen(false)}
        navLinks={navLinks}
        onSignIn={() => setSignInOpen(true)}
        activeHref={activeHref}
      />

      {detailRoute?.type === 'giving' && detailCampaign && (
        <PublicGivingDetail campaign={detailCampaign} campaigns={campaigns} accent={accent} ministryName={ministryName} />
      )}

      {detailRoute?.type === 'events' && detailEvent && (
        <PublicEventDetail event={detailEvent} accent={accent} />
      )}

      {detailRoute?.type === 'check-in' && (
        <PublicQrCheckIn token={detailRoute.id} accent={accent} ministryName={ministryName} onRequireSignIn={() => setSignInOpen(true)} />
      )}

      {detailRoute && detailRoute.type !== 'check-in' && !detailCampaign && !detailEvent && (
        <PageHero eyebrow="Not Found" title={<>This public link was not found.</>} copy="It may have ended, been unpublished, or belongs to another ministry." accent={accent} />
      )}

      {!detailRoute && page === 'home' && (
        <>
          <Hero
            ministryName={ministryName}
            logoSrc={logoSrc}
            bannerSrc={bannerSrc}
            accent={accent}
            tagline={profile.tagline}
            youtubeUrl={profile.youtubeUrl}
            serviceTimes={serviceTimes}
            hasEvents={hasEvents}
            hasCampaigns={hasCampaigns}
          />
          {hasServices && <Services serviceTimes={serviceTimes} accent={accent} />}
          {hasAbout && <About profile={profile} pastorSrc={pastorSrc} accent={accent} />}
          {hasSermons && <Sermons sermons={sermons.slice(0, 3)} accent={accent} variant="home" />}
          {hasMinistries && <Ministries ministries={ministries} accent={accent} />}
          {hasEvents && <Events events={events.slice(0, 4)} accent={accent} variant="home" />}
          {hasCampaigns && <Give campaigns={campaigns.slice(0, 3)} accent={accent} />}
        </>
      )}

      {!detailRoute && page === 'about' && (
        <>
          <PageHero eyebrow="About Us" title={<>Rooted in faith, <span style={{ color: accent }}>growing in love.</span></>} copy="A Spirit-filled congregation committed to worship, discipleship, and serving our community together." accent={accent} />
          {hasAbout && <About profile={profile} pastorSrc={pastorSrc} accent={accent} />}
          {hasServices && <Services serviceTimes={serviceTimes} accent={accent} />}
        </>
      )}

      {!detailRoute && page === 'ministries' && (
        <>
          <PageHero eyebrow="Ministries" title={<>Serve with <span style={{ color: accent }}>purpose.</span></>} copy="Explore the teams, outreaches, and ministries that help our church love people well." accent={accent} />
          {hasMinistries && <Ministries ministries={ministries} accent={accent} />}
        </>
      )}

      {!detailRoute && page === 'sermons' && (
        <>
          <PageHero eyebrow="Sermons" title={<>This week at <span style={{ color: accent }}>the pulpit.</span></>} copy="Watch recent messages and keep growing through the Word wherever you are." accent={accent} />
          {hasSermons && <Sermons sermons={sermons} accent={accent} variant="page" />}
        </>
      )}

      {!detailRoute && page === 'events' && (
        <>
          <PageHero eyebrow="Events" title={<>Come and be <span style={{ color: accent }}>part of it.</span></>} copy="Conferences, worship nights, outreaches, and gatherings. There is always something happening." accent={accent} />
          {hasEvents && <Events events={events} accent={accent} variant="page" />}
        </>
      )}

      {!detailRoute && page === 'give' && (
        <>
          <PageHero eyebrow="Partner With The Mission" title={<>Your generosity <span style={{ color: accent }}>changes lives.</span></>} copy={`Every tithe and offering fuels the ministries, outreach, and mission of ${ministryName}.`} accent={accent} />
          {hasCampaigns && <Give campaigns={campaigns} accent={accent} />}
        </>
      )}

      {!detailRoute && page === 'visit' && <Visit slug={slug} ministryName={ministryName} serviceTimes={serviceTimes} accent={accent} />}

      {!detailRoute && page === 'contact' && hasContact && (
        <>
          <PageHero eyebrow="Contact" title={<>We would love to <span style={{ color: accent }}>hear from you.</span></>} copy="Reach out for prayer, questions, directions, or anything you need before visiting." accent={accent} />
          <Contact profile={profile} accent={accent} churches={churches ?? []} />
        </>
      )}

      <Footer ministryName={ministryName} logoSrc={logoSrc} profile={profile} accent={accent} navLinks={navLinks} />

      <SignInDialog
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        accent={accent}
        ministryName={ministryName}
        logoInitial={ministryName.charAt(0).toUpperCase()}
      />
    </div>
  );
}
