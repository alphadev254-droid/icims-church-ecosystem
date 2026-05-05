import { Clock, MapPin } from 'lucide-react';
import type { ServiceTime } from './types';

interface ServicesProps {
  serviceTimes: ServiceTime[];
  accent: string;
}

export function Services({ serviceTimes, accent }: ServicesProps) {
  return (
    <section id="services" style={{ background: '#f8f7f5', padding: '80px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <p style={{ color: accent, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          Join Us
        </p>
        <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, color: '#111', marginBottom: 40 }}>
          Service Times
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          {serviceTimes.map((s, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 14, padding: '28px 24px',
              border: '1px solid #ede9e3', borderTop: `4px solid ${accent}`,
              transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.10)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
            }}
            >
              <p style={{ fontWeight: 700, fontSize: 17, color: '#111', marginBottom: 12 }}>{s.name}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13, marginBottom: 6 }}>
                <Clock size={14} /> {s.day}
              </div>
              <p style={{ fontSize: 22, fontWeight: 800, color: accent, marginBottom: s.location ? 10 : 0 }}>{s.time}</p>
              {s.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9ca3af', fontSize: 13 }}>
                  <MapPin size={13} /> {s.location}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
