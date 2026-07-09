import { Clock, MapPin, Play } from 'lucide-react';
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
}: HeroProps) {
  const nextService = serviceTimes[0];
  const headline = tagline || 'A place of hope, community & faith.';

  return (
    <section id="home" className="cp-hero" style={{
      minHeight: 690,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      background: `linear-gradient(90deg, rgba(12,18,35,0.92) 0%, rgba(12,18,35,0.74) 44%, rgba(12,18,35,0.60) 100%), url(${bannerSrc}) center/cover no-repeat`,
      padding: '92px 28px',
    }}>
      <div className="cp-home-hero" style={{
        maxWidth: 1400,
        width: '100%',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.05fr) minmax(360px, 0.95fr)',
        gap: 54,
        alignItems: 'center',
      }}>
        <div>
          <p style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: accent,
            border: `1px solid ${hexToRgba(accent, 0.45)}`,
            borderRadius: 999,
            padding: '7px 12px',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            marginBottom: 26,
          }}>
            {ministryName}
          </p>
          <h1 className="cp-hero-title" style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            color: '#fff',
            fontSize: 'clamp(3.5rem, 7vw, 6.75rem)',
            lineHeight: 0.98,
            fontWeight: 800,
            margin: '0 0 24px',
            maxWidth: 820,
          }}>
            {splitHeadline(headline, accent)}
          </h1>
          <p className="cp-hero-copy" style={{
            color: 'rgba(255,255,255,0.78)',
            fontSize: 18,
            lineHeight: 1.75,
            maxWidth: 640,
            marginBottom: 34,
          }}>
            A Spirit-filled congregation committed to worship, discipleship, and serving our community together, in the love of Christ.
          </p>
          <div className="cp-hero-actions" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <a href="#visit" style={primaryButton(accent)}>Plan Your Visit</a>
            {youtubeUrl && (
              <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" style={secondaryButton}>
                <Play size={16} /> Watch Latest Sermon
              </a>
            )}
          </div>
        </div>

        {nextService && (
          <div className="cp-home-service-card" style={{
            border: `1px solid ${hexToRgba(accent, 0.34)}`,
            borderRadius: 22,
            background: 'rgba(17,24,34,0.62)',
            backdropFilter: 'blur(8px)',
            padding: 24,
            boxShadow: '0 28px 70px rgba(0,0,0,0.22)',
          }}>
            <p style={{
              color: accent,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              margin: '0 0 18px',
            }}>
              Next: {nextService.name || 'Service'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 22 }}>
              {[
                ['00', 'Days'],
                ['21', 'Hours'],
                ['37', 'Mins'],
                ['51', 'Secs'],
              ].map(([value, label]) => (
                <div key={label} style={{
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 14,
                  padding: '14px 8px',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.03)',
                }}>
                  <p style={{ color: accent, fontSize: 26, fontWeight: 900, margin: 0 }}>{value}</p>
                  <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', margin: '4px 0 0' }}>{label}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, color: 'rgba(255,255,255,0.72)', fontSize: 14, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={16} color={accent} /> {nextService.location || 'Main Auditorium'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color={accent} /> {nextService.day} {nextService.time}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function splitHeadline(text: string, accent: string) {
  const normalized = text.trim().replace(/\.$/, '');
  const words = normalized.split(' ');
  if (words.length < 3) return normalized;
  const last = words.slice(-2).join(' ');
  const first = words.slice(0, -2).join(' ');
  return (
    <>
      {first} <span style={{ color: accent }}>{last}.</span>
    </>
  );
}

function primaryButton(accent: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: accent,
    color: '#101a30',
    textDecoration: 'none',
    borderRadius: 12,
    padding: '16px 26px',
    fontWeight: 800,
    fontSize: 16,
    boxShadow: '0 16px 34px rgba(197,137,16,0.24)',
  };
}

const secondaryButton: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  textDecoration: 'none',
  borderRadius: 12,
  padding: '15px 25px',
  fontWeight: 800,
  fontSize: 16,
  border: '1px solid rgba(255,255,255,0.28)',
};

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return `rgba(224,165,26,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
