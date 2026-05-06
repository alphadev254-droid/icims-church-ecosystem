/**
 * ChurchPublicPage — rendered when visiting a subdomain like
 * grace-community-church.churchcentral.church
 *
 * No auth, no dashboard layout. Fetches from GET /api/p/:slug.
 */

import { useEffect, useState } from 'react';
import type { PageData, NavLink } from './church-public/types';
import { parseServiceTimes, resolveImg } from './church-public/utils';
import { Navbar }   from './church-public/Navbar';
import { Hero }     from './church-public/Hero';
import { About }    from './church-public/About';
import { Services } from './church-public/Services';
import { Events }   from './church-public/Events';
import { Give }     from './church-public/Give';
import { Contact }  from './church-public/Contact';
import { Footer }   from './church-public/Footer';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export default function ChurchPublicPage({ slug }: { slug: string }) {
  const [data, setData]         = useState<PageData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/p/${slug}`)
      .then(r => { if (!r.ok) { setNotFound(true); setLoading(false); return null; } return r.json(); })
      .then(json => { if (json?.success) setData(json.data); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#888' }}>
        Loading...
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111' }}>Page not found</h1>
        <p style={{ color: '#888', fontSize: 14 }}>This church page doesn't exist or hasn't been published yet.</p>
        <a href="https://churchcentral.church" style={{ color: '#d4a574', fontSize: 14 }}>← Back to ICIMS</a>
      </div>
    );
  }

  const { profile, ministryName, events, campaigns } = data;
  const accent       = profile.primaryColor || '#d4a574';
  const serviceTimes = parseServiceTimes(profile.serviceTimes);

  const hasAbout     = !!(profile.aboutText || profile.pastorName || profile.visionText || profile.missionText);
  const hasServices  = serviceTimes.length > 0;
  const hasContact   = !!(profile.phone || profile.email || profile.address);
  const hasEvents    = events.length > 0;
  const hasCampaigns = campaigns.length > 0;

  const logoSrc   = resolveImg(profile.logoUrl);
  const bannerSrc = resolveImg(profile.bannerUrl);
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
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
      color: '#1f2937',
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

      {/* Welcome strip */}
      <div style={{
        background: `${accent}1a`,
        borderTop: `1px solid ${accent}33`,
        borderBottom: `1px solid ${accent}33`,
        padding: '32px 24px',
        textAlign: 'center',
      }}>
        <p style={{
          fontStyle: 'italic',
          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
          color: '#374151',
          maxWidth: 680, margin: '0 auto',
          lineHeight: 1.7,
        }}>
          "{profile.tagline || 'Everyone is welcome here.'}"
        </p>
      </div>

      {hasAbout    && <About    profile={profile} pastorSrc={pastorSrc} accent={accent} />}
      {hasServices && <Services serviceTimes={serviceTimes} accent={accent} />}
      {hasCampaigns && <Give   campaigns={campaigns} accent={accent} />}
      {hasEvents   && <Events  events={events} accent={accent} />}
      {hasContact  && <Contact profile={profile} accent={accent} />}

      <Footer
        ministryName={ministryName}
        logoSrc={logoSrc}
        profile={profile}
        accent={accent}
        navLinks={navLinks}
      />
    </div>
  );
}
