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

const defaultHero = 'https://media.aircnc.co.ke/media-images/fa70812b-0345-4d35-b45b-3488def7c3e3.webp';
const defaultGold = '#FFC638';
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
        .cp-hero-title { font-size: clamp(2.4rem, 12vw, 3.6rem) !important; overflow-wrap: anywhere !important; }
        .cp-hero-copy { font-size: 15px !important; }
        .cp-hero-actions { flex-direction: column !important; align-items: stretch !important; }
        .cp-hero-actions a { width: 100% !important; text-align: center !important; justify-content: center !important; }
        .cp-section-title { font-size: clamp(1.9rem, 9vw, 2.8rem) !important; overflow-wrap: anywhere !important; }
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
        .cp-give-impact-title { font-size: clamp(2.15rem, 12vw, 3.25rem) !important; max-width: 100% !important; }
        .cp-give-impact-copy { font-size: 15px !important; max-width: 100% !important; }
        .cp-give-impact-stats { gap: 18px !important; display: grid !important; grid-template-columns: 1fr !important; }
        .cp-give-impact-actions { flex-direction: column !important; align-items: stretch !important; }
        .cp-give-impact-actions a { width: 100% !important; justify-content: center !important; }
        .cp-trust-strip { flex-direction: column !important; align-items: flex-start !important; }
        .cp-trust-items { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
        .cp-map { height: 240px !important; }
        .cp-footer { padding: 40px 18px 28px !important; }
        .cp-footer .cp-contact-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        .cp-auth-dialog {
          width: calc(100% - 24px) !important;
          max-height: 92svh !important;
          flex-direction: column !important;
          overflow-y: auto !important;
        }
        .cp-auth-side { width: auto !important; min-height: auto !important; padding: 28px 24px !important; gap: 28px !important; }
        .cp-auth-main { padding: 34px 24px 28px !important; }
      }
      @media (max-width: 420px) {
        .cp-navbar { padding: 0 12px !important; }
        .cp-brand-name { max-width: 132px !important; font-size: 16px !important; }
        .cp-page section, .cp-page .cp-section { padding-left: 14px !important; padding-right: 14px !important; }
        .cp-hero-title { font-size: clamp(2.05rem, 13vw, 3rem) !important; }
        .cp-section-title { font-size: clamp(1.75rem, 10vw, 2.45rem) !important; }
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
          fontSize: 'clamp(2rem, 4.5vw, 3.4rem)',
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

export default function ChurchPublicPage({ slug }: { slug: string }) {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [activeHref, setActiveHref] = useState('#home');

  useEffect(() => {
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
  }, [slug]);

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

  const page = activeHref.replace('#', '') || 'home';

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

      {page === 'home' && (
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

      {page === 'about' && (
        <>
          <PageHero eyebrow="About Us" title={<>Rooted in faith, <span style={{ color: accent }}>growing in love.</span></>} copy="A Spirit-filled congregation committed to worship, discipleship, and serving our community together." accent={accent} />
          {hasAbout && <About profile={profile} pastorSrc={pastorSrc} accent={accent} />}
          {hasServices && <Services serviceTimes={serviceTimes} accent={accent} />}
        </>
      )}

      {page === 'ministries' && (
        <>
          <PageHero eyebrow="Ministries" title={<>Serve with <span style={{ color: accent }}>purpose.</span></>} copy="Explore the teams, outreaches, and ministries that help our church love people well." accent={accent} />
          {hasMinistries && <Ministries ministries={ministries} accent={accent} />}
        </>
      )}

      {page === 'sermons' && (
        <>
          <PageHero eyebrow="Sermons" title={<>This week at <span style={{ color: accent }}>the pulpit.</span></>} copy="Watch recent messages and keep growing through the Word wherever you are." accent={accent} />
          {hasSermons && <Sermons sermons={sermons} accent={accent} variant="page" />}
        </>
      )}

      {page === 'events' && (
        <>
          <PageHero eyebrow="Events" title={<>Come and be <span style={{ color: accent }}>part of it.</span></>} copy="Conferences, worship nights, outreaches, and gatherings. There is always something happening." accent={accent} />
          {hasEvents && <Events events={events} accent={accent} variant="page" />}
        </>
      )}

      {page === 'give' && (
        <>
          <PageHero eyebrow="Partner With The Mission" title={<>Your generosity <span style={{ color: accent }}>changes lives.</span></>} copy={`Every tithe and offering fuels the ministries, outreach, and mission of ${ministryName}.`} accent={accent} />
          {hasCampaigns && <Give campaigns={campaigns} accent={accent} />}
        </>
      )}

      {page === 'visit' && <Visit slug={slug} ministryName={ministryName} serviceTimes={serviceTimes} accent={accent} />}

      {page === 'contact' && hasContact && (
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
