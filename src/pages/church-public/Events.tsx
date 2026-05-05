import { Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';
import type { PublicEvent } from './types';
import { resolveImg } from './utils';

const FRONTEND = 'https://churchcentral.church';

interface EventsProps {
  events: PublicEvent[];
  accent: string;
}

export function Events({ events, accent }: EventsProps) {
  return (
    <section id="events" style={{ background: '#fff', padding: '80px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <p style={{ color: accent, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          What's On
        </p>
        <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, color: '#111', marginBottom: 40 }}>
          Upcoming Events
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {events.map(ev => {
            const evImg = resolveImg(ev.imageUrl);
            const evDate = new Date(ev.date);
            const dayNum = evDate.toLocaleDateString('en-US', { day: 'numeric' });
            const monthAbbr = evDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            return (
              <div key={ev.id} style={{
                border: '1px solid #ede9e3', borderRadius: 16,
                overflow: 'hidden', background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 40px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
              }}
              >
                {/* Image / placeholder */}
                <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
                  {evImg ? (
                    <img src={evImg} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      background: `linear-gradient(135deg, ${accent}22, ${accent}44)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Calendar size={48} color={`${accent}88`} />
                    </div>
                  )}
                  {/* Date badge */}
                  <div style={{
                    position: 'absolute', top: 12, left: 12,
                    background: accent, color: '#fff',
                    borderRadius: 10, padding: '6px 12px',
                    textAlign: 'center', minWidth: 48,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{dayNum}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em' }}>{monthAbbr}</div>
                  </div>
                </div>

                <div style={{ padding: '20px 22px' }}>
                  <h3 style={{ fontWeight: 700, fontSize: 17, color: '#111', marginBottom: 10 }}>{ev.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6b7280', fontSize: 13, marginBottom: 4 }}>
                    <MapPin size={13} /> {ev.location}
                  </div>
                  {ev.time && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
                      <Clock size={13} /> {ev.time}
                    </div>
                  )}
                  {ev.requiresTicket && (
                    <a
                      href={`${FRONTEND}/events/${ev.id}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: accent, color: '#fff',
                        padding: '9px 18px', borderRadius: 8,
                        fontSize: 13, fontWeight: 700, textDecoration: 'none',
                      }}
                    >
                      {ev.isFree
                        ? 'Get Free Ticket'
                        : `Get Ticket${ev.ticketPrice ? ` — ${ev.currency} ${ev.ticketPrice.toLocaleString()}` : ''}`}
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
