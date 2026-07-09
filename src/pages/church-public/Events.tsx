import type { PublicEvent } from './types';

const FRONTEND = 'https://churchcentral.church';

interface EventsProps {
  events: PublicEvent[];
  accent: string;
  variant?: 'home' | 'page';
}

function EventCard({ event, accent }: { event: PublicEvent; accent: string }) {
  const date = new Date(event.date);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.toLocaleDateString('en-US', { day: 'numeric' });
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const time = event.time || date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const actionLabel = event.requiresTicket ? (event.isFree ? 'RSVP Free' : 'Get Tickets') : 'Open Event';

  return (
    <article style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      {/* Date header */}
      <div style={{
        background: '#111822', padding: '22px 20px', textAlign: 'center',
      }}>
        <p style={{ color: accent, fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 800, margin: 0, lineHeight: 1 }}>{month} {day}</p>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '6px 0 0' }}>{time}</p>
      </div>

      <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <span style={{
          display: 'inline-flex', alignSelf: 'flex-start',
          background: `${accent}18`, borderRadius: 999,
          color: accent, fontSize: 11, fontWeight: 700,
          textTransform: 'uppercase', padding: '4px 12px', marginBottom: 12,
          letterSpacing: '0.1em',
        }}>
          {event.church?.name || 'Event'}
        </span>

        <h3 style={{
          fontFamily: 'Georgia, serif', color: '#0f172a',
          fontSize: 20, lineHeight: 1.25, margin: '0 0 8px',
        }}>
          {event.title}
        </h3>

        <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 auto', lineHeight: 1.6 }}>
          {[weekday, event.location].filter(Boolean).join(' · ')}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 18, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
          <span style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: event.requiresTicket ? accent : '#94a3b8',
          }}>
            {event.requiresTicket ? 'Ticketed' : 'Free Entry'}
          </span>
          {event.requiresTicket ? (
            <a href={`${FRONTEND}/events/${event.id}`} target="_blank" rel="noopener noreferrer" style={{
              background: accent, color: '#111822', borderRadius: 7,
              padding: '10px 16px', fontWeight: 700, fontSize: 13,
              textDecoration: 'none',
            }}>
              {actionLabel}
            </a>
          ) : (
            <span style={{
              background: '#f1f5f9', color: '#64748b', borderRadius: 7,
              padding: '10px 16px', fontWeight: 600, fontSize: 13,
            }}>
              No ticket needed
            </span>
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
      <section id="events" style={{ background: '#f8f9fb', padding: '80px 28px 100px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div className="cp-card-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))',
            gap: 20,
          }}>
            {events.map(ev => <EventCard key={ev.id} event={ev} accent={accent} />)}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="events" style={{ background: '#fff', padding: '80px 28px 96px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          gap: 16, marginBottom: 36, flexWrap: 'wrap',
        }}>
          <div>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: accent, marginBottom: 10,
            }}>What's Coming Up</p>
            <h2 className="cp-section-title" style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
              fontWeight: 800, color: '#0f172a', lineHeight: 1.1, margin: 0,
            }}>Upcoming events.</h2>
          </div>
          <a href="#events" style={{
            border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a',
            textDecoration: 'none', padding: '10px 18px', fontWeight: 600, fontSize: 13,
          }}>View All →</a>
        </div>

        <div className="cp-card-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))',
          gap: 20,
        }}>
          {events.map(ev => <EventCard key={ev.id} event={ev} accent={accent} />)}
        </div>
      </div>
    </section>
  );
}
