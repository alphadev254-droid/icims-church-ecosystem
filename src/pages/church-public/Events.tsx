import type { PublicEvent } from './types';
import { resolveImg } from './utils';

const FRONTEND = 'https://churchcentral.church';

interface EventsProps {
  events: PublicEvent[];
  accent: string;
}

export function Events({ events, accent }: EventsProps) {
  return (
    <section id="events" className="cp-section" style={{ background: '#fff', padding: '100px 40px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        <p style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: '#888', marginBottom: 20,
        }}>What's On</p>

        <h2 className="cp-section-title" style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 400, color: '#0a0a0a',
          lineHeight: 1.15, letterSpacing: '-0.01em',
          marginBottom: 56,
        }}>Upcoming events.</h2>

        <div className="cp-card-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 1,
          background: '#e8e4de',
          border: '1px solid #e8e4de',
        }}>
          {events.map(ev => {
            const evImg = resolveImg(ev.imageUrl);
            const evDate = new Date(ev.date);
            const day = evDate.toLocaleDateString('en-US', { day: 'numeric' });
            const month = evDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            const year = evDate.getFullYear();

            return (
              <div key={ev.id} style={{ background: '#fff' }}>
                {/* Image */}
                {evImg ? (
                  <img src={evImg} alt={ev.title} style={{
                    width: '100%', height: 200, objectFit: 'cover',
                    display: 'block', filter: 'grayscale(10%)',
                  }} />
                ) : (
                  <div style={{
                    width: '100%', height: 200,
                    background: '#f0ece6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, color: '#ccc',
                  }}>✝</div>
                )}

                <div style={{ padding: '28px 28px 32px' }}>
                  {/* Date */}
                  <p style={{
                    fontSize: 11, letterSpacing: '0.15em', color: '#888',
                    textTransform: 'uppercase', marginBottom: 12,
                    fontFamily: 'Georgia, serif',
                  }}>
                    {month} {day}, {year}
                    {ev.time && ` · ${ev.time}`}
                  </p>

                  {/* Title */}
                  <h3 style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 20, fontWeight: 400, color: '#0a0a0a',
                    marginBottom: 8, lineHeight: 1.3,
                  }}>{ev.title}</h3>

                  {/* Location */}
                  <p style={{ fontSize: 12, color: '#999', marginBottom: 20 }}>
                    {ev.location}
                  </p>

                  {/* Ticket link */}
                  {ev.requiresTicket && (
                    <a
                      href={`${FRONTEND}/events/${ev.id}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        fontSize: 12, fontWeight: 600, letterSpacing: '0.1em',
                        textTransform: 'uppercase', color: '#0a0a0a',
                        textDecoration: 'none',
                        borderBottom: '1px solid #0a0a0a',
                        paddingBottom: 2,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '0.5'}
                      onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '1'}
                    >
                      {ev.isFree ? 'Register Free →' : `Get Ticket${ev.ticketPrice ? ` · ${ev.currency} ${ev.ticketPrice.toLocaleString()}` : ''} →`}
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
