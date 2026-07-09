/**
 * ChurchPublicPage — rendered when visiting a subdomain like
 * grace-community-church.churchcentral.church
 */

import { useEffect, useState } from 'react';
import type { PageData, NavLink } from './church-public/types';
import { parseServiceTimes, resolveImg } from './church-public/utils';
import { Navbar }        from './church-public/Navbar';
import { Hero }          from './church-public/Hero';
import { About }         from './church-public/About';
import { Services }      from './church-public/Services';
import { Ministries }    from './church-public/Ministries';
import { Sermons }       from './church-public/Sermons';
import { Events }        from './church-public/Events';
import { Give }          from './church-public/Give';
import { Visit }         from './church-public/Visit';
import { Contact }       from './church-public/Contact';
import { Footer }        from './church-public/Footer';
import { SignInDialog }  from './church-public/SignInDialog';

const defaultHero = 'https://media.aircnc.co.ke/media-images/fa70812b-0345-4d35-b45b-3488def7c3e3.webp';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

function ResponsiveStyles() {
  return (
    <style>{`
      .cp-page * { box-sizing: border-box; }
      @media (max-width: 768px) {
        .cp-navbar { padding: 0 16px !important; }
        .cp-nav-inner { height: 64px !important; }
        .cp-brand-name {
          max-width: 190px !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }
        .cp-mobile-menu { padding: 12px 20px 20px !important; }
        .cp-hero { min-height: 92svh !important; background-position: center center !important; }
        .cp-hero-inner { padding: 0 20px 52px !important; }
        .cp-hero-title {
          font-size: clamp(2.15rem, 12vw, 3.25rem) !important;
          max-width: 100% !important;
          line-height: 1.08 !important;
          overflow-wrap: anywhere !important;
        }
        .cp-hero-copy {
          font-size: 14px !important;
          line-height: 1.65 !important;
          max-width: 100% !important;
          margin-bottom: 28px !important;
        }
        .cp-hero-actions { flex-direction: column !important; align-items: stretch !important; }
        .cp-hero-actions a { width: 100% !important; justify-content: center !important; padding: 13px 18px !important; }
        .cp-section { padding: 64px 20px !important; }
        .cp-section-title { font-size: clamp(1.9rem, 10vw, 2.45rem) !important; }
        .cp-two-col, .cp-contact-grid, .cp-visit-grid, .cp-sermon-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
        .cp-visit-form-grid { grid-template-columns: 1fr !important; gap: 0 !important; }
        .cp-sermon-grid a { grid-template-columns: 1fr !important; }
        .cp-ministry-grid { grid-template-columns: 1fr !important; }
        .cp-card-grid { grid-template-columns: 1fr !important; gap: 1px !important; }
        .cp-services-strip { display: grid !important; grid-template-columns: 1fr !important; overflow: visible !important; }
        .cp-service-card { min-width: 0 !important; padding: 28px 24px !important; }
        .cp-map { height: 260px !important; }
        .cp-scripture { padding: 72px 20px !important; }
        .cp-footer {
          padding: 28px 20px !important;
          flex-direction: column !important;
          align-items: flex-start !important;
        }
        .cp-footer p { max-width: 100% !important; line-height: 1.6 !important; }
        .cp-auth-dialog {
          width: calc(100% - 24px) !important;
          max-height: 92svh !important;
          flex-direction: column !important;
          overflow-y: auto !important;
        }
        .cp-auth-side {
          width: auto !important;
          min-height: auto !important;
          padding: 28px 24px !important;
          gap: 28px !important;
        }
        .cp-auth-side h2 { font-size: 28px !important; }
        .cp-auth-main { padding: 34px 24px 28px !important; }
        .cp-auth-main h3 { font-size: 24px !important; margin-bottom: 28px !important; }
      }
      @media (max-width: 420px) {
        .cp-brand-name { max-width: 150px !important; }
        .cp-section { padding: 56px 16px !important; }
        .cp-hero-inner { padding-left: 16px !important; padding-right: 16px !important; }
      }
    `}</style>
  );
}

// Scripture break — full-width dark image with a quote
function ScriptureBreak({ bannerSrc, accent }: { bannerSrc: string; accent: string }) {
  return (
    <div className="cp-scripture" style={{
      position: 'relative',
      background: `url(${bannerSrc}) center/cover no-repeat`,
      padding: '100px 40px',
      textAlign: 'center',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.72)',
      }} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto' }}>
        <p style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
          fontWeight: 400, fontStyle: 'italic',
          color: 'rgba(255,255,255,0.88)',
          lineHeight: 1.65, marginBottom: 20,
        }}>
          "Not forsaking the assembling of ourselves together — but exhorting one another."
        </p>
        <p style={{
          fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.4)',
        }}>— Hebrews 10:25</p>
      </div>
    </div>
  );
}

export default function ChurchPublicPage({ slug }: { slug: string }) {
  const [data, setData]         = useState<PageData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/p/${slug}`)
      .then(r => { if (!r.ok) { setNotFound(true); setLoading(false); return null; } return r.json(); })
      .then(json => { if (json?.success) setData(json.data); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', fontFamily: 'Georgia, serif', color: '#888',
        background: '#0a0a0a',
      }}>
        <p style={{ letterSpacing: '0.15em', fontSize: 13, textTransform: 'uppercase' }}>Loading…</p>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
        fontFamily: 'Georgia, serif', gap: 16, background: '#faf9f7',
      }}>
        <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#aaa' }}>404</p>
        <h1 style={{ fontSize: 28, fontWeight: 400, color: '#0a0a0a' }}>Page not found</h1>
        <p style={{ fontSize: 14, color: '#888' }}>This church page doesn't exist or hasn't been published yet.</p>
        <a href="https://churchcentral.church" style={{ fontSize: 12, color: '#555', letterSpacing: '0.1em' }}>
          ← Back to ICIMS
        </a>
      </div>
    );
  }

  const { profile, ministryName, events = [], campaigns = [], churches, sermons = [], ministries = [] } = data;
  const accent       = profile.primaryColor || '#8b6f47';
  const serviceTimes = parseServiceTimes(profile.serviceTimes);

  const hasAbout     = !!(profile.aboutText || profile.pastorName || profile.visionText || profile.missionText);
  const hasServices  = serviceTimes.length > 0;
  const hasContact   = !!(profile.phone || profile.email || profile.address);
  const hasEvents    = events.length > 0;
  const hasCampaigns = campaigns.length > 0;
  const hasSermons   = sermons.length > 0;
  const hasMinistries = ministries.length > 0;

  const logoSrc   = resolveImg(profile.logoUrl);
  const bannerSrc = resolveImg(profile.bannerUrl) ?? defaultHero;
  const pastorSrc = resolveImg(profile.pastorPhoto);

  const navLinks: NavLink[] = [
    { label: 'About',    href: '#about',    show: hasAbout },
    { label: 'Services', href: '#services', show: hasServices },
    { label: 'Ministries', href: '#ministries', show: hasMinistries },
    { label: 'Sermons',  href: '#sermons',  show: hasSermons },
    { label: 'Give',     href: '#give',     show: hasCampaigns },
    { label: 'Events',   href: '#events',   show: hasEvents },
    { label: 'Visit',    href: '#visit',    show: true },
    { label: 'Contact',  href: '#contact',  show: hasContact },
  ].filter(l => l.show);

  return (
    <div className="cp-page" style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#0a0a0a',
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
        onMenuToggle={() => setMenuOpen(o => !o)}
        onMenuClose={() => setMenuOpen(false)}
        navLinks={navLinks}
        onSignIn={() => setSignInOpen(true)}
      />

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

      {hasAbout    && <About    profile={profile} pastorSrc={pastorSrc} accent={accent} />}
      {hasServices && <Services serviceTimes={serviceTimes} accent={accent} />}
      {hasMinistries && <Ministries ministries={ministries} accent={accent} />}
      {hasSermons && <Sermons sermons={sermons} accent={accent} />}

      {/* Scripture break between services and giving */}
      {(hasServices || hasAbout) && (hasCampaigns || hasEvents) && (
        <ScriptureBreak bannerSrc={bannerSrc} accent={accent} />
      )}

      {hasCampaigns && <Give    campaigns={campaigns} accent={accent} />}
      {hasEvents    && <Events  events={events} accent={accent} />}
      <Visit slug={slug} ministryName={ministryName} serviceTimes={serviceTimes} accent={accent} />
      {hasContact   && <Contact profile={profile} accent={accent} churches={churches ?? []} />}

      <Footer
        ministryName={ministryName}
        logoSrc={logoSrc}
        profile={profile}
        accent={accent}
        navLinks={navLinks}
      />

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
