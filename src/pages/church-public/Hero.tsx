import type React from 'react';
import type { ServiceTime } from './types';

interface HeroProps {
  ministryName: string;
  logoSrc: string | null;
  bannerSrc: string;
  accent: string;
  tagline?: string;
  youtubeUrl?: string;
  serviceTimes: ServiceTime[];
  hasEvents: boolean;
  hasCampaigns: boolean;
}

export function Hero({
  ministryName,
  bannerSrc,
  accent,
  tagline,
  youtubeUrl,
  serviceTimes,
  hasEvents,
  hasCampaigns,
}: HeroProps) {
  const nextService = serviceTimes[0];

  return (
    <section id="home" className="cp-hero" style={{ background: '#fff', padding: '72px 28px 88px' }}>
      <div className="cp-home-hero" style={{
        maxWidth: 1400,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.02fr) minmax(360px, 0.98fr)',
        gap: 42,
        alignItems: 'center',
      }}>
        <div>
          <p style={{
            color: accent,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            marginBottom: 20,
          }}>
            Welcome to {ministryName}
          </p>
          <h1 className="cp-hero-title" style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            color: '#101a30',
            fontSize: 'clamp(3.1rem, 7vw, 6.4rem)',
            lineHeight: 0.98,
            fontWeight: 800,
            letterSpacing: 0,
            margin: '0 0 24px',
            maxWidth: 820,
          }}>
            Rooted in faith, <span style={{ color: accent }}>growing in love.</span>
          </h1>
          <p className="cp-hero-copy" style={{
            color: '#53617a',
            fontSize: 20,
            lineHeight: 1.7,
            maxWidth: 680,
            marginBottom: 34,
          }}>
            {tagline || 'A vibrant congregation committed to worship, discipleship, and serving our community together.'}
          </p>
          <div className="cp-hero-actions" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <a href="#visit" style={primaryButton(accent)}>Plan a Visit</a>
            {hasEvents && <a href="#events" style={secondaryButton}>Upcoming Events</a>}
            {!hasEvents && hasCampaigns && <a href="#give" style={secondaryButton}>Give Online</a>}
            {youtubeUrl && <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" style={secondaryButton}>Watch Online</a>}
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{
            borderRadius: 28,
            overflow: 'hidden',
            minHeight: 520,
            background: '#111822',
            boxShadow: '0 28px 70px rgba(16,24,40,0.16)',
          }}>
            <img src={bannerSrc} alt={ministryName} style={{
              width: '100%',
              height: 520,
              objectFit: 'cover',
              display: 'block',
            }} />
          </div>
          {nextService && (
            <div className="cp-home-service-card" style={{
              position: 'absolute',
              left: 28,
              right: 28,
              bottom: -34,
              background: '#111822',
              color: '#fff',
              borderRadius: 20,
              padding: 24,
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: 18,
              alignItems: 'center',
              boxShadow: '0 22px 50px rgba(16,24,40,0.22)',
            }}>
              <div>
                <p style={{ color: accent, fontSize: 12, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Next service
                </p>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 26, margin: 0 }}>
                  {nextService.name || 'Sunday Service'}
                </h2>
              </div>
              <p style={{ color: accent, fontWeight: 800, fontSize: 18, margin: 0, whiteSpace: 'nowrap' }}>
                {nextService.day} - {nextService.time}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function primaryButton(accent: string): React.CSSProperties {
  return {
    background: accent,
    color: '#101a30',
    textDecoration: 'none',
    borderRadius: 14,
    padding: '16px 26px',
    fontWeight: 800,
    fontSize: 16,
    boxShadow: '0 16px 34px rgba(197,137,16,0.22)',
  };
}

const secondaryButton: React.CSSProperties = {
  background: '#fff',
  color: '#101a30',
  textDecoration: 'none',
  borderRadius: 14,
  padding: '15px 25px',
  fontWeight: 800,
  fontSize: 16,
  border: '1px solid #e3ded7',
};
