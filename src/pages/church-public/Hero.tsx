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
  ministryName, bannerSrc, accent,
  tagline, youtubeUrl, serviceTimes,
}: HeroProps) {
  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex', alignItems: 'flex-end',
      background: `url(${bannerSrc}) center/cover no-repeat`,
    }}>
      {/* Dark overlay — heavier at bottom for text legibility */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.82) 100%)',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 1200, margin: '0 auto',
        padding: '0 40px 80px',
        width: '100%',
      }}>
        {/* Location label */}
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: 11, fontWeight: 400,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.65)',
          marginBottom: 20,
        }}>
          {ministryName}
        </p>

        {/* Headline — large serif */}
        <h1 style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
          fontWeight: 400,
          color: '#fff',
          lineHeight: 1.08,
          margin: '0 0 28px',
          maxWidth: 720,
          letterSpacing: '-0.01em',
        }}>
          {tagline || 'A place of hope, community, and faith.'}
        </h1>

        {/* Sub-tagline */}
        <p style={{
          fontSize: 16, color: 'rgba(255,255,255,0.70)',
          maxWidth: 480, lineHeight: 1.7,
          marginBottom: 40,
          fontWeight: 400,
        }}>
          A vibrant congregation committed to worship, discipleship, and serving our community — together, in the love of Christ.
        </p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <a href="#services" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#fff', color: '#0a0a0a',
            padding: '13px 28px',
            fontSize: 13, fontWeight: 600, letterSpacing: '0.05em',
            textDecoration: 'none',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = '#f0f0f0'}
          onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = '#fff'}
          >
            ☩ Join Us This Sunday
          </a>
          {youtubeUrl && (
            <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'transparent', color: '#fff',
              padding: '13px 28px',
              fontSize: 13, fontWeight: 600, letterSpacing: '0.05em',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.5)',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = '#fff';
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.08)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.5)';
              (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
            }}
            >
              ▷ Watch Online
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
