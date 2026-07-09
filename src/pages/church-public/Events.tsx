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
      <section id="events" className="cp-section" style={{ background: '#faf9f7', padding: '86px 28px 130px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gap: 24 }}>
          {events.map(ev => <EventRow key={ev.id} event={ev} accent={accent} />)}
        </div>
      </section>
    );
  }

  return (
    <section id="events" className="cp-section" style={{ background: '#fff', padding: '94px 28px 112px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, marginBottom: 46 }}>
          <div>
            <p style={labelStyle(accent)}>What's Coming Up</p>
            <h2 className="cp-section-title" style={headingStyle}>Upcoming events</h2>
          </div>
          <a href="#events" style={outlineButton}>Full Calendar</a>
        </div>

        <div className="cp-card-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 28,
        }}>
          {events.map(ev => <EventCard key={ev.id} event={ev} accent={accent} />)}
        </div>
      </div>
    </section>
  );
}

function EventRow({ event, accent }: { event: PublicEvent; accent: string }) {
  const date = new Date(event.date);
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = date.toLocaleDateString('en-US', { day: 'numeric' });
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

  return (
    <article style={{
      background: '#fff',
      border: '1px solid #e9dfd2',
      borderRadius: 18,
      padding: 28,
      display: 'grid',
      gridTemplateColumns: '96px minmax(0, 1fr) auto',
      gap: 28,
      alignItems: 'center',
      boxShadow: '0 16px 42px rgba(16,24,40,0.04)',
    }}>
      <DateBlock month={month} day={day} weekday={weekday} accent={accent} />
      <div>
        <p style={{ display: 'inline-flex', background: '#fff7e8', borderRadius: 999, color: '#c7830f', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', padding: '5px 14px', marginBottom: 12 }}>
          {event.church?.name || 'Event'}
        </p>
        <h3 style={{ fontFamily: 'Georgia, serif', color: '#101a30', fontSize: 28, margin: '0 0 10px' }}>{event.title}</h3>
        <p style={{ color: '#53617a', margin: 0 }}>{[event.time, event.location].filter(Boolean).join('   ')}</p>
      </div>
      {event.requiresTicket ? (
        <a href={`${FRONTEND}/events/${event.id}`} target="_blank" rel="noopener noreferrer" style={rsvpButton(accent)}>
          {event.isFree ? 'RSVP' : 'Tickets'}
        </a>
      ) : (
        <span style={rsvpButton(accent)}>RSVP</span>
      )}
    </article>
  );
}

function EventCard({ event, accent }: { event: PublicEvent; accent: string }) {
  const date = new Date(event.date);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.toLocaleDateString('en-US', { day: 'numeric' });
  const time = event.time || date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <article style={{
      border: '1px solid #e9dfd2',
      borderRadius: 18,
      overflow: 'hidden',
      background: '#fff',
      boxShadow: '0 16px 42px rgba(16,24,40,0.06)',
    }}>
      <div style={{ background: '#111822', color: '#fff', padding: '38px 28px', textAlign: 'center' }}>
        <p style={{ color: accent, fontFamily: 'Georgia, serif', fontSize: 38, fontWeight: 800, margin: 0 }}>{month} {day}</p>
        <p style={{ color: 'rgba(255,255,255,0.72)', margin: '8px 0 0' }}>{time}</p>
      </div>
      <div style={{ padding: 28 }}>
        <p style={{ display: 'inline-flex', background: '#fff7e8', borderRadius: 999, color: '#c7830f', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', padding: '5px 14px', marginBottom: 16 }}>
          {event.church?.name || 'Event'}
        </p>
        <h3 style={{ fontFamily: 'Georgia, serif', color: '#101a30', fontSize: 26, lineHeight: 1.2, margin: '0 0 12px' }}>
          {event.title}
        </h3>
        <p style={{ color: '#53617a', margin: 0 }}>{event.location}</p>
      </div>
    </article>
  );
}

function DateBlock({ month, day, weekday, accent }: { month: string; day: string; weekday: string; accent: string }) {
  return (
    <div style={{
      width: 96,
      height: 96,
      background: '#111822',
      color: '#fff',
      borderRadius: 16,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ color: accent, fontSize: 12, fontWeight: 800 }}>{month}</span>
      <strong style={{ color: accent, fontFamily: 'Georgia, serif', fontSize: 34, lineHeight: 1 }}>{day}</strong>
      <span style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: 800 }}>{weekday}</span>
    </div>
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
  };
}
