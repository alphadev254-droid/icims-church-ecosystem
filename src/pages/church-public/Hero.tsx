import { useEffect, useState } from 'react';
import { Play, Clock, MapPin, ArrowRight } from 'lucide-react';
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

function hexToRgba(hex: string, alpha: number) {
  const c = hex.replace('#', '');
  if (c.length !== 6) return `rgba(245,158,11,${alpha})`;
  return `rgba(${parseInt(c.slice(0,2),16)},${parseInt(c.slice(2,4),16)},${parseInt(c.slice(4,6),16)},${alpha})`;
}

function useCountdown(targetDay: string, targetTime: string) {
  const [parts, setParts] = useState({ d: '00', h: '00', m: '00', s: '00' });
  useEffect(() => {
    function calc() {
      const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const dayIndex = days.findIndex(d => targetDay?.toLowerCase().startsWith(d.toLowerCase()));
      const now = new Date();
      const [timePart, mer] = (targetTime ?? '').split(' ');
      const [rawH, rawM] = timePart?.split(':').map(Number) ?? [0, 0];
      let h = rawH || 0;
      if (mer?.toLowerCase() === 'pm' && h < 12) h += 12;
      if (mer?.toLowerCase() === 'am' && h === 12) h = 0;
      const target = new Date(now);
      target.setHours(h, rawM || 0, 0, 0);
      const todayDay = now.getDay();
      const tDay = dayIndex >= 0 ? dayIndex : todayDay;
      let diff = tDay - todayDay;
      if (diff < 0 || (diff === 0 && now >= target)) diff += 7;
      target.setDate(target.getDate() + diff);
      const ms = target.getTime() - now.getTime();
      if (ms <= 0) return;
      const tot = Math.floor(ms / 1000);
      setParts({
        d: String(Math.floor(tot / 86400)).padStart(2,'0'),
        h: String(Math.floor((tot % 86400) / 3600)).padStart(2,'0'),
        m: String(Math.floor((tot % 3600) / 60)).padStart(2,'0'),
        s: String(tot % 60).padStart(2,'0'),
      });
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDay, targetTime]);
  return parts;
}

export function Hero({ ministryName, bannerSrc, accent, tagline, youtubeUrl, serviceTimes }: HeroProps) {
  const nextService = serviceTimes[0];
  const countdown = useCountdown(nextService?.day ?? '', nextService?.time ?? '');
  const headline = tagline || 'A place of hope, community & faith.';
  const words = headline.trim().replace(/\.$/, '').split(' ');
  const last2 = words.slice(-2).join(' ');
  const first = words.slice(0, -2).join(' ');

  return (
    <section id="home" className="cp-hero" style={{
      minHeight: 560,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      background: `linear-gradient(105deg, rgba(18,29,57,0.97) 0%, rgba(18,29,57,0.84) 55%, rgba(18,29,57,0.62) 100%), url(${bannerSrc}) center/cover no-repeat`,
      padding: '72px 28px 60px',
    }}>
      <div className="cp-home-hero" style={{
        maxWidth: 1400, width: '100%', margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: nextService ? 'minmax(0,1.15fr) minmax(300px,0.85fr)' : '1fr',
        gap: 48, alignItems: 'center',
      }}>
        <div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: hexToRgba(accent, 0.15),
            border: `1px solid ${hexToRgba(accent, 0.4)}`,
            borderRadius: 6, padding: '5px 12px',
            color: accent, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20,
          }}>
            {ministryName}
          </span>

          <h1 className="cp-hero-title" style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            color: '#fff', fontSize: 'clamp(2.35rem, 5vw, 4.35rem)',
            lineHeight: 1.05, fontWeight: 800, margin: '0 0 18px', maxWidth: 720,
          }}>
            {words.length >= 3
              ? <>{first} <span style={{ color: accent }}>{last2}.</span></>
              : headline}
          </h1>

          <p className="cp-hero-copy" style={{
            color: 'rgba(255,255,255,0.9)', fontSize: 16, lineHeight: 1.75,
            maxWidth: 520, marginBottom: 28,
          }}>
            A Spirit-filled congregation committed to worship, discipleship, and serving our community together.
          </p>

          <div className="cp-hero-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href="#visit" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: accent, color: '#121D39', textDecoration: 'none',
              borderRadius: 7, padding: '12px 22px', fontWeight: 700, fontSize: 14,
              letterSpacing: '0.01em',
            }}>
              Plan Your Visit <ArrowRight size={15} />
            </a>
            {youtubeUrl && (
              <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'rgba(255,255,255,0.07)', color: '#fff', textDecoration: 'none',
                borderRadius: 7, padding: '11px 20px', fontWeight: 600, fontSize: 14,
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
                <Play size={14} fill="#fff" /> Watch Sermon
              </a>
            )}
          </div>
        </div>

        {nextService && (
          <div style={{
            background: 'rgba(18,29,57,0.78)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${hexToRgba(accent, 0.25)}`,
            borderRadius: 14, padding: '22px 20px',
          }}>
            <p style={{
              color: accent, fontSize: 9, fontWeight: 700,
              letterSpacing: '0.24em', textTransform: 'uppercase', margin: '0 0 16px',
            }}>
              Next — {nextService.name}
            </p>
            <div className="cp-countdown-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 18 }}>
              {[['Days', countdown.d], ['Hrs', countdown.h], ['Min', countdown.m], ['Sec', countdown.s]].map(([label, val]) => (
                <div key={label} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${hexToRgba(accent, 0.18)}`,
                  borderRadius: 8, padding: '10px 4px', textAlign: 'center',
                }}>
                  <p style={{ color: accent, fontSize: 24, fontWeight: 800, margin: 0, lineHeight: 1 }}>{val}</p>
                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', margin: '4px 0 0' }}>{label}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: '#fff', fontSize: 12 }}>
                <Clock size={13} color={accent} /> {nextService.day} · {nextService.time}
              </span>
              {nextService.location && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: '#fff', fontSize: 12 }}>
                  <MapPin size={13} color={accent} /> {nextService.location}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
