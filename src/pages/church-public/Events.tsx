import type { PublicEvent } from './types';

const DARK = '#121D39';

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
  const actionLabel = event.requiresTicket ? (event.isFree ? 'RSVP Free' : 'Get Tickets') : 'Open Event';

  return (
    <article style={{
      borderRadius: 12,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 20px rgba(18,29,57,0.12)',
      border: '1px solid #e2e8f0',
      minWidth: 0,
    }}>
      <div style={{
        background: DARK,
        padding: '20px 18px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
      }}>
        <div style={{
          background: accent,
          borderRadius: 8,
          padding: '8px 10px',
          textAlign: 'center',
          minWidth: 48,
          flexShrink: 0,
        }}>
          <p style={{ color: DARK, fontSize: 20, fontWeight: 900, margin: 0, lineHeight: 1, fontFamily: 'Georgia, serif' }}>{day}</p>
          <p style={{ color: DARK, fontSize: 9, fontWeight: 800, margin: '2px 0 0', letterSpacing: '0.1em' }}>{month}</p>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, margin: '0 0 5px' }}>{weekday} - {time}</p>
          <h3 style={{
            fontFamily: 'Georgia, serif',
            color: accent,
            fontSize: 17,
            lineHeight: 1.25,
            margin: 0,
            fontWeight: 700,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {event.title}
          </h3>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{
            background: `${accent}18`,
            borderRadius: 5,
            color: DARK,
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            padding: '3px 9px',
            letterSpacing: '0.08em',
          }}>
            {event.church?.name || 'Event'}
          </span>
          <span style={{
            background: event.requiresTicket ? '#fef9ec' : '#f0fdf4',
            color: event.requiresTicket ? '#92400e' : '#166534',
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 5,
            padding: '3px 9px',
          }}>
            {event.requiresTicket ? (event.isFree ? 'Free' : 'Ticketed') : 'Open'}
          </span>
        </div>

        {event.location && (
          <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 auto', lineHeight: 1.5 }}>
            {event.location}
          </p>
        )}

        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
          {event.requiresTicket ? (
            <a
              className="cp-event-card-action"
              href={`/events/${event.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: accent,
                color: DARK,
                borderRadius: 6,
                padding: '8px 14px',
                fontWeight: 700,
                fontSize: 12,
                textDecoration: 'none',
              }}
            >
              {actionLabel} <span aria-hidden="true">-&gt;</span>
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

  const grid = (
    <div className="cp-card-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 14,
    }}>
      {events.map(event => <EventCard key={event.id} event={event} accent={accent} />)}
    </div>
  );

  if (variant === 'page') {
    return (
      <section id="events" style={{ background: '#f8fafc', padding: '56px 28px 72px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>{grid}</div>
      </section>
    );
  }

  return (
    <section id="events" style={{ background: '#f8fafc', padding: '56px 28px 72px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div className="cp-section-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: accent, marginBottom: 8 }}>What's Coming Up</p>
            <h2 className="cp-section-title" style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(1.7rem, 3.2vw, 2.45rem)',
              fontWeight: 800,
              color: DARK,
              lineHeight: 1.1,
              margin: 0,
            }}>
              Upcoming events.
            </h2>
          </div>
          <a href="#events" style={{
            border: `1px solid ${DARK}22`,
            borderRadius: 7,
            color: DARK,
            textDecoration: 'none',
            padding: '9px 16px',
            fontWeight: 600,
            fontSize: 12,
          }}>
            View All -&gt;
          </a>
        </div>
        {grid}
      </div>
    </section>
  );
}
