import { Calendar, ExternalLink } from 'lucide-react';
import type { ServiceTime } from './types';

interface HeroProps {
  ministryName: string;
  logoSrc: string | null;
  bannerSrc: string | null;
  accent: string;
  tagline?: string;
  youtubeUrl?: string;
  serviceTimes: ServiceTime[];
  hasEvents: boolean;
  hasCampaigns: boolean;
}

export function Hero({
  ministryName, logoSrc, bannerSrc, accent,
  tagline, youtubeUrl, serviceTimes, hasEvents, hasCampaigns,
}: HeroProps) {
  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: bannerSrc
        ? `url(${bannerSrc}) center/cover no-repeat`
        : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    }}>
      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.65) 100%)',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 700, margin: '0 auto',
        padding: '120px 24px 80px',
        textAlign: 'center', width: '100%',
      }}>
        {/* Logo */}
        {logoSrc ? (
          <img src={logoSrc} alt={ministryName} style={{
            height: 96, width: 96, borderRadius: '50%', objectFit: 'cover',
            border: '4px solid rgba(255,255,255,0.35)',
            display: 'block', margin: '0 auto 24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }} />
        ) : (
          <div style={{
            height: 96, width: 96, borderRadius: '50%',
            background: `${accent}44`, border: `4px solid ${accent}88`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: 40,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>⛪</div>
        )}

        {/* Name */}
        <h1 style={{
          fontSize: 'clamp(2.2rem, 6vw, 4rem)',
          fontWeight: 800, color: '#fff',
          lineHeight: 1.1, margin: '0 0 16px',
          textShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }}>
          {ministryName}
        </h1>

        {/* Tagline */}
        {tagline && (
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            color: 'rgba(255,255,255,0.80)',
            maxWidth: 520, margin: '0 auto 36px',
            lineHeight: 1.65,
          }}>
            {tagline}
          </p>
        )}

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 36 }}>
          <a href="#services" style={{
            background: accent, color: '#fff',
            padding: '14px 28px', borderRadius: 9999,
            fontWeight: 700, fontSize: 15, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            boxShadow: `0 4px 20px ${accent}66`,
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 8px 28px ${accent}88`;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 4px 20px ${accent}66`;
          }}
          >
            <Calendar size={17} /> Join Us This Sunday
          </a>
          {youtubeUrl && (
            <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" style={{
              background: 'transparent', color: '#fff',
              padding: '14px 28px', borderRadius: 9999,
              fontWeight: 700, fontSize: 15, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              border: '2px solid rgba(255,255,255,0.55)',
              transition: 'background 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.12)';
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.8)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.55)';
            }}
            >
              <ExternalLink size={17} /> Watch Online
            </a>
          )}
        </div>

        {/* Service time pills */}
        {serviceTimes.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {serviceTimes.map((s, i) => (
              <span key={i} style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#fff', fontSize: 12, fontWeight: 600,
                padding: '5px 14px', borderRadius: 9999,
              }}>
                {s.day} {s.time}{s.location ? ` · ${s.location}` : ''}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
