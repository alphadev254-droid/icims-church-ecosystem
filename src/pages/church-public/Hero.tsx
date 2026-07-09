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
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return `rgba(224,165,26,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function useCountdown(targetDay: string, targetTime: string) {
  const [parts, setParts] = useState({ d: '00', h: '00', m: '00', s: '00' });

  useEffect(() => {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const dayIndex = days.findIndex(d => targetDay?.toLowerCase().startsWith(d.toLowerCase()));

    function calc() {
      const now = new Date();
      const [timePart, meridiem] = targetTime?.split(' ') ?? ['00:00', ''];
      const [rawH, rawM] = timePart.split(':').map(Number);
      let hour = rawH;
      if (meridiem?.toLowerCase() === 'pm' && hour < 12) hour += 12;
      if (meridiem?.toLowerCase() === 'am' && hour === 12) hour = 0;

      const target = new Date(now);
      target.setHours(hour, rawM || 0, 0, 0);
      const todayDay = now.getDay();
      const targetDayNum = dayIndex >= 0 ? dayIndex : todayDay;
      let diff = targetDayNum - todayDay;
      if (diff < 0 || (diff === 0 && now >= target)) diff += 7;
      target.setDate(target.getDate() + diff);

      const ms = target.getTime() - now.getTime();
      if (ms <= 0) return;
      const totalSecs = Math.floor(ms / 1000);
      const d = Math.floor(totalSecs / 86400);
      const h = Math.floor((totalSecs % 86400) / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;
      setParts({
        d: String(d).padStart(2, '0'),
        h: String(h).padStart(2, '0'),
        m: String(m).padStart(2, '0'),
        s: String(s).padStart(2, '0'),
      });
    }

    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDay, targetTime, dayIndex]);

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
      minHeight: 680,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      background: `linear-gradient(100deg, rgba(10,15,28,0.94) 0%, rgba(10,15,28,0.78) 50%, rgba(10,15,28,0.55) 100%), url(${bannerSrc}) center/cover no-repeat`,
      padding: '96px 28px 80px',
    }}>
      <div className="cp-home-hero" style={{
        maxWidth: 1400, width: '100%', margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: nextService ? 'minmax(0,1.1fr) minmax(340px,0.9fr)' : '1fr',
        gap: 56, alignItems: 'center',
      }}>
        {/* Left */}
        <div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            border: `1px solid ${hexToRgba(accent, 0.5)}`,
            borderRadius: 999, padding: '6px 14px',
            color: accent, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 28,
          }}>
            {ministryName}
          </span>

          <h1 className="cp-hero-title" style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            color: '#fff', fontSize: 'clamp(3rem, 6.5vw, 6rem)',
            lineHeight: 1, fontWeight: 800, margin: '0 0 22px', maxWidth: 800,
          }}>
            {words.length >= 3 ? <>{first} <span style={{ color: accent }}>{last2}.</span></> : headline}
          </h1>

          <p className="cp-hero-copy" style={{
            color: 'rgba(255,255,255,0.72)', fontSize: 17, lineHeight: 1.75,
            maxWidth: 580, marginBottom: 36,
          }}>
            A Spirit-filled congregation committed to worship, discipleship, and serving our community together, in the love of Christ.
          </p>

          <div className="cp-hero-actions" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="#visit" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: accent, color: '#111822', textDecoration: 'none',
              borderRadius: 8, padding: '14px 24px', fontWeight: 700, fontSize: 15,
            }}>
              Plan Your Visit <ArrowRight size={16} />
            </a>
            {youtubeUrl && (
              <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.08)', color: '#fff', textDecoration: 'none',
                borderRadius: 8, padding: '13px 22px', fontWeight: 600, fontSize: 15,
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
                <Play size={15} /> Watch Sermon
              </a>
            )}
          </div>
        </div>

        {/* Right — service countdown card */}
        {nextService && (
          <div style={{
            border: `1px solid ${hexToRgba(accent, 0.3)}`,
            borderRadius: 16, background: 'rgba(17,24,34,0.7)',
            backdropFilter: 'blur(10px)', padding: '28px 24px',
          }}>
            <p style={{
              color: accent, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.22em', textTransform: 'uppercase', margin: '0 0 20px',
            }}>
              Next Service — {nextService.name}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 24 }}>
              {[['Days', countdown.d], ['Hrs', countdown.h], ['Min', countdown.m], ['Sec', countdown.s]].map(([label, val]) => (
                <div key={label} style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: '12px 6px', textAlign: 'center',
                }}>
                  <p style={{ color: accent, fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1 }}>{val}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', margin: '5px 0 0' }}>{label}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                <Clock size={14} color={accent} /> {nextService.day} · {nextService.time}
              </span>
              {nextService.location && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                  <MapPin size={14} color={accent} /> {nextService.location}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
