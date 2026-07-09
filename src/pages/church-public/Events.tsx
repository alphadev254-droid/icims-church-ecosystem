import type { PublicEvent } from './types';

const FRONTEND = 'https://churchcentral.church';

interface EventsProps {
  events: PublicEvent[];
  accent: string;
  variant?: 'home' | 'page';
}

function EventCard({ event, accent }: { event: PublicEvent; accent: string }) {
  const date = new Date(event.date);
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = date.toLocaleDateString('en-US', { day: 'numeric' });
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const time = event.time || date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const actionLabel = event.requiresTicket ? (event.isFree ? 'RSVP Free' : 'Get Tickets') : 'Learn More';

  return (
    <article style={{
      background: '#fff', border: '1px solid #e8edf5', borderRadius: 12,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      transition: 'transform 0.18s, box-shadow 0.18s',
    }}>
      {/* Top accent bar + date badge */}
      <div style={{ background: '#0a0f1e', padding: '18px 18px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{
          background: accent, borderRadius: 8, padding: '8px 12px', textAlign: 'center', minWidth: 52,
        }}>
          <p style={{ color: '#0a0f1e', fontSize: 18, fontWeight: 900, margin: 0, lineHeight: 1, fontFamily: 'Georgia, serif' }}>{day}</p>
          <p style={{ color: '#0a0f1e', fontSize: 9, fontWeight: 800, margin: '2px 0 0', letterSpacing: '0.1em' }}>{month}</p>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, margin: '0 0 4px' }}>{weekday} · {time}</p>
          <h3 style={{ fontFamily: 'Georgia, serif', color: '#fff', fontSize: 16, lineHeight: 1.25, margin: 0, fontWeight: 700 }}>
            {event.title}
          </h3>
        </div>
      </div>

      <div style={{ padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{
            background: `${accent}15`, borderRadius: 5,
            color: accent, fontSize: 10, fontWeight: 700,
            textTransform: 'uppercase', padding: '3px 9px', letterSpacing: '0.1em',
          }}>
            {event.church?.name || 'Event'}
          </span>
          <span style={{
            background: event.requiresTicket ? '#fef3c7' : '#f0fdf4',
            color: event.requiresTicket ? '#92400e' : '#166534',
            fontSize: 10, fontWeight: 700, borderRadius: 5, padding: '3px 9px',
          }}>
            {event.requiresTicket ? (event.isFree ? 'Free' : 'Ticketed') : 'Open'}
          </span>
        </div>

        {event.location && (
          <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 auto', lineHeight: 1.5 }}>📍 {event.location}</p>
        )}

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
          {event.requiresTicket ? (
            <a href={`${FRONTEND}/events/${event.id}`} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: accent, color: '#0a0f1e', borderRadius: 7,
              padding: '9px 16px', fontWeight: 700, fontSize: 12,
              textDecoration: 'none',
            }}>
              {actionLabel} →
            </a>
          ) : (
            <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>No ticket needed</span>
          )}
        </div>
      </div>
    </article>
  );
}

export function Events({ events, accent, variant = 'home' }: EventsProps) {
  if (!events.length) return null;

  if (variant === 'page') {
    return (
      <section id="events" style={{ background: '#f8fafc', padding: '56px 28px 72px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div className="cp-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 14 }}>
            {events.map(ev => <EventCard key={ev.id} event={ev} accent={accent} />)}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="events" style={{ background: '#f8fafc', padding: '56px 28px 72px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: accent, marginBottom: 8 }}>What's Coming Up</p>
            <h2 className="cp-section-title" style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(1.8rem, 3.8vw, 2.8rem)',
              fontWeight: 800, color: '#0a0f1e', lineHeight: 1.1, margin: 0,
            }}>Upcoming events.</h2>
          </div>
          <a href="#events" style={{
            border: '1px solid #e2e8f0', borderRadius: 7, color: '#0a0f1e',
            textDecoration: 'none', padding: '9px 16px', fontWeight: 600, fontSize: 12,
          }}>View All →</a>
        </div>
        <div className="cp-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 14 }}>
          {events.map(ev => <EventCard key={ev.id} event={ev} accent={accent} />)}
        </div>
      </div>
    </section>
  );
}
