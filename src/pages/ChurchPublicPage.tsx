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
import { Events }        from './church-public/Events';
import { Give }          from './church-public/Give';
import { Contact }       from './church-public/Contact';
import { Footer }        from './church-public/Footer';
import { SignInDialog }  from './church-public/SignInDialog';
import defaultHero from 'https://media.aircnc.co.ke/media-images/fa70812b-0345-4d35-b45b-3488def7c3e3.webp';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

// Scripture break — full-width dark image with a quote
function ScriptureBreak({ bannerSrc, accent }: { bannerSrc: string; accent: string }) {
  return (
    <div style={{
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

  const { profile, ministryName, events, campaigns, churches } = data;
  const accent       = profile.primaryColor || '#8b6f47';
  const serviceTimes = parseServiceTimes(profile.serviceTimes);

  const hasAbout     = !!(profile.aboutText || profile.pastorName || profile.visionText || profile.missionText);
  const hasServices  = serviceTimes.length > 0;
  const hasContact   = !!(profile.phone || profile.email || profile.address);
  const hasEvents    = events.length > 0;
  const hasCampaigns = campaigns.length > 0;

  const logoSrc   = resolveImg(profile.logoUrl);
  const bannerSrc = resolveImg(profile.bannerUrl) ?? defaultHero;
  const pastorSrc = resolveImg(profile.pastorPhoto);

  const navLinks: NavLink[] = [
    { label: 'About',    href: '#about',    show: hasAbout },
    { label: 'Services', href: '#services', show: hasServices },
    { label: 'Give',     href: '#give',     show: hasCampaigns },
    { label: 'Events',   href: '#events',   show: hasEvents },
    { label: 'Contact',  href: '#contact',  show: hasContact },
  ].filter(l => l.show);

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#0a0a0a',
      background: '#fff',
      overflowX: 'hidden',
    }}>
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

      {/* Scripture break between services and giving */}
      {(hasServices || hasAbout) && (hasCampaigns || hasEvents) && (
        <ScriptureBreak bannerSrc={bannerSrc} accent={accent} />
      )}

      {hasCampaigns && <Give    campaigns={campaigns} accent={accent} />}
      {hasEvents    && <Events  events={events} accent={accent} />}
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
