import type { PublicEvent } from './types';
import type React from 'react';

const FRONTEND = 'https://churchcentral.church';

interface EventsProps {
  events: PublicEvent[];
  accent: string;
  variant?: 'home' | 'page';
}

export function Events({ events, accent, variant = 'home' }: EventsProps) {
  if (!events.length) return null;

  if (variant === 'page') {
    return (
      <section id="events" className="cp-section" style={{ background: '#faf9f7', padding: '72px 28px 104px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div className="cp-card-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}>
            {events.map(ev => <EventCard key={ev.id} event={ev} accent={accent} detailed />)}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="events" className="cp-section" style={{ background: '#fff', padding: '82px 28px 96px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div className="cp-section-heading-row" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, marginBottom: 36, flexWrap: 'wrap' }}>
          <div>
            <p style={labelStyle(accent)}>What's Coming Up</p>
            <h2 className="cp-section-title" style={headingStyle}>Upcoming events</h2>
          </div>
          <a href="#events" style={outlineButton}>Full Calendar</a>
        </div>

        <div className="cp-card-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 24,
        }}>
          {events.map(ev => <EventCard key={ev.id} event={ev} accent={accent} />)}
        </div>
      </div>
    </section>
  );
}

function EventCard({ event, accent, detailed = false }: { event: PublicEvent; accent: string; detailed?: boolean }) {
  const date = new Date(event.date);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.toLocaleDateString('en-US', { day: 'numeric' });
  const time = event.time || date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const actionLabel = event.requiresTicket ? (event.isFree ? 'RSVP' : 'Get Tickets') : 'Details';

  return (
    <article style={{
      border: '1px solid #e9dfd2',
      borderRadius: 16,
      overflow: 'hidden',
      background: '#fff',
      boxShadow: '0 16px 42px rgba(16,24,40,0.055)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: detailed ? 410 : 360,
    }}>
      <div style={{ background: '#111822', color: '#fff', padding: detailed ? '34px 28px' : '30px 24px', textAlign: 'center' }}>
        <p style={{ color: accent, fontFamily: 'Georgia, serif', fontSize: 38, fontWeight: 800, margin: 0 }}>{month} {day}</p>
        <p style={{ color: 'rgba(255,255,255,0.72)', margin: '8px 0 0' }}>{time}</p>
      </div>
      <div style={{ padding: 26, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <p style={{ display: 'inline-flex', background: '#fff7e8', borderRadius: 999, color: '#c7830f', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', padding: '5px 14px', marginBottom: 16 }}>
          {event.church?.name || 'Event'}
        </p>
        <h3 style={{ fontFamily: 'Georgia, serif', color: '#101a30', fontSize: 26, lineHeight: 1.2, margin: '0 0 12px' }}>
          {event.title}
        </h3>
        <p style={{ color: '#53617a', margin: 0, lineHeight: 1.65 }}>
          {[weekday, event.location].filter(Boolean).join(' - ')}
        </p>
        {detailed && event.description && (
          <p style={{
            color: '#53617a',
            fontSize: 14,
            lineHeight: 1.7,
            margin: '16px 0 0',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {event.description}
          </p>
        )}
        <div className="cp-event-card-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginTop: 'auto', paddingTop: 24 }}>
          <span style={{ color: event.requiresTicket ? accent : '#8a94a6', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            {event.requiresTicket ? 'Ticketed' : 'Open Event'}
          </span>
          {event.requiresTicket ? (
            <a className="cp-event-card-action" href={`${FRONTEND}/events/${event.id}`} target="_blank" rel="noopener noreferrer" style={rsvpButton(accent)}>
              {actionLabel}
            </a>
          ) : (
            <span className="cp-event-card-action" style={mutedButton}>No ticket needed</span>
          )}
        </div>
      </div>
    </article>
  );
}

const headingStyle: React.CSSProperties = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  color: '#101a30',
  fontSize: 'clamp(2.6rem, 5vw, 5rem)',
  lineHeight: 1,
  margin: 0,
};

function labelStyle(accent: string): React.CSSProperties {
  return { color: accent, fontSize: 12, fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 18 };
}

const outlineButton: React.CSSProperties = {
  border: '1px solid #e3ded7',
  borderRadius: 14,
  color: '#101a30',
  textDecoration: 'none',
  padding: '14px 22px',
  fontWeight: 800,
};

function rsvpButton(accent: string): React.CSSProperties {
  return {
    background: accent,
    color: '#101a30',
    borderRadius: 12,
    padding: '14px 20px',
    fontWeight: 800,
    textDecoration: 'none',
    justifySelf: 'end',
    display: 'inline-flex',
    justifyContent: 'center',
  };
}

const mutedButton: React.CSSProperties = {
  background: '#f5f1ea',
  color: '#53617a',
  borderRadius: 12,
  padding: '13px 16px',
  fontWeight: 800,
  textDecoration: 'none',
  display: 'inline-flex',
  justifyContent: 'center',
  fontSize: 13,
};
